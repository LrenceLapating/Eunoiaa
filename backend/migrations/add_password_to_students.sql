-- Add password_hash column to students table for student login functionality
-- This allows students to login using their ID number or email with a default password of 'student123'
-- Students can later change their password using the change password endpoint

ALTER TABLE students 
ADD COLUMN password_hash VARCHAR(255);

-- Add index for better performance on password lookups
CREATE INDEX idx_students_password ON students(password_hash);

-- Update existing students to have no password_hash (they will use default password 'student123')
-- New students uploaded via CSV will also start with no password_hash and use the default password

-- Optional: If you want to set a default hashed password for all existing students
-- Uncomment the following lines and replace 'your_hashed_password_here' with the actual bcrypt hash of 'student123'
-- UPDATE students SET password_hash = 'your_hashed_password_here' WHERE password_hash IS NULL;

COMMIT;