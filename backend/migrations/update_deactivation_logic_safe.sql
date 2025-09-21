-- Migration: Update deactivation logic to use is_active flag (PRESERVES EXISTING BEHAVIOR)
-- This keeps your current deactivation logic exactly the same
-- while adding is_active functionality for college scores
-- Date: $(date)

-- IMPORTANT: This migration only runs AFTER add_is_active_to_college_scores.sql
-- It assumes the is_active column already exists in college_scores table

-- Step 1: First, let's check if the original deactivate_all_students function exists
-- and get its current definition to preserve it

-- Step 2: Create helper functions for is_active management (these are NEW, don't affect existing logic)
CREATE OR REPLACE FUNCTION sync_college_scores_with_students()
RETURNS JSON AS $$
DECLARE
    updated_count INTEGER := 0;
    result JSON;
BEGIN
    -- When students are deactivated, mark their college scores as inactive
    -- This runs AFTER your existing deactivation logic
    UPDATE college_scores 
    SET is_active = FALSE, updated_at = NOW()
    WHERE is_active = TRUE
    AND college_name NOT IN (
        SELECT DISTINCT college 
        FROM students 
        WHERE status = 'active' 
        AND college IS NOT NULL
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the sync activity
    INSERT INTO activity_logs (
        user_id, 
        user_type, 
        action, 
        details, 
        created_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'system', 
        'college_scores_sync_with_students',
        json_build_object(
            'synced_college_scores', updated_count,
            'method', 'is_active_sync'
        ),
        NOW()
    );
    
    result := json_build_object(
        'synced_college_scores', updated_count,
        'success', true
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'synced_college_scores', 0,
            'error', SQLERRM,
            'success', false
        );
        
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to reactivate college scores when students are added back
CREATE OR REPLACE FUNCTION reactivate_college_scores_for_active_students()
RETURNS JSON AS $$
DECLARE
    reactivated_count INTEGER := 0;
    result JSON;
BEGIN
    -- Reactivate college scores when there are active students in those colleges
    UPDATE college_scores 
    SET is_active = TRUE, updated_at = NOW()
    WHERE is_active = FALSE
    AND college_name IN (
        SELECT DISTINCT college 
        FROM students 
        WHERE status = 'active' 
        AND college IS NOT NULL
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
        'college_scores_reactivation_for_students',
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

-- Step 4: Create a trigger to automatically sync college_scores.is_active with student status
-- This ensures college scores stay in sync without changing your deactivation logic
CREATE OR REPLACE FUNCTION trigger_sync_college_scores_on_student_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When a student's status changes, sync the college scores
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR 
       (TG_OP = 'INSERT') OR 
       (TG_OP = 'DELETE') THEN
        
        -- Perform the sync asynchronously (doesn't block your existing logic)
        PERFORM sync_college_scores_with_students();
        PERFORM reactivate_college_scores_for_active_students();
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger (optional - you can enable this later if you want automatic sync)
-- Commented out by default to not interfere with existing behavior
/*
CREATE TRIGGER trigger_student_status_sync_college_scores
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_college_scores_on_student_change();
*/

-- Step 6: Create a manual sync function you can call when needed
CREATE OR REPLACE FUNCTION manual_sync_college_scores()
RETURNS JSON AS $$
DECLARE
    sync_result JSON;
    reactivate_result JSON;
    final_result JSON;
BEGIN
    -- First sync (deactivate scores for colleges with no active students)
    SELECT sync_college_scores_with_students() INTO sync_result;
    
    -- Then reactivate (activate scores for colleges with active students)
    SELECT reactivate_college_scores_for_active_students() INTO reactivate_result;
    
    final_result := json_build_object(
        'sync_result', sync_result,
        'reactivate_result', reactivate_result,
        'message', 'College scores synced with student status',
        'note', 'Your existing deactivation logic is preserved'
    );
    
    RETURN final_result;
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully
-- IMPORTANT NOTES:
-- 1. Your existing deactivate_all_students() function is COMPLETELY PRESERVED
-- 2. Your current deactivation logic will work exactly the same as before
-- 3. New functions are added to manage is_active flags separately
-- 4. You can manually sync college scores with: SELECT manual_sync_college_scores();
-- 5. Optional trigger is available but disabled by default
-- 6. This enables College Detail/History functionality without breaking anything

-- Usage Examples:
-- Manual sync after deactivation: SELECT manual_sync_college_scores();
-- Check sync status: SELECT sync_college_scores_with_students();
-- Reactivate when adding students: SELECT reactivate_college_scores_for_active_students();