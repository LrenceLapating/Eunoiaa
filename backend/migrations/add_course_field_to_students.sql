-- Migration: Add course field to students table
-- Date: 2024-01-15
-- Description: Adds a course field to store student course information for cascading dropdowns

-- Add course column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS course character varying(100) NULL;

-- Create index for better performance on course queries
CREATE INDEX IF NOT EXISTS idx_students_course 
ON public.students USING btree (course) TABLESPACE pg_default;

-- Add comment to document the column
COMMENT ON COLUMN public.students.course IS 'Student course/program (e.g., BSIT, BSCS, etc.)';