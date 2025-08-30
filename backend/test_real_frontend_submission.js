require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRealFrontendSubmission() {
  try {
    console.log('🔍 Testing real frontend submission flow...');
    
    // 1. Check if there are any assigned assessments that students should be able to submit
    console.log('\n📋 Checking for assigned assessments...');
    
    const { data: assignedAssessments, error: assignedError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        *,
        student:students!inner(
          id,
          name,
          email,
          college,
          section,
          year_level
        ),
        bulk_assessment:bulk_assessments!inner(
          id,
          assessment_type,
          assessment_name,
          status
        )
      `)
      .eq('status', 'assigned')
      .gt('expires_at', new Date().toISOString())
      .limit(5);
    
    if (assignedError) {
      console.error('❌ Error fetching assigned assessments:', assignedError);
      return;
    }
    
    if (!assignedAssessments || assignedAssessments.length === 0) {
      console.log('❌ No assigned assessments found');
      
      // Create a test assignment for a real student
      console.log('\n🧪 Creating test assignment for real student...');
      
      // Get an active bulk assessment
      const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
        .from('bulk_assessments')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (bulkError || !bulkAssessment) {
        console.error('❌ No active bulk assessment found:', bulkError);
        return;
      }
      
      // Get a real student
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (studentError || !student) {
        console.error('❌ No active student found:', studentError);
        return;
      }
      
      // Create test assignment
      const { data: testAssignment, error: createError } = await supabaseAdmin
        .from('assessment_assignments')
        .insert({
          student_id: student.id,
          bulk_assessment_id: bulkAssessment.id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select(`
          *,
          student:students!inner(
            id,
            name,
            email,
            college,
            section,
            year_level
          ),
          bulk_assessment:bulk_assessments!inner(
            id,
            assessment_type,
            assessment_name,
            status
          )
        `)
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test assignment:', createError);
        return;
      }
      
      console.log('✅ Created test assignment for real student');
      assignedAssessments = [testAssignment];
    }
    
    const assignment = assignedAssessments[0];
    console.log(`\n📋 Found assignment for testing:`);
    console.log(`   Assignment ID: ${assignment.id}`);
    console.log(`   Student: ${assignment.student.name} (${assignment.student.email})`);
    console.log(`   College: ${assignment.student.college}`);
    console.log(`   Assessment: ${assignment.bulk_assessment.assessment_name}`);
    console.log(`   Type: ${assignment.bulk_assessment.assessment_type}`);
    
    // 2. Simulate the exact frontend API call
    console.log('\n🌐 Simulating frontend API call...');
    
    const assessmentType = assignment.bulk_assessment.assessment_type;
    const expectedCount = assessmentType === 'ryff_84' ? 84 : 42;
    
    // Generate responses exactly like frontend would
    const responses = {};
    for (let i = 1; i <= expectedCount; i++) {
      responses[i] = Math.floor(Math.random() * 6) + 1;
    }
    
    const submissionData = {
      responses: responses,
      timeTakenMinutes: 15,
      questionTimes: {},
      startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString()
    };
    
    console.log('📝 Submission data prepared:', {
      assignmentId: assignment.id,
      responseCount: Object.keys(responses).length,
      timeTakenMinutes: submissionData.timeTakenMinutes
    });
    
    // Make the actual HTTP request like the frontend does
    const fetch = require('node-fetch');
    
    console.log('\n🚀 Making HTTP POST request...');
    console.log(`   URL: http://localhost:3000/api/student-assessments/submit/${assignment.id}`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/student-assessments/submit/${assignment.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Note: Not including credentials like frontend does since we're testing from backend
        body: JSON.stringify(submissionData)
      });
      
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response OK: ${response.ok}`);
      
      const responseText = await response.text();
      console.log(`   Response Body: ${responseText}`);
      
      if (response.ok) {
        console.log('✅ HTTP request successful!');
        
        // Check if assessment was actually saved
        console.log('\n🔍 Verifying assessment was saved...');
        
        const tableName = assessmentType === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
        
        const { data: savedAssessment, error: checkError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .eq('assignment_id', assignment.id)
          .single();
        
        if (checkError) {
          console.error('❌ Assessment not found in database:', checkError);
        } else {
          console.log('✅ Assessment successfully saved to database:', {
            id: savedAssessment.id,
            student_id: savedAssessment.student_id,
            overall_score: savedAssessment.overall_score,
            risk_level: savedAssessment.risk_level
          });
        }
        
        // Check if assignment status was updated
        const { data: updatedAssignment, error: statusError } = await supabaseAdmin
          .from('assessment_assignments')
          .select('*')
          .eq('id', assignment.id)
          .single();
        
        if (statusError) {
          console.error('❌ Could not check assignment status:', statusError);
        } else {
          console.log('✅ Assignment status:', {
            status: updatedAssignment.status,
            completed_at: updatedAssignment.completed_at
          });
        }
        
        // Check if college scores were computed
        console.log('\n🎯 Checking college score computation...');
        
        const { data: collegeScores, error: scoreError } = await supabaseAdmin
          .from('college_scores')
          .select('*')
          .eq('college_name', assignment.student.college)
          .eq('assessment_name', assignment.bulk_assessment.assessment_name)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (scoreError) {
          console.error('❌ Error checking college scores:', scoreError);
        } else if (collegeScores && collegeScores.length > 0) {
          console.log('✅ College scores found:', {
            college: collegeScores[0].college_name,
            assessment: collegeScores[0].assessment_name,
            created: collegeScores[0].created_at
          });
        } else {
          console.log('❌ No college scores found - automatic computation may have failed');
        }
        
      } else {
        console.error('❌ HTTP request failed');
        
        // Try to parse error response
        try {
          const errorData = JSON.parse(responseText);
          console.error('   Error details:', errorData);
        } catch (e) {
          console.error('   Raw error response:', responseText);
        }
      }
      
    } catch (fetchError) {
      console.error('❌ Network error during HTTP request:', fetchError.message);
      console.log('\n💡 This might indicate:');
      console.log('   - Backend server is not running');
      console.log('   - CORS issues');
      console.log('   - Network connectivity problems');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testRealFrontendSubmission().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});