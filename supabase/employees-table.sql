-- PMP OPS — Employees (operational directory)
-- Run in Supabase SQL Editor. Operational roster: who works here, contact, specialty.
-- Not HR: no payroll, PTO, or time clocks.

CREATE TABLE IF NOT EXISTS public.employees (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text,
  phone text,
  email text,
  specialty text,
  photo_url text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_anon_rw'
  ) THEN
    CREATE POLICY "employees_anon_rw"
      ON public.employees FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_authenticated_rw'
  ) THEN
    CREATE POLICY "employees_authenticated_rw"
      ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
