-- Allow progress_log to record asset-note events (LOG = what happened).
-- Run once in Supabase SQL Editor.

ALTER TABLE public.progress_log
  ADD COLUMN IF NOT EXISTS asset_key text;

ALTER TABLE public.progress_log
  DROP CONSTRAINT IF EXISTS progress_log_stage_check;

ALTER TABLE public.progress_log
  ADD CONSTRAINT progress_log_stage_check
  CHECK (stage IN ('pressed', 'qc_passed', 'rejected', 'asset_note'));

COMMENT ON COLUMN public.progress_log.asset_key IS 'When stage = asset_note, the asset key (e.g. stampers) for the note.';
