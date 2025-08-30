require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificAssessment() {
  console.log('🔍 Checking for assessment: "2025-2026 2nd Semester - 1st Test 42"...');
  
  // Check college_scores table
  const { data: collegeScores, error: collegeError } = await supabase
    .from('college_scores')
    .select('*')
    .eq('assessment_name', '2025-2026 2nd Semester - 1st Test 42');
  
  if (collegeError) {
    console.error('Error checking college_scores:', collegeError);
    return;
  }
  
  console.log(`\n📊 Found ${collegeScores.length} college score records:`);
  collegeScores.forEach(record => {
    console.log(`   - College: ${record.college}`);
    console.log(`     Student Count: ${record.student_count}`);
    console.log(`     Created: ${record.created_at}`);
    console.log(`     ID: ${record.id}`);
    console.log('');
  });
  
  // Check if bulk assessment exists
  const { data: bulkAssessments, error: bulkError } = await supabase
    .from('bulk_assessments')
    .select('*')
    .eq('assessment_name', '2025-2026 2nd Semester - 1st Test 42');
  
  if (bulkError) {
    console.error('Error checking bulk_assessments:', bulkError);
    return;
  }
  
  console.log(`\n📋 Found ${bulkAssessments.length} bulk assessment records:`);
  bulkAssessments.forEach(record => {
    console.log(`   - Assessment: ${record.assessment_name}`);
    console.log(`     Status: ${record.status}`);
    console.log(`     Created: ${record.created_at}`);
    console.log(`     ID: ${record.id}`);
    console.log('');
  });
  
  // Check assignments for this assessment
  const { data: responses, error: responseError } = await supabase
    .from('assignments')
    .select('student_id, college')
    .eq('assessment_name', '2025-2026 2nd Semester - 1st Test 42');
  
  if (responseError) {
    console.error('Error checking assessment_responses:', responseError);
    return;
  }
  
  console.log(`\n📝 Found ${responses.length} assignment records`);
  
  // Group by college
  const collegeGroups = {};
  responses.forEach(response => {
    if (!collegeGroups[response.college]) {
      collegeGroups[response.college] = [];
    }
    collegeGroups[response.college].push(response.student_id);
  });
  
  console.log('\n📊 Students by college:');
  Object.keys(collegeGroups).forEach(college => {
    console.log(`   - ${college}: ${collegeGroups[college].length} students`);
  });
}

checkSpecificAssessment().catch(console.error);