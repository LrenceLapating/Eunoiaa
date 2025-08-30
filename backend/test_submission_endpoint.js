require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubmissionEndpoint() {
  try {
    console.log('🧪 Testing assessment submission endpoint...');
    
    const targetAssessment = '2025-2026 1st Semester - Testing for Section Filtering';
    
    // 1. Find an existing completed assignment for this assessment
    const { data: existingAssignment, error: existingError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'completed')
      .limit(1)
      .single();
    
    if (existingError || !existingAssignment) {
      console.log('❌ No existing completed assignment found for testing');
      return;
    }
    
    console.log(`\n📋 Using existing assignment: ${existingAssignment.id}`);
    console.log(`   Student ID: ${existingAssignment.student_id}`);
    console.log(`   Bulk Assessment ID: ${existingAssignment.bulk_assessment_id}`);
    
    // 2. Get the bulk assessment details
    const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('id', existingAssignment.bulk_assessment_id)
      .single();
    
    if (bulkError || !bulkAssessment) {
      console.error('❌ Bulk assessment not found:', bulkError);
      return;
    }
    
    console.log(`   Assessment Name: ${bulkAssessment.assessment_name}`);
    console.log(`   Assessment Type: ${bulkAssessment.assessment_type}`);
    
    // 3. Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', existingAssignment.student_id)
      .single();
    
    if (studentError || !student) {
      console.error('❌ Student not found:', studentError);
      return;
    }
    
    console.log(`   Student: ${student.name}`);
    console.log(`   College: ${student.college}`);
    
    // 4. Check if assessment record exists
    const assessmentType = bulkAssessment.assessment_type;
    const tableName = assessmentType === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
    
    console.log(`\n🔍 Checking ${tableName} for existing record...`);
    
    const { data: existingRecord, error: recordError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('assignment_id', existingAssignment.id)
      .single();
    
    if (existingRecord) {
      console.log('✅ Assessment record already exists:');
      console.log(`   Record ID: ${existingRecord.id}`);
      console.log(`   Has scores: ${!!existingRecord.scores}`);
      console.log(`   Overall score: ${existingRecord.overall_score}`);
      console.log(`   Risk level: ${existingRecord.risk_level}`);
      
      // Check college scores
      console.log('\n🏆 Checking college scores...');
      
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
        console.log('✅ College scores found:');
        console.log(`   College: ${collegeScores[0].college_name}`);
        console.log(`   Assessment: ${collegeScores[0].assessment_name}`);
        console.log(`   Created: ${collegeScores[0].created_at}`);
        console.log(`   Completion rate: ${collegeScores[0].completion_data?.completion_rate || 'N/A'}`);
      } else {
        console.log('❌ No college scores found - this is the problem!');
        
        // Try to manually trigger college score computation
        console.log('\n🔄 Manually triggering college score computation...');
        
        const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');
        const result = await computeAndStoreCollegeScores(
          student.college,
          assessmentType,
          bulkAssessment.assessment_name
        );
        
        if (result.success) {
          console.log('✅ Manual college score computation successful:', result.message);
        } else {
          console.error('❌ Manual college score computation failed:', result.error);
        }
      }
      
      return;
    }
    
    console.log('❌ No assessment record found - this explains the issue!');
    console.log('💡 The assignment is marked as completed but no assessment data was saved');
    
    // 5. Let's create a test assessment record to see if the process works
    console.log('\n🧪 Creating test assessment record...');
    
    const expectedCount = assessmentType === 'ryff_84' ? 84 : 42;
    const responses = {};
    for (let i = 1; i <= expectedCount; i++) {
      responses[i] = Math.floor(Math.random() * 6) + 1; // Random response 1-6
    }
    
    // Calculate scores
    const { calculateRyffScores, determineRiskLevel } = require('./utils/ryffScoring');
    const scores = calculateRyffScores(responses, assessmentType);
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const riskLevel = determineRiskLevel(scores, overallScore, assessmentType);
    
    console.log('✅ Scores calculated:', {
      overallScore: parseFloat(overallScore.toFixed(2)),
      riskLevel,
      dimensionCount: Object.keys(scores).length
    });
    
    // Insert test record
    const { data: testRecord, error: insertError } = await supabaseAdmin
      .from(tableName)
      .insert({
        student_id: student.id,
        assignment_id: existingAssignment.id,
        assessment_type: assessmentType,
        responses: responses,
        scores: scores,
        overall_score: parseFloat(overallScore.toFixed(2)),
        risk_level: riskLevel,
        completed_at: new Date().toISOString(),
        completion_time: 15
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating test record:', insertError);
      return;
    }
    
    console.log('✅ Test assessment record created:', testRecord.id);
    
    // Trigger college score computation
    console.log('\n🏫 Triggering college score computation...');
    
    const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');
    const result = await computeAndStoreCollegeScores(
      student.college,
      assessmentType,
      bulkAssessment.assessment_name
    );
    
    if (result.success) {
      console.log('✅ College scores computed successfully:', result.message);
    } else {
      console.error('❌ College score computation failed:', result.error);
    }
    
    // Verify college scores were created
    const { data: newCollegeScores, error: newScoreError } = await supabaseAdmin
      .from('college_scores')
      .select('*')
      .eq('college_name', student.college)
      .eq('assessment_name', bulkAssessment.assessment_name)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (newScoreError) {
      console.error('❌ Error checking new college scores:', newScoreError);
    } else if (newCollegeScores && newCollegeScores.length > 0) {
      console.log('✅ New college scores created:');
      console.log(`   College: ${newCollegeScores[0].college_name}`);
      console.log(`   Assessment: ${newCollegeScores[0].assessment_name}`);
      console.log(`   Created: ${newCollegeScores[0].created_at}`);
      console.log(`   Completion rate: ${newCollegeScores[0].completion_data?.completion_rate || 'N/A'}`);
    } else {
      console.log('❌ Still no college scores found after manual computation');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testSubmissionEndpoint().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});