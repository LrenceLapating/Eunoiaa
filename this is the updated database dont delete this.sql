-- EUNOIA Assessment System - Complete Database Schema
-- Updated to match actual Supabase deployment
-- Generated: January 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    section VARCHAR(100),
    id_number VARCHAR(50) UNIQUE,
    year_level INTEGER,
    college VARCHAR(255),
    semester VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Counselors table
CREATE TABLE IF NOT EXISTS counselors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    college VARCHAR(255),
    role VARCHAR(50) DEFAULT 'counselor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bulk assessments table
CREATE TABLE IF NOT EXISTS bulk_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('ryff_42', 'ryff_84')),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('specific_students', 'college', 'all_students')),
    target_colleges TEXT[], -- Array of college names
    custom_message TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'cancelled', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Assessment assignments table
CREATE TABLE IF NOT EXISTS assessment_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_assessment_id UUID NOT NULL REFERENCES bulk_assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'expired')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 5. Assessments table (completed responses)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assessment_assignments(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('ryff_42', 'ryff_84')),
    responses JSONB NOT NULL, -- Question responses as JSON
    scores JSONB NOT NULL, -- Calculated dimension scores
    overall_score DECIMAL(4,2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Assessment progress table (for in-progress assessments)
CREATE TABLE IF NOT EXISTS assessment_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES assessment_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    current_question INTEGER DEFAULT 1,
    responses JSONB DEFAULT '{}', -- Partial responses
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Assessment analytics table (MISSING FROM CURRENT DATABASE)
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    time_taken_minutes INTEGER, -- Total time to complete
    question_times JSONB, -- Time spent on each question
    navigation_pattern JSONB, -- How user navigated through questions
    device_info JSONB, -- Browser/device information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'counselor')),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 9. Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'counselor')),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section);

CREATE INDEX IF NOT EXISTS idx_counselors_email ON counselors(email);
CREATE INDEX IF NOT EXISTS idx_counselors_college ON counselors(college);
CREATE INDEX IF NOT EXISTS idx_counselors_active ON counselors(is_active);

CREATE INDEX IF NOT EXISTS idx_bulk_assessments_counselor ON bulk_assessments(counselor_id);
CREATE INDEX IF NOT EXISTS idx_bulk_assessments_status ON bulk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_bulk_assessments_created ON bulk_assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_bulk_assessments_type ON bulk_assessments(assessment_type);

CREATE INDEX IF NOT EXISTS idx_assessment_assignments_student ON assessment_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_bulk ON assessment_assignments(bulk_assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_status ON assessment_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_expires ON assessment_assignments(expires_at);

CREATE INDEX IF NOT EXISTS idx_assessments_student ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assignment ON assessments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessments_completed ON assessments(completed_at);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);

CREATE INDEX IF NOT EXISTS idx_assessment_progress_assignment ON assessment_progress(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_progress_student ON assessment_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_assessment_analytics_assessment ON assessment_analytics(assessment_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- 11. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Students can update their own data" ON students
    FOR UPDATE USING (id = auth.uid());

-- Counselors policies
CREATE POLICY "Counselors can view their own data" ON counselors
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Counselors can update their own data" ON counselors
    FOR UPDATE USING (id = auth.uid());

-- Bulk assessments policies
CREATE POLICY "Counselors can manage their own bulk assessments" ON bulk_assessments
    FOR ALL USING (counselor_id = auth.uid());

-- Assessment assignments policies
CREATE POLICY "Students can view their own assignments" ON assessment_assignments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Counselors can view assignments for their bulk assessments" ON assessment_assignments
    FOR SELECT USING (
        bulk_assessment_id IN (
            SELECT id FROM bulk_assessments WHERE counselor_id = auth.uid()
        )
    );

CREATE POLICY "Counselors can manage assignments for their bulk assessments" ON assessment_assignments
    FOR ALL USING (
        bulk_assessment_id IN (
            SELECT id FROM bulk_assessments WHERE counselor_id = auth.uid()
        )
    );

-- Assessments policies
CREATE POLICY "Students can view their own assessments" ON assessments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own assessments" ON assessments
    FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Counselors can view assessments for their assignments" ON assessments
    FOR SELECT USING (
        assignment_id IN (
            SELECT aa.id FROM assessment_assignments aa
            JOIN bulk_assessments ba ON aa.bulk_assessment_id = ba.id
            WHERE ba.counselor_id = auth.uid()
        )
    );

-- Assessment progress policies
CREATE POLICY "Students can manage their own progress" ON assessment_progress
    FOR ALL USING (student_id = auth.uid());

-- Assessment analytics policies
CREATE POLICY "Analytics can be viewed by assessment owners" ON assessment_analytics
    FOR SELECT USING (
        assessment_id IN (
            SELECT id FROM assessments WHERE student_id = auth.uid()
        ) OR
        assessment_id IN (
            SELECT a.id FROM assessments a
            JOIN assessment_assignments aa ON a.assignment_id = aa.id
            JOIN bulk_assessments ba ON aa.bulk_assessment_id = ba.id
            WHERE ba.counselor_id = auth.uid()
        )
    );

CREATE POLICY "Analytics can be created" ON assessment_analytics
    FOR INSERT WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Activity logs can be created" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- 12. Utility Functions

-- Function to get assessment statistics for counselors
CREATE OR REPLACE FUNCTION get_assessment_statistics(counselor_uuid UUID)
RETURNS TABLE (
    total_assessments BIGINT,
    completed_assessments BIGINT,
    pending_assessments BIGINT,
    at_risk_students BIGINT,
    average_score DECIMAL,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(aa.id) as total_assessments,
        COUNT(a.id) as completed_assessments,
        COUNT(aa.id) - COUNT(a.id) as pending_assessments,
        COUNT(CASE WHEN a.risk_level = 'high' THEN 1 END) as at_risk_students,
        COALESCE(AVG(a.overall_score), 0) as average_score,
        CASE 
            WHEN COUNT(aa.id) > 0 THEN (COUNT(a.id)::DECIMAL / COUNT(aa.id) * 100)
            ELSE 0
        END as completion_rate
    FROM bulk_assessments ba
    LEFT JOIN assessment_assignments aa ON ba.id = aa.bulk_assessment_id
    LEFT JOIN assessments a ON aa.id = a.assignment_id
    WHERE ba.counselor_id = counselor_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update assessment assignment status
CREATE OR REPLACE FUNCTION update_assignment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update assignment status to completed when assessment is created
    UPDATE assessment_assignments 
    SET status = 'completed', completed_at = NEW.completed_at
    WHERE id = NEW.assignment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update assignment status
CREATE TRIGGER trigger_update_assignment_status
    AFTER INSERT ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_status();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_counselors_updated_at
    BEFORE UPDATE ON counselors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bulk_assessments_updated_at
    BEFORE UPDATE ON bulk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE students IS 'Student user accounts and profiles';
COMMENT ON TABLE counselors IS 'Counselor user accounts and profiles';
COMMENT ON TABLE bulk_assessments IS 'Assessment batches created by counselors';
COMMENT ON TABLE assessment_assignments IS 'Individual student assessment assignments';
COMMENT ON TABLE assessments IS 'Completed assessment responses and scores';
COMMENT ON TABLE assessment_progress IS 'In-progress assessment tracking';
COMMENT ON TABLE assessment_analytics IS 'Detailed assessment completion analytics';
COMMENT ON TABLE user_sessions IS 'User authentication sessions';
COMMENT ON TABLE activity_logs IS 'System activity audit trail';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- End of schema