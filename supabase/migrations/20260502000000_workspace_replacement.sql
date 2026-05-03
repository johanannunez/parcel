-- Rename the owner collaboration object from entities to workspaces.
-- Legal business entity details remain fields on the workspace row.

do $$
begin
  if to_regclass('public.entities') is not null
     and to_regclass('public.workspaces') is null then
    alter table public.entities rename to workspaces;
  end if;

  if to_regclass('public.workspaces') is null then
    create table public.workspaces (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      type text not null default 'individual',
      ein text,
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint workspaces_type_check check (
        type in ('individual', 'llc', 's_corp', 'c_corp', 'trust', 'partnership')
      )
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contacts'
      and column_name = 'entity_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contacts'
      and column_name = 'workspace_id'
  ) then
    alter table public.contacts rename column entity_id to workspace_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'entity_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'workspace_id'
  ) then
    alter table public.profiles rename column entity_id to workspace_id;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'contacts_entity_id_fkey'
  ) then
    alter table public.contacts rename constraint contacts_entity_id_fkey to contacts_workspace_id_fkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_entity_id_fkey'
  ) then
    alter table public.profiles rename constraint profiles_entity_id_fkey to profiles_workspace_id_fkey;
  end if;

  if to_regclass('public.idx_contacts_entity_id') is not null then
    alter index public.idx_contacts_entity_id rename to idx_contacts_workspace_id;
  end if;
end $$;

alter table public.contacts
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

alter table public.profiles
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists idx_contacts_workspace_id on public.contacts(workspace_id);
create index if not exists idx_profiles_workspace_id on public.profiles(workspace_id);
