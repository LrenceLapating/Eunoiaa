-- Fix the sync_risk_level_to_assignments function to remove updated_at reference
-- Run this SQL in your Supabase SQL editor

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_sync_risk_level_42items ON assessments_42items;
DROP TRIGGER IF EXISTS trigger_sync_risk_level_84items ON assessments_84items;

-- Create the fixed function without updated_at reference
CREATE OR REPLACE FUNCTION sync_risk_level_to_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- Update assessment_assignments table with the new risk_level
    -- The assignment_id in the assessment table corresponds to the id in assessment_assignments
    UPDATE assessment_assignments 
    SET risk_level = CASE 
        -- Map assessment table risk_level values to assessment_assignments format
        WHEN NEW.risk_level = 'low' THEN 'healthy'
        WHEN NEW.risk_level = 'moderate' THEN 'moderate' 
        WHEN NEW.risk_level = 'high' THEN 'at-risk'
        ELSE NEW.risk_level
    END
    WHERE id = NEW.assignment_id;
    
    -- Log the sync operation (optional, can be removed in production)
    RAISE NOTICE 'Synced risk_level % from % to assessment_assignments for assignment_id %', 
        NEW.risk_level, TG_TABLE_NAME, NEW.assignment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers
CREATE TRIGGER trigger_sync_risk_level_42items
    AFTER INSERT OR UPDATE OF risk_level ON assessments_42items
    FOR EACH ROW
    WHEN (NEW.risk_level IS NOT NULL AND NEW.assignment_id IS NOT NULL)
    EXECUTE FUNCTION sync_risk_level_to_assignments();

CREATE TRIGGER trigger_sync_risk_level_84items
    AFTER INSERT OR UPDATE OF risk_level ON assessments_84items
    FOR EACH ROW
    WHEN (NEW.risk_level IS NOT NULL AND NEW.assignment_id IS NOT NULL)
    EXECUTE FUNCTION sync_risk_level_to_assignments();

-- Verify the function was created successfully
SELECT 'Trigger fix applied successfully!' as status;