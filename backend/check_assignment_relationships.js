require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssignmentRelationships() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Checking assignment relationships...');
    
    // Check bulk_assessments for our counselor
    console.log('\n--- Bulk Assessments for Counselor ---');
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84');
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`Found ${bulkAssessments?.length || 0} bulk assessments`);
    bulkAssessments?.forEach((bulk, index) => {
      console.log(`  ${index + 1}. ID: ${bulk.id}`);
      console.log(`     Name: ${bulk.assessment_name}`);
      console.log(`     Status: ${bulk.status}`);
      console.log(`     Created: ${bulk.created_at}`);
    });
    
    // Check assessment_assignments for these bulk assessments
    console.log('\n--- Assessment Assignments ---');
    for (const bulk of bulkAssessments || []) {
      console.log(`\nChecking assignments for bulk assessment: ${bulk.assessment_name} (${bulk.id})`);
      
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('assessment_assignments')
        .select('*')
        .eq('bulk_assessment_id', bulk.id);
      
      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError);
      } else {
        console.log(`  Found ${assignments?.length || 0} individual assignments`);
        assignments?.forEach((assignment, index) => {
          console.log(`    ${index + 1}. Assignment ID: ${assignment.id}`);
          console.log(`       Student ID: ${assignment.student_id}`);
          console.log(`       Status: ${assignment.status}`);
          console.log(`       Assigned: ${assignment.assigned_at}`);
          console.log(`       Completed: ${assignment.completed_at || 'Not completed'}`);
        });
      }
    }
    
    // Check orphaned assessments and see if we can find valid assignment_ids
    console.log('\n--- Checking Orphaned Assessments ---');
    const { data: orphanedAssessments, error: orphanedError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (orphanedError) {
      console.error('❌ Error fetching orphaned assessments:', orphanedError);
    } else {
      console.log(`Found ${orphanedAssessments?.length || 0} total 84-item assessments`);
      
      for (const assessment of orphanedAssessments || []) {
        console.log(`\nAssessment ${assessment.id}:`);
        console.log(`  Current assignment_id: ${assessment.assignment_id}`);
        console.log(`  Student ID: ${assessment.student_id}`);
        
        // Check if there's a valid assignment for this student in our counselor's bulk assessments
        let foundValidAssignment = false;
        
        for (const bulk of bulkAssessments || []) {
          const { data: validAssignments, error: validError } = await supabaseAdmin
            .from('assessment_assignments')
            .select('*')
            .eq('bulk_assessment_id', bulk.id)
            .eq('student_id', assessment.student_id);
          
          if (!validError && validAssignments && validAssignments.length > 0) {
            console.log(`  ✅ Found valid assignment: ${validAssignments[0].id} in bulk "${bulk.assessment_name}"`);
            foundValidAssignment = true;
            break;
          }
        }
        
        if (!foundValidAssignment) {
          console.log(`  ❌ No valid assignment found for this student in counselor's bulk assessments`);
          
          // Check if we can create an assignment for this student
          console.log(`  💡 Could create assignment in most recent bulk assessment`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
  
  process.exit(0);
}

checkAssignmentRelationships();