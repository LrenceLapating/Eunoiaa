-- Create college_scores table to store computed college-level assessment scores
-- This table will store aggregated scores for each college and dimension

BEGIN;

-- Create college_scores table
CREATE TABLE IF NOT EXISTS college_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    dimension_name VARCHAR(100) NOT NULL, -- autonomy, environmental_mastery, etc.
    raw_score DECIMAL(5,2) NOT NULL, -- Average raw score (7-42 range)
    student_count INTEGER NOT NULL DEFAULT 0, -- Number of students included in calculation
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('At Risk', 'Moderate', 'Healthy')),
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of college and dimension
    UNIQUE(college_name, dimension_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_college_scores_college ON college_scores(college_name);
CREATE INDEX IF NOT EXISTS idx_college_scores_dimension ON college_scores(dimension_name);
CREATE INDEX IF NOT EXISTS idx_college_scores_risk_level ON college_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_college_scores_calculated ON college_scores(last_calculated);

-- Enable RLS
ALTER TABLE college_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for counselors to view college scores
CREATE POLICY "Counselors can view college scores" ON college_scores
    FOR SELECT USING (true); -- All authenticated users can view college scores

-- Create policy for system to update college scores
CREATE POLICY "System can manage college scores" ON college_scores
    FOR ALL USING (true); -- Allow system operations

-- Add comments
COMMENT ON TABLE college_scores IS 'Aggregated assessment scores by college and dimension';
COMMENT ON COLUMN college_scores.raw_score IS 'Average raw score for this college-dimension combination (7-42 range)';
COMMENT ON COLUMN college_scores.student_count IS 'Number of students included in this calculation';
COMMENT ON COLUMN college_scores.risk_level IS 'Risk categorization: At Risk (≤18), Moderate (19-30), Healthy (≥31)';

COMMIT;