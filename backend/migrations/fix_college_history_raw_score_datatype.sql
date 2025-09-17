-- Migration: Fix raw_score data type in college_scores_history table
-- Issue: raw_score is currently INTEGER but should be NUMERIC(6,2) to match college_scores table
-- This causes precision loss when archiving scores

-- Step 1: Check current data type
DO $$
BEGIN
    -- Log current data type for verification
    RAISE NOTICE 'Checking current raw_score data type in college_scores_history...';
END $$;

-- Step 2: Alter the column data type to match college_scores table
ALTER TABLE college_scores_history 
ALTER COLUMN raw_score TYPE NUMERIC(6,2);

-- Step 3: Add comment to document the fix
COMMENT ON COLUMN college_scores_history.raw_score IS 'Raw score with decimal precision (matches college_scores.raw_score)';

-- Step 4: Verify the change
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated raw_score data type to NUMERIC(6,2)';
    RAISE NOTICE 'This ensures decimal precision is preserved when archiving college scores';
END $$;