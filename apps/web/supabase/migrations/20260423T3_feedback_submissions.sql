create table feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('bug', 'idea', 'compliment', 'other')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table feedback_submissions enable row level security;

create policy "Service role full access"
  on feedback_submissions
  using (true)
  with check (true);
