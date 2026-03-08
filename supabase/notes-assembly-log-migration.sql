-- PMP OPS — Append-only notes and assembly logs on jobs
-- Run after schema.sql. Adds JSONB columns; keep existing notes/assembly for latest/summary.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes_log jsonb DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assembly_log jsonb DEFAULT '[]';

COMMENT ON COLUMN jobs.notes_log IS 'Append-only log: [{text, person, timestamp}, ...]. Latest also in notes.';
COMMENT ON COLUMN jobs.assembly_log IS 'Append-only log: [{text, person, timestamp}, ...]. Latest also in assembly.';
