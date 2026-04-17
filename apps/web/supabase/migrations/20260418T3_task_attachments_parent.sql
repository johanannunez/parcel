-- Allow 'task' as an attachment parent_type so task files can live on the task itself.
alter table attachments drop constraint if exists attachments_parent_type_check;
alter table attachments add constraint attachments_parent_type_check
  check (parent_type in ('contact','property','project','task'));

-- Same for notes, for consistency (future: task comments as notes).
alter table notes drop constraint if exists notes_parent_type_check;
alter table notes add constraint notes_parent_type_check
  check (parent_type in ('contact','property','project','task'));
