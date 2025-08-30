const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function runMigration() {
  try {
    console.log('Running migration to add target_year_levels and target_sections columns...');
    
    // Add target_year_levels column
    console.log('Adding target_year_levels column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.bulk_assessments ADD COLUMN IF NOT EXISTS target_year_levels integer[] NULL;'
    });
    
    if (error1) {
      console.error('Error adding target_year_levels:', error1);
    } else {
      console.log('✅ target_year_levels column added successfully');
    }
    
    // Add target_sections column
    console.log('Adding target_sections column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.bulk_assessments ADD COLUMN IF NOT EXISTS target_sections text[] NULL;'
    });
    
    if (error2) {
      console.error('Error adding target_sections:', error2);
    } else {
      console.log('✅ target_sections column added successfully');
    }
    
    // Update existing records
    console.log('Updating existing records...');
    const { error: error3 } = await supabase
      .from('bulk_assessments')
      .update({ 
        target_year_levels: [],
        target_sections: []
      })
      .is('target_year_levels', null);
    
    if (error3) {
      console.error('Error updating existing records:', error3);
    } else {
      console.log('✅ Existing records updated successfully');
    }
    
    // Test the columns
    console.log('Testing the new columns...');
    const { data, error: testError } = await supabase
      .from('bulk_assessments')
      .select('id, target_year_levels, target_sections')
      .limit(1);
    
    if (testError) {
      console.error('Error testing columns:', testError);
    } else {
      console.log('✅ Columns working! Sample data:', data);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();