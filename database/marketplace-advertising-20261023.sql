-- Samiz Tech marketplace advertising campaigns
-- Local draft only. Review and validate before applying to Supabase.
-- Advertising payments are separate from marketplace product-sale payments.
-- Fixed package prices must be defined and enforced server-side.

BEGIN;

CREATE TABLE public.marketplace_ad_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    supplier_id uuid NOT NULL
        REFERENCES public.marketplace_supplier_profiles(id)
        ON DELETE RESTRICT,

    product_id uuid,

    package_id text NOT NULL
        CHECK (length(trim(package_id)) BETWEEN 1 AND 80),

    package_name text NOT NULL
        CHECK (length(trim(package_name)) BETWEEN 1 AND 120),

    amount_kobo bigint NOT NULL
        CHECK (amount_kobo > 0),

    currency text NOT NULL DEFAULT 'NGN'
        CHECK (currency = 'NGN'),

    headline text NOT NULL
        CHECK (length(trim(headline)) BETWEEN 1 AND 160),

    description text
        CHECK (description IS NULL OR length(description) <= 2000),

    image_url text NOT NULL
        CHECK (length(trim(image_url)) BETWEEN 1 AND 2048),

    target_url text NOT NULL
        CHECK (length(trim(target_url)) BETWEEN 1 AND 2048),

    placement text NOT NULL
        CHECK (
            placement IN (
                'marketplace_featured',
                'category_featured',
                'homepage_banner'
            )
        ),

    payment_status text NOT NULL DEFAULT 'pending'
        CHECK (
            payment_status IN (
                'pending',
                'paid',
                'failed',
                'refunded'
            )
        ),

    campaign_status text NOT NULL DEFAULT 'pending_review'
        CHECK (
            campaign_status IN (
                'pending_review',
                'approved',
                'rejected',
                'paused',
                'completed',
                'cancelled'
            )
        ),

    paystack_reference text NOT NULL UNIQUE,
    paystack_transaction_id bigint UNIQUE,

    paid_at timestamptz,

    starts_at timestamptz,
    ends_at timestamptz,

    admin_review_note text
        CHECK (
            admin_review_note IS NULL
            OR length(admin_review_note) <= 1000
        ),

    reviewed_by text,
    reviewed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT marketplace_ad_campaigns_schedule_check
        CHECK (
            (starts_at IS NULL AND ends_at IS NULL)
            OR
            (starts_at IS NOT NULL AND ends_at IS NOT NULL
             AND ends_at > starts_at)
        ),

    CONSTRAINT marketplace_ad_campaigns_paid_fields_check
        CHECK (
            payment_status <> 'paid'
            OR (paid_at IS NOT NULL AND paystack_transaction_id IS NOT NULL)
        ),

    CONSTRAINT marketplace_ad_campaigns_product_supplier_fk
        FOREIGN KEY (product_id, supplier_id)
        REFERENCES public.marketplace_products (id, supplier_id)
        ON DELETE RESTRICT
);

CREATE INDEX marketplace_ad_campaigns_supplier_created_idx
    ON public.marketplace_ad_campaigns (supplier_id, created_at DESC);

CREATE INDEX marketplace_ad_campaigns_review_queue_idx
    ON public.marketplace_ad_campaigns (created_at DESC)
    WHERE campaign_status = 'pending_review';

CREATE INDEX marketplace_ad_campaigns_active_placement_idx
    ON public.marketplace_ad_campaigns (placement, starts_at, ends_at)
    WHERE payment_status = 'paid'
      AND campaign_status = 'approved';

ALTER TABLE public.marketplace_ad_campaigns
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.marketplace_ad_campaigns
    FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.marketplace_ad_campaigns
    TO service_role;

COMMIT;
