-- Job-level caution/blocker model (JSONB).
-- Shape: { "reason": "stuck|customer|billing|traffic_jam|special|other", "since": "ISO-8601", "text": "optional short context" }
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS caution jsonb;
