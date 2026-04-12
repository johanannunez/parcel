-- =====================================================================
-- Parcel — Timeline System Upgrade
-- =====================================================================
-- Upgrades owner_timeline from a basic event log to a premium activity
-- timeline with visibility controls, soft delete, categories, pinning,
-- and admin audit trail.
--
-- Run this in the Supabase SQL Editor as a single block.
-- =====================================================================


-- ---------------------------------------------------------------------
-- ENUM: timeline event categories
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.timeline_category AS ENUM (
    'account',
    'property',
    'financial',
    'calendar',
    'document',
    'communication'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.timeline_visibility AS ENUM ('owner', 'admin_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ---------------------------------------------------------------------
-- Add new columns to owner_timeline
-- ---------------------------------------------------------------------

-- Category for filtering
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS category public.timeline_category NOT NULL DEFAULT 'account';

-- Visibility: 'owner' means visible to the owner, 'admin_only' means only admin sees it
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS visibility public.timeline_visibility NOT NULL DEFAULT 'owner';

-- Pin important milestones to the top
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Soft delete: admin can delete without losing audit trail
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Who deleted it (audit trail)
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Icon override (Phosphor icon name, e.g. 'House', 'CurrencyDollar')
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS icon text;

-- Updated at for tracking edits
ALTER TABLE public.owner_timeline
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();


-- ---------------------------------------------------------------------
-- Indexes for new columns
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_timeline_category
  ON public.owner_timeline(category);

CREATE INDEX IF NOT EXISTS idx_timeline_visibility
  ON public.owner_timeline(visibility);

CREATE INDEX IF NOT EXISTS idx_timeline_pinned
  ON public.owner_timeline(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_timeline_deleted
  ON public.owner_timeline(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_timeline_owner_created
  ON public.owner_timeline(owner_id, created_at DESC);


-- ---------------------------------------------------------------------
-- Backfill existing event_type to category mapping
-- ---------------------------------------------------------------------
UPDATE public.owner_timeline SET category = 'account'
  WHERE event_type IN ('onboarding', 'task_created', 'task_status_changed', 'task_deleted', 'note_added')
  AND category = 'account';

UPDATE public.owner_timeline SET category = 'property'
  WHERE event_type IN ('property')
  AND category = 'account';

UPDATE public.owner_timeline SET category = 'financial'
  WHERE event_type IN ('payout')
  AND category = 'account';

UPDATE public.owner_timeline SET category = 'calendar'
  WHERE event_type IN ('block')
  AND category = 'account';

UPDATE public.owner_timeline SET category = 'document'
  WHERE event_type IN ('document')
  AND category = 'account';

UPDATE public.owner_timeline SET category = 'communication'
  WHERE event_type IN ('message')
  AND category = 'account';


-- ---------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------
CREATE TRIGGER owner_timeline_set_updated_at
  BEFORE UPDATE ON public.owner_timeline
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------
-- RLS policies for owner_timeline
-- Owners: can SELECT their own entries where visibility = 'owner'
--         and deleted_at IS NULL. Cannot delete or update.
-- Admins: full access via is_admin().
-- ---------------------------------------------------------------------

-- Drop existing policies if any (safe to run multiple times)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Owners view own timeline" ON public.owner_timeline;
  DROP POLICY IF EXISTS "Admins full access timeline" ON public.owner_timeline;
  DROP POLICY IF EXISTS "Admins insert timeline" ON public.owner_timeline;
  DROP POLICY IF EXISTS "Admins update timeline" ON public.owner_timeline;
  DROP POLICY IF EXISTS "Admins delete timeline" ON public.owner_timeline;
END $$;

-- Owners see their own non-deleted, owner-visible entries
CREATE POLICY "Owners view own timeline"
  ON public.owner_timeline FOR SELECT
  TO authenticated
  USING (
    (owner_id = auth.uid() AND visibility = 'owner' AND deleted_at IS NULL)
    OR public.is_admin()
  );

-- Only admins can insert (server actions use service role anyway)
CREATE POLICY "Admins insert timeline"
  ON public.owner_timeline FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update (visibility, pin, soft delete)
CREATE POLICY "Admins update timeline"
  ON public.owner_timeline FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Hard delete restricted to admins (prefer soft delete)
CREATE POLICY "Admins delete timeline"
  ON public.owner_timeline FOR DELETE
  TO authenticated
  USING (public.is_admin());
