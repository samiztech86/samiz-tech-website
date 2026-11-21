"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";

type Props = {
  images: string[];
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export default function MarketplaceProductGallery({
  images,
  alt,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className = "",
  priority = false,
}: Props) {
  const validImages = images.filter(
    (url) => typeof url === "string" && /^https?:\/\//i.test(url),
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const hasMultiple = validImages.length > 1;

  const previous = useCallback(() => {
    setActiveIndex((current) =>
      current === 0 ? validImages.length - 1 : current - 1,
    );
  }, [validImages.length]);

  const next = useCallback(() => {
    setActiveIndex((current) =>
      current === validImages.length - 1 ? 0 : current + 1,
    );
  }, [validImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft" && hasMultiple) previous();
      if (event.key === "ArrowRight" && hasMultiple) next();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, hasMultiple, previous, next]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const body = document.body;
    const html = document.documentElement;

    const originalBodyOverflow = body.style.overflow;
    const originalBodyPaddingRight = body.style.paddingRight;
    const originalHtmlOverflow = html.style.overflow;

    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const currentPaddingRight =
      Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [lightboxOpen]);

  const handleTouchEnd = (endX: number) => {
    if (touchStart === null) return;

    const difference = touchStart - endX;
    if (Math.abs(difference) > 45 && hasMultiple) {
      if (difference > 0) next();
      else previous();
    }

    setTouchStart(null);
  };

  if (validImages.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-500 ${className}`}>
        Product image unavailable
      </div>
    );
  }

  return (
    <>
      <div
        className={`group relative h-full w-full overflow-hidden ${className}`}
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 z-0 block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
          aria-label={`Enlarge image ${activeIndex + 1} of ${validImages.length}: ${alt}`}
        >
          <Image
            src={validImages[activeIndex]}
            alt={alt}
            fill
            unoptimized
            priority={priority}
            sizes={sizes}
            className="object-contain p-4"
          />
        </button>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Previous product image"
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-lg text-white opacity-100 shadow transition hover:bg-slate-900 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next product image"
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-lg text-white opacity-100 shadow transition hover:bg-slate-900 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            >
              ›
            </button>
            <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full bg-slate-900/75 px-2 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {validImages.length}
            </span>
          </>
        ) : null}
      </div>

      {lightboxOpen ? createPortal((
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-contain bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} image gallery`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close enlarged image"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25"
          >
            ×
          </button>

          {hasMultiple ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  previous();
                }}
                aria-label="Previous enlarged image"
                className="absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25 sm:left-6"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  next();
                }}
                aria-label="Next enlarged image"
                className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25 sm:right-6"
              >
                ›
              </button>
            </>
          ) : null}

          <div
            className="relative h-[80vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          >
            <Image
              src={validImages[activeIndex]}
              alt={`${alt} — image ${activeIndex + 1}`}
              fill
              unoptimized
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {hasMultiple ? (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
              {activeIndex + 1} of {validImages.length}
            </span>
          ) : null}
        </div>
      ), document.body) : null}
    </>
  );
}
