-- Update college_scores table to support assessment_type column
-- This migration adds the assessment_type column and updates the unique constraint

BEGIN;

-- Add assessment_type column if it doesn't exist
ALTER TABLE college_scores 
ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(20) DEFAULT 'ryff_42';

-- Drop the old unique constraint
ALTER TABLE college_scores 
DROP CONSTRAINT IF EXISTS college_scores_college_name_dimension_name_key;

-- Add new unique constraint that includes assessment_type
ALTER TABLE college_scores 
ADD CONSTRAINT college_scores_unique_college_dimension_type 
UNIQUE(college_name, dimension_name, assessment_type);

-- Create index for assessment_type for better performance
CREATE INDEX IF NOT EXISTS idx_college_scores_assessment_type ON college_scores(assessment_type);

-- Add comment for the new column
COMMENT ON COLUMN college_scores.assessment_type IS 'Assessment type: ryff_42 for 42-item or ryff_84 for 84-item assessments';

COMMIT;