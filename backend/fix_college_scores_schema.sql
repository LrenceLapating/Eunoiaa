-- =====================================================
-- COLLEGE_SCORES TABLE SCHEMA OPTIMIZATION
-- This script ensures proper data types, constraints, and foreign keys
-- for effective communication with related tables
-- =====================================================

-- First, let's check if the college_scores table exists and get its current structure
-- If it doesn't exist, create it with the proper structure

CREATE TABLE IF NOT EXISTS college_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    dimension_name VARCHAR(100) NOT NULL,
    raw_score NUMERIC(6,2), -- Increased precision for scores
    student_count INTEGER DEFAULT 0 CHECK (student_count >= 0),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'at-risk', 'healthy')),
    assessment_type VARCHAR(50) NOT NULL,
    assessment_name VARCHAR(255), -- Links to bulk_assessments.assessment_name
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADD MISSING COLUMNS (if they don't exist)
-- =====================================================

-- Add assessment_name column if it doesn't exist (from migration file)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_scores' AND column_name = 'assessment_name'
    ) THEN
        ALTER TABLE college_scores ADD COLUMN assessment_name VARCHAR(255);
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_scores' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE college_scores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- MODIFY EXISTING COLUMNS FOR CONSISTENCY
-- =====================================================

-- Ensure college_name matches students.college data type
ALTER TABLE college_scores 
ALTER COLUMN college_name TYPE VARCHAR(255);

-- Ensure assessment_type matches assessments tables
ALTER TABLE college_scores 
ALTER COLUMN assessment_type TYPE VARCHAR(50);

-- Ensure assessment_name matches bulk_assessments.assessment_name
ALTER TABLE college_scores 
ALTER COLUMN assessment_name TYPE VARCHAR(255);

-- Improve raw_score precision for better accuracy
ALTER TABLE college_scores 
ALTER COLUMN raw_score TYPE NUMERIC(6,2);

-- =====================================================
-- ADD CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Add NOT NULL constraints where appropriate
ALTER TABLE college_scores 
ALTER COLUMN college_name SET NOT NULL;

ALTER TABLE college_scores 
ALTER COLUMN dimension_name SET NOT NULL;

ALTER TABLE college_scores 
ALTER COLUMN assessment_type SET NOT NULL;

-- Add CHECK constraints
DO $$
BEGIN
    -- Risk level constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'college_scores_risk_level_check'
    ) THEN
        ALTER TABLE college_scores 
        ADD CONSTRAINT college_scores_risk_level_check 
        CHECK (risk_level IN ('low', 'moderate', 'high', 'at-risk', 'healthy'));
    END IF;
    
    -- Student count constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'college_scores_student_count_check'
    ) THEN
        ALTER TABLE college_scores 
        ADD CONSTRAINT college_scores_student_count_check 
        CHECK (student_count >= 0);
    END IF;
    
    -- Assessment type constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'college_scores_assessment_type_check'
    ) THEN
        ALTER TABLE college_scores 
        ADD CONSTRAINT college_scores_assessment_type_check 
        CHECK (assessment_type IN ('ryff_42', 'ryff_84'));
    END IF;
END $$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for college-based queries
CREATE INDEX IF NOT EXISTS idx_college_scores_college_name 
ON college_scores(college_name);

-- Index for dimension-based queries
CREATE INDEX IF NOT EXISTS idx_college_scores_dimension_name 
ON college_scores(dimension_name);

-- Index for assessment type filtering
CREATE INDEX IF NOT EXISTS idx_college_scores_assessment_type 
ON college_scores(assessment_type);

-- Index for assessment name filtering (important for new functionality)
CREATE INDEX IF NOT EXISTS idx_college_scores_assessment_name 
ON college_scores(assessment_name);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_college_scores_college_assessment 
ON college_scores(college_name, assessment_type, assessment_name);

-- Index for risk level filtering
CREATE INDEX IF NOT EXISTS idx_college_scores_risk_level 
ON college_scores(risk_level);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_college_scores_last_calculated 
ON college_scores(last_calculated);

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS (OPTIONAL - for strict referential integrity)
-- Note: These are commented out as they might cause issues with existing data
-- Uncomment if you want strict referential integrity
-- =====================================================

/*
-- Foreign key to ensure college_name exists in students table
-- Note: This creates a soft relationship since college_name is not a primary key in students
ALTER TABLE college_scores 
ADD CONSTRAINT fk_college_scores_college 
FOREIGN KEY (college_name) 
REFERENCES students(college) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

-- Note: We cannot create a direct foreign key to bulk_assessments.assessment_name
-- because assessment_name is not a primary key. Instead, we rely on application-level
-- validation and the indexes for performance.
*/

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
DROP TRIGGER IF EXISTS trigger_college_scores_updated_at ON college_scores;
CREATE TRIGGER trigger_college_scores_updated_at
    BEFORE UPDATE ON college_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_college_scores_updated_at();

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE college_scores IS 'Stores aggregated assessment scores by college and dimension';
COMMENT ON COLUMN college_scores.college_name IS 'Must match students.college values';
COMMENT ON COLUMN college_scores.assessment_type IS 'Must match assessment type from assessments tables (ryff_42 or ryff_84)';
COMMENT ON COLUMN college_scores.assessment_name IS 'References assessment_name from bulk_assessments table for filtering';
COMMENT ON COLUMN college_scores.dimension_name IS 'Psychological dimension being measured';
COMMENT ON COLUMN college_scores.raw_score IS 'Aggregated score for the dimension (0-100 scale)';
COMMENT ON COLUMN college_scores.student_count IS 'Number of students included in this score calculation';
COMMENT ON COLUMN college_scores.risk_level IS 'Risk assessment level based on the score';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check the final table structure
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

PRINT 'College scores table schema optimization completed successfully!';
PRINT 'The table now has:';
PRINT '✅ Proper data types matching related tables';
PRINT '✅ Appropriate constraints for data integrity';
PRINT '✅ Indexes for optimal query performance';
PRINT '✅ Automatic updated_at trigger';
PRINT '✅ Comprehensive documentation';
PRINT '';
PRINT 'Key relationships:';
PRINT '- college_name matches students.college (VARCHAR(255))';
PRINT '- assessment_type matches assessments tables (VARCHAR(50))';
PRINT '- assessment_name references bulk_assessments.assessment_name (VARCHAR(255))';
PRINT '';
PRINT 'The table is now optimized for effective communication with other tables during data insertion.';