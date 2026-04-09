-- =====================================================================
-- Parcel — Communication Center (Slice 1)
-- =====================================================================
-- Adds messaging infrastructure: conversations, messages, read tracking.
-- Notifications table included for Slice 3 but created now to avoid
-- a second migration run.
--
-- Run this in the Supabase SQL Editor as a single block.
-- =====================================================================


-- ---------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------
create type public.conversation_type as enum ('direct', 'announcement', 'email_log');


-- ---------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  subject text,
  type public.conversation_type not null default 'direct',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.conversations is
  'Message threads. Direct = 1:1 admin-to-owner. Announcement = broadcast (owner_id NULL). Email_log = logged outbound email.';

create index idx_conversations_owner on public.conversations(owner_id);
create index idx_conversations_last_msg on public.conversations(last_message_at desc);


-- ---------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  is_system boolean not null default false,
  delivery_method text not null default 'portal',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Individual messages within a conversation. Body is HTML from Tiptap editor.';

create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_messages_sender on public.messages(sender_id);


-- ---------------------------------------------------------------------
-- message_reads
-- ---------------------------------------------------------------------
create table public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reader_id uuid not null references public.profiles(id) on delete cascade,
  first_read_at timestamptz not null default now(),
  read_count int not null default 1,
  last_read_at timestamptz not null default now(),
  device_info text
);

comment on table public.message_reads is
  'Engagement tracking per message per reader. Admin-only visibility.';

create unique index idx_message_reads_unique on public.message_reads(message_id, reader_id);


-- ---------------------------------------------------------------------
-- notifications (created now for Slice 3, avoids second migration)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'Event-triggered alerts shown in the portal notification bell.';

create index idx_notifications_owner on public.notifications(owner_id, created_at desc);
create index idx_notifications_unread on public.notifications(owner_id) where read = false;


-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.notifications enable row level security;

-- Helper: check if the current user is an admin
-- Reuses the existing is_admin() pattern if available, otherwise define here.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;


-- conversations: owners see their own + announcements
create policy "Owners read own conversations"
  on public.conversations for select
  using (owner_id = auth.uid() or type = 'announcement');

create policy "Admins full access conversations"
  on public.conversations for all
  using (public.is_admin());


-- messages: owners read messages in conversations they can see
create policy "Owners read messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.type = 'announcement')
    )
  );

-- owners can insert messages in their own direct conversations (reply)
create policy "Owners reply in own direct conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.owner_id = auth.uid()
        and c.type = 'direct'
    )
  );

create policy "Admins full access messages"
  on public.messages for all
  using (public.is_admin());


-- message_reads: no owner access. Admin only via service role.
create policy "Admins full access message_reads"
  on public.message_reads for all
  using (public.is_admin());

-- Owners can insert their own read receipts (for tracking)
create policy "Owners insert own reads"
  on public.message_reads for insert
  with check (reader_id = auth.uid());

-- Owners can update their own read receipts (increment count)
create policy "Owners update own reads"
  on public.message_reads for update
  using (reader_id = auth.uid());


-- notifications: owners read/update their own
create policy "Owners read own notifications"
  on public.notifications for select
  using (owner_id = auth.uid());

create policy "Owners update own notifications"
  on public.notifications for update
  using (owner_id = auth.uid());

create policy "Admins full access notifications"
  on public.notifications for all
  using (public.is_admin());


-- ---------------------------------------------------------------------
-- Trigger: update conversations.last_message_at on new message
-- ---------------------------------------------------------------------
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_message_update_conversation
  after insert on public.messages
  for each row
  execute function public.update_conversation_last_message();


-- ---------------------------------------------------------------------
-- RPC: increment read count (upsert-style)
-- ---------------------------------------------------------------------
create or replace function public.increment_message_read(
  p_message_id uuid,
  p_reader_id uuid,
  p_device_info text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.message_reads
  set read_count = read_count + 1,
      last_read_at = now(),
      device_info = coalesce(p_device_info, device_info)
  where message_id = p_message_id
    and reader_id = p_reader_id;
end;
$$;


-- ---------------------------------------------------------------------
-- Enable Realtime
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
