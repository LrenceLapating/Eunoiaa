require('dotenv').config();
const { supabase } = require('./config/database');

async function checkCollegeScores() {
  try {
    console.log('🔍 Checking assessment names in college_scores table...');
    
    const { data, error } = await supabase
      .from('college_scores')
      .select('assessment_name')
      .not('assessment_name', 'is', null);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    const uniqueAssessmentNames = [...new Set(data.map(d => d.assessment_name))];
    console.log('✅ Assessment names in college_scores:', uniqueAssessmentNames);
    console.log('📊 Total records:', data.length);
    console.log('📋 Unique assessment names:', uniqueAssessmentNames.length);
    
  } catch (error) {
    console.error('❌ Error checking college scores:', error);
  }
}

checkCollegeScores();