/*
  # Add AI usage logs table for rate limiting and usage tracking

  1. New Table
    - `ai_usage_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `endpoint` (text) - API endpoint name
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can only read/insert their own usage logs

  3. Performance
    - Indexes for user_id and created_at filtering
*/

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created_at
  ON ai_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
  ON ai_usage_logs(created_at DESC);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai usage logs"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
