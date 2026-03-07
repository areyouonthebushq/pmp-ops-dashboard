-- PMP OPS — Row Level Security
-- Run after schema.sql. Enables RLS and allows authenticated users full CRUD.

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE presses ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_log ENABLE ROW LEVEL SECURITY;

-- Jobs
CREATE POLICY "Authenticated users full access to jobs"
  ON jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Progress log
CREATE POLICY "Authenticated users full access to progress_log"
  ON progress_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Presses
CREATE POLICY "Authenticated users full access to presses"
  ON presses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Todos
CREATE POLICY "Authenticated users full access to todos"
  ON todos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- QC log
CREATE POLICY "Authenticated users full access to qc_log"
  ON qc_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: allow anon for demo without auth (e.g. CSV import, test data).
-- Remove or disable these in production if you use Supabase Auth.
CREATE POLICY "Anon full access to jobs" ON jobs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to progress_log" ON progress_log FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to presses" ON presses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to todos" ON todos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to qc_log" ON qc_log FOR ALL TO anon USING (true) WITH CHECK (true);
