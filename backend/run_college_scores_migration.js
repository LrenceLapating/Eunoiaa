const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  try {
    console.log('Adding assessment_name column to college_scores table...');
    
    // First, let's check if the column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('college_scores')
      .select('assessment_name')
      .limit(1);
    
    if (!testError) {
      console.log('✅ assessment_name column already exists!');
      return;
    }
    
    // If we get here, the column doesn't exist, so let's add it
    console.log('Column does not exist, adding it...');
    
    // Use raw SQL to alter the table
    const { data, error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE college_scores 
        ADD COLUMN assessment_name VARCHAR(255);
        
        CREATE INDEX IF NOT EXISTS idx_college_scores_assessment_name 
        ON college_scores(assessment_name);
      `
    });
    
    if (error) {
      console.error('Error running migration:', error);
    } else {
      console.log('✅ Migration completed successfully!');
      console.log('Added assessment_name column and index to college_scores table.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();