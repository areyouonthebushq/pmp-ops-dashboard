-- PMP OPS — Notes channels (!TEAM / !ALERT) for plant-wide team and alert feeds.
-- Run in Supabase SQL Editor after schema.sql.

CREATE TABLE IF NOT EXISTS notes_channels (
  id text PRIMARY KEY,
  log jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_channels_authenticated_rw"
  ON notes_channels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional seeds (run once if desired):
-- INSERT INTO notes_channels (id, log) VALUES ('!TEAM', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO notes_channels (id, log) VALUES ('!ALERT', '[]'::jsonb) ON CONFLICT (id) DO NOTHING;

