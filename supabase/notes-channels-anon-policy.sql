-- Allow anon role to read/write notes_channels when running without auth.
-- This mirrors other anon-friendly behavior for local/unauth deployments.
-- Run after notes-channels-table.sql and rls-roles-migration.sql if present.

CREATE POLICY IF NOT EXISTS "notes_channels_anon_rw"
  ON public.notes_channels
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

