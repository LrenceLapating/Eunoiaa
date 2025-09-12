-- Migration: Add completion_time field to ryff_history table
-- This migration adds the missing completion_time field and populates it from original assessment tables

-- Step 1: Add completion_time column to ryff_history table
ALTER TABLE public.ryff_history 
ADD COLUMN IF NOT EXISTS completion_time integer;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ryff_history_completion_time 
ON public.ryff_history USING btree (completion_time);

-- Step 3: Update ryff_history records with completion_time from assessments_42items
UPDATE public.ryff_history 
SET completion_time = a42.completion_time
FROM public.assessments_42items a42
WHERE ryff_history.original_id = a42.id 
  AND ryff_history.assessment_type = 'ryff_42'
  AND a42.completion_time IS NOT NULL
  AND ryff_history.completion_time IS NULL;

-- Step 4: Update ryff_history records with completion_time from assessments_84items
UPDATE public.ryff_history 
SET completion_time = a84.completion_time
FROM public.assessments_84items a84
WHERE ryff_history.original_id = a84.id 
  AND ryff_history.assessment_type = 'ryff_84'
  AND a84.completion_time IS NOT NULL
  AND ryff_history.completion_time IS NULL;

-- Step 5: Verify the migration results
-- This query shows the count of records with completion_time populated
SELECT 
  assessment_type,
  COUNT(*) as total_records,
  COUNT(completion_time) as records_with_completion_time,
  COUNT(*) - COUNT(completion_time) as records_without_completion_time
FROM public.ryff_history 
GROUP BY assessment_type;

-- Step 6: Add a trigger to automatically populate completion_time for future records
CREATE OR REPLACE FUNCTION update_ryff_history_completion_time()
RETURNS TRIGGER AS $$
BEGIN
  -- If completion_time is not provided, try to fetch it from original assessment
  IF NEW.completion_time IS NULL AND NEW.original_id IS NOT NULL THEN
    -- Try to get from 42-item assessments
    IF NEW.assessment_type = 'ryff_42' THEN
      SELECT completion_time INTO NEW.completion_time
      FROM public.assessments_42items
      WHERE id = NEW.original_id;
    -- Try to get from 84-item assessments
    ELSIF NEW.assessment_type = 'ryff_84' THEN
      SELECT completion_time INTO NEW.completion_time
      FROM public.assessments_84items
      WHERE id = NEW.original_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_update_ryff_history_completion_time ON public.ryff_history;
CREATE TRIGGER trigger_update_ryff_history_completion_time
  BEFORE INSERT ON public.ryff_history
  FOR EACH ROW
  EXECUTE FUNCTION update_ryff_history_completion_time();

-- Migration completed successfully
-- The ryff_history table now has completion_time field populated from original assessments