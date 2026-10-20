-- Samiz Tech customer support chat
-- Local draft only. Review before applying to Supabase.
-- Does not modify marketplace, orders, or payment tables.

create table if not exists public.support_conversations (
    id uuid primary key default gen_random_uuid(),
    visitor_name text not null
        check (char_length(trim(visitor_name)) between 1 and 120),
    visitor_email text not null
        check (char_length(trim(visitor_email)) between 3 and 254),
    visitor_token_hash text not null unique,
    subject text null
        check (subject is null or char_length(subject) <= 200),
    status text not null default 'open'
        check (status in ('open', 'waiting', 'resolved')),
    last_message_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists support_conversations_status_last_message_idx
    on public.support_conversations (status, last_message_at desc);

create table if not exists public.support_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null
        references public.support_conversations(id) on delete cascade,
    sender_type text not null
        check (sender_type in ('visitor', 'admin')),
    message text not null
        check (char_length(trim(message)) between 1 and 5000),
    created_at timestamptz not null default now()
);

create index if not exists support_messages_conversation_created_idx
    on public.support_messages (conversation_id, created_at asc);

-- Browser clients must access support data only through protected APIs.
-- The server-side API must hash and verify the visitor's random token.
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

revoke all on public.support_conversations from anon, authenticated;
revoke all on public.support_messages from anon, authenticated;
