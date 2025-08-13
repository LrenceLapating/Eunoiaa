require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOrphanedAssessments() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Fixing orphaned 84-item assessments...');
    
    // Get the counselor's valid 84-item assignments
    const { data: validAssignments, error: assignmentsError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('id, assessment_name, created_at')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84')
      .eq('status', 'sent')
      .order('created_at', { ascending: false });
    
    if (assignmentsError) {
      console.error('❌ Error fetching valid assignments:', assignmentsError);
      return;
    }
    
    console.log(`Found ${validAssignments?.length || 0} valid assignments for counselor:`);
    validAssignments?.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.assessment_name} (${assignment.id}) - ${assignment.created_at}`);
    });
    
    // Get orphaned 84-item assessments
    const { data: orphanedAssessments, error: orphanedError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (orphanedError) {
      console.error('❌ Error fetching orphaned assessments:', orphanedError);
      return;
    }
    
    console.log(`\nFound ${orphanedAssessments?.length || 0} total 84-item assessments`);
    
    if (orphanedAssessments && orphanedAssessments.length > 0 && validAssignments && validAssignments.length > 0) {
      // Let's use the most recent assignment for the orphaned assessments
      const targetAssignment = validAssignments[0]; // Most recent assignment
      
      console.log(`\nProposed fix: Assign orphaned assessments to "${targetAssignment.assessment_name}" (${targetAssignment.id})`);
      
      for (const assessment of orphanedAssessments) {
        console.log(`\nAssessment ${assessment.id}:`);
        console.log(`  Current assignment_id: ${assessment.assignment_id}`);
        console.log(`  Student: ${assessment.student_id}`);
        console.log(`  Score: ${assessment.overall_score}`);
        console.log(`  Created: ${assessment.created_at}`);
        
        // Check if this assignment_id belongs to our counselor
        const { data: assignmentCheck, error: checkError } = await supabaseAdmin
          .from('bulk_assessments')
          .select('counselor_id, assessment_name')
          .eq('id', assessment.assignment_id)
          .single();
        
        if (checkError || !assignmentCheck) {
          console.log(`  ❌ Assignment ${assessment.assignment_id} not found - ORPHANED`);
          console.log(`  🔧 Would update assignment_id to: ${targetAssignment.id}`);
        } else if (assignmentCheck.counselor_id !== counselorId) {
          console.log(`  ❌ Assignment belongs to different counselor: ${assignmentCheck.counselor_id}`);
          console.log(`  🔧 Would update assignment_id to: ${targetAssignment.id}`);
        } else {
          console.log(`  ✅ Assignment belongs to correct counselor`);
        }
      }
      
      console.log('\n⚠️  This is a DRY RUN. No changes have been made.');
      console.log('\nTo apply the fix, we would update the assignment_id for orphaned assessments.');
      console.log('This would make them appear in the counselor dashboard.');
      
      // Uncomment the following lines to actually apply the fix:
      /*
      console.log('\n🔧 Applying fix...');
      for (const assessment of orphanedAssessments) {
        const { data: assignmentCheck, error: checkError } = await supabaseAdmin
          .from('bulk_assessments')
          .select('counselor_id')
          .eq('id', assessment.assignment_id)
          .single();
        
        if (checkError || !assignmentCheck || assignmentCheck.counselor_id !== counselorId) {
          const { error: updateError } = await supabaseAdmin
            .from('assessments_84items')
            .update({ assignment_id: targetAssignment.id })
            .eq('id', assessment.id);
          
          if (updateError) {
            console.error(`❌ Failed to update assessment ${assessment.id}:`, updateError);
          } else {
            console.log(`✅ Updated assessment ${assessment.id} assignment_id to ${targetAssignment.id}`);
          }
        }
      }
      */
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
  
  process.exit(0);
}

fixOrphanedAssessments();