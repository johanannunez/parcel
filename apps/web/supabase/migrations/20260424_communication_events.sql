create table if not exists public.communication_events (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  quo_id             text unique not null,
  channel            text not null check (channel in ('call', 'sms')),
  direction          text not null check (direction in ('inbound', 'outbound')),
  phone_from         text not null,
  phone_to           text not null,
  raw_transcript     text,
  duration_seconds   int,
  recording_url      text,
  quo_summary        text,
  entity_type        text check (entity_type in ('owner', 'contact', 'vendor', 'unknown')),
  entity_id          uuid,
  process_after      timestamptz,
  processed_at       timestamptz,
  tier               text check (tier in ('action_required', 'fyi', 'noise')),
  claude_summary     text,
  created_at         timestamptz not null default now()
);

-- Only index rows that still need processing
create index if not exists communication_events_pipeline_idx
  on public.communication_events (process_after)
  where processed_at is null;

create index if not exists communication_events_entity_idx
  on public.communication_events (entity_type, entity_id);

create index if not exists communication_events_phone_from_idx
  on public.communication_events (phone_from);

alter table public.communication_events enable row level security;

create policy "Admins can manage communication_events"
  on public.communication_events
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
