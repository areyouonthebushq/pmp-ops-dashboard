-- PMP OPS v7.1 — Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Jobs: one row per vinyl pressing order
CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  catalog text,
  artist text,
  album text,
  invoice text,
  status text CHECK (status IN ('queue', 'pressing', 'assembly', 'hold', 'done')),
  due date,
  press text,
  client text,
  email text,
  location text,
  last_contact date,
  format text,
  vinyl_type text,
  qty integer,
  weight text,
  color text,
  specialty text,
  label_type text,
  sleeve text,
  jacket text,
  outer_pkg text,
  cpl text,
  notes text,
  assembly text,
  inv_date date,
  deposit date,
  inv2 date,
  pay2 date,
  assets jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Progress log: append-only pressing/QC events per job
CREATE TABLE IF NOT EXISTS progress_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  qty integer NOT NULL,
  stage text NOT NULL CHECK (stage IN ('pressed', 'qc_passed', 'rejected')),
  person text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_log_job_id ON progress_log(job_id);

-- Presses: 4 rows, one per physical machine
CREATE TABLE IF NOT EXISTS presses (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text,
  status text CHECK (status IN ('online', 'warning', 'offline', 'idle')),
  job_id text REFERENCES jobs(id) ON DELETE SET NULL
);

-- Todos: checklist items (daily, weekly, standing)
CREATE TABLE IF NOT EXISTS todos (
  id text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('daily', 'weekly', 'standing')),
  text text NOT NULL,
  done boolean DEFAULT false,
  who text DEFAULT '',
  sort_order integer DEFAULT 0
);

-- QC log: reject tracking
CREATE TABLE IF NOT EXISTS qc_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  time text NOT NULL,
  type text NOT NULL,
  job text NOT NULL,
  date text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qc_log_date ON qc_log(date);
