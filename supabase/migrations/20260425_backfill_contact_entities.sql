-- For each contact with no entity_id, create an entity and link it.
-- Entity name = company_name if set, otherwise full_name.
-- Entity type defaults to 'individual'.
DO $$
DECLARE
  rec RECORD;
  new_entity_id uuid;
BEGIN
  FOR rec IN
    SELECT id, full_name, company_name
    FROM contacts
    WHERE entity_id IS NULL
  LOOP
    INSERT INTO entities (name, type)
    VALUES (
      COALESCE(NULLIF(TRIM(rec.company_name), ''), rec.full_name),
      'individual'
    )
    RETURNING id INTO new_entity_id;

    UPDATE contacts
    SET entity_id = new_entity_id
    WHERE id = rec.id;
  END LOOP;
END $$;
