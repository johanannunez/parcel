-- property_forms: unified per-property form data store
-- Replaces ad-hoc JSONB columns on properties (wifi_details, bed_arrangements, guidebook_spots, house_rules)
-- Each row is one form section for one property. Upsert on (property_id, form_key).

CREATE TABLE IF NOT EXISTS public.property_forms (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid        NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  form_key      text        NOT NULL,
  data          jsonb       NOT NULL DEFAULT '{}',
  completed_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, form_key)
);

ALTER TABLE public.property_forms ENABLE ROW LEVEL SECURITY;

-- Owners read their own property forms
CREATE POLICY "Owners read own property forms"
  ON public.property_forms FOR SELECT
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      INNER JOIN public.contacts c ON c.id = p.contact_id
      WHERE c.profile_id = auth.uid()
    )
  );

-- Owners upsert their own property forms
CREATE POLICY "Owners upsert own property forms"
  ON public.property_forms FOR ALL
  USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      INNER JOIN public.contacts c ON c.id = p.contact_id
      WHERE c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT p.id FROM public.properties p
      INNER JOIN public.contacts c ON c.id = p.contact_id
      WHERE c.profile_id = auth.uid()
    )
  );

-- Service role full access (used by server actions that bypass RLS)
CREATE POLICY "Service role full access to property_forms"
  ON public.property_forms FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for the common lookup pattern
CREATE INDEX IF NOT EXISTS property_forms_property_id_idx
  ON public.property_forms (property_id);

-- ─── Backfill existing data from properties columns ───────────────────────

-- Migrate bed_arrangements → setup_basic
INSERT INTO public.property_forms (property_id, form_key, data, completed_at)
SELECT
  p.id,
  'setup_basic',
  jsonb_build_object(
    'bedrooms',      p.bed_arrangements -> 'bedrooms',
    'bathrooms',     p.bed_arrangements -> 'bathrooms',
    'bed_count',     p.bed_arrangements -> 'bed_count',
    'max_guests',    p.bed_arrangements -> 'max_guests',
    'arrangements',  p.bed_arrangements -> 'arrangements'
  ),
  now()
FROM public.properties p
WHERE p.bed_arrangements IS NOT NULL
  AND p.bed_arrangements <> '{}'::jsonb
ON CONFLICT (property_id, form_key) DO NOTHING;

-- Migrate wifi_details → setup_tech (Wi-Fi sub-section)
INSERT INTO public.property_forms (property_id, form_key, data, completed_at)
SELECT
  p.id,
  'setup_tech',
  jsonb_build_object(
    'wifi_ssid',            p.wifi_details -> 'ssid',
    'wifi_password',        p.wifi_details -> 'password',
    'wifi_router_location', p.wifi_details -> 'router_location'
  ),
  now()
FROM public.properties p
WHERE p.wifi_details IS NOT NULL
  AND p.wifi_details <> '{}'::jsonb
  AND (
    p.wifi_details ->> 'ssid'     IS NOT NULL OR
    p.wifi_details ->> 'password' IS NOT NULL
  )
ON CONFLICT (property_id, form_key) DO NOTHING;

-- Migrate guidebook_spots → guidebook
INSERT INTO public.property_forms (property_id, form_key, data, completed_at)
SELECT
  p.id,
  'guidebook',
  jsonb_build_object('spots', p.guidebook_spots),
  now()
FROM public.properties p
WHERE p.guidebook_spots IS NOT NULL
  AND jsonb_typeof(p.guidebook_spots) = 'array'
  AND jsonb_array_length(p.guidebook_spots) > 0
ON CONFLICT (property_id, form_key) DO NOTHING;

-- Migrate house_rules → setup_house_rules
INSERT INTO public.property_forms (property_id, form_key, data, completed_at)
SELECT
  p.id,
  'setup_house_rules',
  p.house_rules,
  now()
FROM public.properties p
WHERE p.house_rules IS NOT NULL
  AND p.house_rules <> '{}'::jsonb
ON CONFLICT (property_id, form_key) DO NOTHING;
