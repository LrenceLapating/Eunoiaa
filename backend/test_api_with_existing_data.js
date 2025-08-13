require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIWithExistingData() {
  try {
    console.log('Testing API logic with existing 84-item assessment data...');
    
    // We know from previous test that this assessment exists:
    const knownAssignmentId = '7814dd48-8dfe-4a62-bf22-63d83f427dc2';
    const knownAssessmentId = '87a55d76-18d9-42b5-bf54-5ca79416051d';
    
    console.log('\nStep 1: Verify the assessment record exists...');
    const { data: assessment, error: assessmentError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .eq('id', knownAssessmentId)
      .single();
    
    if (assessmentError || !assessment) {
      console.log('❌ Assessment not found:', assessmentError);
      return;
    }
    
    console.log('✅ Assessment exists:');
    console.log(`  - Assessment ID: ${assessment.id}`);
    console.log(`  - Student ID: ${assessment.student_id}`);
    console.log(`  - Assignment ID: ${assessment.assignment_id}`);
    console.log(`  - Assessment Type: ${assessment.assessment_type}`);
    console.log(`  - Overall Score: ${assessment.overall_score}`);
    
    console.log('\nStep 2: Get the assignment details...');
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('id', knownAssignmentId)
      .single();
    
    if (assignmentError || !assignment) {
      console.log('❌ Assignment not found:', assignmentError);
      return;
    }
    
    console.log('✅ Assignment exists:');
    console.log(`  - Assignment ID: ${assignment.id}`);
    console.log(`  - Student ID: ${assignment.student_id}`);
    console.log(`  - Counselor ID: ${assignment.bulk_assessments.counselor_id}`);
    console.log(`  - Assessment Type: ${assignment.bulk_assessments.assessment_type}`);
    console.log(`  - Status: ${assignment.status}`);
    
    const counselorId = assignment.bulk_assessments.counselor_id;
    
    console.log('\nStep 3: Simulate the API query logic...');
    console.log(`Testing with counselor ID: ${counselorId}`);
    
    // Step 3a: Get assignments for counselor (like the API does)
    console.log('\nStep 3a: Get assignments for counselor...');
    const { data: assignments, error: assignError } = await supabaseAdmin
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
      console.log('❌ Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} assignments for counselor`);
    
    // Filter for 84-item assignments
    const ryff84Assignments = assignments?.filter(a => 
      a.bulk_assessments.assessment_type === 'ryff_84'
    ) || [];
    
    console.log(`✅ Found ${ryff84Assignments.length} 84-item assignments`);
    
    if (ryff84Assignments.length > 0) {
      console.log('84-item assignment IDs:', ryff84Assignments.map(a => a.id));
      
      // Check if our known assignment is in the list
      const ourAssignment = ryff84Assignments.find(a => a.id === knownAssignmentId);
      if (ourAssignment) {
        console.log('✅ Our known assignment is in the list!');
      } else {
        console.log('❌ Our known assignment is NOT in the list!');
        console.log('This means the counselor filter is not working correctly.');
      }
    }
    
    // Step 3b: Get assessments for these assignment IDs (like the API does)
    console.log('\nStep 3b: Get assessments for assignment IDs...');
    const assignmentIds = ryff84Assignments.map(a => a.id);
    console.log('Assignment IDs to query:', assignmentIds);
    
    if (assignmentIds.length > 0) {
      const { data: assessmentData, error: assessmentError } = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .in('assignment_id', assignmentIds);
      
      if (assessmentError) {
        console.log('❌ Error fetching assessments:', assessmentError);
        return;
      }
      
      console.log(`✅ Found ${assessmentData?.length || 0} assessments`);
      
      if (assessmentData && assessmentData.length > 0) {
        console.log('Assessment IDs found:', assessmentData.map(a => a.id));
        
        // Check if our known assessment is in the results
        const ourAssessment = assessmentData.find(a => a.id === knownAssessmentId);
        if (ourAssessment) {
          console.log('✅ Our known assessment is in the results!');
          console.log('🎯 CONCLUSION: The API logic should work correctly!');
        } else {
          console.log('❌ Our known assessment is NOT in the results!');
          console.log('This indicates an issue with the assignment_id matching.');
        }
      } else {
        console.log('❌ No assessments found despite having assignment IDs');
        console.log('This confirms the issue is in the assessment query.');
      }
    } else {
      console.log('❌ No 84-item assignment IDs to query');
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testAPIWithExistingData();