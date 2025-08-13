require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedAPI() {
  try {
    console.log('Testing the FIXED API logic for 84-item assessments...');
    
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    const assessmentType = 'ryff_84';
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log('\n=== Testing 84-item assessment query with FIXED logic ===');
    console.log('Counselor ID:', counselorId);
    console.log('Assessment Type:', assessmentType);
    
    // Step 1: Get assignments for this counselor with PROPER filtering
    console.log('\nStep 1: Getting assignments with assessment type filter...');
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, bulk_assessment_id,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('bulk_assessments.assessment_type', 'ryff_84')  // THIS WAS MISSING!
      .neq('bulk_assessments.status', 'archived');
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} 84-item assignments`);
    
    if (!assignments || assignments.length === 0) {
      console.log('❌ No 84-item assignments found for counselor');
      return;
    }
    
    // Step 2: Get assessments for these assignment IDs
    console.log('\nStep 2: Getting assessments for assignment IDs...');
    const assignmentIds = assignments.map(a => a.id);
    console.log('Assignment IDs:', assignmentIds);
    
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments_84items')
      .select('*')
      .in('assignment_id', assignmentIds)
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError);
      return;
    }
    
    console.log(`✅ Found ${assessmentData?.length || 0} 84-item assessments`);
    
    if (!assessmentData || assessmentData.length === 0) {
      console.log('❌ No assessment data found');
      return;
    }
    
    // Step 3: Get student data
    console.log('\nStep 3: Getting student data...');
    const studentIds = [...new Set(assessmentData.map(a => a.student_id))];
    
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, id_number, name, college, section, email')
      .in('id', studentIds)
      .eq('status', 'active');
    
    if (studentError) {
      console.error('❌ Error fetching students:', studentError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} students`);
    
    // Step 4: Combine all data
    console.log('\nStep 4: Combining data...');
    const enrichedAssessments = assessmentData.map(assessment => {
      const assignment = assignments.find(a => a.id === assessment.assignment_id);
      const student = students.find(s => s.id === assessment.student_id);
      
      return {
        ...assessment,
        student: student,
        assignment: {
          id: assignment?.id,
          assigned_at: assignment?.assigned_at,
          completed_at: assignment?.completed_at,
          bulk_assessment_id: assignment?.bulk_assessment_id,
          bulk_assessment: assignment?.bulk_assessments
        }
      };
    }).filter(a => a.student);
    
    console.log(`\n🎉 SUCCESS! Found ${enrichedAssessments.length} enriched 84-item assessments`);
    
    if (enrichedAssessments.length > 0) {
      console.log('\n📋 Assessment Details:');
      enrichedAssessments.forEach((assessment, index) => {
        console.log(`${index + 1}. Student: ${assessment.student.name}`);
        console.log(`   College: ${assessment.student.college}`);
        console.log(`   Overall Score: ${assessment.overall_score}`);
        console.log(`   Risk Level: ${assessment.risk_level}`);
        console.log(`   Assessment Type: ${assessment.assessment_type}`);
        console.log(`   Completed: ${assessment.completed_at}`);
        console.log('');
      });
      
      console.log('\n✅ The fix is working! 84-item assessments are now being returned correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testFixedAPI();