-- PROGRESS_LOG asset-note support for press + QC.
-- Run after rls-roles-migration.sql and press-choose-any-policy.sql.

-- Allow press role to insert asset_note events (for any press, consistent with press-choose-any-policy).
DROP POLICY IF EXISTS "progress_log_press_insert" ON public.progress_log;
CREATE POLICY "progress_log_press_insert"
  ON public.progress_log FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'press'
    AND stage IN ('pressed', 'qc_passed', 'asset_note')
    AND job_on_any_press(job_id)
  );

-- Allow QC role to insert asset_note events (asset-originated notes).
CREATE POLICY IF NOT EXISTS "progress_log_qc_insert_asset_note"
  ON public.progress_log FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'qc' AND stage = 'asset_note');

