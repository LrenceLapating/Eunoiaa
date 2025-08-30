-- =====================================================
-- CREATE NEW COLLEGE_SCORES TABLE
-- This script creates a fresh college_scores table with proper
-- schema, data types, and relationships for dimension analysis
-- =====================================================

-- Drop the table if it exists (since user deleted it)
DROP TABLE IF EXISTS college_scores CASCADE;

-- Create the college_scores table with optimized schema
CREATE TABLE college_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    dimension_name VARCHAR(100) NOT NULL,
    raw_score NUMERIC(6,2) NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 0 CHECK (student_count >= 0),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'at-risk', 'healthy')),
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('ryff_42', 'ryff_84')),
    assessment_name VARCHAR(255) NOT NULL,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes for filtering
CREATE INDEX idx_college_scores_college_name ON college_scores(college_name);
CREATE INDEX idx_college_scores_dimension_name ON college_scores(dimension_name);
CREATE INDEX idx_college_scores_assessment_type ON college_scores(assessment_type);
CREATE INDEX idx_college_scores_assessment_name ON college_scores(assessment_name);
CREATE INDEX idx_college_scores_risk_level ON college_scores(risk_level);

-- Composite indexes for common query patterns
CREATE INDEX idx_college_scores_college_assessment ON college_scores(college_name, assessment_type, assessment_name);
CREATE INDEX idx_college_scores_college_dimension ON college_scores(college_name, dimension_name);

-- Time-based index
CREATE INDEX idx_college_scores_last_calculated ON college_scores(last_calculated);

-- =====================================================
-- CREATE TRIGGER FOR AUTOMATIC updated_at
-- =====================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_college_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_college_scores_updated_at
    BEFORE UPDATE ON college_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_college_scores_updated_at();

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE college_scores IS 'Stores aggregated assessment scores by college and dimension for counselor analysis';
COMMENT ON COLUMN college_scores.id IS 'Primary key UUID';
COMMENT ON COLUMN college_scores.college_name IS 'College name - must match students.college values';
COMMENT ON COLUMN college_scores.dimension_name IS 'Psychological dimension being measured (e.g., Autonomy, Environmental Mastery)';
COMMENT ON COLUMN college_scores.raw_score IS 'Aggregated score for the dimension (0-100 scale)';
COMMENT ON COLUMN college_scores.student_count IS 'Number of students included in this score calculation';
COMMENT ON COLUMN college_scores.risk_level IS 'Risk assessment level based on the score (low/moderate/high/at-risk/healthy)';
COMMENT ON COLUMN college_scores.assessment_type IS 'Type of assessment (ryff_42 or ryff_84) - matches assessments tables';
COMMENT ON COLUMN college_scores.assessment_name IS 'Assessment name from bulk_assessments table for filtering';
COMMENT ON COLUMN college_scores.last_calculated IS 'Timestamp when scores were last computed';
COMMENT ON COLUMN college_scores.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN college_scores.updated_at IS 'Record last update timestamp (auto-updated)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check the table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'college_scores' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'college_scores';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'college_scores';

-- Success message
SELECT 'College scores table created successfully!' as status;
SELECT 'Table is ready for data population from existing assessments.' as next_step;