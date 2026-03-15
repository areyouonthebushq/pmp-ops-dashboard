-- DEV 2.0: add optional stage, type, entity to dev_notes (docs/dev-2.0-console-spec.md).
-- Run after dev-notes-table.sql. Existing rows get NULL; client treats NULL as ''.

ALTER TABLE public.dev_notes
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS entity text;
