-- Allow 'task' as an attachment parent_type so task files can live on the task itself.
do $$
begin
  alter table attachments drop constraint if exists attachments_parent_type_check;
  if not exists (
    select 1 from pg_constraint where conname = 'attachments_parent_type_check'
  ) then
    alter table attachments add constraint attachments_parent_type_check
      check (parent_type in ('contact','property','project','task'));
  end if;
end $$;

-- Same for notes, for consistency (future: task comments as notes).
do $$
begin
  alter table notes drop constraint if exists notes_parent_type_check;
  if not exists (
    select 1 from pg_constraint where conname = 'notes_parent_type_check'
  ) then
    alter table notes add constraint notes_parent_type_check
      check (parent_type in ('contact','property','project','task'));
  end if;
end $$;
