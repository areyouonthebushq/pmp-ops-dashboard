-- Allow QC role to insert progress_log rows with stage = 'qc_passed' (manual QC pass logging).
-- Run after rls-roles-migration.sql. Existing policy progress_log_qc_insert_rejected handles stage = 'rejected'.

CREATE POLICY "progress_log_qc_insert_passed"
  ON progress_log FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'qc' AND stage = 'qc_passed');
