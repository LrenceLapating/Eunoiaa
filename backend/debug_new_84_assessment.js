require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugNew84Assessment() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Debugging new 84-item assessment issue...');
    
    // Check all 84-item assessments
    console.log('\n--- All 84-item assessments ---');
    const { data: all84Assessments, error: all84Error } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (all84Error) {
      console.error('❌ Error fetching 84-item assessments:', all84Error);
    } else {
      console.log(`Found ${all84Assessments?.length || 0} total 84-item assessments`);
      all84Assessments?.forEach((assessment, index) => {
        console.log(`  ${index + 1}. ID: ${assessment.id}`);
        console.log(`     Assignment ID: ${assessment.assignment_id}`);
        console.log(`     Student ID: ${assessment.student_id}`);
        console.log(`     Created: ${assessment.created_at}`);
        console.log(`     Score: ${assessment.overall_score}`);
        console.log('');
      });
    }
    
    // Check bulk assessments for our counselor
    console.log('\n--- Bulk assessments for counselor ---');
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84');
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
    } else {
      console.log(`Found ${bulkAssessments?.length || 0} 84-item bulk assessments for counselor`);
      bulkAssessments?.forEach((bulk, index) => {
        console.log(`  ${index + 1}. ID: ${bulk.id}`);
        console.log(`     Assessment Name: ${bulk.assessment_name}`);
        console.log(`     Status: ${bulk.status}`);
        console.log(`     Created: ${bulk.created_at}`);
        console.log('');
      });
    }
    
    // Check for orphaned assessments (assessments with assignment_ids not belonging to our counselor)
    console.log('\n--- Checking for assignment ID mismatches ---');
    if (all84Assessments && all84Assessments.length > 0) {
      for (const assessment of all84Assessments) {
        const { data: assignmentCheck, error: assignmentError } = await supabaseAdmin
          .from('bulk_assessments')
          .select('counselor_id, assessment_name, assessment_type')
          .eq('id', assessment.assignment_id)
          .single();
        
        if (assignmentError) {
          console.log(`❌ Assessment ${assessment.id} has invalid assignment_id: ${assessment.assignment_id}`);
        } else {
          const belongsToOurCounselor = assignmentCheck.counselor_id === counselorId;
          const isCorrectType = assignmentCheck.assessment_type === 'ryff_84';
          
          console.log(`Assessment ${assessment.id}:`);
          console.log(`  Assignment ID: ${assessment.assignment_id}`);
          console.log(`  Assignment Name: ${assignmentCheck.assessment_name}`);
          console.log(`  Assignment Type: ${assignmentCheck.assessment_type}`);
          console.log(`  Belongs to our counselor: ${belongsToOurCounselor ? '✅' : '❌'}`);
          console.log(`  Correct assessment type: ${isCorrectType ? '✅' : '❌'}`);
          console.log('');
        }
      }
    }
    
    // Test the actual API logic manually
    console.log('\n--- Testing API logic manually ---');
    
    // Step 1: Get assignments for counselor
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('bulk_assessments')
      .select(`
        id,
        assessment_name,
        created_at,
        status,
        assessment_type
      `)
      .eq('counselor_id', counselorId)
      .eq('status', 'sent')
      .eq('assessment_type', 'ryff_84');
    
    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
    } else {
      console.log(`Found ${assignments?.length || 0} valid 84-item assignments for counselor`);
      
      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        console.log('Assignment IDs:', assignmentIds);
        
        // Step 2: Get assessments for these assignments
        const { data: assessments, error: assessmentsError } = await supabaseAdmin
          .from('assessments_84items')
          .select('*')
          .in('assignment_id', assignmentIds);
        
        if (assessmentsError) {
          console.error('❌ Error fetching assessments for assignments:', assessmentsError);
        } else {
          console.log(`Found ${assessments?.length || 0} completed 84-item assessments for these assignments`);
          assessments?.forEach((assessment, index) => {
            console.log(`  ${index + 1}. Assessment ID: ${assessment.id}`);
            console.log(`     Assignment ID: ${assessment.assignment_id}`);
            console.log(`     Student ID: ${assessment.student_id}`);
            console.log(`     Score: ${assessment.overall_score}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
  
  process.exit(0);
}

debugNew84Assessment();