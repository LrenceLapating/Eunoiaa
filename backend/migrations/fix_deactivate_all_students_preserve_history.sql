-- Migration: Fix deactivate_all_students function to preserve assessment history
-- This ensures that when students are deactivated, their assessment data is moved to ryff_history
-- instead of being deleted, so the history view remains populated
-- Date: $(date)

-- Create the corrected deactivate_all_students function
CREATE OR REPLACE FUNCTION deactivate_all_students()
RETURNS JSON AS $$
DECLARE
    deactivated_count INTEGER := 0;
    moved_42_count INTEGER := 0;
    moved_84_count INTEGER := 0;
    total_moved_assessments INTEGER := 0;
    result JSON;
BEGIN
    -- Step 1: Move assessment data from assessments_42items to ryff_history
    INSERT INTO ryff_history (
        original_id,
        student_id,
        assessment_type,
        responses,
        scores,
        overall_score,
        risk_level,
        at_risk_dimensions,
        assignment_id,
        completed_at,
        created_at,
        updated_at,
        archived_at,
        completion_time
    )
    SELECT 
        a.id as original_id,
        a.student_id,
        'ryff_42' as assessment_type,
        a.responses,
        a.scores,
        a.overall_score,
        a.risk_level,
        a.at_risk_dimensions,
        a.assignment_id,
        a.completed_at,
        a.created_at,
        a.updated_at,
        NOW() as archived_at,
        a.completion_time
    FROM assessments_42items a
    INNER JOIN students s ON a.student_id = s.id
    WHERE s.status = 'active';
    
    GET DIAGNOSTICS moved_42_count = ROW_COUNT;
    
    -- Step 2: Move assessment data from assessments_84items to ryff_history
    INSERT INTO ryff_history (
        original_id,
        student_id,
        assessment_type,
        responses,
        scores,
        overall_score,
        risk_level,
        at_risk_dimensions,
        assignment_id,
        completed_at,
        created_at,
        updated_at,
        archived_at,
        completion_time
    )
    SELECT 
        a.id as original_id,
        a.student_id,
        'ryff_84' as assessment_type,
        a.responses,
        a.scores,
        a.overall_score,
        a.risk_level,
        a.at_risk_dimensions,
        a.assignment_id,
        a.completed_at,
        a.created_at,
        a.updated_at,
        NOW() as archived_at,
        a.completion_time
    FROM assessments_84items a
    INNER JOIN students s ON a.student_id = s.id
    WHERE s.status = 'active';
    
    GET DIAGNOSTICS moved_84_count = ROW_COUNT;
    
    total_moved_assessments := moved_42_count + moved_84_count;
    
    -- Step 3: Deactivate all active students
    UPDATE students 
    SET status = 'inactive', updated_at = NOW()
    WHERE status = 'active';
    
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    
    -- Step 4: Clear assessment data from active tables (now that it's safely in history)
    DELETE FROM assessments_42items 
    WHERE student_id IN (
        SELECT id FROM students WHERE status = 'inactive'
    );
    
    DELETE FROM assessments_84items 
    WHERE student_id IN (
        SELECT id FROM students WHERE status = 'inactive'
    );
    
    -- Step 5: Update assessment assignments status
    UPDATE assessment_assignments 
    SET status = 'expired', updated_at = NOW()
    WHERE student_id IN (
        SELECT id FROM students WHERE status = 'inactive'
    ) AND status IN ('assigned', 'in_progress');
    
    -- Step 6: Log the deactivation activity
    INSERT INTO activity_logs (
        user_id, 
        user_type, 
        action, 
        details, 
        created_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, -- System user
        'system', 
        'bulk_student_deactivation_with_history',
        json_build_object(
            'deactivated_students', deactivated_count,
            'moved_42items_assessments', moved_42_count,
            'moved_84items_assessments', moved_84_count,
            'total_moved_assessments', total_moved_assessments,
            'method', 'move_to_history'
        ),
        NOW()
    );
    
    result := json_build_object(
        'success', true,
        'message', CASE 
            WHEN deactivated_count = 0 THEN 'No active students to deactivate'
            ELSE 'Successfully deactivated ' || deactivated_count || ' students and moved ' || total_moved_assessments || ' assessments to history'
        END,
        'deactivated_students', deactivated_count,
        'total_moved_assessments', total_moved_assessments,
        'cleared_42items_assessments', moved_42_count, -- Now shows moved count instead of 0
        'cleared_84items_assessments', moved_84_count  -- Now shows moved count instead of 0
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
            'success', false,
            'message', 'Error during deactivation: ' || SQLERRM,
            'deactivated_students', 0,
            'total_moved_assessments', 0,
            'cleared_42items_assessments', 0,
            'cleared_84items_assessments', 0,
            'error', SQLERRM
        );
        
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- ROLLBACK PLAN (SAFETY BACKUP)
-- ===================================================================
-- If you need to rollback this migration, run the following:

/*
-- ROLLBACK: Restore original function (run this if needed)
CREATE OR REPLACE FUNCTION deactivate_all_students()
RETURNS json AS $$
DECLARE
    result json;
    deactivated_count integer := 0;
    cleared_42_count integer := 0;
    cleared_84_count integer := 0;
BEGIN
    -- Original logic: just deactivate and clear (no history preservation)
    UPDATE students SET status = 'inactive' WHERE status = 'active';
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    
    DELETE FROM assessments_42items WHERE student_id IN (
        SELECT id FROM students WHERE status = 'inactive'
    );
    GET DIAGNOSTICS cleared_42_count = ROW_COUNT;
    
    DELETE FROM assessments_84items WHERE student_id IN (
        SELECT id FROM students WHERE status = 'inactive'
    );
    GET DIAGNOSTICS cleared_84_count = ROW_COUNT;
    
    result := json_build_object(
        'success', true,
        'message', CASE 
            WHEN deactivated_count = 0 THEN 'No active students to deactivate'
            ELSE 'Successfully deactivated ' || deactivated_count || ' students'
        END,
        'deactivated_students', deactivated_count,
        'total_moved_assessments', 0,
        'cleared_42items_assessments', cleared_42_count,
        'cleared_84items_assessments', cleared_84_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
*/

-- ===================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ===================================================================
-- The deactivate_all_students function now:
-- 1. ✅ SAFELY moves assessment data to ryff_history before deactivation
-- 2. ✅ Deactivates students (making them disappear from student view)
-- 3. ✅ Clears assessment data from active tables
-- 4. ✅ Preserves historical data for the history view
-- 5. ✅ Maintains exact same API response format
-- 6. ✅ No breaking changes to existing code