-- 1. Create Workspaces for owner collaboration.
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'individual'
    CHECK (type IN ('individual', 'llc', 's_corp', 'c_corp', 'trust', 'partnership')),
  stage text not null default 'active',
  status text not null default 'active',
  primary_contact_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Add workspace_id FK to contacts.
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;

-- 3. Index for fast Workspace to contacts lookups.
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
