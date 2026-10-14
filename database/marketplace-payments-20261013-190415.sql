-- Samiz marketplace payments migration draft
-- LOCAL DRAFT ONLY. Review before running in Supabase SQL Editor.
-- Does not modify existing quote-request or other payment flows.

BEGIN;

-- Supplier payout configuration.
-- Never store the full bank account number in this table.
ALTER TABLE public.marketplace_supplier_profiles
    ADD COLUMN IF NOT EXISTS payout_bank_code text,
    ADD COLUMN IF NOT EXISTS payout_bank_name text,
    ADD COLUMN IF NOT EXISTS payout_account_name text,
    ADD COLUMN IF NOT EXISTS payout_account_last4 text,
    ADD COLUMN IF NOT EXISTS payout_subaccount_code text,
    ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'not_configured',
    ADD COLUMN IF NOT EXISTS payout_updated_at timestamptz;

-- Add payout status validation without replacing existing constraints.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'marketplace_supplier_payout_status_check'
          AND conrelid = 'public.marketplace_supplier_profiles'::regclass
    ) THEN
        ALTER TABLE public.marketplace_supplier_profiles
            ADD CONSTRAINT marketplace_supplier_payout_status_check
            CHECK (
                payout_status IN (
                    'not_configured',
                    'pending',
                    'active',
                    'failed',
                    'disabled'
                )
                AND (
                    payout_status <> 'active'
                    OR (
                        payout_bank_code IS NOT NULL
                        AND payout_account_name IS NOT NULL
                        AND payout_account_last4 IS NOT NULL
                        AND payout_subaccount_code IS NOT NULL
                    )
                )
            );
    END IF;
END
$$;
-- A Paystack subaccount must not be assigned to multiple suppliers.
CREATE UNIQUE INDEX IF NOT EXISTS
    marketplace_supplier_payout_subaccount_unique
ON public.marketplace_supplier_profiles (payout_subaccount_code)
WHERE payout_subaccount_code IS NOT NULL;

-- One supplier per order in this initial marketplace checkout design.
-- All monetary amounts are integer kobo snapshots.
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id uuid NOT NULL,
    supplier_id uuid NOT NULL REFERENCES
        public.marketplace_supplier_profiles(id) ON DELETE RESTRICT,

    product_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price_kobo bigint NOT NULL,
    subtotal_kobo bigint NOT NULL,
    commission_kobo bigint NOT NULL,
    supplier_amount_kobo bigint NOT NULL,

    currency text NOT NULL DEFAULT 'NGN',

    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,

    payment_status text NOT NULL DEFAULT 'pending',
    paystack_reference text NOT NULL UNIQUE,
    paystack_transaction_id bigint UNIQUE,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT marketplace_orders_product_supplier_fk
        FOREIGN KEY (product_id, supplier_id)
        REFERENCES public.marketplace_products(id, supplier_id)
        ON DELETE RESTRICT,

    CONSTRAINT marketplace_orders_quantity_check
        CHECK (quantity BETWEEN 1 AND 10000),

    CONSTRAINT marketplace_orders_unit_price_check
        CHECK (unit_price_kobo > 0),

    CONSTRAINT marketplace_orders_subtotal_check
        CHECK (subtotal_kobo = unit_price_kobo * quantity),

    CONSTRAINT marketplace_orders_commission_check
        CHECK (
            commission_kobo = round(subtotal_kobo::numeric * 0.05)::bigint
        ),

    CONSTRAINT marketplace_orders_supplier_amount_check
        CHECK (supplier_amount_kobo = subtotal_kobo - commission_kobo),

    CONSTRAINT marketplace_orders_currency_check
        CHECK (currency = 'NGN'),

    CONSTRAINT marketplace_orders_payment_status_check
        CHECK (
            payment_status IN (
                'pending',
                'paid',
                'failed',
                'cancelled',
                'refunded'
            )
        ),

    CONSTRAINT marketplace_orders_customer_name_check
        CHECK (char_length(trim(customer_name)) BETWEEN 2 AND 120),

    CONSTRAINT marketplace_orders_customer_email_check
        CHECK (char_length(trim(customer_email)) BETWEEN 3 AND 254),

    CONSTRAINT marketplace_orders_customer_phone_check
        CHECK (char_length(trim(customer_phone)) BETWEEN 7 AND 40)
);

CREATE INDEX IF NOT EXISTS marketplace_orders_supplier_created_idx
    ON public.marketplace_orders (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_orders_product_created_idx
    ON public.marketplace_orders (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_orders_status_created_idx
    ON public.marketplace_orders (payment_status, created_at DESC);

-- No direct browser access. Dedicated server endpoints will use the
-- server-only Supabase service role after authenticating/validating requests.
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.marketplace_orders FROM anon, authenticated;
GRANT ALL ON TABLE public.marketplace_orders TO service_role;

COMMIT;


