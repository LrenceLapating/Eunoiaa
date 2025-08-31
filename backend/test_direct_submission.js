require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = 'http://localhost:3000';

async function testDirectSubmission() {
  try {
    console.log('🧪 Testing direct assessment submission...');
    
    // 1. Find an assigned assessment (not completed)
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        status,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('status', 'assigned')
      .limit(1);
    
    if (assignmentError || !assignments || assignments.length === 0) {
      console.log('❌ No assigned assessments found for testing');
      console.log('Creating a test assignment...');
      
      // Get a student and bulk assessment to create test assignment
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id')
        .limit(1);
      
      const { data: bulkAssessments } = await supabaseAdmin
        .from('bulk_assessments')
        .select('id, assessment_type')
        .eq('assessment_type', 'ryff_42')
        .limit(1);
      
      if (!students || !bulkAssessments || students.length === 0 || bulkAssessments.length === 0) {
        console.log('❌ No students or bulk assessments found');
        return;
      }
      
      // Create test assignment
      const { data: newAssignment, error: createError } = await supabaseAdmin
        .from('assessment_assignments')
        .insert({
          student_id: students[0].id,
          bulk_assessment_id: bulkAssessments[0].id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .select(`
          id,
          student_id,
          bulk_assessment_id,
          status,
          bulk_assessments!inner(
            id,
            assessment_name,
            assessment_type
          )
        `)
        .single();
      
      if (createError) {
        console.error('❌ Error creating test assignment:', createError);
        return;
      }
      
      assignments[0] = newAssignment;
      console.log('✅ Created test assignment:', newAssignment.id);
    }
    
    const assignment = assignments[0];
    const assessmentType = assignment.bulk_assessments.assessment_type;
    const questionCount = assessmentType === 'ryff_84' ? 84 : 42;
    
    console.log(`\n📋 Testing with assignment: ${assignment.id}`);
    console.log(`   Assessment Type: ${assessmentType}`);
    console.log(`   Question Count: ${questionCount}`);
    
    // 2. Create mock responses (all neutral responses)
    const mockResponses = {};
    for (let i = 1; i <= questionCount; i++) {
      mockResponses[i] = 4; // Neutral response (scale 1-6, so 4 is slightly positive)
    }
    
    console.log(`\n📝 Created ${Object.keys(mockResponses).length} mock responses`);
    
    // 3. Test the submission endpoint
    console.log('\n🚀 Testing submission endpoint...');
    
    try {
      const response = await axios.post(
        `${BASE_URL}/api/student-assessments/submit/${assignment.id}`,
        {
          responses: mockResponses,
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          endTime: new Date().toISOString()
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Submission successful!');
      console.log('Response:', {
        success: response.data.success,
        message: response.data.message,
        assessmentId: response.data.assessmentId,
        overallScore: response.data.overallScore,
        riskLevel: response.data.riskLevel
      });
      
      // 4. Verify the data was saved correctly
      console.log('\n🔍 Verifying saved data...');
      
      const tableName = assessmentType === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
      
      const { data: savedAssessment, error: verifyError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('assignment_id', assignment.id)
        .single();
      
      if (verifyError) {
        console.error('❌ Error verifying saved data:', verifyError);
      } else {
        console.log('✅ Data saved successfully:');
        console.log(`   Assessment ID: ${savedAssessment.id}`);
        console.log(`   Overall Score: ${savedAssessment.overall_score}`);
        console.log(`   Risk Level: ${savedAssessment.risk_level}`);
        console.log(`   Has Responses: ${!!savedAssessment.responses}`);
        console.log(`   Has Scores: ${!!savedAssessment.scores}`);
      }
      
      // 5. Check if assignment status was updated
      const { data: updatedAssignment, error: statusError } = await supabaseAdmin
        .from('assessment_assignments')
        .select('status')
        .eq('id', assignment.id)
        .single();
      
      if (statusError) {
        console.error('❌ Error checking assignment status:', statusError);
      } else {
        console.log(`✅ Assignment status updated to: ${updatedAssignment.status}`);
      }
      
    } catch (error) {
      console.error('❌ Submission failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectSubmission().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('❌ Test error:', error);
});