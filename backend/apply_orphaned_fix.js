require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyOrphanedFix() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Applying fix for orphaned 84-item assessments...');
    
    // Get the counselor's most recent 84-item assignment
    const { data: validAssignments, error: assignmentsError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('id, assessment_name, created_at')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84')
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (assignmentsError || !validAssignments || validAssignments.length === 0) {
      console.error('❌ Error fetching valid assignments or no assignments found:', assignmentsError);
      return;
    }
    
    const targetAssignment = validAssignments[0];
    console.log(`Target assignment: "${targetAssignment.assessment_name}" (${targetAssignment.id})`);
    
    // Get all 84-item assessments
    const { data: allAssessments, error: assessmentsError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (assessmentsError) {
      console.error('❌ Error fetching assessments:', assessmentsError);
      return;
    }
    
    console.log(`\nChecking ${allAssessments?.length || 0} assessments...`);
    
    let fixedCount = 0;
    
    for (const assessment of allAssessments || []) {
      // Check if this assignment_id belongs to our counselor
      const { data: assignmentCheck, error: checkError } = await supabaseAdmin
        .from('bulk_assessments')
        .select('counselor_id, assessment_name')
        .eq('id', assessment.assignment_id)
        .single();
      
      let needsFix = false;
      let reason = '';
      
      if (checkError || !assignmentCheck) {
        needsFix = true;
        reason = 'Assignment not found (orphaned)';
      } else if (assignmentCheck.counselor_id !== counselorId) {
        needsFix = true;
        reason = `Assignment belongs to different counselor: ${assignmentCheck.counselor_id}`;
      }
      
      if (needsFix) {
        console.log(`\n🔧 Fixing assessment ${assessment.id}:`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Old assignment_id: ${assessment.assignment_id}`);
        console.log(`   New assignment_id: ${targetAssignment.id}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('assessments_84items')
          .update({ assignment_id: targetAssignment.id })
          .eq('id', assessment.id);
        
        if (updateError) {
          console.error(`   ❌ Failed to update:`, updateError);
        } else {
          console.log(`   ✅ Successfully updated`);
          fixedCount++;
        }
      } else {
        console.log(`✅ Assessment ${assessment.id} already has correct assignment`);
      }
    }
    
    console.log(`\n🎉 Fix complete! Updated ${fixedCount} orphaned assessments.`);
    
    if (fixedCount > 0) {
      console.log('\nThese assessments should now appear in the counselor dashboard.');
      console.log('Please refresh the frontend to see the updated results.');
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
  
  process.exit(0);
}

applyOrphanedFix();