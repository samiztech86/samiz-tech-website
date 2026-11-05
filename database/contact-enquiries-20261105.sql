-- Samiz Tech Engineering Ltd
-- Contact enquiries and admin notification support.
-- Prepared locally. Review and apply separately through Supabase SQL Editor.

BEGIN;

-- 1. Persist public website contact enquiries.
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    company text,
    phone text NOT NULL,
    email text,
    service text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'contacted', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT contact_enquiries_name_length
        CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
    CONSTRAINT contact_enquiries_company_length
        CHECK (company IS NULL OR char_length(company) <= 160),
    CONSTRAINT contact_enquiries_phone_length
        CHECK (char_length(btrim(phone)) BETWEEN 7 AND 40),
    CONSTRAINT contact_enquiries_email_length
        CHECK (email IS NULL OR char_length(email) BETWEEN 5 AND 254),
    CONSTRAINT contact_enquiries_service_length
        CHECK (service IS NULL OR char_length(service) <= 60),
    CONSTRAINT contact_enquiries_message_length
        CHECK (char_length(btrim(message)) BETWEEN 10 AND 5000)
);

CREATE INDEX IF NOT EXISTS contact_enquiries_created_at_idx
    ON public.contact_enquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_enquiries_status_created_at_idx
    ON public.contact_enquiries (status, created_at DESC);

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.contact_enquiries
    FROM anon, authenticated;

GRANT ALL ON TABLE public.contact_enquiries
    TO service_role;

-- Maintain updated_at whenever an enquiry is changed.
CREATE OR REPLACE FUNCTION public.set_contact_enquiry_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_contact_enquiry_updated_at()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS contact_enquiries_set_updated_at
    ON public.contact_enquiries;

CREATE TRIGGER contact_enquiries_set_updated_at
    BEFORE UPDATE ON public.contact_enquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_contact_enquiry_updated_at();

-- 2. Extend the existing admin notification event constraint.
ALTER TABLE public.admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_event_type_check;

ALTER TABLE public.admin_notifications
    ADD CONSTRAINT admin_notifications_event_type_check
    CHECK (
        event_type IN (
            'supplier_registered',
            'product_submitted',
            'support_message',
            'marketplace_event',
            'team_application',
            'contact_enquiry'
        )
    );

-- 3. Extend the existing admin notification entity constraint.
ALTER TABLE public.admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_entity_type_check;

ALTER TABLE public.admin_notifications
    ADD CONSTRAINT admin_notifications_entity_type_check
    CHECK (
        entity_type IN (
            'supplier',
            'product',
            'support_conversation',
            'team_application',
            'contact_enquiry',
            'other'
        )
    );

COMMIT;
