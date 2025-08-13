require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAssignmentIds() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Fixing assignment IDs for 84-item assessments...');
    
    // Get all 84-item assessments
    const { data: assessments, error: assessmentsError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (assessmentsError) {
      console.error('❌ Error fetching assessments:', assessmentsError);
      return;
    }
    
    console.log(`Found ${assessments?.length || 0} total 84-item assessments`);
    
    // Get all valid assignments for our counselor
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84');
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    // Get all assignment_assignments for these bulk assessments
    const allValidAssignments = [];
    for (const bulk of bulkAssessments || []) {
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('assessment_assignments')
        .select('*')
        .eq('bulk_assessment_id', bulk.id);
      
      if (!assignmentsError && assignments) {
        allValidAssignments.push(...assignments.map(a => ({...a, bulk_name: bulk.assessment_name})));
      }
    }
    
    console.log(`Found ${allValidAssignments.length} valid assignments for counselor`);
    
    // Process each assessment
    for (const assessment of assessments || []) {
      console.log(`\n--- Processing Assessment ${assessment.id} ---`);
      console.log(`Student ID: ${assessment.student_id}`);
      console.log(`Current assignment_id: ${assessment.assignment_id}`);
      
      // Check if current assignment_id is valid
      const currentAssignmentValid = allValidAssignments.find(a => a.id === assessment.assignment_id);
      
      if (currentAssignmentValid) {
        console.log(`✅ Current assignment_id is valid (${currentAssignmentValid.bulk_name})`);
        continue;
      }
      
      // Find a valid assignment for this student
      const validAssignment = allValidAssignments.find(a => a.student_id === assessment.student_id);
      
      if (validAssignment) {
        console.log(`🔧 Found valid assignment for student: ${validAssignment.id} (${validAssignment.bulk_name})`);
        console.log(`   Assignment status: ${validAssignment.status}`);
        
        // Update the assessment
        const { error: updateError } = await supabaseAdmin
          .from('assessments_84items')
          .update({ assignment_id: validAssignment.id })
          .eq('id', assessment.id);
        
        if (updateError) {
          console.error(`❌ Failed to update assessment: ${updateError.message}`);
        } else {
          console.log(`✅ Successfully updated assignment_id to ${validAssignment.id}`);
          
          // If the assignment is not marked as completed, mark it as completed
          if (validAssignment.status !== 'completed') {
            const { error: completeError } = await supabaseAdmin
              .from('assessment_assignments')
              .update({ 
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', validAssignment.id);
            
            if (completeError) {
              console.error(`❌ Failed to mark assignment as completed: ${completeError.message}`);
            } else {
              console.log(`✅ Marked assignment as completed`);
            }
          }
        }
      } else {
        console.log(`❌ No valid assignment found for student ${assessment.student_id}`);
        
        // Create a new assignment in the most recent bulk assessment
        const mostRecentBulk = bulkAssessments
          ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        
        if (mostRecentBulk) {
          console.log(`💡 Creating new assignment in "${mostRecentBulk.assessment_name}"`);
          
          const { data: newAssignment, error: createError } = await supabaseAdmin
            .from('assessment_assignments')
            .insert({
              bulk_assessment_id: mostRecentBulk.id,
              student_id: assessment.student_id,
              status: 'completed',
              assigned_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error(`❌ Failed to create assignment: ${createError.message}`);
          } else {
            console.log(`✅ Created new assignment: ${newAssignment.id}`);
            
            // Update the assessment with the new assignment_id
            const { error: updateError } = await supabaseAdmin
              .from('assessments_84items')
              .update({ assignment_id: newAssignment.id })
              .eq('id', assessment.id);
            
            if (updateError) {
              console.error(`❌ Failed to update assessment with new assignment: ${updateError.message}`);
            } else {
              console.log(`✅ Successfully linked assessment to new assignment`);
            }
          }
        }
      }
    }
    
    console.log('\n🎉 Assignment ID fixing completed!');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
  
  process.exit(0);
}

fixAssignmentIds();