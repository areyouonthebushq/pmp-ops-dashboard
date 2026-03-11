-- PMP OPS — PO / CONTRACT reference (Phase 1) — floor-critical packaging/assembly
-- Run in Supabase SQL Editor if your jobs table was created before this feature.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS po_contract jsonb DEFAULT '{}';

COMMENT ON COLUMN jobs.po_contract IS 'Floor-critical PO/contract ref: sleeveType, sleeveColor, insertDetails, stickerDetails, packagingNotes, specialAssemblyNotes.';
