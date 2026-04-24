create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  message text not null,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

alter table support_tickets enable row level security;

create policy "Service role full access"
  on support_tickets
  using (true)
  with check (true);

create index support_tickets_status_idx on support_tickets (status, created_at desc);
