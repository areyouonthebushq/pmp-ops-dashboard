-- PMP OPS — Storage bucket for one PO/contract image per job
-- Path convention: {job_id}/po.{ext} (e.g. j123/po.jpg)
--
-- Manual Supabase setup required:
-- 1. Dashboard → Storage → New bucket → Name: po-images, set "Public bucket" ON → Create
-- 2. Run the policy below in SQL Editor so authenticated users can upload/delete
--
-- Policy: allow authenticated users to upload, update, delete in po-images
DROP POLICY IF EXISTS "po-images authenticated full" ON storage.objects;
CREATE POLICY "po-images authenticated full"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'po-images')
  WITH CHECK (bucket_id = 'po-images');
