-- For each contact with no workspace_id, create a Workspace and link it.
-- Workspace name = company_name if set, otherwise full_name.
-- Legal business type defaults to 'individual'.
DO $$
DECLARE
  rec RECORD;
  new_workspace_id uuid;
BEGIN
  FOR rec IN
    SELECT id, full_name, company_name
    FROM contacts
    WHERE workspace_id IS NULL
  LOOP
    INSERT INTO workspaces (name, type)
    VALUES (
      COALESCE(NULLIF(TRIM(rec.company_name), ''), rec.full_name),
      'individual'
    )
    RETURNING id INTO new_workspace_id;

    UPDATE contacts
    SET workspace_id = new_workspace_id
    WHERE id = rec.id;
  END LOOP;
END $$;
