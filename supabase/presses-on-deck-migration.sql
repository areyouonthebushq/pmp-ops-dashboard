-- PMP OPS — One optional on-deck job per press (floor staging awareness).
-- Run after schema.sql. Single slot per press; no scheduling engine.

ALTER TABLE presses ADD COLUMN IF NOT EXISTS on_deck_job_id text REFERENCES jobs(id) ON DELETE SET NULL;
COMMENT ON COLUMN presses.on_deck_job_id IS 'Optional next job for this press (display only; one slot per press).';
