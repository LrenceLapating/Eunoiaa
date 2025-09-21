-- Migration: Add is_active flag to college_scores table
-- This migration implements the unified College Detail/History solution
-- Date: $(date)

-- Step 1: Add is_active column to college_scores table
ALTER TABLE public.college_scores 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Step 2: Create index for performance on is_active column
CREATE INDEX IF NOT EXISTS idx_college_scores_is_active 
ON public.college_scores (is_active);

-- Step 3: Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_college_scores_active_college_assessment 
ON public.college_scores (is_active, college_name, assessment_type, assessment_name);

-- Step 4: Create composite index for filtering
CREATE INDEX IF NOT EXISTS idx_college_scores_active_filters 
ON public.college_scores (is_active, college_name, dimension_name, assessment_type);

-- Step 5: Migrate data from college_scores_history back to college_scores
-- This preserves all historical data with is_active=false
INSERT INTO public.college_scores (
    college_name,
    dimension_name,
    raw_score,
    student_count,
    risk_level,
    assessment_type,
    assessment_name,
    last_calculated,
    created_at,
    updated_at,
    available_year_levels,
    available_sections,
    is_active
)
SELECT 
    college_name,
    dimension_name,
    raw_score,
    COALESCE(student_count, 0) as student_count,
    risk_level,
    assessment_type,
    assessment_name,
    last_calculated,
    created_at,
    updated_at,
    COALESCE(available_year_levels, '[]'::jsonb) as available_year_levels,
    COALESCE(available_sections, '[]'::jsonb) as available_sections,
    FALSE as is_active  -- Mark historical data as inactive
FROM public.college_scores_history
WHERE NOT EXISTS (
    -- Avoid duplicates if this migration is run multiple times
    SELECT 1 FROM public.college_scores cs 
    WHERE cs.college_name = college_scores_history.college_name
    AND cs.dimension_name = college_scores_history.dimension_name
    AND cs.assessment_type = college_scores_history.assessment_type
    AND cs.assessment_name = college_scores_history.assessment_name
    AND cs.is_active = FALSE
);

-- Step 6: Update statistics for better query planning
ANALYZE public.college_scores;

-- Step 7: Verification queries (commented out - uncomment to run manually)
/*
-- Verify the migration worked correctly
SELECT 
    is_active,
    COUNT(*) as record_count,
    COUNT(DISTINCT college_name) as college_count,
    COUNT(DISTINCT assessment_name) as assessment_count
FROM public.college_scores 
GROUP BY is_active
ORDER BY is_active DESC;

-- Check that course filtering data is preserved
SELECT 
    college_name,
    assessment_name,
    is_active,
    available_year_levels,
    available_sections
FROM public.college_scores 
WHERE college_name = 'CCS' 
AND assessment_name IS NOT NULL
ORDER BY is_active DESC, assessment_name
LIMIT 10;
*/

-- Migration completed successfully
-- Next steps:
-- 1. Update backend APIs to use is_active parameter
-- 2. Update deactivation logic to set is_active=false instead of moving data
-- 3. Test College Detail and College History with unified functionality