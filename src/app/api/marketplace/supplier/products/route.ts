import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";
import { requireCurrentSupplierAgreementAcceptance } from "@/lib/marketplace/supplier-agreement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "solar_backup_power",
  "electrical_materials",
  "industrial_distribution",
  "smart_energy_automation",
  "tools_accessories",
] as const;

function respond(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function makeSlug(name: string) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140)
    .replace(/-+$/g, "");

  return `${base || "product"}-${randomUUID().slice(0, 8)}`;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function matchesImageSignature(
  bytes: Buffer,
  mime: string,
): boolean {
  if (mime === "image/jpeg") {
    return bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/png") {
    return bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
  }
  if (mime === "image/webp") {
    return bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Please sign in to submit a product." }, 401);
    }

    let input: Record<string, unknown>;
    let imageFiles: File[] = [];

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return respond({ error: "Invalid multipart form submission." }, 400);
      }

      input = {};
      for (const [key, value] of form.entries()) {
        if (key !== "images" && typeof value === "string") {
          input[key] = value;
        }
      }
      imageFiles = form.getAll("images").filter(
        (value): value is File => value instanceof File && value.size > 0,
      );
    } else {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return respond({ error: "Request body must be valid JSON." }, 400);
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return respond({ error: "Invalid product details." }, 400);
      }
      input = body as Record<string, unknown>;
    }

    if (imageFiles.length > MAX_IMAGES) {
      return respond({ error: "Upload no more than 5 product images." }, 400);
    }

    for (const file of imageFiles) {
      if (!(file.type in IMAGE_TYPES)) {
        return respond({ error: "Images must be JPEG, PNG, or WebP." }, 400);
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return respond({ error: "Each image must be 5 MB or smaller." }, 400);
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      if (!matchesImageSignature(bytes, file.type)) {
        return respond({ error: "An uploaded file is not a valid supported image." }, 400);
      }
    }
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const category =
      typeof input.category === "string" ? input.category : "";
    const description =
      typeof input.description === "string"
        ? input.description.trim()
        : "";
    const brand =
      typeof input.brand === "string" ? input.brand.trim() : "";
    const modelNumber =
      typeof input.model_number === "string"
        ? input.model_number.trim()
        : "";
    const priceType =
      input.price_type === "indicative" ? "indicative" : input.price_type;
    const rawPrice = input.indicative_price;

    if (name.length < 3 || name.length > 180) {
      return respond({ error: "Product name must be 3–180 characters." }, 400);
    }

    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return respond({ error: "Choose a valid product category." }, 400);
    }

    if (description.length < 10 || description.length > 8000) {
      return respond({ error: "Description must be 10–8000 characters." }, 400);
    }

    if (brand.length > 120 || modelNumber.length > 120) {
      return respond({ error: "Brand and model number must not exceed 120 characters." }, 400);
    }

    if (priceType !== "quote_only" && priceType !== "indicative") {
      return respond({ error: "Choose quote-only or indicative pricing." }, 400);
    }

    let indicativePrice: number | null = null;

    if (priceType === "indicative") {
      if (
        (typeof rawPrice !== "number" && typeof rawPrice !== "string") ||
        String(rawPrice).trim() === ""
      ) {
        return respond({ error: "Enter an indicative price." }, 400);
      }

      indicativePrice = Number(rawPrice);

      if (
        !Number.isFinite(indicativePrice) ||
        indicativePrice < 0 ||
        indicativePrice > 999999999999
      ) {
        return respond({ error: "Enter a valid non-negative price." }, 400);
      }

      indicativePrice = Math.round(indicativePrice * 100) / 100;
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, verification_status")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Marketplace supplier profile lookup failed.");
      return respond({ error: "Unable to verify supplier approval." }, 500);
    }

    if (!profile || profile.verification_status !== "approved") {
      return respond(
        { error: "Only approved suppliers can submit product listings." },
        403,
      );
    }


    const agreementGuard = await requireCurrentSupplierAgreementAcceptance(
      authData.user.id,
    );
    if (!agreementGuard.ok) {
      return respond(
        {
          error: agreementGuard.error,
          code: agreementGuard.code,
          agreementRequired:
            agreementGuard.code === "SUPPLIER_AGREEMENT_ACCEPTANCE_REQUIRED" ||
            agreementGuard.code === "SUPPLIER_AGREEMENT_VERSION_MISMATCH",
        },
        agreementGuard.status,
      );
    }

    const imageUrls: string[] = [];
    const uploadedPaths: string[] = [];

    for (const file of imageFiles) {
      const extension = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
      const storagePath = `${authData.user.id}/${randomUUID()}.${extension}`;
      const bytes = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseServer.storage
        .from("marketplace-product-images")
        .upload(storagePath, bytes, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        if (uploadedPaths.length) {
          await supabaseServer.storage
            .from("marketplace-product-images")
            .remove(uploadedPaths);
        }
        console.error("Marketplace product image upload failed.");
        return respond({ error: "An image could not be uploaded. Please try again." }, 500);
      }

      uploadedPaths.push(storagePath);
      const { data: publicUrl } = supabaseServer.storage
        .from("marketplace-product-images")
        .getPublicUrl(storagePath);
      imageUrls.push(publicUrl.publicUrl);
    }

    const { data: product, error: insertError } = await supabaseServer
      .from("marketplace_products")
      .insert({
        supplier_id: authData.user.id,
        name,
        slug: makeSlug(name),
        category,
        description,
        brand: brand || null,
        model_number: modelNumber || null,
        image_urls: imageUrls,
        price_type: priceType,
        indicative_price: indicativePrice,
        currency: "NGN",
        product_status: "draft",
      })
      .select(
        "id, name, category, description, brand, model_number, price_type, indicative_price, currency, product_status, created_at",
      )
      .single();

    if (insertError || !product) {
      if (uploadedPaths.length) {
        await supabaseServer.storage
          .from("marketplace-product-images")
          .remove(uploadedPaths);
      }
      console.error("Marketplace product creation failed.");
      return respond(
        { error: "Product could not be saved. Please try again." },
        500,
      );
    }

    return respond(
      {
        product,
        message: "Product saved as a draft. It is not publicly listed.",
      },
      201,
    );
  } catch {
    console.error("Unexpected marketplace product submission error.");
    return respond({ error: "An unexpected error occurred." }, 500);
  }
}
