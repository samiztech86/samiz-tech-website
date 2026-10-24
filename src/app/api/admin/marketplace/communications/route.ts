import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";
import { sendMarketplaceSupplierCampaignEmail } from "@/lib/email/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };
const PAGE_SIZE = 500;
const MAX_CAMPAIGN_RECIPIENTS = 5000;

type SupplierRecipient = {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  verification_status: string | null;
};

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function loadAllSuppliers() {
  const suppliers: SupplierRecipient[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, business_name, contact_name, contact_email, verification_status")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (result.error) {
      throw new Error("Unable to retrieve registered suppliers.");
    }

    const page = (result.data ?? []) as SupplierRecipient[];
    suppliers.push(...page);

    if (page.length < PAGE_SIZE) break;

    if (suppliers.length >= MAX_CAMPAIGN_RECIPIENTS) {
      const overflow = await supabaseServer
        .from("marketplace_supplier_profiles")
        .select("id")
        .order("created_at", { ascending: false })
        .range(MAX_CAMPAIGN_RECIPIENTS, MAX_CAMPAIGN_RECIPIENTS);

      if (overflow.error) {
        throw new Error("Unable to verify the registered supplier count.");
      }

      if ((overflow.data ?? []).length > 0) {
        throw new Error(
          `The supplier list exceeds the safety limit of ${MAX_CAMPAIGN_RECIPIENTS}. No campaign was sent.`
        );
      }

      break;
    }
  }

  return suppliers;
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: responseHeaders },
      );
    }

    const suppliers = await loadAllSuppliers();

    return NextResponse.json(
      {
        suppliers: suppliers.map((supplier) => ({
          id: supplier.id,
          business_name: supplier.business_name,
          contact_name: supplier.contact_name,
          contact_email: supplier.contact_email,
          verification_status: supplier.verification_status,
        })),
        totalSuppliers: suppliers.length,
        eligibleRecipients: suppliers.filter(
          (supplier) =>
            typeof supplier.contact_email === "string" &&
            validEmail(supplier.contact_email.trim()),
        ).length,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error(
      "Admin supplier communications GET failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load suppliers." },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: responseHeaders },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON request body is required." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400, headers: responseHeaders },
      );
    }

    const payload = body as {
      mode?: unknown;
      supplierId?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    const mode = payload.mode;
    const supplierId =
      typeof payload.supplierId === "string" ? payload.supplierId.trim() : "";
    const subject =
      typeof payload.subject === "string" ? payload.subject.trim() : "";
    const message =
      typeof payload.message === "string" ? payload.message.trim() : "";

    if (mode !== "single" && mode !== "bulk") {
      return NextResponse.json(
        { error: "Mode must be single or bulk." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (!subject || subject.length > 180) {
      return NextResponse.json(
        { error: "Subject is required and must not exceed 180 characters." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (!message || message.length > 5000) {
      return NextResponse.json(
        { error: "Message is required and must not exceed 5000 characters." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (mode === "single" && !supplierId) {
      return NextResponse.json(
        { error: "Select exactly one supplier for a single email." },
        { status: 400, headers: responseHeaders },
      );
    }

    const allSuppliers = await loadAllSuppliers();

    let targets: SupplierRecipient[];

    if (mode === "single") {
      const selected = allSuppliers.find((supplier) => supplier.id === supplierId);

      if (!selected) {
        return NextResponse.json(
          { error: "The selected supplier was not found." },
          { status: 404, headers: responseHeaders },
        );
      }

      targets = [selected];
    } else {
      targets = allSuppliers;
    }

    const seenEmails = new Set<string>();
    const recipients = targets.flatMap((supplier) => {
      const email =
        typeof supplier.contact_email === "string"
          ? supplier.contact_email.trim()
          : "";

      if (!validEmail(email)) return [];

      const normalizedEmail = email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) return [];
      seenEmails.add(normalizedEmail);

      return [{
        supplierId: supplier.id,
        businessName: supplier.business_name || supplier.contact_name || "Supplier",
        email,
      }];
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No eligible supplier email addresses were found. No emails were sent." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (mode === "single" && recipients.length !== 1) {
      return NextResponse.json(
        { error: "The selected supplier does not have a valid email address. No emails were sent." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (mode === "bulk" && recipients.length > MAX_CAMPAIGN_RECIPIENTS) {
      return NextResponse.json(
        { error: "The campaign exceeds the configured recipient safety limit. No emails were sent." },
        { status: 400, headers: responseHeaders },
      );
    }

    const results: {
      supplierId: string;
      businessName: string;
      status: "sent" | "failed";
      error?: string;
    }[] = [];

    // Send individual emails in small batches so supplier addresses are not exposed.
    for (let offset = 0; offset < recipients.length; offset += 5) {
      const batch = recipients.slice(offset, offset + 5);

      const batchResults = await Promise.all(
        batch.map(async (recipient) => {
          try {
            const delivery = await sendMarketplaceSupplierCampaignEmail(
              recipient.email,
              subject,
              message,
            );

            if (delivery.success) {
              return {
                supplierId: recipient.supplierId,
                businessName: recipient.businessName,
                status: "sent" as const,
              };
            }

            return {
              supplierId: recipient.supplierId,
              businessName: recipient.businessName,
              status: "failed" as const,
              error: "Email provider did not confirm delivery acceptance.",
            };
          } catch {
            return {
              supplierId: recipient.supplierId,
              businessName: recipient.businessName,
              status: "failed" as const,
              error: "Email could not be submitted.",
            };
          }
        }),
      );

      results.push(...batchResults);
    }

    const sent = results.filter((item) => item.status === "sent").length;
    const failed = results.length - sent;

    return NextResponse.json(
      {
        success: failed === 0,
        mode,
        targeted: recipients.length,
        sent,
        failed,
        results,
      },
      { status: 200, headers: responseHeaders },
    );
  } catch (error) {
    console.error(
      "Admin supplier communications POST failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process the email campaign." },
      { status: 500, headers: responseHeaders },
    );
  }
}
