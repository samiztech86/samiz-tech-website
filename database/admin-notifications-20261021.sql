-- Samiz Tech admin notifications
-- Browser access is denied; protected server APIs handle access.

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    event_type text NOT NULL
        CHECK (
            event_type IN (
                'supplier_registered',
                'product_submitted',
                'support_message',
                'marketplace_event'
            )
        ),

    title text NOT NULL,
    message text NOT NULL,

    entity_type text NOT NULL DEFAULT 'other'
        CHECK (
            entity_type IN (
                'supplier',
                'product',
                'support_conversation',
                'other'
            )
        ),

    entity_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz
);

CREATE INDEX IF NOT EXISTS admin_notifications_created_at_idx
    ON public.admin_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx
    ON public.admin_notifications (created_at DESC)
    WHERE read_at IS NULL;

ALTER TABLE public.admin_notifications
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_notifications
    FROM anon, authenticated;

GRANT ALL ON TABLE public.admin_notifications
    TO service_role;
