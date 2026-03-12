-- PMP OPS — DEV notes (backstage product memory)
-- Run in Supabase SQL Editor after schema.sql.
-- Backstage-only; separate from production NOTES.

CREATE TABLE IF NOT EXISTS public.dev_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area text NOT NULL,
  text text NOT NULL,
  person text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE public.dev_notes ENABLE ROW LEVEL SECURITY;

-- For now, mirror other anon-friendly behavior so DEV can be used
-- in local/unauth deployments. Admin gating is handled in the app.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dev_notes'
      AND policyname = 'dev_notes_anon_rw'
  ) THEN
    CREATE POLICY "dev_notes_anon_rw"
      ON public.dev_notes
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dev_notes'
      AND policyname = 'dev_notes_authenticated_rw'
  ) THEN
    CREATE POLICY "dev_notes_authenticated_rw"
      ON public.dev_notes
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

