require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCounselorLogic() {
  try {
    console.log('Testing counselor API logic for 84-item assessments...');
    
    // Use the CORRECT counselor ID from bulk_assessments
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    const assessmentType = 'ryff_84';
    const tableName = 'assessments_84items';
    
    console.log('\nStep 1: Get assignments for counselor via bulk_assessments');
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, bulk_assessment_id,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .neq('bulk_assessments.status', 'archived');
    
    if (assignError) {
      console.error('Error getting assignments:', assignError);
      return;
    }
    
    console.log('All assignments found:', assignments?.length || 0);
    if (assignments && assignments.length > 0) {
      console.log('Assignment details:');
      assignments.forEach(a => {
        console.log(`  - Assignment ID: ${a.id}`);
        console.log(`  - Student ID: ${a.student_id}`);
        console.log(`  - Status: ${a.status || 'N/A'}`);
        console.log(`  - Bulk Assessment: ${a.bulk_assessments.assessment_type}`);
        console.log(`  - Bulk ID: ${a.bulk_assessment_id}`);
        console.log('');
      });
    }
    
    console.log('\nStep 2: Filter for 84-item assessments');
    const ryff84Assignments = assignments?.filter(a => 
      a.bulk_assessments.assessment_type === 'ryff_84'
    ) || [];
    console.log('84-item assignments:', ryff84Assignments.length);
    
    console.log('\nStep 3: Get assessments from', tableName);
    const assignmentIds = ryff84Assignments.map(a => a.id);
    console.log('Assignment IDs to look for:', assignmentIds);
    
    if (assignmentIds.length > 0) {
      const { data: assessments, error: assessError } = await supabase
        .from(tableName)
        .select('*')
        .in('assignment_id', assignmentIds);
      
      if (assessError) {
        console.error('Error getting assessments:', assessError);
        return;
      }
      
      console.log('Assessments found:', assessments?.length || 0);
      if (assessments && assessments.length > 0) {
        console.log('Assessment details:');
        assessments.forEach(assessment => {
          console.log(`  - Assessment ID: ${assessment.id}`);
          console.log(`  - Student ID: ${assessment.student_id}`);
          console.log(`  - Assignment ID: ${assessment.assignment_id}`);
          console.log(`  - Overall Score: ${assessment.overall_score}`);
          console.log(`  - Risk Level: ${assessment.risk_level}`);
          console.log(`  - Completed At: ${assessment.completed_at}`);
          console.log('');
        });
      }
      
      console.log('\n=== SUMMARY ===');
      console.log(`Counselor ID: ${counselorId}`);
      console.log(`Assessment Type: ${assessmentType}`);
      console.log(`Total assignments for counselor: ${assignments?.length || 0}`);
      console.log(`84-item assignments: ${ryff84Assignments.length}`);
      console.log(`Final assessments returned: ${assessments?.length || 0}`);
      
      if (assessments && assessments.length > 0) {
        console.log('\n✅ SUCCESS: 84-item assessments are being found correctly!');
      } else {
        console.log('\n❌ ISSUE: No assessments found in assessments_84items table');
        console.log('This could mean:');
        console.log('1. Students haven\'t completed their 84-item assessments yet');
        console.log('2. There\'s a mismatch in assignment_id references');
      }
    } else {
      console.log('\n❌ No 84-item assignments found for this counselor');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCounselorLogic();