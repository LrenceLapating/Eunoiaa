-- Migration: Add missing foreign key constraint between assessment_assignments and bulk_assessments
-- Date: 2024-01-XX
-- Description: Fixes the PostgREST error by adding the missing foreign key relationship

-- Add the missing foreign key constraint
ALTER TABLE public.assessment_assignments 
ADD CONSTRAINT assessment_assignments_bulk_assessment_id_fkey 
FOREIGN KEY (bulk_assessment_id) 
REFERENCES public.bulk_assessments (id) 
ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT assessment_assignments_bulk_assessment_id_fkey ON public.assessment_assignments 
IS 'Foreign key relationship between assessment assignments and bulk assessments';

-- Verify the constraint was added
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='assessment_assignments'
    AND tc.constraint_name = 'assessment_assignments_bulk_assessment_id_fkey';