-- Samiz Tech Engineering Ltd
-- Team applications and persistent public submission rate limiting.
-- Prepared locally; review and apply separately through Supabase SQL Editor.

BEGIN;

-- 1. Store team applications.
CREATE TABLE IF NOT EXISTS public.team_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    location text,
    application_type text NOT NULL
        CHECK (application_type IN ('employment_interest', 'volunteer_collaboration', 'project_collaboration')),
    interest_area text NOT NULL
        CHECK (interest_area IN (
            'software_development',
            'electrical_solar',
            'energyos_iot_automation',
            'business_development_sales',
            'operations_field_support',
            'other'
        )),
    experience text NOT NULL,
    portfolio_url text,
    consent boolean NOT NULL DEFAULT false CHECK (consent = true),
    status text NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'shortlisted', 'contacted', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT team_applications_name_length
        CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
    CONSTRAINT team_applications_email_length
        CHECK (char_length(email) BETWEEN 5 AND 254),
    CONSTRAINT team_applications_phone_length
        CHECK (char_length(btrim(phone)) BETWEEN 7 AND 40),
    CONSTRAINT team_applications_location_length
        CHECK (location IS NULL OR char_length(location) <= 120),
    CONSTRAINT team_applications_experience_length
        CHECK (char_length(btrim(experience)) BETWEEN 20 AND 5000),
    CONSTRAINT team_applications_portfolio_length
        CHECK (portfolio_url IS NULL OR char_length(portfolio_url) <= 2048)
);

CREATE INDEX IF NOT EXISTS team_applications_created_at_idx
    ON public.team_applications (created_at DESC);

CREATE INDEX IF NOT EXISTS team_applications_status_created_at_idx
    ON public.team_applications (status, created_at DESC);

ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.team_applications
    FROM anon, authenticated;

GRANT ALL ON TABLE public.team_applications
    TO service_role;


-- 2. Store only hashed rate-limit identifiers, never raw IP addresses.
CREATE TABLE IF NOT EXISTS public.team_application_rate_limits (
    identifier_hash text PRIMARY KEY,
    window_started_at timestamptz NOT NULL,
    submission_count integer NOT NULL DEFAULT 1
        CHECK (submission_count >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_application_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.team_application_rate_limits
    FROM anon, authenticated;

GRANT ALL ON TABLE public.team_application_rate_limits
    TO service_role;


-- 3. Atomically allow at most 3 submissions per identifier per hour.
CREATE OR REPLACE FUNCTION public.check_team_application_rate_limit(
    p_identifier_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    current_window timestamptz := date_trunc('hour', now());
    current_count integer;
BEGIN
    IF p_identifier_hash IS NULL
       OR char_length(p_identifier_hash) < 32
       OR char_length(p_identifier_hash) > 128 THEN
        RETURN false;
    END IF;

    INSERT INTO public.team_application_rate_limits (
        identifier_hash,
        window_started_at,
        submission_count,
        updated_at
    )
    VALUES (
        p_identifier_hash,
        current_window,
        1,
        now()
    )
    ON CONFLICT (identifier_hash)
    DO UPDATE SET
        window_started_at = CASE
            WHEN public.team_application_rate_limits.window_started_at < current_window
                THEN current_window
            ELSE public.team_application_rate_limits.window_started_at
        END,
        submission_count = CASE
            WHEN public.team_application_rate_limits.window_started_at < current_window
                THEN 1
            ELSE public.team_application_rate_limits.submission_count + 1
        END,
        updated_at = now()
    RETURNING submission_count INTO current_count;

    RETURN current_count <= 3;
END;
$function$;

REVOKE ALL ON FUNCTION public.check_team_application_rate_limit(text)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_team_application_rate_limit(text)
    TO service_role;


-- 4. Extend the existing admin notification event/entity constraints.
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
            'team_application'
        )
    );

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
            'other'
        )
    );

COMMIT;
