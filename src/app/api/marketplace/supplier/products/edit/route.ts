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

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function matchesImageSignature(bytes: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") {
    return bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;
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
  const uploadedPaths: string[] = [];

  try {
    const origin = request.headers.get("origin");

    if (origin) {
      try {
        if (new URL(origin).origin !== new URL(request.url).origin) {
          return respond({ error: "Request origin is not allowed." }, 403);
        }
      } catch {
        return respond({ error: "Request origin is invalid." }, 403);
      }
    }

    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return respond({ error: "A multipart product update is required." }, 400);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return respond({ error: "Invalid product update form." }, 400);
    }

    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value.trim() : "";
    };

    const productId = field("productId");
    const name = field("name");
    const category = field("category");
    const description = field("description");
    const brand = field("brand");
    const modelNumber = field("model_number");
    const priceType = field("price_type");
    const rawPrice = field("indicative_price");

    if (!UUID_PATTERN.test(productId)) {
      return respond({ error: "A valid product ID is required." }, 400);
    }

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
      if (!rawPrice) {
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

    const imageEntries = form.getAll("images");
    if (imageEntries.some((entry) => !(entry instanceof File))) {
      return respond({ error: "Invalid image upload." }, 400);
    }

    const imageFiles = imageEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    );

    if (imageFiles.length > MAX_IMAGES) {
      return respond({ error: "Upload no more than 5 product images." }, 400);
    }

    const validatedImages: Array<{ file: File; bytes: Buffer }> = [];

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

      validatedImages.push({ file, bytes });
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Please sign in to edit your listings." }, 401);
    }

    const userId = authData.user.id;

    const { data: supplier, error: supplierError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, verification_status")
      .eq("id", userId)
      .maybeSingle();

    if (supplierError) {
      console.error("Marketplace product edit: supplier lookup failed.");
      return respond({ error: "Unable to verify supplier approval." }, 500);
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond({ error: "Only approved suppliers can edit product listings." }, 403);
    }

    const agreementGuard = await requireCurrentSupplierAgreementAcceptance(userId);

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

    const { data: existing, error: lookupError } = await supabaseServer
      .from("marketplace_products")
      .select("id, supplier_id, product_status, image_urls")
      .eq("id", productId)
      .eq("supplier_id", userId)
      .maybeSingle();

    if (lookupError) {
      console.error("Marketplace product edit: product lookup failed.");
      return respond({ error: "Unable to load this product for editing." }, 500);
    }

    if (!existing) {
      return respond({ error: "Product not found for this supplier." }, 404);
    }

    const currentStatus = existing.product_status;

    if (!["draft", "approved", "rejected"].includes(currentStatus)) {
      return respond(
        { error: "This product cannot be edited while it is awaiting review. Refresh your dashboard." },
        409,
      );
    }

    const currentImages = Array.isArray(existing.image_urls)
      ? existing.image_urls.filter(
          (url: unknown): url is string =>
            typeof url === "string" && url.trim().length > 0,
        )
      : [];

    const imageUrls: string[] = validatedImages.length > 0 ? [] : [...currentImages];

    for (const { file, bytes } of validatedImages) {
      const extension = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
      const storagePath = `${userId}/${randomUUID()}.${extension}`;

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

        console.error("Marketplace product edit: image upload failed.");
        return respond({ error: "An image could not be uploaded. Please try again." }, 500);
      }

      uploadedPaths.push(storagePath);

      const { data: publicUrl } = supabaseServer.storage
        .from("marketplace-product-images")
        .getPublicUrl(storagePath);

      imageUrls.push(publicUrl.publicUrl);
    }

    const nextStatus = currentStatus === "draft" ? "draft" : "submitted";

    const update: Record<string, unknown> = {
      name,
      category,
      description,
      brand: brand || null,
      model_number: modelNumber || null,
      price_type: priceType,
      indicative_price: indicativePrice,
      product_status: nextStatus,
    };

    if (validatedImages.length > 0) {
      update.image_urls = imageUrls;
    }

    const { data: product, error: updateError } = await supabaseServer
      .from("marketplace_products")
      .update(update)
      .eq("id", productId)
      .eq("supplier_id", userId)
      .eq("product_status", currentStatus)
      .select(
        "id, name, category, description, brand, model_number, price_type, indicative_price, currency, product_status, image_urls",
      )
      .maybeSingle();

    if (updateError || !product) {
      if (uploadedPaths.length) {
        await supabaseServer.storage
          .from("marketplace-product-images")
          .remove(uploadedPaths);
      }

      if (updateError) {
        console.error("Marketplace product edit: database update failed.");
      }

      return respond(
        {
          error: updateError
            ? "Product could not be updated. Please try again."
            : "This product changed while you were editing it. Refresh the dashboard and try again.",
        },
        updateError ? 500 : 409,
      );
    }

    return respond({
      success: true,
      product,
      message: nextStatus === "draft"
        ? "Draft updated successfully. Submit it for review when ready."
        : "Product updated and submitted for admin review. It will be publicly visible again after approval.",
    });
  } catch {
    if (uploadedPaths.length) {
      await supabaseServer.storage
        .from("marketplace-product-images")
        .remove(uploadedPaths);
    }

    console.error("Unexpected marketplace product edit failure.");
    return respond({ error: "Unable to update this product right now." }, 500);
  }
}
