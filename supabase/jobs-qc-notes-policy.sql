-- Allow QC role to update jobs for the purpose of notes/communication.
-- UI constrains which fields QC can touch (notes/assembly/asset state), but RLS must allow UPDATE.
-- Run after rls-roles-migration.sql.

CREATE POLICY IF NOT EXISTS "jobs_qc_update_notes"
  ON public.jobs FOR UPDATE TO authenticated
  USING (get_my_role() = 'qc')
  WITH CHECK (get_my_role() = 'qc');

