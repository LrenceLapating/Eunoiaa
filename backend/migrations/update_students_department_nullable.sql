-- Update students table to make department column nullable
-- This fixes the issue where CSV uploads fail because department is required but we removed it from processing

BEGIN;

-- Make department column nullable since we're using college as primary identifier
ALTER TABLE students ALTER COLUMN department DROP NOT NULL;

-- Optional: You can also remove the department column entirely if not needed
-- Uncomment the following line if you want to completely remove the department column:
-- ALTER TABLE students DROP COLUMN department;

COMMIT;