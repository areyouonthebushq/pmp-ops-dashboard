-- PMP OPS — Compound Library (phase 1)
-- Run in Supabase SQL Editor after schema.sql.
-- Visual reference surface for floor compounds/colors.

CREATE TABLE IF NOT EXISTS public.compounds (
  id text PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  stock text,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.compounds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'compounds'
      AND policyname = 'compounds_anon_rw'
  ) THEN
    CREATE POLICY "compounds_anon_rw"
      ON public.compounds
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
      AND tablename = 'compounds'
      AND policyname = 'compounds_authenticated_rw'
  ) THEN
    CREATE POLICY "compounds_authenticated_rw"
      ON public.compounds
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

