-- Migration: Create soil_test_results table for storing user-entered soil test results
CREATE TABLE IF NOT EXISTS soil_test_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id uuid REFERENCES fields(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_date date NOT NULL,
    soil_ph numeric,
    nitrogen numeric,
    phosphorus numeric,
    potassium numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Optional: Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_soil_test_results_field_id ON soil_test_results(field_id);

-- Optional: RLS policy (enable and allow owner access)
ALTER TABLE soil_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own soil test results" ON soil_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own soil test results" ON soil_test_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own soil test results" ON soil_test_results
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own soil test results" ON soil_test_results
  FOR DELETE USING (auth.uid() = user_id);
