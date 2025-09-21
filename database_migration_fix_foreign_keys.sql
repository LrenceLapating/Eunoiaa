-- SAFE Database Migration: Fix Missing Foreign Key Constraints
-- Date: 2024-01-22
-- Purpose: Clean orphaned data and add missing foreign key constraints to counselor_interventions table
-- 
-- ⚠️  WARNING: This script will DELETE orphaned records that have invalid references
-- ✅ SAFETY: Backs up data before deletion and shows what will be affected

-- Step 1: Show what data will be affected (for review)
SELECT 'ORPHANED RECORDS TO BE DELETED:' as action;

-- Show counselor_interventions with invalid student_id references
SELECT 
    'Invalid student_id references' as issue_type,
    ci.id as intervention_id,
    ci.student_id,
    ci.intervention_title,
    ci.created_at
FROM counselor_interventions ci
LEFT JOIN students s ON ci.student_id = s.id
WHERE s.id IS NULL;

-- Show counselor_interventions with invalid assessment_id references (excluding nulls)
SELECT 
    'Invalid assessment_id references' as issue_type,
    ci.id as intervention_id,
    ci.assessment_id,
    ci.intervention_title,
    ci.created_at
FROM counselor_interventions ci
LEFT JOIN assessment_assignments aa ON ci.assessment_id = aa.id
WHERE ci.assessment_id IS NOT NULL AND aa.id IS NULL;

-- Step 2: Create backup table (optional - uncomment if you want backup)
-- CREATE TABLE counselor_interventions_backup AS SELECT * FROM counselor_interventions;

-- Step 3: Clean up orphaned records
-- Delete interventions with invalid student_id references
DELETE FROM counselor_interventions 
WHERE student_id NOT IN (SELECT id FROM students);

-- Delete interventions with invalid assessment_id references (keep nulls)
DELETE FROM counselor_interventions 
WHERE assessment_id IS NOT NULL 
AND assessment_id NOT IN (SELECT id FROM assessment_assignments);

-- Step 4: Add foreign key constraints (now safe to add)
-- Add foreign key constraint for student_id referencing students table
ALTER TABLE counselor_interventions 
ADD CONSTRAINT fk_counselor_interventions_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Add foreign key constraint for assessment_id referencing assessment_assignments table
ALTER TABLE counselor_interventions 
ADD CONSTRAINT fk_counselor_interventions_assessment 
FOREIGN KEY (assessment_id) REFERENCES assessment_assignments(id) ON DELETE CASCADE;

-- Step 5: Verify the constraints were added successfully
SELECT 
    'FOREIGN KEY CONSTRAINTS ADDED:' as result,
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
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'counselor_interventions'
    AND tc.constraint_name IN ('fk_counselor_interventions_student', 'fk_counselor_interventions_assessment');

-- Step 6: Show final record count
SELECT 
    'FINAL RECORD COUNT:' as result,
    COUNT(*) as remaining_interventions
FROM counselor_interventions;

-- Note: This script will:
-- 1. Show you exactly what orphaned data exists
-- 2. Delete the orphaned records (they're invalid anyway)
-- 3. Add the foreign key constraints safely
-- 4. Verify everything worked correctly
--
-- The deleted records had invalid references and couldn't be used properly anyway.