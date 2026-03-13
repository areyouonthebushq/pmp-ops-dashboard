-- PMP OPS — Schedule entries (TODAY view: who is scheduled)
-- Run after employees-table.sql. One row per person per day; no recurring/PTO/attendance.

CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id text PRIMARY KEY,
  employee_id text NOT NULL,
  date date NOT NULL,
  shift_label text,
  area text,
  notes text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedule_entries' AND policyname = 'schedule_entries_anon_rw'
  ) THEN
    CREATE POLICY "schedule_entries_anon_rw"
      ON public.schedule_entries FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'schedule_entries' AND policyname = 'schedule_entries_authenticated_rw'
  ) THEN
    CREATE POLICY "schedule_entries_authenticated_rw"
      ON public.schedule_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
