-- Add fulfillment_phase column to jobs table
-- Values: awaiting_instructions, ready_for_pickup, ready_to_ship, local_pickup,
--         in_house_fulfillment, held_exception, shipped (or NULL)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fulfillment_phase text;
