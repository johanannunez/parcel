create table changelogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  version text,
  tag text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table changelogs enable row level security;

create policy "Service role full access"
  on changelogs
  using (true)
  with check (true);

create index changelogs_published_at_idx on changelogs (published_at desc);
