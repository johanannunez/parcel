create table if not exists public.ai_insights (
  id             uuid primary key default gen_random_uuid(),
  parent_type    text not null check (parent_type in ('contact','property','project')),
  parent_id      uuid not null,
  agent_key      text not null,
  severity       text not null default 'info'
                 check (severity in ('info','recommendation','warning','success')),
  title          text not null,
  body           text not null,
  action_label   text,
  action_payload jsonb,
  dismissed_at   timestamptz,
  expires_at     timestamptz,
  created_at     timestamptz not null default now(),
  constraint ai_insights_parent_agent_key unique (parent_type, parent_id, agent_key)
);

-- Composite index; omit now() from predicate so it stays immutable.
create index if not exists ai_insights_parent_active_idx
  on ai_insights (parent_type, parent_id)
  where dismissed_at is null;

alter table ai_insights enable row level security;

drop policy if exists ai_insights_admin_rw on ai_insights;
create policy ai_insights_admin_rw on ai_insights
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Seed: property in-progress (setup_status = 'in_progress' approximates onboarding).
insert into ai_insights (parent_type, parent_id, agent_key, severity, title, body, action_label)
select 'property', p.id, 'setup_agent', 'recommendation',
       'Setup Agent',
       'Listing photos pending for over 4 days. Want a nudge email drafted for the owner?',
       'Draft nudge'
  from properties p
 where p.setup_status = 'in_progress'
 limit 1
on conflict (parent_type, parent_id, agent_key) do nothing;

-- Seed: contact in paused/churned stage.
insert into ai_insights (parent_type, parent_id, agent_key, severity, title, body)
select 'contact', c.id, 'winback_agent', 'recommendation',
       'Win-back Agent',
       '41% of paused owners reactivate within 6 months. Consider a check-in in 30 days.'
  from contacts c
 where c.lifecycle_stage in ('paused','churned')
 limit 1
on conflict (parent_type, parent_id, agent_key) do nothing;
