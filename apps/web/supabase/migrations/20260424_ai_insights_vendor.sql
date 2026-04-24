alter table public.ai_insights
  drop constraint if exists ai_insights_parent_type_check,
  add constraint ai_insights_parent_type_check
    check (parent_type in ('contact', 'property', 'project', 'vendor', 'owner'));
