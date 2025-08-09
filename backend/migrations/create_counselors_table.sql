-- Create counselors table for authentication
CREATE TABLE IF NOT EXISTS counselors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    college VARCHAR(100),
    role VARCHAR(50) DEFAULT 'counselor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_counselors_email ON counselors(email);

-- Create index on college for filtering
CREATE INDEX IF NOT EXISTS idx_counselors_college ON counselors(college);

-- Insert default counselor account (password: counselor123)
INSERT INTO counselors (email, name, password_hash, college, role) 
VALUES (
    'counselor@eunoia.edu',
    'Default Counselor',
    '$2b$10$rQJ8YnWkLVMZjjjjjjjjjOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', -- This will be updated with actual hash
    'Student Affairs',
    'counselor'
) ON CONFLICT (email) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_counselors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_counselors_updated_at
    BEFORE UPDATE ON counselors
    FOR EACH ROW
    EXECUTE FUNCTION update_counselors_updated_at();