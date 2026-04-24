-- Remove the duplicate owners-archived contact view.
-- The canonical archived view already covers all churned/paused contacts
-- under the key "archived". The "owners-archived" row was never seeded by
-- an official migration and duplicates the Archived tab on /admin/contacts.

delete from public.saved_views
 where entity_type = 'contact'
   and key = 'owners-archived'
   and owner_user_id is null;
