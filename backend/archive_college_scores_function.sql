-- Function to archive college scores from college_scores to college_scores_history
CREATE OR REPLACE FUNCTION archive_college_scores()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    archived_count integer := 0;
    result json;
BEGIN
    -- Insert all current college scores into history table
    INSERT INTO college_scores_history (
        college_name,
        dimension_name,
        raw_score,
        student_count,
        risk_level,
        assessment_type,
        assessment_name,
        last_calculated,
        available_year_levels,
        available_sections,
        student_id,
        archived_at,
        archived_from_id,
        archive_reason
    )
    SELECT 
        college_name,
        dimension_name,
        raw_score,
        student_count,
        risk_level,
        assessment_type,
        assessment_name,
        last_calculated,
        available_year_levels,
        available_sections,
        NULL as student_id, -- college scores don't have individual student_id
        NOW() as archived_at,
        id as archived_from_id,
        'student_deactivation' as archive_reason
    FROM college_scores;
    
    -- Get count of archived records
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Clear the college_scores table after archiving
    DELETE FROM college_scores;
    
    -- Return result
    result := json_build_object(
        'success', true,
        'archived_count', archived_count,
        'message', 'Successfully archived ' || archived_count || ' college score records'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'archived_count', 0,
        'message', 'Failed to archive college scores: ' || SQLERRM
    );
    
    RETURN result;
END;
$$;