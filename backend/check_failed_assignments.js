const { supabaseAdmin } = require('./config/database');

async function checkFailedAssignments() {
  try {
    console.log('🔍 Checking failed assignment details...');
    
    const failedIds = [
      'c8865e75-af1f-4fb7-97ab-18edbc6071be',
      '1cda2755-b044-47ee-8adc-190a3e89ffd0', 
      '7ad16b93-7478-47eb-b1de-df873562828f'
    ];
    
    for (const id of failedIds) {
      console.log(`\n📋 Assignment ${id}:`);
      
      const { data: assignment, error } = await supabaseAdmin
        .from('assessment_assignments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`❌ Error fetching assignment ${id}:`, error);
        continue;
      }
      
      console.log(`   Student ID: ${assignment.student_id}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Completed: ${assignment.completed_at}`);
      console.log(`   Risk Level: ${assignment.risk_level}`);
      
      // Fetch bulk assessment separately
      const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
        .from('bulk_assessments')
        .select('*')
        .eq('id', assignment.bulk_assessment_id)
        .single();
      
      if (bulkError) {
        console.log(`   ❌ No bulk assessment found for bulk_assessment_id: ${assignment.bulk_assessment_id}`);
        console.log(`   Error: ${bulkError.message}`);
      } else {
        console.log(`   Assessment: ${bulkAssessment.assessment_name}`);
        console.log(`   Type: ${bulkAssessment.assessment_type}`);
      }
      
      // Check if student exists
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, email, college')
        .eq('id', assignment.student_id)
        .single();
      
      if (studentError) {
        console.log(`   ❌ Student not found: ${studentError.message}`);
      } else {
        console.log(`   Student: ${student.email} (${student.college})`);
      }
      
      // Check for any assessment records with this assignment_id
      const { data: assessments42 } = await supabaseAdmin
        .from('assessments_42items')
        .select('id, created_at')
        .eq('assignment_id', id);
      
      const { data: assessments84 } = await supabaseAdmin
        .from('assessments_84items')
        .select('id, created_at')
        .eq('assignment_id', id);
      
      const totalAssessments = (assessments42?.length || 0) + (assessments84?.length || 0);
      console.log(`   Assessment Records: ${totalAssessments} found`);
      
      if (assessments42?.length > 0) {
        console.log(`     - 42-item records: ${assessments42.length}`);
      }
      if (assessments84?.length > 0) {
        console.log(`     - 84-item records: ${assessments84.length}`);
      }
    }
    
    // Also check the one successful assignment for comparison
    console.log('\n✅ Checking successful assignment for comparison...');
    
    const { data: successfulAssignments, error: successError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'completed')
      .not('id', 'in', `(${failedIds.join(',')})`)
      .limit(1);
    
    if (successError) {
      console.error('❌ Error fetching successful assignment:', successError);
    } else if (successfulAssignments?.length > 0) {
      const successful = successfulAssignments[0];
      console.log(`\n📋 Successful Assignment ${successful.id}:`);
      console.log(`   Student ID: ${successful.student_id}`);
      console.log(`   Status: ${successful.status}`);
      console.log(`   Completed: ${successful.completed_at}`);
      // Fetch bulk assessment for successful assignment
      const { data: successBulk, error: successBulkError } = await supabaseAdmin
        .from('bulk_assessments')
        .select('*')
        .eq('id', successful.bulk_assessment_id)
        .single();
      
      if (successBulkError) {
        console.log(`   ❌ No bulk assessment found`);
      } else {
        console.log(`   Assessment: ${successBulk.assessment_name}`);
        console.log(`   Type: ${successBulk.assessment_type}`);
      }
      
      // Check assessment records for successful assignment
      const { data: successAssessments42 } = await supabaseAdmin
        .from('assessments_42items')
        .select('id, created_at')
        .eq('assignment_id', successful.id);
      
      const { data: successAssessments84 } = await supabaseAdmin
        .from('assessments_84items')
        .select('id, created_at')
        .eq('assignment_id', successful.id);
      
      const successTotal = (successAssessments42?.length || 0) + (successAssessments84?.length || 0);
      console.log(`   Assessment Records: ${successTotal} found`);
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error);
  }
  
  process.exit(0);
}

checkFailedAssignments();