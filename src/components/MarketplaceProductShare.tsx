"use client";

import { useState } from "react";

type Props = {
  productName: string;
  slug: string;
  priceLabel?: string;
  compact?: boolean;
};

export default function MarketplaceProductShare({
  productName,
  slug,
  priceLabel,
  compact = false,
}: Props) {
  const [status, setStatus] = useState("");

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/marketplace/products/${encodeURIComponent(slug)}`
      : `https://www.samiztech.com.ng/marketplace/products/${encodeURIComponent(slug)}`;

  const message = [
    `Check out ${productName} on Samiz Tech Marketplace.`,
    priceLabel ? `Listed price: ${priceLabel}` : "Price: On request",
    productUrl,
  ].join("\n");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(productUrl);
      setStatus("Product link copied.");
    } catch {
      setStatus("Copy failed. Use the WhatsApp or Share option.");
    }
  }

  async function shareProduct() {
    if (!navigator.share) {
      setStatus("Native sharing is not supported in this browser. Use WhatsApp or Copy link.");
      return;
    }

    try {
      await navigator.share({
        title: `${productName} | Samiz Tech Marketplace`,
        text: message,
        url: productUrl,
      });
      setStatus("");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setStatus("Sharing was unsuccessful. Try WhatsApp or Copy link.");
      }
    }
  }

  const buttonClass =
    "inline-flex items-center justify-center border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100";

  return (
    <div className={compact ? "mt-3" : "mt-6 border-t border-slate-200 pt-5"}>
      {!compact && (
        <p className="mb-3 text-sm font-semibold text-slate-900">
          Share this product
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyLink} className={buttonClass}>
          Copy link
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          WhatsApp
        </a>
        <button type="button" onClick={shareProduct} className={buttonClass}>
          Share
        </button>
      </div>
      {status ? (
        <p role="status" aria-live="polite" className="mt-2 text-xs text-slate-600">
          {status}
        </p>
      ) : null}
    </div>
  );
}
