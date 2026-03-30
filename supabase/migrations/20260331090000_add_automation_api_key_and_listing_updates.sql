/*
  # n8n Automation Integration

  1) profiles
  - Add per-tenant API key (UUID)

  2) listings
  - Add automation columns and generating status

  3) Security
  - Keep RLS enabled
  - Allow anonymous automation callback only when x-api-key matches listing owner profile.api_key
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS api_key UUID;

UPDATE profiles
SET api_key = gen_random_uuid()
WHERE api_key IS NULL;

ALTER TABLE profiles
  ALTER COLUMN api_key SET DEFAULT gen_random_uuid();

ALTER TABLE profiles
  ALTER COLUMN api_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_api_key_unique
  ON profiles(api_key);

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS ai_title TEXT,
  ADD COLUMN IF NOT EXISTS ai_description TEXT,
  ADD COLUMN IF NOT EXISTS automation_image_url TEXT;

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN ('draft', 'generating', 'published'));

CREATE OR REPLACE FUNCTION public.request_api_key()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  header_value TEXT;
BEGIN
  header_value := (current_setting('request.headers', true)::json ->> 'x-api-key');

  IF header_value IS NULL OR header_value = '' THEN
    RETURN NULL;
  END IF;

  RETURN header_value::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

DROP POLICY IF EXISTS "Automation can view listings by api key" ON listings;
CREATE POLICY "Automation can view listings by api key"
  ON listings FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = listings.user_id
        AND p.api_key = public.request_api_key()
    )
  );

DROP POLICY IF EXISTS "Automation can update listings by api key" ON listings;
CREATE POLICY "Automation can update listings by api key"
  ON listings FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = listings.user_id
        AND p.api_key = public.request_api_key()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = listings.user_id
        AND p.api_key = public.request_api_key()
    )
  );
