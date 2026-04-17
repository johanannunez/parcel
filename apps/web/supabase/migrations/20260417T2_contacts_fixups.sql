-- Fixups on top of 20260417_contacts_and_saved_views.sql.
-- 1. Generic updated_at trigger helper.
-- 2. Apply it to saved_views.
-- 3. Keep contacts' stage_changed_at logic but route updated_at through the shared helper.
-- 4. Relax properties.contact_id FK to ON DELETE SET NULL so churned contacts can be deleted
--    without cascading-blocking the property record.

-- 1. Generic helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 2. saved_views trigger
drop trigger if exists saved_views_touch_updated_at on public.saved_views;
create trigger saved_views_touch_updated_at
before update on public.saved_views
for each row execute function public.touch_updated_at();

-- 3. contacts: keep both triggers; the stage trigger is BEFORE UPDATE but narrower.
--    Replace the combined function with a stage-only function and use the shared helper
--    for the updated_at field via a second trigger.
create or replace function public.contacts_touch_stage_changed_at()
returns trigger language plpgsql as $$
begin
  if new.lifecycle_stage is distinct from old.lifecycle_stage then
    new.stage_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at
before update on public.contacts
for each row execute function public.touch_updated_at();

drop trigger if exists contacts_touch_stage_changed_at on public.contacts;
create trigger contacts_touch_stage_changed_at
before update on public.contacts
for each row execute function public.contacts_touch_stage_changed_at();

-- 4. FK relaxation: properties.contact_id → on delete set null.
-- PostgreSQL does not support ALTER COLUMN for FK semantics, so drop + recreate the constraint.
do $$
declare
  fkname text;
begin
  select conname into fkname
    from pg_constraint
   where conrelid = 'public.properties'::regclass
     and contype = 'f'
     and conname like '%contact_id%';
  if fkname is not null then
    execute format('alter table public.properties drop constraint %I', fkname);
  end if;
end $$;

alter table public.properties
  add constraint properties_contact_id_fkey
  foreign key (contact_id) references public.contacts(id)
  on delete set null;
