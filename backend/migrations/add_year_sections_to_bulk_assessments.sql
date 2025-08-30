-- Migration: Add target_year_levels and target_sections to bulk_assessments table
-- Date: 2025-01-27
-- Description: Add columns to support filtering by year levels and sections in bulk assessments

-- Add target_year_levels column (array of integers for year levels like 1, 2, 3, 4)
ALTER TABLE public.bulk_assessments 
ADD COLUMN target_year_levels integer[] NULL;

-- Add target_sections column (array of text for sections like 'BSCS-3A', 'BSIT-2B', etc.)
ALTER TABLE public.bulk_assessments 
ADD COLUMN target_sections text[] NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bulk_assessments_target_year_levels 
ON public.bulk_assessments USING GIN (target_year_levels);

CREATE INDEX IF NOT EXISTS idx_bulk_assessments_target_sections 
ON public.bulk_assessments USING GIN (target_sections);

-- Add comments for documentation
COMMENT ON COLUMN public.bulk_assessments.target_year_levels IS 'Array of target year levels (1, 2, 3, 4) for this bulk assessment';
COMMENT ON COLUMN public.bulk_assessments.target_sections IS 'Array of target sections (e.g., BSCS-3A, BSIT-2B) for this bulk assessment';

-- Update existing records to have empty arrays (optional, for data consistency)
UPDATE public.bulk_assessments 
SET target_year_levels = '{}', target_sections = '{}' 
WHERE target_year_levels IS NULL OR target_sections IS NULL;