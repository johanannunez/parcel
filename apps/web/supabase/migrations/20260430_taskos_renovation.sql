-- 1. Colored labels
CREATE TABLE IF NOT EXISTS public.task_labels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#6b7280',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_labels_admin_rw ON task_labels FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 2. New columns on tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS label_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linked_project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
-- Note: linked_contact_id and linked_property_id already exist

-- 3. Task comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES profiles(id),
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS task_comments_task_idx ON task_comments (task_id);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_comments_admin_rw ON task_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 4. Activity log
CREATE TABLE IF NOT EXISTS public.task_activity (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES profiles(id),
  field      text NOT NULL,
  old_value  text,
  new_value  text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS task_activity_task_idx ON task_activity (task_id);
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_activity_admin_r ON task_activity FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 5. In-app notifications
-- Table already exists with owner_id + read boolean; extend it with missing columns.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS data       jsonb,
  ADD COLUMN IF NOT EXISTS read_at    timestamptz;
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. Seed default labels
INSERT INTO task_labels (name, color, sort_order) VALUES
  ('Maintenance',  '#f59e0b', 1),
  ('Compliance',   '#ef4444', 2),
  ('Cleaning',     '#10b981', 3),
  ('Guest',        '#3b82f6', 4),
  ('Financial',    '#8b5cf6', 5),
  ('Follow-up',    '#c17b4e', 6)
ON CONFLICT DO NOTHING;
