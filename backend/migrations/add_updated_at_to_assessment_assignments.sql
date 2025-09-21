-- Migration: Add updated_at column to assessment_assignments table
-- This fixes the error: column "updated_at" of relation "assessment_assignments" does not exist
-- Date: $(date)

-- Step 1: Add the updated_at column to assessment_assignments table
ALTER TABLE public.assessment_assignments 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Update existing records to have the current timestamp
UPDATE public.assessment_assignments 
SET updated_at = assigned_at 
WHERE updated_at IS NULL;

-- Step 3: Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_assessment_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER trigger_assessment_assignments_updated_at
    BEFORE UPDATE ON public.assessment_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_assignments_updated_at();

-- Step 5: Add an index for better performance on updated_at queries
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_updated_at 
ON public.assessment_assignments USING btree (updated_at);

-- Migration completed successfully
-- The assessment_assignments table now has an updated_at column that:
-- 1. Defaults to NOW() for new records
-- 2. Automatically updates when records are modified
-- 3. Has an index for better query performance