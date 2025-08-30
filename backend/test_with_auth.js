require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const { SessionManager } = require('./middleware/sessionManager');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sessionManager = new SessionManager();

async function testWithAuth() {
  try {
    console.log('🔍 Testing submission with proper authentication...');
    
    // 1. Find a student and create a session for them
    console.log('\n👤 Finding student for authentication...');
    
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
    
    console.log(`✅ Using student: ${student.name} (${student.email})`);
    
    // 2. Create a session for this student
    console.log('\n🔐 Creating session for student...');
    
    const session = await sessionManager.createSession(
      student.id,
      'student',
      '127.0.0.1',
      'Test-User-Agent'
    );
    
    if (!session) {
      console.error('❌ Failed to create session');
      return;
    }
    
    console.log(`✅ Session created: ${session.sessionToken.substring(0, 20)}...`);
    
    // 3. Find or create an assigned assessment for this student
    console.log('\n📋 Finding/creating assigned assessment...');
    
    let { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('student_id', student.id)
      .eq('status', 'assigned')
      .gt('expires_at', new Date().toISOString())
      .limit(1);
    
    if (assignError || !assignments || assignments.length === 0) {
      console.log('   No assigned assessment found, creating one...');
      
      // Get an active bulk assessment
      const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
        .from('bulk_assessments')
        .select('*')
        .eq('status', 'sent')
        .limit(1)
        .single();
      
      if (bulkError || !bulkAssessment) {
        console.error('❌ No active bulk assessment found:', bulkError);
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
      console.log('   ✅ Created new assignment');
    }
    
    const assignment = assignments[0];
    console.log(`✅ Using assignment: ${assignment.id}`);
    
    // 4. Get bulk assessment details
    const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('id', assignment.bulk_assessment_id)
      .single();
    
    if (bulkError || !bulkAssessment) {
      console.error('❌ Failed to get bulk assessment:', bulkError);
      return;
    }
    
    console.log(`   Assessment: ${bulkAssessment.assessment_name}`);
    console.log(`   Type: ${bulkAssessment.assessment_type}`);
    
    // 5. Check if assessment record already exists
    const tableName = bulkAssessment.assessment_type === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
    
    const { data: existingRecord } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('assignment_id', assignment.id);
    
    if (existingRecord && existingRecord.length > 0) {
      console.log('⚠️ Assessment already completed, skipping...');
      return;
    }
    
    // 6. Prepare submission data
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
    
    // 7. Make authenticated HTTP request
    console.log('\n🚀 Making authenticated HTTP request...');
    console.log(`   URL: http://localhost:3000/api/student-assessments/submit/${assignment.id}`);
    console.log(`   Auth: Bearer ${session.sessionToken.substring(0, 20)}...`);
    
    const response = await fetch(`http://localhost:3000/api/student-assessments/submit/${assignment.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.sessionToken}`
      },
      body: JSON.stringify(submissionData)
    });
    
    console.log(`   Response Status: ${response.status}`);
    console.log(`   Response OK: ${response.ok}`);
    
    const responseText = await response.text();
    console.log(`   Response Body: ${responseText}`);
    
    if (response.ok) {
      console.log('\n✅ Authenticated submission successful!');
      
      // Wait for async operations
      console.log('⏳ Waiting for async operations...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 8. Verify results
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
      
      // Check college scores
      console.log('\n🎯 Checking automatic college score computation...');
      
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
          console.log('🎉 SUCCESS: College scores were computed automatically!');
          console.log('\n📊 The automatic college scoring system is working!');
        } else {
          console.log('⚠️ College scores exist but may be from previous computation');
        }
      } else {
        console.log('❌ No college scores found');
        console.log('   The automatic college score computation failed');
      }
      
    } else {
      console.error('\n❌ Authenticated submission failed!');
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('   Error details:', errorData);
      } catch (e) {
        console.error('   Raw error response:', responseText);
      }
    }
    
    // 9. Clean up session
    console.log('\n🧹 Cleaning up session...');
    await sessionManager.invalidateSession(session.sessionToken);
    console.log('✅ Session cleaned up');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testWithAuth().then(() => {
  console.log('\n🏁 Authentication test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});