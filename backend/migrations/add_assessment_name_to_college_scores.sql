-- Migration: Add assessment_name column to college_scores table
-- This column will be used to connect college_scores with bulk_assessments table
-- Date: 2025-01-27

ALTER TABLE college_scores 
ADD COLUMN assessment_name VARCHAR(255);

-- Optional: Add index for better query performance when joining with bulk_assessments
CREATE INDEX idx_college_scores_assessment_name ON college_scores(assessment_name);

-- Optional: Add comment to document the purpose of this column
COMMENT ON COLUMN college_scores.assessment_name IS 'References the assessment_name from bulk_assessments table to establish relationship between college scores and specific assessments';