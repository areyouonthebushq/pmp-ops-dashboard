-- PMP OPS — Add PVC phase-1 columns to compounds (number, code_name, amount_on_hand, color)
-- Run after compounds-table.sql. Keeps existing columns for backward compatibility.

ALTER TABLE public.compounds
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS code_name text,
  ADD COLUMN IF NOT EXISTS amount_on_hand text,
  ADD COLUMN IF NOT EXISTS color text;

-- Optional: backfill from legacy name/stock for existing rows
-- UPDATE public.compounds SET code_name = name WHERE code_name IS NULL AND name IS NOT NULL;
-- UPDATE public.compounds SET amount_on_hand = stock WHERE amount_on_hand IS NULL AND stock IS NOT NULL;
