require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSubmissionProcess() {
  try {
    console.log('🔍 Debugging assessment submission process...');
    
    const targetAssessment = '2025-2026 1st Semester - Testing for Section Filtering';
    
    // 1. Get the bulk assessment
    const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_name', targetAssessment)
      .single();
    
    if (bulkError || !bulkAssessment) {
      console.error('❌ Error fetching bulk assessment:', bulkError);
      return;
    }
    
    console.log(`✅ Bulk assessment found: ${bulkAssessment.id}`);
    
    // 2. Get completed assignments
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', bulkAssessment.id)
      .eq('status', 'completed');
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`\n📝 Found ${assignments.length} completed assignments`);
    
    if (assignments.length === 0) {
      console.log('❌ No completed assignments found');
      return;
    }
    
    // 3. Check assessment records for each assignment
    const tableName = bulkAssessment.assessment_type === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
    
    console.log(`\n🔍 Checking ${tableName} table for each assignment...`);
    
    for (const assignment of assignments) {
      console.log(`\n👤 Assignment ID: ${assignment.id}, Student ID: ${assignment.student_id}`);
      
      // Check by assignment_id
      const { data: byAssignmentId, error: assignIdError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('assignment_id', assignment.id);
      
      if (assignIdError) {
        console.log(`   ❌ Error checking by assignment_id: ${assignIdError.message}`);
      } else {
        console.log(`   📊 Records by assignment_id: ${byAssignmentId.length}`);
        if (byAssignmentId.length > 0) {
          console.log(`      ✅ Has scores: ${!!byAssignmentId[0].scores}`);
          console.log(`      ✅ Overall score: ${byAssignmentId[0].overall_score}`);
        }
      }
      
      // Check by student_id (in case assignment_id is not set)
      const { data: byStudentId, error: studentIdError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('student_id', assignment.student_id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (studentIdError) {
        console.log(`   ❌ Error checking by student_id: ${studentIdError.message}`);
      } else {
        console.log(`   📊 Recent records by student_id: ${byStudentId.length}`);
        if (byStudentId.length > 0) {
          for (const record of byStudentId) {
            console.log(`      📝 Record ID: ${record.id}`);
            console.log(`         Assignment ID: ${record.assignment_id}`);
            console.log(`         Has scores: ${!!record.scores}`);
            console.log(`         Overall score: ${record.overall_score}`);
            console.log(`         Created at: ${record.created_at}`);
            console.log(`         Completed at: ${record.completed_at}`);
          }
        }
      }
    }
    
    // 4. Check if there are any assessment records without assignment_id
    console.log(`\n🔍 Checking for orphaned assessment records...`);
    
    const studentIds = assignments.map(a => a.student_id);
    
    const { data: orphanedRecords, error: orphanError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .in('student_id', studentIds)
      .is('assignment_id', null)
      .not('scores', 'is', null);
    
    if (orphanError) {
      console.log(`❌ Error checking orphaned records: ${orphanError.message}`);
    } else {
      console.log(`📊 Orphaned records (no assignment_id): ${orphanedRecords.length}`);
      if (orphanedRecords.length > 0) {
        console.log('💡 These records might be from the old submission process');
        for (const record of orphanedRecords.slice(0, 3)) {
          console.log(`   📝 Record ID: ${record.id}, Student: ${record.student_id}, Created: ${record.created_at}`);
        }
      }
    }
    
    // 5. Test the college scoring query with different approaches
    console.log(`\n🧪 Testing college scoring queries...`);
    
    // Approach 1: Using assignment_id join
    const { data: approach1, error: error1 } = await supabaseAdmin
      .from(tableName)
      .select(`
        id,
        scores,
        student_id,
        assignment_id,
        assignment:assessment_assignments!inner(
          id,
          status,
          bulk_assessment:bulk_assessments!inner(
            assessment_name,
            assessment_type
          )
        )
      `)
      .eq('assignment.status', 'completed')
      .eq('assignment.bulk_assessment.assessment_name', targetAssessment)
      .not('scores', 'is', null);
    
    if (error1) {
      console.log(`❌ Approach 1 (assignment_id join) failed: ${error1.message}`);
    } else {
      console.log(`✅ Approach 1 found ${approach1.length} records`);
    }
    
    // Approach 2: Using student_id join (fallback)
    const { data: approach2, error: error2 } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        status,
        bulk_assessment:bulk_assessments!inner(
          assessment_name,
          assessment_type
        )
      `)
      .eq('status', 'completed')
      .eq('bulk_assessment.assessment_name', targetAssessment);
    
    if (error2) {
      console.log(`❌ Approach 2 (student lookup) failed: ${error2.message}`);
    } else {
      console.log(`✅ Approach 2 found ${approach2.length} assignments`);
      
      if (approach2.length > 0) {
        // Now check for assessment records for these students
        const studentIds = approach2.map(a => a.student_id);
        
        const { data: assessmentsByStudents, error: studentsError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .in('student_id', studentIds)
          .not('scores', 'is', null);
        
        if (studentsError) {
          console.log(`❌ Student assessment lookup failed: ${studentsError.message}`);
        } else {
          console.log(`✅ Found ${assessmentsByStudents.length} assessment records for these students`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugSubmissionProcess().then(() => {
  console.log('\n🏁 Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});