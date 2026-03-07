-- PMP OPS — Role-based RLS migration
-- Run after schema.sql and auth-and-profiles.sql.
-- Replaces broad "authenticated full access" with role-based policies.
-- Assumes profiles.role is one of: admin, floor_manager, press, qc.

-- ============================================================
-- 1. Profiles: add assigned_press_id for press role (p1, p2, p3, p4)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_press_id text
  CHECK (assigned_press_id IS NULL OR assigned_press_id IN ('p1', 'p2', 'p3', 'p4'));

-- ============================================================
-- 2. Helper functions (SECURITY DEFINER so RLS can read profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_press_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_press_id FROM public.profiles WHERE id = auth.uid() AND role = 'press';
$$;

-- True if the given job_id is assigned to the current user's press (for press role).
CREATE OR REPLACE FUNCTION public.job_on_my_press(p_job_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.presses
    WHERE id = (SELECT get_my_press_id())
      AND presses.job_id = p_job_id
  );
$$;

-- ============================================================
-- 3. Drop existing broad policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users full access to jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users full access to progress_log" ON progress_log;
DROP POLICY IF EXISTS "Authenticated users full access to presses" ON presses;
DROP POLICY IF EXISTS "Authenticated users full access to todos" ON todos;
DROP POLICY IF EXISTS "Authenticated users full access to qc_log" ON qc_log;
DROP POLICY IF EXISTS "Anon full access to jobs" ON jobs;
DROP POLICY IF EXISTS "Anon full access to progress_log" ON progress_log;
DROP POLICY IF EXISTS "Anon full access to presses" ON presses;
DROP POLICY IF EXISTS "Anon full access to todos" ON todos;
DROP POLICY IF EXISTS "Anon full access to qc_log" ON qc_log;

-- ============================================================
-- 4. JOBS — admin full; floor_manager read+update; press read+update own press; qc read
-- ============================================================
CREATE POLICY "jobs_admin_all"
  ON jobs FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "jobs_floor_manager_select"
  ON jobs FOR SELECT TO authenticated
  USING (get_my_role() = 'floor_manager');
CREATE POLICY "jobs_floor_manager_update"
  ON jobs FOR UPDATE TO authenticated
  USING (get_my_role() = 'floor_manager')
  WITH CHECK (get_my_role() = 'floor_manager');

CREATE POLICY "jobs_press_select"
  ON jobs FOR SELECT TO authenticated
  USING (get_my_role() = 'press');
CREATE POLICY "jobs_press_update_own"
  ON jobs FOR UPDATE TO authenticated
  USING (get_my_role() = 'press' AND job_on_my_press(id))
  WITH CHECK (get_my_role() = 'press' AND job_on_my_press(id));

CREATE POLICY "jobs_qc_select"
  ON jobs FOR SELECT TO authenticated
  USING (get_my_role() = 'qc');

-- ============================================================
-- 5. PROGRESS_LOG — admin all; floor_manager select+insert; press select+insert pressed/qc_passed for own press; qc select+insert rejected
-- ============================================================
CREATE POLICY "progress_log_admin_all"
  ON progress_log FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "progress_log_floor_manager_select"
  ON progress_log FOR SELECT TO authenticated
  USING (get_my_role() = 'floor_manager');
CREATE POLICY "progress_log_floor_manager_insert"
  ON progress_log FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'floor_manager');

CREATE POLICY "progress_log_press_select"
  ON progress_log FOR SELECT TO authenticated
  USING (get_my_role() = 'press');
CREATE POLICY "progress_log_press_insert"
  ON progress_log FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'press'
    AND stage IN ('pressed', 'qc_passed')
    AND job_on_my_press(job_id)
  );

CREATE POLICY "progress_log_qc_select"
  ON progress_log FOR SELECT TO authenticated
  USING (get_my_role() = 'qc');
CREATE POLICY "progress_log_qc_insert_rejected"
  ON progress_log FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'qc' AND stage = 'rejected');

-- ============================================================
-- 6. PRESSES — admin all; floor_manager select+update; press select+update own row; qc select
-- ============================================================
CREATE POLICY "presses_admin_all"
  ON presses FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "presses_floor_manager_select"
  ON presses FOR SELECT TO authenticated
  USING (get_my_role() = 'floor_manager');
CREATE POLICY "presses_floor_manager_update"
  ON presses FOR UPDATE TO authenticated
  USING (get_my_role() = 'floor_manager')
  WITH CHECK (get_my_role() = 'floor_manager');

CREATE POLICY "presses_press_select"
  ON presses FOR SELECT TO authenticated
  USING (get_my_role() = 'press');
CREATE POLICY "presses_press_update_own"
  ON presses FOR UPDATE TO authenticated
  USING (id = get_my_press_id())
  WITH CHECK (id = get_my_press_id());

CREATE POLICY "presses_qc_select"
  ON presses FOR SELECT TO authenticated
  USING (get_my_role() = 'qc');

-- ============================================================
-- 7. TODOS — admin all; floor_manager select+update; press select; qc select
-- ============================================================
CREATE POLICY "todos_admin_all"
  ON todos FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "todos_floor_manager_select"
  ON todos FOR SELECT TO authenticated
  USING (get_my_role() = 'floor_manager');
CREATE POLICY "todos_floor_manager_update"
  ON todos FOR UPDATE TO authenticated
  USING (get_my_role() = 'floor_manager')
  WITH CHECK (get_my_role() = 'floor_manager');

CREATE POLICY "todos_press_select"
  ON todos FOR SELECT TO authenticated
  USING (get_my_role() = 'press');

CREATE POLICY "todos_qc_select"
  ON todos FOR SELECT TO authenticated
  USING (get_my_role() = 'qc');

-- ============================================================
-- 8. QC_LOG — admin all; floor_manager select; press select; qc select+insert
-- ============================================================
CREATE POLICY "qc_log_admin_all"
  ON qc_log FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "qc_log_floor_manager_select"
  ON qc_log FOR SELECT TO authenticated
  USING (get_my_role() = 'floor_manager');

CREATE POLICY "qc_log_press_select"
  ON qc_log FOR SELECT TO authenticated
  USING (get_my_role() = 'press');

CREATE POLICY "qc_log_qc_select"
  ON qc_log FOR SELECT TO authenticated
  USING (get_my_role() = 'qc');
CREATE POLICY "qc_log_qc_insert"
  ON qc_log FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'qc');
