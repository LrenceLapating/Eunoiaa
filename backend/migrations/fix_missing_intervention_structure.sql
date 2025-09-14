-- Migration: Fix missing structured intervention data
-- Date: 2025-01-27
-- Description: Populate missing overall_strategy and dimension_interventions from intervention_text
-- This fixes the issue where AI interventions appear to "disappear" due to missing structured data

-- Function to extract and populate structured intervention data
CREATE OR REPLACE FUNCTION populate_intervention_structure()
RETURNS void AS $$
DECLARE
    intervention_record RECORD;
    extracted_strategy TEXT;
    extracted_dimensions JSONB;
    dimension_pattern TEXT;
    dimension_match TEXT[];
    dimension_name TEXT;
    dimension_key TEXT;
    dimension_text TEXT;
BEGIN
    -- Process interventions with missing structured data
    FOR intervention_record IN 
        SELECT id, intervention_text, overall_strategy, dimension_interventions
        FROM counselor_interventions 
        WHERE (overall_strategy IS NULL OR overall_strategy = '') 
           OR (dimension_interventions IS NULL OR dimension_interventions = '{}'::jsonb)
    LOOP
        -- Initialize variables
        extracted_strategy := '';
        extracted_dimensions := '{}'::jsonb;
        
        -- Extract overall strategy from intervention_text
        -- Look for content before "Dimension Scores" or dimension names
        extracted_strategy := TRIM(REGEXP_REPLACE(
            SPLIT_PART(intervention_record.intervention_text, 'Dimension Scores', 1),
            '^(Overall Mental Health Strategy:|Strategy:|Overall Strategy:|Overview:)\s*',
            '',
            'gi'
        ));
        
        -- If no clear strategy found, extract first paragraph
        IF LENGTH(extracted_strategy) < 20 THEN
            extracted_strategy := TRIM(SPLIT_PART(intervention_record.intervention_text, E'\n\n', 1));
        END IF;
        
        -- Ensure we have a meaningful strategy
        IF LENGTH(extracted_strategy) < 10 THEN
            extracted_strategy := 'Personalized intervention strategy based on your assessment results.';
        END IF;
        
        -- Extract dimension interventions using regex patterns
        -- Look for patterns like "Autonomy (score/total): intervention text"
        FOR dimension_match IN 
            SELECT REGEXP_MATCHES(
                intervention_record.intervention_text,
                '(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*\([^)]+\):\s*([^\n]+)',
                'gi'
            )
        LOOP
            dimension_name := dimension_match[1];
            dimension_text := TRIM(dimension_match[2]);
            
            -- Convert dimension name to key format
            dimension_key := CASE 
                WHEN dimension_name ILIKE 'autonomy' THEN 'autonomy'
                WHEN dimension_name ILIKE 'personal growth' THEN 'personal_growth'
                WHEN dimension_name ILIKE 'purpose in life' THEN 'purpose_in_life'
                WHEN dimension_name ILIKE 'self acceptance' THEN 'self_acceptance'
                WHEN dimension_name ILIKE 'positive relations' THEN 'positive_relations'
                WHEN dimension_name ILIKE 'environmental mastery' THEN 'environmental_mastery'
                ELSE LOWER(REPLACE(dimension_name, ' ', '_'))
            END;
            
            -- Add to dimensions JSON
            extracted_dimensions := extracted_dimensions || jsonb_build_object(dimension_key, dimension_text);
        END LOOP;
        
        -- Update the intervention record with extracted data
        UPDATE counselor_interventions 
        SET 
            overall_strategy = CASE 
                WHEN overall_strategy IS NULL OR overall_strategy = '' 
                THEN extracted_strategy 
                ELSE overall_strategy 
            END,
            dimension_interventions = CASE 
                WHEN dimension_interventions IS NULL OR dimension_interventions = '{}'::jsonb 
                THEN extracted_dimensions 
                ELSE dimension_interventions 
            END,
            updated_at = NOW()
        WHERE id = intervention_record.id;
        
        RAISE NOTICE 'Updated intervention %: strategy length %, dimensions count %', 
            intervention_record.id, LENGTH(extracted_strategy), jsonb_object_keys(extracted_dimensions);
            
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT populate_intervention_structure();

-- Verify the results
SELECT 
    COUNT(*) as total_interventions,
    COUNT(CASE WHEN overall_strategy IS NOT NULL AND overall_strategy != '' THEN 1 END) as with_strategy,
    COUNT(CASE WHEN dimension_interventions IS NOT NULL AND dimension_interventions != '{}'::jsonb THEN 1 END) as with_dimensions
FROM counselor_interventions;

-- Clean up the function (optional)
-- DROP FUNCTION IF EXISTS populate_intervention_structure();

-- Add comment for documentation
COMMENT ON TABLE counselor_interventions IS 'Stores AI-generated interventions with structured data for proper display';