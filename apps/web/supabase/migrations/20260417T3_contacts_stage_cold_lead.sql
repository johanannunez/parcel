-- Contacts: add 'lead_cold' stage and re-seed canonical saved views.
-- 5 boards: Lead Pipeline, Onboarding, Active Owners, Cold, Archived.

-- 1. Add lead_cold to the contact_lifecycle_stage enum
alter type contact_lifecycle_stage add value if not exists 'lead_cold';

-- 2. Re-seed saved_views for contacts: delete old, insert canonical set
delete from saved_views where entity_type = 'contact';

insert into saved_views (entity_type, key, name, is_shared, sort_order, filter_jsonb, sort, view_mode)
values
  ('contact','lead-pipeline', 'Lead Pipeline', true, 10,
   '{"stages":["lead_new","qualified","in_discussion","contract_sent"]}',
   'stage_age',       'status'),
  ('contact','onboarding',    'Onboarding',    true, 20,
   '{"stages":["onboarding"]}',
   'stage_age',       'compact'),
  ('contact','active-owners', 'Active Owners', true, 30,
   '{"stages":["active_owner"]}',
   'recent_activity', 'compact'),
  ('contact','cold',           'Cold',          true, 40,
   '{"stages":["lead_cold"]}',
   'stage_age',       'compact'),
  ('contact','archived',       'Archived',      true, 50,
   '{"stages":["paused","churned"]}',
   'name_asc',        'compact')
on conflict (entity_type, key, coalesce(owner_user_id::text, 'SHARED')) do nothing;
