-- apps/web/supabase/seeds/pipeline-dev-seed.sql
-- Development seed for the pipeline system.
-- Every row uses a deterministic UUID (md5-based) so re-runs upsert instead of duplicating.
-- Every human-readable field is prefixed with "TEST · " so real data can be filtered.
-- NEVER run this in production.
--
-- Apply via MCP: mcp__claude_ai_Supabase__execute_sql project_id=pwoxwpryummqeqsxdgyc
-- Or via psql: PGPASSWORD=... psql "$DATABASE_URL" -f apps/web/supabase/seeds/pipeline-dev-seed.sql

do $$
declare
  admin_user uuid := '9b7a5e7d-b799-40fa-b8f6-b68a3f4a00ee';

  -- Contact UUIDs
  c_avery    uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.avery-barlow'),   1, 12))::uuid;
  c_sarah    uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.sarah-johnson'),  1, 12))::uuid;
  c_marcus   uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.marcus-reyes'),   1, 12))::uuid;
  c_priya    uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.priya-shah'),     1, 12))::uuid;
  c_dana     uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.dana-chen'),      1, 12))::uuid;
  c_lori     uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.lori-henderson'), 1, 12))::uuid;
  c_mike     uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.mike-robertson'), 1, 12))::uuid;
  c_cathy    uuid := ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.cathy-marsh'),    1, 12))::uuid;

  -- Property UUIDs
  p_dana_onb uuid := ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.dana-onb'),    1, 12))::uuid;
  p_mike_rev uuid := ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.mike-review'), 1, 12))::uuid;
  p_ready    uuid := ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.ready'),       1, 12))::uuid;
  p_live1    uuid := ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-1'),      1, 12))::uuid;
  p_live2    uuid := ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-2'),      1, 12))::uuid;
  p_paused   uuid := ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.paused'),      1, 12))::uuid;

  -- Project UUIDs
  j_idea     uuid := ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.idea-1'),     1, 12))::uuid;
  j_feature  uuid := ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.feature-1'),  1, 12))::uuid;
  j_cleaner  uuid := ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.cleaner-1'),  1, 12))::uuid;
  j_employee uuid := ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.employee-1'), 1, 12))::uuid;

  -- Task UUIDs
  t_ov1      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.overdue-1'),  1, 12))::uuid;
  t_ov2      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.overdue-2'),  1, 12))::uuid;
  t_ov3      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.overdue-3'),  1, 12))::uuid;
  t_td1      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.today-1'),    1, 12))::uuid;
  t_td2      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.today-2'),    1, 12))::uuid;
  t_wk1      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.week-1'),     1, 12))::uuid;
  t_wk2      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.week-2'),     1, 12))::uuid;
  t_wk3      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.week-3'),     1, 12))::uuid;
  t_lt1      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.later-1'),    1, 12))::uuid;
  t_lt2      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.later-2'),    1, 12))::uuid;
  t_nd1      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.none-1'),     1, 12))::uuid;
  t_par      uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'),   1, 12))::uuid;
  t_sub1     uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-1'),      1, 12))::uuid;
  t_sub2     uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-2'),      1, 12))::uuid;
  t_sub3     uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-3'),      1, 12))::uuid;
  t_sub4     uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-4'),      1, 12))::uuid;
  t_sub5     uuid := ('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-5'),      1, 12))::uuid;

  -- Note UUIDs
  n1         uuid := ('0000e000-0000-0000-0000-' || substring(md5('seed.note.1'), 1, 12))::uuid;
  n2         uuid := ('0000e000-0000-0000-0000-' || substring(md5('seed.note.2'), 1, 12))::uuid;
  n3         uuid := ('0000e000-0000-0000-0000-' || substring(md5('seed.note.3'), 1, 12))::uuid;

  -- AI Insight UUIDs
  ai_info    uuid := ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.info'),           1, 12))::uuid;
  ai_rec     uuid := ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.recommendation'), 1, 12))::uuid;
  ai_warn    uuid := ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.warning'),        1, 12))::uuid;
  ai_succ    uuid := ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.success'),        1, 12))::uuid;

begin

  -- -----------------------------------------------------------------------
  -- CONTACTS (8 records, one per lifecycle_stage)
  -- -----------------------------------------------------------------------
  insert into contacts (
    id, profile_id, full_name, company_name, email,
    source, source_detail, lifecycle_stage,
    estimated_mrr, last_activity_at, stage_changed_at, created_at, updated_at, metadata
  ) values
    (c_avery,  null, 'TEST · Avery Barlow',   'Barlow Rentals LLC',  'avery@example.test',
     'instagram', null,      'lead_new',
     1800, now() - interval '3 days',  now() - interval '3 days',  now() - interval '3 days',  now(), '{}'),
    (c_sarah,  null, 'TEST · Sarah Johnson',  'Oak Industries LLC',  'sarah@example.test',
     'referral',  'Mike R.', 'qualified',
     3200, now() - interval '4 days',  now() - interval '12 days', now() - interval '12 days', now(), '{}'),
    (c_marcus, null, 'TEST · Marcus Reyes',   'Reyes Holdings',      'marcus@example.test',
     'website',   null,      'in_discussion',
     1500, now() - interval '8 days',  now() - interval '18 days', now() - interval '18 days', now(), '{}'),
    (c_priya,  null, 'TEST · Priya Shah',     null,                  'priya@example.test',
     'referral',  'Cathy M.','contract_sent',
     2100, now() - interval '2 days',  now() - interval '25 days', now() - interval '25 days', now(), '{}'),
    (c_dana,   null, 'TEST · Dana Chen',      'Chen Co',             'dana@example.test',
     'inbound',   null,      'onboarding',
     null, now() - interval '1 day',   now() - interval '40 days', now() - interval '40 days', now(), '{}'),
    (c_lori,   null, 'TEST · Lori Henderson', 'Henderson Holdings',  'lori@example.test',
     'referral',  null,      'active_owner',
     null, now() - interval '6 hours', now() - interval '360 days',now() - interval '360 days',now(), '{}'),
    (c_mike,   null, 'TEST · Mike Robertson', null,                  'mike@example.test',
     'referral',  null,      'active_owner',
     null, now() - interval '3 days',  now() - interval '200 days',now() - interval '200 days',now(), '{}'),
    (c_cathy,  null, 'TEST · Cathy Marsh',    null,                  'cathy@example.test',
     'referral',  null,      'paused',
     null, now() - interval '42 days', now() - interval '760 days',now() - interval '760 days',now(), '{}')
  on conflict (id) do update set
    full_name        = excluded.full_name,
    company_name     = excluded.company_name,
    email            = excluded.email,
    source           = excluded.source,
    source_detail    = excluded.source_detail,
    lifecycle_stage  = excluded.lifecycle_stage,
    estimated_mrr    = excluded.estimated_mrr,
    last_activity_at = excluded.last_activity_at;

  -- -----------------------------------------------------------------------
  -- PROPERTIES (6 records across pipeline stages)
  -- setup_status: 'in_progress' for active pipeline, 'published' for live
  -- owner_id: admin user (required NOT NULL FK to profiles)
  -- property_type: str | ltr | arbitrage | mtr | co-hosting
  -- postal_code (not zip), address_line1 (not address_line_1)
  -- -----------------------------------------------------------------------
  insert into properties (
    id, owner_id, contact_id,
    name, address_line1, city, state, postal_code, country,
    property_type, setup_status,
    cover_photo_url,
    active, street_view_available,
    created_at, updated_at
  ) values
    -- Dana Chen: onboarding stage
    (p_dana_onb, admin_user, c_dana,
     'TEST · 5629 NE 129th Pl', '5629 NE 129th Pl', 'Vancouver', 'WA', '98682', 'US',
     'co-hosting', 'in_progress',
     'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
     true, false,
     now() - interval '5 days', now()),
    -- Mike Robertson: listing review stage
    (p_mike_rev, admin_user, c_mike,
     'TEST · 19 S Edison St', '19 S Edison St', 'Kennewick', 'WA', '99336', 'US',
     'co-hosting', 'in_progress',
     'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
     true, false,
     now() - interval '12 days', now()),
    -- Lori Henderson: launch ready
    (p_ready, admin_user, c_lori,
     'TEST · 34 Downing Drive', '34 Downing Drive', 'Newark', 'DE', '19711', 'US',
     'co-hosting', 'in_progress',
     'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
     true, false,
     now() - interval '30 days', now()),
    -- Lori Henderson: live property 1
    (p_live1, admin_user, c_lori,
     'TEST · 1228 Stardust Way', '1228 Stardust Way', 'Pasco', 'WA', '99301', 'US',
     'co-hosting', 'published',
     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
     true, false,
     now() - interval '200 days', now()),
    -- Lori Henderson: live property 2
    (p_live2, admin_user, c_lori,
     'TEST · 442 Cherry Lane', '442 Cherry Lane', 'Walla Walla', 'WA', '99362', 'US',
     'co-hosting', 'published',
     'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
     true, false,
     now() - interval '150 days', now()),
    -- Cathy Marsh: paused
    (p_paused, admin_user, c_cathy,
     'TEST · 88 Vine St', '88 Vine St', 'Spokane', 'WA', '99207', 'US',
     'co-hosting', 'in_progress',
     'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800',
     false, false,
     now() - interval '760 days', now())
  on conflict (id) do update set
    name             = excluded.name,
    contact_id       = excluded.contact_id,
    address_line1    = excluded.address_line1,
    city             = excluded.city,
    state            = excluded.state,
    postal_code      = excluded.postal_code,
    setup_status     = excluded.setup_status,
    cover_photo_url  = excluded.cover_photo_url,
    active           = excluded.active,
    updated_at       = now();

  -- -----------------------------------------------------------------------
  -- PROJECTS (4 records)
  -- project_type: idea | feature_build | employee_onboarding | cleaner_onboarding | vendor_onboarding | internal
  -- status: not_started | in_progress | blocked | done | archived
  -- -----------------------------------------------------------------------
  insert into projects (
    id, name, description, project_type, status,
    owner_user_id, target_date, linked_property_id, emoji,
    created_at, updated_at
  ) values
    (j_idea,
     'TEST · Add Treasury auto-reconcile',
     'Auto-reconcile Plaid transactions against Stripe invoices every 24h.',
     'idea', 'not_started',
     admin_user, null, null, '💡',
     now() - interval '5 days', now()),
    (j_feature,
     'TEST · Rebuild owner onboarding wizard',
     'Replace 13-step wizard with 5 grouped steps.',
     'feature_build', 'in_progress',
     admin_user, current_date + 21, null, '🛠',
     now() - interval '14 days', now()),
    (j_cleaner,
     'TEST · Onboard Octavio cleaner team',
     'Training, checklists, and access setup.',
     'cleaner_onboarding', 'in_progress',
     admin_user, current_date + 10, p_live1, '🧼',
     now() - interval '7 days', now()),
    (j_employee,
     'TEST · Onboard new VA Aria',
     'First 30 days checklist.',
     'employee_onboarding', 'not_started',
     admin_user, current_date + 30, null, '👋',
     now() - interval '1 day', now())
  on conflict (id) do update set
    name               = excluded.name,
    status             = excluded.status,
    target_date        = excluded.target_date,
    linked_property_id = excluded.linked_property_id,
    updated_at         = now();

  -- -----------------------------------------------------------------------
  -- TASKS (parent tasks across due buckets)
  -- task_type enum: todo | call | meeting | email | milestone
  -- status check: todo | in_progress | blocked | done
  -- parent_type check: contact | property | project (both null or both non-null)
  -- tags: NOT NULL (default empty array)
  -- -----------------------------------------------------------------------
  insert into tasks (
    id, parent_type, parent_id,
    title, status, task_type, tags,
    assignee_id, created_by, due_at
  ) values
    -- 3 overdue
    (t_ov1, 'contact',  c_sarah,    'TEST · Send updated proposal to Sarah',             'todo', 'todo', '{}', admin_user, admin_user, now() - interval '4 days'),
    (t_ov2, 'property', p_mike_rev, 'TEST · Confirm parking instructions at 19 S Edison','todo', 'todo', '{}', admin_user, admin_user, now() - interval '2 days'),
    (t_ov3, null,       null,       'TEST · Call Mike R. about new referral',             'todo', 'call', '{}', admin_user, admin_user, now() - interval '1 day'),

    -- 2 today
    (t_td1, 'property', p_live2,   'TEST · Review block request for 442 Cherry (May 4-7)','todo', 'todo', '{}', admin_user, admin_user, now()),
    (t_td2, 'project',  j_feature, 'TEST · Ship wizard step 1 prototype',                 'todo', 'milestone', '{}', admin_user, admin_user, now()),

    -- 3 this week
    (t_wk1, 'contact', c_dana,     'TEST · Upload listing photos for 5629 NE 129th', 'todo', 'todo', '{}', admin_user, admin_user, now() + interval '3 days'),
    (t_wk2, 'project', j_cleaner,  'TEST · Send training deck to Octavio',            'todo', 'email', '{}', admin_user, admin_user, now() + interval '4 days'),
    (t_wk3, 'contact', c_priya,    'TEST · Chase countersigned contract',              'todo', 'call',  '{}', admin_user, admin_user, now() + interval '5 days'),

    -- 2 later
    (t_lt1, 'project', j_idea,     'TEST · Spike: Plaid transaction categorization',    'todo', 'todo', '{}', admin_user, admin_user, now() + interval '18 days'),
    (t_lt2, 'contact', c_cathy,    'TEST · Check-in call with Cathy (win-back)',         'todo', 'call', '{}', admin_user, admin_user, now() + interval '45 days'),

    -- 1 no date
    (t_nd1, null, null,            'TEST · Review Hubflow handoff notes',                'todo', 'todo', '{}', admin_user, admin_user, null),

    -- Parent task for subtask expansion test
    (t_par, 'project', j_cleaner,  'TEST · Cleaner walkthrough video recording',         'todo', 'todo', '{}', admin_user, admin_user, now() - interval '1 day')

  on conflict (id) do update set
    title       = excluded.title,
    status      = excluded.status,
    task_type   = excluded.task_type,
    assignee_id = excluded.assignee_id,
    due_at      = excluded.due_at;

  -- -----------------------------------------------------------------------
  -- SUBTASKS (5 subtasks under t_par, 3 done / 2 todo)
  -- Use parent_task_id; parent_type and parent_id must be null per constraint
  -- -----------------------------------------------------------------------
  insert into tasks (
    id, parent_task_id,
    title, status, task_type, tags,
    assignee_id, created_by
  ) values
    (t_sub1, t_par, 'TEST · Record bedroom sequence',       'done', 'todo', '{}', admin_user, admin_user),
    (t_sub2, t_par, 'TEST · Record kitchen sequence',       'done', 'todo', '{}', admin_user, admin_user),
    (t_sub3, t_par, 'TEST · Record bathroom sequence',      'done', 'todo', '{}', admin_user, admin_user),
    (t_sub4, t_par, 'TEST · Record exterior walkthrough',   'todo', 'todo', '{}', admin_user, admin_user),
    (t_sub5, t_par, 'TEST · Edit final cut',                'todo', 'todo', '{}', admin_user, admin_user)
  on conflict (id) do update set
    title     = excluded.title,
    status    = excluded.status,
    task_type = excluded.task_type;

  -- -----------------------------------------------------------------------
  -- NOTES (3 records)
  -- parent_type: contact | property (no project in notes? check passes as long as FK exists)
  -- -----------------------------------------------------------------------
  insert into notes (
    id, parent_type, parent_id, body, author_id
  ) values
    (n1, 'contact',  c_lori,    'TEST · Loves quick turnovers. Responds fastest on text.',                   admin_user),
    (n2, 'contact',  c_sarah,   'TEST · Mike R. referral. Already has 2 homes ready to list.',               admin_user),
    (n3, 'property', p_dana_onb,'TEST · Owner wants photos redone before launch. Tue afternoon pencilled in.',admin_user)
  on conflict (id) do update set
    body = excluded.body;

  -- -----------------------------------------------------------------------
  -- AI INSIGHTS (4 records, one per severity)
  -- parent_type check: contact | property | project
  -- severity check: info | recommendation | warning | success
  -- Parents are inserted above so FK constraint is satisfied
  -- -----------------------------------------------------------------------
  insert into ai_insights (
    id, parent_type, parent_id,
    agent_key, severity, title, body, action_label
  ) values
    (ai_info,
     'property', p_live1,
     'performance_agent', 'info',
     'Performance Agent',
     'TEST · 1228 Stardust Way is pacing 12% above last month. Consider a nightly rate bump of $15.',
     'Adjust pricing'),
    (ai_rec,
     'property', p_dana_onb,
     'setup_agent', 'recommendation',
     'Setup Agent',
     'TEST · Listing photos pending 4+ days. 7 of 11 recent onboardings stall here. Nudge owner?',
     'Draft nudge'),
    (ai_warn,
     'contact', c_priya,
     'risk_agent', 'warning',
     'Risk Agent',
     'TEST · Contract sent 2 days ago. No response. Follow up today to avoid losing this deal.',
     'Follow up'),
    (ai_succ,
     'property', p_ready,
     'listing_qa', 'success',
     'Listing QA',
     'TEST · All photos approved. Hospitable sync clean. Ready to launch.',
     null)
  on conflict (id) do update set
    severity     = excluded.severity,
    title        = excluded.title,
    body         = excluded.body,
    action_label = excluded.action_label;

end $$;

-- Verification summary (run after applying to confirm counts)
select
  (select count(*) from contacts   where full_name like 'TEST · %') as seed_contacts,
  (select count(*) from properties where name      like 'TEST · %') as seed_properties,
  (select count(*) from projects   where name      like 'TEST · %') as seed_projects,
  (select count(*) from tasks      where title     like 'TEST · %') as seed_tasks,
  (select count(*) from notes      where body      like 'TEST · %') as seed_notes,
  (select count(*) from ai_insights
   where id in (
     ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.info'),           1, 12))::uuid,
     ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.recommendation'), 1, 12))::uuid,
     ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.warning'),        1, 12))::uuid,
     ('0000f000-0000-0000-0000-' || substring(md5('seed.ai.success'),        1, 12))::uuid
   )) as seed_ai_insights;
