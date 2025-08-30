require('dotenv').config();
const { supabase } = require('./config/database');

async function checkBulkAssessmentsStructure() {
  try {
    console.log('Checking bulk_assessments table structure...');
    
    // Get a few records to see the structure
    const { data: assessments, error } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    if (assessments && assessments.length > 0) {
      console.log('bulk_assessments table structure (first record):');
      console.log(JSON.stringify(assessments[0], null, 2));
      
      console.log('\nAll column names:');
      Object.keys(assessments[0]).forEach((key, index) => {
        console.log(`${index + 1}. ${key}`);
      });
      
      console.log('\nAll assessments:');
      assessments.forEach((assessment, index) => {
        console.log(`${index + 1}. Name: ${assessment.assessment_name || 'N/A'}, College: ${assessment.college_name || assessment.college || 'N/A'}, Type: ${assessment.assessment_type || 'N/A'}`);
      });
    } else {
      console.log('No bulk assessments found in the database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBulkAssessmentsStructure();