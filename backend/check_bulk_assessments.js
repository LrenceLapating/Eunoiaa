const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssessments() {
  console.log('📋 Checking all bulk assessments created recently...');
  
  const { data: bulkAssessments, error } = await supabase
    .from('bulk_assessments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent bulk assessments:');
  bulkAssessments.forEach((a, i) => {
    console.log(`${i+1}. ${a.assessment_name} (${a.assessment_type}) - Created: ${a.created_at}`);
  });
  
  // Check if there are any assignments for the most recent assessment
  if (bulkAssessments.length > 0) {
    const latestAssessment = bulkAssessments[0];
    console.log(`\n🎯 Checking assignments for latest assessment: ${latestAssessment.assessment_name}`);
    
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', latestAssessment.id)
      .order('assigned_at', { ascending: false });
      
    if (assignError) {
      console.error('Error fetching assignments:', assignError);
    } else {
      console.log(`Found ${assignments.length} assignments for this assessment:`);
      assignments.forEach((a, i) => {
        console.log(`  ${i+1}. Assignment ${a.id} - Status: ${a.status} - Student: ${a.student_id} - Completed: ${a.completed_at || 'Not completed'}`);
      });
    }
  }
}

checkAssessments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });