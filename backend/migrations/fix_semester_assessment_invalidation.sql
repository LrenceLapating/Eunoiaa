-- Migration: Fix semester assessment invalidation
-- This ensures each student only has one active assessment per semester
-- When a new assessment is created for a student, previous semester assessments are invalidated

-- Function to invalidate previous semester assessments for specific students
CREATE OR REPLACE FUNCTION invalidate_previous_semester_assessments(
    p_student_ids UUID[],
    p_assessment_type VARCHAR(50),
    p_current_school_year VARCHAR(20),
    p_current_semester VARCHAR(50)
)
RETURNS TABLE(
    invalidated_count INTEGER,
    affected_student_ids UUID[],
    log_details JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_invalidated_count INTEGER := 0;
    v_affected_students UUID[] := ARRAY[]::UUID[];
    v_log_details JSONB := '[]'::JSONB;
    v_student_id UUID;
    v_assignment_record RECORD;
BEGIN
    -- Log the operation start
    RAISE NOTICE 'Starting invalidation of previous semester % assessments for % students in %-%', 
        p_assessment_type, array_length(p_student_ids, 1), p_current_school_year, p_current_semester;
    
    -- For each student, find and invalidate previous semester assessments
    FOREACH v_student_id IN ARRAY p_student_ids
    LOOP
        -- Find active assessments from previous semesters for this student and assessment type
        FOR v_assignment_record IN
            SELECT 
                aa.id as assignment_id,
                aa.student_id,
                aa.status,
                ba.school_year,
                ba.semester,
                ba.assessment_type,
                ba.assessment_name
            FROM assessment_assignments aa
            JOIN bulk_assessments ba ON aa.bulk_assessment_id = ba.id
            WHERE aa.student_id = v_student_id
                AND ba.assessment_type = p_assessment_type
                AND aa.status = 'assigned'
                AND NOT (ba.school_year = p_current_school_year AND ba.semester = p_current_semester)
        LOOP
            -- Update the assignment status to 'expired'
            UPDATE assessment_assignments 
            SET 
                status = 'expired',
                updated_at = NOW()
            WHERE id = v_assignment_record.assignment_id;
            
            -- Increment counter
            v_invalidated_count := v_invalidated_count + 1;
            
            -- Add to affected students array if not already present
            IF NOT (v_student_id = ANY(v_affected_students)) THEN
                v_affected_students := array_append(v_affected_students, v_student_id);
            END IF;
            
            -- Log the invalidation
            v_log_details := v_log_details || jsonb_build_object(
                'assignment_id', v_assignment_record.assignment_id,
                'student_id', v_assignment_record.student_id,
                'previous_status', v_assignment_record.status,
                'previous_semester', v_assignment_record.school_year || '-' || v_assignment_record.semester,
                'assessment_name', v_assignment_record.assessment_name,
                'invalidated_at', NOW()
            );
            
            RAISE NOTICE 'Invalidated assignment % for student % (% -> expired)', 
                v_assignment_record.assignment_id, v_student_id, v_assignment_record.status;
        END LOOP;
    END LOOP;
    
    -- Log the operation completion
    RAISE NOTICE 'Completed invalidation: % assignments invalidated for % students', 
        v_invalidated_count, array_length(v_affected_students, 1);
    
    -- Return results
    RETURN QUERY SELECT 
        v_invalidated_count,
        v_affected_students,
        v_log_details;
END;
$$;

-- Add comment to document the function
COMMENT ON FUNCTION invalidate_previous_semester_assessments(UUID[], VARCHAR(50), VARCHAR(20), VARCHAR(50)) 
IS 'Safely invalidates previous semester assessments for specified students when new assessments are created. This ensures each student only has one active assessment per semester.';

-- Create an index to optimize the function performance
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_student_status_lookup
ON assessment_assignments(student_id, status)
WHERE status = 'assigned';

-- Create an index for bulk assessments lookup
CREATE INDEX IF NOT EXISTS idx_bulk_assessments_type_semester_lookup 
ON bulk_assessments(assessment_type, school_year, semester);

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: fix_semester_assessment_invalidation.sql';
    RAISE NOTICE 'Added function: invalidate_previous_semester_assessments()';
    RAISE NOTICE 'Added indexes for performance optimization';
END;
$$;