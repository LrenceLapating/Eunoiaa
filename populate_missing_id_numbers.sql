-- Script to populate missing id_numbers for students
-- This will assign sequential student IDs to students who don't have id_number set

-- First, let's see how many students are missing id_number
SELECT COUNT(*) as students_without_id_number 
FROM students 
WHERE id_number IS NULL OR id_number = '';

-- Update students without id_number to have sequential IDs
-- Format: STUD-YYYY-NNNN (e.g., STUD-2025-0001)
WITH numbered_students AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM students 
  WHERE id_number IS NULL OR id_number = ''
)
UPDATE students 
SET id_number = 'STUD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(numbered_students.row_num::text, 4, '0'),
    updated_at = NOW()
FROM numbered_students 
WHERE students.id = numbered_students.id;

-- Verify the update
SELECT id, name, id_number, created_at 
FROM students 
ORDER BY created_at;

-- Check if any students still have missing id_number
SELECT COUNT(*) as remaining_students_without_id_number 
FROM students 
WHERE id_number IS NULL OR id_number = '';