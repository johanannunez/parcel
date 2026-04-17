-- Activity log visibility
-- Adds a visibility enum ('admin_only' | 'both') to public.activity_log so the
-- admin timeline can show internal-only events while the owner timeline sees
-- only 'both'. Owners read their own activity via (entity_type, entity_id):
--   - entity_type = 'owner'    AND entity_id = auth.uid()
--   - entity_type = 'property' AND entity_id in (their properties)
-- Admins keep full access (unchanged semantically from the original policy,
-- which is replaced below with an explicit admin-read policy named
-- activity_log_admin_read, plus a new activity_log_owner_read policy).

-- 1. Enum type
do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_visibility') then
    create type public.activity_visibility as enum ('admin_only', 'both');
  end if;
end $$;

-- 2. Column (default 'both' so existing rows remain visible to owners)
alter table public.activity_log
  add column if not exists visibility public.activity_visibility not null default 'both';

-- 3. Composite index for owner timeline lookups
create index if not exists activity_log_visibility_idx
  on public.activity_log (entity_type, entity_id, visibility, created_at desc);

-- 4. Ensure RLS is on (it already is from the initial schema, this is a no-op
--    guard for idempotency if this migration is ever replayed standalone).
alter table public.activity_log enable row level security;

-- 5. Policies (drop-then-create so this migration is idempotent and supersedes
--    the original "Admins view activity log" policy).
drop policy if exists "Admins view activity log" on public.activity_log;
drop policy if exists activity_log_admin_read on public.activity_log;
drop policy if exists activity_log_owner_read on public.activity_log;

create policy activity_log_admin_read
  on public.activity_log for select
  to authenticated
  using (public.is_admin());

create policy activity_log_owner_read
  on public.activity_log for select
  to authenticated
  using (
    visibility = 'both'
    and (
      (entity_type = 'owner' and entity_id = auth.uid())
      or (
        entity_type = 'property'
        and entity_id in (
          select id from public.properties where owner_id = auth.uid()
        )
      )
    )
  );

comment on column public.activity_log.visibility is
  'Controls who can see this event. admin_only = admins only (internal notes, system events). both = admins and the owning owner/property owner.';
