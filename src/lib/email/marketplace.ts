import "server-only";

import { Resend } from "resend";

type MarketplaceEmailResult =
  | { success: true }
  | { success: false; error: string };

type QuoteRequestNotification = {
  requestId: string;
  productName: string;
  supplierEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  organizationName?: string | null;
  quantity?: number | null;
  quantityUnit?: string | null;
  deliveryLocation?: string | null;
  customerMessage?: string | null;
};

type SupplierQuoteNotification = {
  requestId: string;
  quoteId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  quoteAmount: number;
  currency: string;
  estimatedLeadTime?: string | null;
  quoteValidUntil?: string | null;
  supplierMessage: string;
};

function getMarketplaceEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Marketplace email configuration is incomplete.");
  }

  return { resend: new Resend(apiKey), from };
}

async function sendMarketplaceEmail(
  recipient: string,
  subject: string,
  lines: string[],
): Promise<MarketplaceEmailResult> {
  try {
    const { resend, from } = getMarketplaceEmailConfiguration();

    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      subject,
      text: [
        ...lines,
        "",
        "Samiz Tech Engineering Ltd",
        "Where Engineering Meets Energy",
      ].join("\n"),
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Resend rejected the email.",
      };
    }

    if (!data?.id) {
      return {
        success: false,
        error: "Resend did not return an email ID.",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown marketplace email error.",
    };
  }
}

export async function sendMarketplaceQuoteRequestNotification(
  details: QuoteRequestNotification,
): Promise<MarketplaceEmailResult> {
  const lines = [
    "A customer has submitted a new marketplace quote request.",
    "",
    `Request reference: ${details.requestId}`,
    `Product: ${details.productName}`,
    `Customer: ${details.customerName}`,
    `Customer email: ${details.customerEmail}`,
    `Customer phone: ${details.customerPhone}`,
    `Organisation: ${details.organizationName || "Not provided"}`,
    `Quantity: ${
      details.quantity == null
        ? "Not specified"
        : `${details.quantity} ${details.quantityUnit || ""}`.trim()
    }`,
    `Delivery location: ${details.deliveryLocation || "Not provided"}`,
    "",
    "Customer specifications or message:",
    details.customerMessage || "No additional details provided.",
    "",
    "Please sign in to your Samiz Tech Marketplace supplier dashboard to review the request and submit your quotation.",
  ];

  return sendMarketplaceEmail(
    details.supplierEmail,
    `New quote request: ${details.productName}`,
    lines,
  );
}

export async function sendMarketplaceSupplierQuoteNotification(
  details: SupplierQuoteNotification,
): Promise<MarketplaceEmailResult> {
  const lines = [
    `Hello ${details.customerName},`,
    "",
    "The supplier has submitted a quotation for your marketplace request.",
    "",
    `Request reference: ${details.requestId}`,
    `Quotation reference: ${details.quoteId}`,
    `Product: ${details.productName}`,
    `Quoted total: ${details.currency} ${details.quoteAmount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    `Estimated lead time: ${details.estimatedLeadTime || "Not specified"}`,
    `Quotation valid until: ${details.quoteValidUntil || "Not specified"}`,
    "",
    "Supplier terms and message:",
    details.supplierMessage,
    "",
    "You can review this quotation and accept it through the Samiz Tech marketplace. If you accept, complete payment through the marketplace checkout. This email does not confirm that the quotation has been accepted or paid.",
  ];

  return sendMarketplaceEmail(
    details.customerEmail,
    `Supplier quotation received: ${details.productName}`,
    lines,
  );
}

// Reusable notification helper for persisted marketplace events.
// Email delivery failures must not undo the associated database operation.
export async function sendMarketplaceEventNotifications(details: {
  recipientEmails: Array<string | null | undefined>;
  subject: string;
  adminSubject?: string;
  lines: string[];
}): Promise<MarketplaceEmailResult> {
  const recipients = new Map<string, string>();

  for (const email of details.recipientEmails) {
    const normalized = email?.trim().toLowerCase();

    if (normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      recipients.set(normalized, details.subject);
    }
  }

  const adminEmail = process.env.MARKETPLACE_ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    recipients.set(adminEmail, details.adminSubject || details.subject);
  } else {
    console.error(
      "Marketplace admin notification skipped: MARKETPLACE_ADMIN_EMAIL is not configured with a valid email address.",
    );
  }

  if (recipients.size === 0) {
    return {
      success: false,
      error: "No valid recipients are configured for this marketplace notification.",
    };
  }

  const results = await Promise.all(
    Array.from(recipients.entries()).map(([email, subject]) =>
      sendMarketplaceEmail(email, subject, details.lines),
    ),
  );

  const failures = results.filter(
    (result): result is { success: false; error: string } => !result.success,
  );

  if (failures.length > 0) {
    return {
      success: false,
      error: `${failures.length} marketplace notification email(s) failed.`,
    };
  }

  return { success: true };
}
