-- 1. Add entity_type to entities (if not already present)
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS type text
  CHECK (type IN ('individual', 'llc', 's_corp', 'c_corp', 'trust', 'partnership'))
  DEFAULT 'individual';

-- 2. Add entity_id FK to contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES entities(id) ON DELETE SET NULL;

-- 3. Index for fast entity→contacts lookups
CREATE INDEX IF NOT EXISTS idx_contacts_entity_id ON contacts(entity_id);
