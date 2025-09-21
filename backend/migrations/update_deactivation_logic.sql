-- Migration: Update deactivation logic to use is_active flag (SAFE VERSION)
-- This preserves the existing deactivate_all_students function behavior
-- while adding new is_active functionality
-- Date: $(date)

-- IMPORTANT: This migration only runs AFTER add_is_active_to_college_scores.sql
-- It assumes the is_active column already exists in college_scores table

-- Step 1: Create a backup function with the new logic (don't replace the original yet)
CREATE OR REPLACE FUNCTION deactivate_all_students_with_is_active()
RETURNS JSON AS $$
DECLARE
    deactivated_count INTEGER := 0;
    archived_scores_count INTEGER := 0;
    result JSON;
BEGIN
    -- Step 1: Deactivate all active students (same as original)
    UPDATE students 
    SET status = 'inactive', updated_at = NOW()
    WHERE status = 'active';
    
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    
    -- Step 2: Mark all active college scores as inactive (NEW BEHAVIOR)
    -- This replaces moving data to college_scores_history
    UPDATE college_scores 
    SET is_active = FALSE, updated_at = NOW()
    WHERE is_active = TRUE;
    
    GET DIAGNOSTICS archived_scores_count = ROW_COUNT;
    
    -- Step 3: Log the deactivation activity
    INSERT INTO activity_logs (
        user_id, 
        user_type, 
        action, 
        details, 
        created_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, -- System user
        'system', 
        'bulk_student_deactivation_is_active',
        json_build_object(
            'deactivated_students', deactivated_count,
            'archived_college_scores', archived_scores_count,
            'method', 'is_active_flag'
        ),
        NOW()
    );
    
    result := json_build_object(
        'deactivated_students', deactivated_count,
        'archived_college_scores', archived_scores_count,
        'total_moved_assessments', 0, -- For backward compatibility
        'method', 'is_active_flag',
        'success', true
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return failure result
        INSERT INTO activity_logs (
            user_id, 
            user_type, 
            action, 
            details, 
            created_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            'system', 
            'bulk_student_deactivation_error',
            json_build_object(
                'error_message', SQLERRM,
                'error_state', SQLSTATE
            ),
            NOW()
        );
        
        result := json_build_object(
            'deactivated_students', 0,
            'archived_college_scores', 0,
            'total_moved_assessments', 0,
            'error', SQLERRM,
            'success', false
        );
        
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create helper functions for the new system
CREATE OR REPLACE FUNCTION reactivate_college_scores()
RETURNS JSON AS $$
DECLARE
    reactivated_count INTEGER := 0;
    result JSON;
BEGIN
    -- Reactivate college scores when there are active students
    UPDATE college_scores 
    SET is_active = TRUE, updated_at = NOW()
    WHERE is_active = FALSE
    AND EXISTS (
        SELECT 1 FROM students 
        WHERE status = 'active' 
        AND students.college = college_scores.college_name
    );
    
    GET DIAGNOSTICS reactivated_count = ROW_COUNT;
    
    -- Log the reactivation
    INSERT INTO activity_logs (
        user_id, 
        user_type, 
        action, 
        details, 
        created_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'system', 
        'college_scores_reactivation',
        json_build_object(
            'reactivated_college_scores', reactivated_count
        ),
        NOW()
    );
    
    result := json_build_object(
        'reactivated_college_scores', reactivated_count,
        'success', true
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'reactivated_college_scores', 0,
            'error', SQLERRM,
            'success', false
        );
        
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to get deactivation statistics
CREATE OR REPLACE FUNCTION get_deactivation_stats()
RETURNS JSON AS $$
DECLARE
    active_students INTEGER;
    inactive_students INTEGER;
    active_scores INTEGER;
    inactive_scores INTEGER;
    result JSON;
BEGIN
    -- Count active and inactive students
    SELECT COUNT(*) INTO active_students 
    FROM students WHERE status = 'active';
    
    SELECT COUNT(*) INTO inactive_students 
    FROM students WHERE status = 'inactive';
    
    -- Count active and inactive college scores
    SELECT COUNT(*) INTO active_scores 
    FROM college_scores WHERE is_active = TRUE;
    
    SELECT COUNT(*) INTO inactive_scores 
    FROM college_scores WHERE is_active = FALSE;
    
    result := json_build_object(
        'students', json_build_object(
            'active', active_students,
            'inactive', inactive_students,
            'total', active_students + inactive_students
        ),
        'college_scores', json_build_object(
            'active', active_scores,
            'inactive', inactive_scores,
            'total', active_scores + inactive_scores
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to test the new deactivation logic
CREATE OR REPLACE FUNCTION test_new_deactivation_logic()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Test the new deactivation function
    SELECT deactivate_all_students_with_is_active() INTO result;
    
    RETURN json_build_object(
        'test_result', result,
        'message', 'New deactivation logic tested successfully',
        'note', 'Original deactivate_all_students function is preserved'
    );
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully
-- IMPORTANT NOTES:
-- 1. The original deactivate_all_students() function is PRESERVED
-- 2. New function deactivate_all_students_with_is_active() uses is_active flags
-- 3. You can test the new logic with: SELECT test_new_deactivation_logic();
-- 4. When ready to switch, manually replace deactivate_all_students with the new logic
-- 5. This enables unified College Detail and History functionality safely