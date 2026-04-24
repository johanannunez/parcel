ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS management_fee_percent NUMERIC(5,2) DEFAULT NULL;
