CREATE TABLE IF NOT EXISTS api_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  token_hash   text NOT NULL UNIQUE,
  last_used_at timestamptz,
  created_at   timestamptz DEFAULT now() NOT NULL
);

-- token_hash has a UNIQUE constraint which already provides an index; no separate index needed.
CREATE INDEX IF NOT EXISTS api_tokens_profile_idx ON api_tokens (profile_id);
