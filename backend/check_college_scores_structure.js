const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCollegeScoresStructure() {
  try {
    // Check table structure using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'college_scores' 
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.error('Error checking table structure:', error);
      return;
    }

    console.log('College scores table structure:');
    console.table(data);

    // Check if assessment_name column exists
    const hasAssessmentName = data.some(col => col.column_name === 'assessment_name');
    console.log('\nHas assessment_name column:', hasAssessmentName);

    if (!hasAssessmentName) {
      console.log('\nNeed to add assessment_name column to college_scores table.');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkCollegeScoresStructure();