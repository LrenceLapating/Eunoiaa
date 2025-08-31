-- Migration: Create triggers to automatically sync risk_level from assessment tables to assessment_assignments
-- This ensures that whenever risk_level is updated in assessments_42items or assessments_84items,
-- the corresponding assessment_assignments record is automatically updated

-- Function to sync risk_level from assessment tables to assessment_assignments
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

-- Create trigger for assessments_42items table
-- This trigger fires AFTER INSERT OR UPDATE of risk_level column
DROP TRIGGER IF EXISTS trigger_sync_risk_level_42items ON assessments_42items;
CREATE TRIGGER trigger_sync_risk_level_42items
    AFTER INSERT OR UPDATE OF risk_level ON assessments_42items
    FOR EACH ROW
    WHEN (NEW.risk_level IS NOT NULL AND NEW.assignment_id IS NOT NULL)
    EXECUTE FUNCTION sync_risk_level_to_assignments();

-- Create trigger for assessments_84items table
-- This trigger fires AFTER INSERT OR UPDATE of risk_level column
DROP TRIGGER IF EXISTS trigger_sync_risk_level_84items ON assessments_84items;
CREATE TRIGGER trigger_sync_risk_level_84items
    AFTER INSERT OR UPDATE OF risk_level ON assessments_84items
    FOR EACH ROW
    WHEN (NEW.risk_level IS NOT NULL AND NEW.assignment_id IS NOT NULL)
    EXECUTE FUNCTION sync_risk_level_to_assignments();

-- Create indexes to optimize the trigger performance
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_id_risk_level 
    ON assessment_assignments(id, risk_level);

CREATE INDEX IF NOT EXISTS idx_assessments_42items_assignment_risk 
    ON assessments_42items(assignment_id, risk_level);

CREATE INDEX IF NOT EXISTS idx_assessments_84items_assignment_risk 
    ON assessments_84items(assignment_id, risk_level);

-- Add comments for documentation
COMMENT ON FUNCTION sync_risk_level_to_assignments() IS 
'Automatically syncs risk_level changes from assessment tables to assessment_assignments table';

COMMENT ON TRIGGER trigger_sync_risk_level_42items ON assessments_42items IS 
'Auto-sync risk_level from assessments_42items to assessment_assignments';

COMMENT ON TRIGGER trigger_sync_risk_level_84items ON assessments_84items IS 
'Auto-sync risk_level from assessments_84items to assessment_assignments';