-- Data Population Script: Populate completion_time in ryff_history table
-- Run this script in Supabase Dashboard → SQL Editor
-- This script only contains the data population commands

-- Step 1: Update ryff_history records with completion_time from assessments_42items
UPDATE public.ryff_history 
SET completion_time = a42.completion_time
FROM public.assessments_42items a42
WHERE ryff_history.original_id = a42.id 
  AND ryff_history.assessment_type = 'ryff_42'
  AND a42.completion_time IS NOT NULL
  AND ryff_history.completion_time IS NULL;

-- Step 2: Update ryff_history records with completion_time from assessments_84items
UPDATE public.ryff_history 
SET completion_time = a84.completion_time
FROM public.assessments_84items a84
WHERE ryff_history.original_id = a84.id 
  AND ryff_history.assessment_type = 'ryff_84'
  AND a84.completion_time IS NOT NULL
  AND ryff_history.completion_time IS NULL;

-- Step 3: Verify the results
SELECT 
  assessment_type,
  COUNT(*) as total_records,
  COUNT(completion_time) as records_with_completion_time,
  COUNT(*) - COUNT(completion_time) as records_without_completion_time
FROM public.ryff_history 
GROUP BY assessment_type;

-- Step 4: Show sample data
SELECT 
  id,
  assessment_type,
  completion_time,
  completed_at
FROM public.ryff_history 
WHERE completion_time IS NOT NULL
ORDER BY id DESC 
LIMIT 10;