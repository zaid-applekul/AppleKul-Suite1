-- Migration: Remove duplicate micronutrient columns from soil_test_results
ALTER TABLE soil_test_results
  DROP COLUMN IF EXISTS zn,
  DROP COLUMN IF EXISTS fe,
  DROP COLUMN IF EXISTS mn,
  DROP COLUMN IF EXISTS cu,
  DROP COLUMN IF EXISTS b,
  DROP COLUMN IF EXISTS ec;

-- Migration: Add micronutrients and EC columns to soil_test_results table
ALTER TABLE soil_test_results
  ADD COLUMN zn numeric,
  ADD COLUMN fe numeric,
  ADD COLUMN mn numeric,
  ADD COLUMN cu numeric,
  ADD COLUMN b numeric,
  ADD COLUMN ec numeric;
