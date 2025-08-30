require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLiveSubmission() {
  try {
    console.log('🔍 Testing live submission with backend server running...');
    
    // 1. Get an assigned assessment
    console.log('\n📋 Finding assigned assessment...');
    
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'assigned')
      .gt('expires_at', new Date().toISOString())
      .limit(1);
    
    if (assignError || !assignments || assignments.length === 0) {
      console.log('❌ No assigned assessments found, creating one...');
      
      // Get bulk assessment and student
      const { data: bulkAssessment } = await supabaseAdmin
        .from('bulk_assessments')
        .select('*')
        .eq('status', 'sent')
        .limit(1)
        .single();
      
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (!bulkAssessment || !student) {
        console.error('❌ Cannot create test assignment - missing bulk assessment or student');
        return;
      }
      
      const { data: newAssignment, error: createError } = await supabaseAdmin
        .from('assessment_assignments')
        .insert({
          student_id: student.id,
          bulk_assessment_id: bulkAssessment.id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create assignment:', createError);
        return;
      }
      
      assignments = [newAssignment];
      console.log('✅ Created test assignment');
    }
    
    const assignment = assignments[0];
    console.log(`✅ Using assignment: ${assignment.id}`);
    
    // 2. Get assignment details
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', assignment.student_id)
      .single();
    
    const { data: bulkAssessment } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('id', assignment.bulk_assessment_id)
      .single();
    
    console.log(`   Student: ${student.name} (${student.college})`);
    console.log(`   Assessment: ${bulkAssessment.assessment_name}`);
    console.log(`   Type: ${bulkAssessment.assessment_type}`);
    
    // 3. Check if assessment record already exists (shouldn't for assigned status)
    const tableName = bulkAssessment.assessment_type === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
    
    const { data: existingRecord } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('assignment_id', assignment.id);
    
    if (existingRecord && existingRecord.length > 0) {
      console.log('⚠️ Assessment record already exists - this assignment was already completed');
      console.log('   Existing record:', {
        id: existingRecord[0].id,
        overall_score: existingRecord[0].overall_score,
        completed_at: existingRecord[0].completed_at
      });
      return;
    }
    
    console.log('✅ No existing assessment record - ready for submission');
    
    // 4. Prepare submission data exactly like frontend
    const expectedCount = bulkAssessment.assessment_type === 'ryff_84' ? 84 : 42;
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
    
    console.log('\n📝 Prepared submission data:', {
      responseCount: Object.keys(responses).length,
      timeTakenMinutes: submissionData.timeTakenMinutes
    });
    
    // 5. Make the HTTP request to the live backend
    console.log('\n🚀 Making live HTTP request...');
    console.log(`   URL: http://localhost:3000/api/student-assessments/submit/${assignment.id}`);
    
    const response = await fetch(`http://localhost:3000/api/student-assessments/submit/${assignment.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });
    
    console.log(`   Response Status: ${response.status}`);
    console.log(`   Response OK: ${response.ok}`);
    
    const responseText = await response.text();
    console.log(`   Response Body: ${responseText}`);
    
    if (response.ok) {
      console.log('\n✅ Submission successful!');
      
      // Wait a moment for async operations to complete
      console.log('⏳ Waiting for async operations to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 6. Verify the results
      console.log('\n🔍 Verifying submission results...');
      
      // Check assessment record
      const { data: assessmentRecord, error: recordError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('assignment_id', assignment.id)
        .single();
      
      if (recordError) {
        console.error('❌ Assessment record not found:', recordError);
      } else {
        console.log('✅ Assessment record created:', {
          id: assessmentRecord.id,
          student_id: assessmentRecord.student_id,
          overall_score: assessmentRecord.overall_score,
          risk_level: assessmentRecord.risk_level,
          completed_at: assessmentRecord.completed_at
        });
      }
      
      // Check assignment status
      const { data: updatedAssignment, error: statusError } = await supabaseAdmin
        .from('assessment_assignments')
        .select('*')
        .eq('id', assignment.id)
        .single();
      
      if (statusError) {
        console.error('❌ Assignment status check failed:', statusError);
      } else {
        console.log('✅ Assignment status updated:', {
          status: updatedAssignment.status,
          completed_at: updatedAssignment.completed_at
        });
      }
      
      // Check college scores (might take a moment to compute)
      console.log('\n🎯 Checking college score computation...');
      
      const { data: collegeScores, error: scoreError } = await supabaseAdmin
        .from('college_scores')
        .select('*')
        .eq('college_name', student.college)
        .eq('assessment_name', bulkAssessment.assessment_name)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (scoreError) {
        console.error('❌ Error checking college scores:', scoreError);
      } else if (collegeScores && collegeScores.length > 0) {
        const latestScore = collegeScores[0];
        const scoreAge = new Date() - new Date(latestScore.created_at);
        
        console.log('✅ College scores found:', {
          college: latestScore.college_name,
          assessment: latestScore.assessment_name,
          created: latestScore.created_at,
          ageSeconds: Math.round(scoreAge / 1000)
        });
        
        if (scoreAge < 10000) { // Less than 10 seconds old
          console.log('🎉 College scores were computed automatically!');
        } else {
          console.log('⚠️ College scores exist but may be from previous computation');
        }
      } else {
        console.log('❌ No college scores found');
        console.log('   This indicates the automatic college score computation failed');
      }
      
    } else {
      console.error('\n❌ Submission failed!');
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('   Error details:', errorData);
      } catch (e) {
        console.error('   Raw error response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testLiveSubmission().then(() => {
  console.log('\n🏁 Live submission test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});