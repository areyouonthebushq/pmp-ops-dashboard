-- PMP OPS — Job archive lifecycle: add columns for soft-archive (no hard delete)
-- Run in Supabase SQL Editor if your jobs table was created before archive support.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived_by text DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archive_reason text DEFAULT NULL;

COMMENT ON COLUMN jobs.archived_at IS 'When job was archived (soft delete). Null = active.';
COMMENT ON COLUMN jobs.archived_by IS 'Who archived the job (e.g. email).';
COMMENT ON COLUMN jobs.archive_reason IS 'Optional reason for archiving.';
