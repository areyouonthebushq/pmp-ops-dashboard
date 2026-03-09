-- PMP OPS — Press role: allow working on any chosen press (not only assigned_press_id)
-- Run after rls-roles-migration.sql.
-- Product intent: press operators choose which press to work on in the launcher;
-- RLS must allow write for the chosen press, not only profiles.assigned_press_id.

-- ============================================================
-- 1. Helper: true if job is assigned to any floor press (p1–p4)
-- ============================================================
CREATE OR REPLACE FUNCTION public.job_on_any_press(p_job_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.presses
    WHERE presses.job_id = p_job_id
      AND presses.id IN ('p1', 'p2', 'p3', 'p4')
  );
$$;

-- ============================================================
-- 2. PROGRESS_LOG — press may insert pressed/qc_passed for job on any press
-- ============================================================
DROP POLICY IF EXISTS "progress_log_press_insert" ON progress_log;
CREATE POLICY "progress_log_press_insert"
  ON progress_log FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'press'
    AND stage IN ('pressed', 'qc_passed')
    AND job_on_any_press(job_id)
  );

-- ============================================================
-- 3. JOBS — press may update job when it is on any press
-- ============================================================
DROP POLICY IF EXISTS "jobs_press_update_own" ON jobs;
CREATE POLICY "jobs_press_update_own"
  ON jobs FOR UPDATE TO authenticated
  USING (get_my_role() = 'press' AND job_on_any_press(id))
  WITH CHECK (get_my_role() = 'press' AND job_on_any_press(id));

-- ============================================================
-- 4. PRESSES — press may update any floor press (p1–p4)
-- ============================================================
DROP POLICY IF EXISTS "presses_press_update_own" ON presses;
CREATE POLICY "presses_press_update_own"
  ON presses FOR UPDATE TO authenticated
  USING (get_my_role() = 'press' AND id IN ('p1', 'p2', 'p3', 'p4'))
  WITH CHECK (get_my_role() = 'press' AND id IN ('p1', 'p2', 'p3', 'p4'));
