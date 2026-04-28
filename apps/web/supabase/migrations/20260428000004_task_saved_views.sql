-- Add Inbox, Today, Upcoming built-in views for the task entity type.
-- Replaces 'my-tasks' as the default landing view with 'today'.

INSERT INTO saved_views (key, name, sort_order, entity_type, is_shared)
SELECT key, name, sort_order, entity_type, is_shared FROM (VALUES
  ('inbox',    'Inbox',    1, 'task', true),
  ('today',    'Today',    2, 'task', true),
  ('upcoming', 'Upcoming', 3, 'task', true)
) AS v(key, name, sort_order, entity_type, is_shared)
WHERE NOT EXISTS (
  SELECT 1 FROM saved_views s
  WHERE s.key = v.key AND s.entity_type = v.entity_type
);

-- Re-order existing task views to appear after the new ones
UPDATE saved_views SET sort_order = 10 WHERE key = 'my-tasks'   AND entity_type = 'task';
UPDATE saved_views SET sort_order = 20 WHERE key = 'overdue'    AND entity_type = 'task';
UPDATE saved_views SET sort_order = 30 WHERE key = 'this-week'  AND entity_type = 'task';
UPDATE saved_views SET sort_order = 40 WHERE key = 'unassigned' AND entity_type = 'task';
