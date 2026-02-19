-- Drop tables if they exist (for migration re-runs in dev/test)
DROP TABLE IF EXISTS water_test_results CASCADE;
DROP TABLE IF EXISTS test_bookings CASCADE;
DROP TABLE IF EXISTS labs CASCADE;

-- Migration: Create labs table
CREATE TABLE IF NOT EXISTS labs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    contact_info text,
    services_offered text[], -- e.g. ARRAY['soil', 'water']
    pricing jsonb, -- e.g. {"soil": 500, "water": 300}
    created_at timestamptz DEFAULT now()
);

-- Migration: Create test_bookings table
CREATE TABLE IF NOT EXISTS test_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    orchard_id uuid REFERENCES fields(id) ON DELETE CASCADE,
    lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
    test_type text NOT NULL, -- 'soil' or 'water'
    status text NOT NULL DEFAULT 'PENDING', -- PENDING, SAMPLE_COLLECTED, PROCESSING, COMPLETED
    payment_status text NOT NULL DEFAULT 'PENDING',
    created_at timestamptz DEFAULT now()
);

-- Migration: Create water_test_results table
CREATE TABLE IF NOT EXISTS water_test_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES test_bookings(id) ON DELETE CASCADE,
    uploaded_by_lab_id uuid REFERENCES labs(id),
    test_date date NOT NULL,
    ph numeric,
    ec numeric,
    tds numeric,
    co3 numeric,
    hco3 numeric,
    cl numeric,
    na numeric,
    ca numeric,
    mg numeric,
    sar numeric,
    rsc numeric,
    boron numeric,
    no3_n numeric,
    so4 numeric,
    created_at timestamptz DEFAULT now()
);

-- Migration: Add lab metadata and new columns to soil_test_results
ALTER TABLE soil_test_results
  ADD COLUMN IF NOT EXISTS uploaded_by_lab_id uuid REFERENCES labs(id),
  ADD COLUMN IF NOT EXISTS test_date date,
  ADD COLUMN IF NOT EXISTS oc numeric,
  ADD COLUMN IF NOT EXISTS zn numeric,
  ADD COLUMN IF NOT EXISTS b numeric,
  ADD COLUMN IF NOT EXISTS s numeric,
  ADD COLUMN IF NOT EXISTS fe numeric,
  ADD COLUMN IF NOT EXISTS cu numeric,
  ADD COLUMN IF NOT EXISTS mn numeric,
  ADD COLUMN IF NOT EXISTS ec numeric,
  ADD COLUMN IF NOT EXISTS lime_requirement numeric,
  ADD COLUMN IF NOT EXISTS gypsum_requirement numeric;
