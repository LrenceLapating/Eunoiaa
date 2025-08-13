const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test84ItemFilter() {
  console.log('=== Testing 84-Item Assessment Filter Issue ===\n');
  
  try {
    const counselorId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Test counselor ID
    
    // Test 1: Check if counselor has any 84-item bulk assessments
    console.log('1. Checking counselor\'s 84-item bulk assessments...');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84')
      .neq('status', 'archived');
    
    if (bulkError) {
      console.log('❌ Error fetching bulk assessments:', bulkError.message);
      return;
    }
    
    console.log('✅ 84-item bulk assessments found:', bulkAssessments?.length || 0);
    if (bulkAssessments && bulkAssessments.length > 0) {
      bulkAssessments.forEach((bulk, index) => {
        console.log(`   Bulk Assessment ${index + 1}:`);
        console.log(`   - ID: ${bulk.id}`);
        console.log(`   - Name: ${bulk.assessment_name}`);
        console.log(`   - Status: ${bulk.status}`);
        console.log(`   - Created: ${bulk.created_at}`);
      });
    }
    
    if (!bulkAssessments || bulkAssessments.length === 0) {
      console.log('\n❌ NO 84-ITEM BULK ASSESSMENTS FOUND!');
      console.log('This is likely why 84-item assessments don\'t appear in the frontend.');
      console.log('The counselor needs to create 84-item bulk assessments first.');
      return;
    }
    
    // Test 2: Check assignments for these bulk assessments
    console.log('\n2. Checking assignments for 84-item bulk assessments...');
    const bulkIds = bulkAssessments.map(b => b.id);
    
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, bulk_assessment_id, status,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .in('bulk_assessment_id', bulkIds);
    
    if (assignError) {
      console.log('❌ Error fetching assignments:', assignError.message);
      return;
    }
    
    console.log('✅ Assignments found:', assignments?.length || 0);
    if (assignments && assignments.length > 0) {
      assignments.forEach((assignment, index) => {
        console.log(`   Assignment ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Student ID: ${assignment.student_id}`);
        console.log(`   - Status: ${assignment.status}`);
        console.log(`   - Completed: ${assignment.completed_at || 'Not completed'}`);
      });
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('\n❌ NO ASSIGNMENTS FOUND!');
      console.log('The bulk assessments exist but no students have been assigned.');
      return;
    }
    
    // Test 3: Check actual 84-item assessment submissions
    console.log('\n3. Checking 84-item assessment submissions...');
    const assignmentIds = assignments.map(a => a.id);
    
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments_84items')
      .select('*')
      .in('assignment_id', assignmentIds);
    
    if (assessmentError) {
      console.log('❌ Error fetching 84-item assessments:', assessmentError.message);
      return;
    }
    
    console.log('✅ 84-item assessments found:', assessments?.length || 0);
    if (assessments && assessments.length > 0) {
      assessments.forEach((assessment, index) => {
        console.log(`   Assessment ${index + 1}:`);
        console.log(`   - ID: ${assessment.id}`);
        console.log(`   - Assignment ID: ${assessment.assignment_id}`);
        console.log(`   - Student ID: ${assessment.student_id}`);
        console.log(`   - Assessment Type: ${assessment.assessment_type}`);
        console.log(`   - Overall Score: ${assessment.overall_score}`);
        console.log(`   - Has Responses: ${!!assessment.responses}`);
        console.log(`   - Created: ${assessment.created_at}`);
      });
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('\n❌ NO 84-ITEM ASSESSMENT SUBMISSIONS FOUND!');
      console.log('Students have been assigned but haven\'t completed the assessments yet.');
      return;
    }
    
    // Test 4: Simulate the exact backend logic
    console.log('\n4. Simulating backend API logic for 84-item filter...');
    
    // Step 1: Get assignments (same as backend)
    const { data: backendAssignments, error: backendAssignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, bulk_assessment_id,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('bulk_assessments.assessment_type', 'ryff_84')
      .neq('bulk_assessments.status', 'archived');
    
    if (backendAssignError) {
      console.log('❌ Backend simulation error (assignments):', backendAssignError.message);
      return;
    }
    
    console.log('✅ Backend assignments query successful:', backendAssignments?.length || 0);
    
    if (!backendAssignments || backendAssignments.length === 0) {
      console.log('\n❌ BACKEND LOGIC ISSUE: No assignments found for counselor!');
      return;
    }
    
    // Step 2: Get assessments for these assignment IDs
    const backendAssignmentIds = backendAssignments.map(a => a.id);
    
    const { data: backendAssessments, error: backendAssessmentError } = await supabase
      .from('assessments_84items')
      .select('*')
      .in('assignment_id', backendAssignmentIds)
      .limit(1000);
    
    if (backendAssessmentError) {
      console.log('❌ Backend simulation error (assessments):', backendAssessmentError.message);
      return;
    }
    
    console.log('✅ Backend assessments query successful:', backendAssessments?.length || 0);
    
    if (!backendAssessments || backendAssessments.length === 0) {
      console.log('\n❌ BACKEND LOGIC ISSUE: No assessments found for assignment IDs!');
      console.log('Assignment IDs searched:', backendAssignmentIds);
      return;
    }
    
    // Step 3: Get student data
    const studentIds = [...new Set(backendAssessments.map(a => a.student_id))];
    
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, id_number, name, college, section, email')
      .in('id', studentIds)
      .eq('status', 'active');
    
    if (studentError) {
      console.log('❌ Backend simulation error (students):', studentError.message);
      return;
    }
    
    console.log('✅ Backend students query successful:', students?.length || 0);
    
    // Step 4: Combine data (same as backend)
    const combinedData = backendAssessments.map(assessment => {
      const assignment = backendAssignments.find(a => a.id === assessment.assignment_id);
      const student = students.find(s => s.id === assessment.student_id);
      
      return {
        ...assessment,
        student: student,
        assignment: {
          id: assignment.id,
          assigned_at: assignment.assigned_at,
          completed_at: assignment.completed_at,
          bulk_assessment_id: assignment.bulk_assessment_id,
          bulk_assessment: assignment.bulk_assessments
        }
      };
    }).filter(a => a.student); // Only include assessments with valid students
    
    console.log('✅ Final combined data:', combinedData.length);
    
    if (combinedData.length > 0) {
      console.log('\n📋 Sample combined assessment:');
      const sample = combinedData[0];
      console.log('- Assessment ID:', sample.id);
      console.log('- Assessment Type:', sample.assessment_type);
      console.log('- Student Name:', sample.student?.name);
      console.log('- Student ID Number:', sample.student?.id_number);
      console.log('- Overall Score:', sample.overall_score);
      console.log('- Bulk Assessment Name:', sample.assignment?.bulk_assessment?.assessment_name);
      
      console.log('\n✅ SUCCESS: 84-item assessments should be working!');
      console.log('If they\'re not showing in the frontend, the issue might be:');
      console.log('1. Session authentication problems');
      console.log('2. Frontend filtering logic');
      console.log('3. API response transformation');
    } else {
      console.log('\n❌ ISSUE: Combined data is empty after filtering!');
      console.log('This suggests students might not be active or data relationships are broken.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
test84ItemFilter();