ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS caldav_uid text,
  ADD COLUMN IF NOT EXISTS caldav_etag text;

COMMENT ON COLUMN tasks.priority IS '1=Urgent 2=High 3=Medium 4=None';
COMMENT ON COLUMN tasks.caldav_uid IS 'Stable CalDAV UID, format: task-{id}@parcelco.com';

CREATE UNIQUE INDEX IF NOT EXISTS tasks_caldav_uid_idx
  ON tasks (caldav_uid)
  WHERE caldav_uid IS NOT NULL;
