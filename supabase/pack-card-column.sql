-- Pack card: late-stage packing/assembly readiness checklist (JSONB).
-- Shape: { "components_verified": { "status": "ready|na|caution", "person": "", "date": "", "note": "" }, ... }
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pack_card jsonb;
