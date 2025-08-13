require('dotenv').config();
const { supabase } = require('./config/database');

// Find where completed 84-item assessment responses are stored
async function findCompletedAssessments() {
  try {
    console.log('🔍 Searching for completed 84-item assessment responses...');
    
    // Get 84-item bulk assessments
    const { data: bulk84, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_type', 'ryff_84');
    
    console.log(`\n📊 Found ${bulk84?.length || 0} 84-item bulk assessments:`);
    bulk84?.forEach((bulk, index) => {
      console.log(`  ${index + 1}. ID: ${bulk.id}, Name: "${bulk.assessment_name}", Created: ${bulk.created_at}`);
    });
    
    if (bulk84?.length > 0) {
      // Check assignments for these bulk assessments
      const bulkIds = bulk84.map(b => b.id);
      
      const { data: assignments, error: assignError } = await supabase
        .from('assessment_assignments')
        .select('*')
        .in('bulk_assessment_id', bulkIds);
      
      console.log(`\n📋 Found ${assignments?.length || 0} assignments for 84-item assessments:`);
      assignments?.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Student: ${assignment.student_id}, Status: ${assignment.status}, Completed: ${assignment.completed_at}`);
      });
      
      // Check for completed assignments
      const completedAssignments = assignments?.filter(a => a.status === 'completed') || [];
      console.log(`\n✅ Found ${completedAssignments.length} completed 84-item assignments`);
      
      if (completedAssignments.length > 0) {
        // Now check where the actual responses are stored
        console.log('\n🔍 Checking where responses are stored...');
        
        // Check assessment_responses table
        const assignmentIds = completedAssignments.map(a => a.id);
        
        const { data: responses, error: responseError } = await supabase
          .from('assessment_responses')
          .select('*')
          .in('assignment_id', assignmentIds)
          .limit(5);
        
        if (responseError) {
          console.log('   assessment_responses table error:', responseError.message);
        } else {
          console.log(`   Found ${responses?.length || 0} responses in assessment_responses table`);
          if (responses?.length > 0) {
            console.log('   Sample response:', {
              id: responses[0].id,
              assignment_id: responses[0].assignment_id,
              student_id: responses[0].student_id,
              scores: responses[0].scores ? 'Has scores' : 'No scores',
              created_at: responses[0].created_at
            });
          }
        }
        
        // Also check if there are any other tables that might store the responses
        console.log('\n🔍 Checking student_assessments table...');
        const { data: studentAssessments, error: studentError } = await supabase
          .from('student_assessments')
          .select('*')
          .in('assignment_id', assignmentIds)
          .limit(5);
        
        if (studentError) {
          console.log('   student_assessments table error:', studentError.message);
        } else {
          console.log(`   Found ${studentAssessments?.length || 0} records in student_assessments table`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findCompletedAssessments();