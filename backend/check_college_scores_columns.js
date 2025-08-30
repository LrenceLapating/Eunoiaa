// Check college_scores table structure and fix column name issues
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkCollegeScoresStructure() {
  console.log('🔍 Checking college_scores table structure...');
  
  try {
    // Get table structure
    const { data: structure, error: structureError } = await supabase
      .from('college_scores')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('Error fetching college_scores structure:', structureError);
    } else if (structure && structure.length > 0) {
      console.log('College_scores columns:', Object.keys(structure[0]));
      console.log('Sample record:', JSON.stringify(structure[0], null, 2));
    } else {
      console.log('No records found in college_scores table');
    }
    
    // Try to find records with correct column names
    console.log('\n🔍 Checking for assessment records...');
    const { data: allRecords, error: allError } = await supabase
      .from('college_scores')
      .select('*')
      .limit(10);
    
    if (allError) {
      console.error('Error fetching all college_scores:', allError);
    } else {
      console.log(`Found ${allRecords.length} total records in college_scores`);
      if (allRecords.length > 0) {
        // Check unique assessment names
        const assessmentNames = [...new Set(allRecords.map(r => r.assessment_name || r.assessmentName))];
        console.log('Unique assessment names:', assessmentNames);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollegeScoresStructure().catch(console.error);