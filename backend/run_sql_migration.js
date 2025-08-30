require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running SQL migration to add target_year_levels and target_sections columns...');
    
    // First, let's check if columns already exist
    console.log('\nChecking current table structure...');
    const { data: currentStructure, error: structureError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('Error checking structure:', structureError);
      return;
    }
    
    if (currentStructure && currentStructure.length > 0) {
      const columns = Object.keys(currentStructure[0]);
      console.log('Current columns:', columns);
      
      const hasYearLevels = columns.includes('target_year_levels');
      const hasSections = columns.includes('target_sections');
      
      console.log('Has target_year_levels:', hasYearLevels);
      console.log('Has target_sections:', hasSections);
      
      if (hasYearLevels && hasSections) {
        console.log('\n✅ Columns already exist! Migration not needed.');
        return;
      }
    }
    
    console.log('\n⚠️  Columns missing. Need to add them manually.');
    console.log('\nPlease run the following SQL commands in your Supabase SQL editor:');
    console.log('\n-- Add target_year_levels column');
    console.log('ALTER TABLE public.bulk_assessments ADD COLUMN IF NOT EXISTS target_year_levels integer[] NULL;');
    console.log('\n-- Add target_sections column');
    console.log('ALTER TABLE public.bulk_assessments ADD COLUMN IF NOT EXISTS target_sections text[] NULL;');
    console.log('\n-- Update existing records to have empty arrays');
    console.log('UPDATE public.bulk_assessments SET target_year_levels = \'{}\', target_sections = \'{}\' WHERE target_year_levels IS NULL OR target_sections IS NULL;');
    console.log('\n-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_bulk_assessments_target_year_levels ON public.bulk_assessments USING GIN (target_year_levels);');
    console.log('CREATE INDEX IF NOT EXISTS idx_bulk_assessments_target_sections ON public.bulk_assessments USING GIN (target_sections);');
    
    console.log('\n📝 After running these SQL commands, the dropdowns should work properly.');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();