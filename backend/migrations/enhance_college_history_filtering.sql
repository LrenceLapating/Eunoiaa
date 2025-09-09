-- Migration: Enhance college_scores_history table for filtering context preservation
-- Date: 2025-01-27
-- Description: Add columns to support preserving filtering context when archiving college scores
-- MANUAL EXECUTION REQUIRED: Run this in Supabase SQL Editor

-- Step 1: Add new columns to college_scores_history table
ALTER TABLE public.college_scores_history 
ADD COLUMN IF NOT EXISTS available_year_levels JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.college_scores_history 
ADD COLUMN IF NOT EXISTS available_sections JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.college_scores_history 
ADD COLUMN IF NOT EXISTS filter_context JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.college_scores_history 
ADD COLUMN IF NOT EXISTS original_student_data JSONB DEFAULT '{}'::jsonb;

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_college_scores_history_year_levels 
ON public.college_scores_history USING GIN (available_year_levels);

CREATE INDEX IF NOT EXISTS idx_college_scores_history_sections 
ON public.college_scores_history USING GIN (available_sections);

CREATE INDEX IF NOT EXISTS idx_college_scores_history_filter_context 
ON public.college_scores_history USING GIN (filter_context);

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.college_scores_history.available_year_levels IS 'JSON array of year levels that were available when this score was calculated (e.g., [1, 2, 3, 4])';
COMMENT ON COLUMN public.college_scores_history.available_sections IS 'JSON array of sections that were available when this score was calculated (e.g., ["BSCS-3A", "BSIT-2B"])';
COMMENT ON COLUMN public.college_scores_history.filter_context IS 'JSON object containing the exact filter state when this score was archived (e.g., {"applied_year_level": "3", "applied_section": "BSCS-3A"})';
COMMENT ON COLUMN public.college_scores_history.original_student_data IS 'JSON object containing metadata about the students included in this calculation';

-- Step 4: Create helper function to get archived assessment filters
CREATE OR REPLACE FUNCTION get_archived_assessment_filters(
    p_college_name TEXT,
    p_assessment_type TEXT,
    p_assessment_name TEXT,
    p_archived_at TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    year_levels JSONB,
    sections JSONB,
    filter_context JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        COALESCE(h.available_year_levels, '[]'::jsonb) as year_levels,
        COALESCE(h.available_sections, '[]'::jsonb) as sections,
        COALESCE(h.filter_context, '{}'::jsonb) as filter_context
    FROM college_scores_history h
    WHERE h.college_name = p_college_name
        AND h.assessment_type = p_assessment_type
        AND h.assessment_name = p_assessment_name
        AND h.archived_at = p_archived_at
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create helper function to get filtered college scores history
CREATE OR REPLACE FUNCTION get_filtered_college_scores_history(
    p_college_name TEXT DEFAULT NULL,
    p_assessment_type TEXT DEFAULT NULL,
    p_assessment_name TEXT DEFAULT NULL,
    p_year_level TEXT DEFAULT NULL,
    p_section TEXT DEFAULT NULL,
    p_archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    college_name TEXT,
    dimension_name TEXT,
    raw_score NUMERIC,
    student_count INTEGER,
    risk_level TEXT,
    assessment_type TEXT,
    assessment_name TEXT,
    last_calculated TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    available_year_levels JSONB,
    available_sections JSONB,
    filter_context JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.college_name::TEXT,
        h.dimension_name::TEXT,
        h.raw_score,
        h.student_count,
        h.risk_level::TEXT,
        h.assessment_type::TEXT,
        h.assessment_name::TEXT,
        h.last_calculated,
        h.archived_at,
        COALESCE(h.available_year_levels, '[]'::jsonb) as available_year_levels,
        COALESCE(h.available_sections, '[]'::jsonb) as available_sections,
        COALESCE(h.filter_context, '{}'::jsonb) as filter_context
    FROM college_scores_history h
    WHERE 
        (p_college_name IS NULL OR h.college_name = p_college_name)
        AND (p_assessment_type IS NULL OR h.assessment_type = p_assessment_type)
        AND (p_assessment_name IS NULL OR h.assessment_name = p_assessment_name)
        AND (p_archived_at IS NULL OR h.archived_at = p_archived_at)
        AND (
            p_year_level IS NULL 
            OR h.available_year_levels ? p_year_level
            OR h.filter_context->>'applied_year_level' = p_year_level
        )
        AND (
            p_section IS NULL 
            OR h.available_sections ? p_section
            OR h.filter_context->>'applied_section' = p_section
        )
    ORDER BY h.archived_at DESC, h.dimension_name;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Verification queries (run these to confirm the migration worked)
-- Check if new columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'college_scores_history' 
    AND table_schema = 'public'
    AND column_name IN ('available_year_levels', 'available_sections', 'filter_context', 'original_student_data')
ORDER BY column_name;

-- Check if indexes were created
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'college_scores_history' 
    AND indexname LIKE '%year_levels%' OR indexname LIKE '%sections%' OR indexname LIKE '%filter_context%';

-- Check if functions were created
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('get_archived_assessment_filters', 'get_filtered_college_scores_history');

-- Test the functions (these should return empty results if no data exists)
SELECT * FROM get_archived_assessment_filters('Test College', 'ryff_42', 'Test Assessment', NOW());
SELECT * FROM get_filtered_college_scores_history('Test College', 'ryff_42', 'Test Assessment') LIMIT 1;