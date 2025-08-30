require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { calculateRyffScores, determineRiskLevel } = require('./utils/ryffScoring');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSubmissionFailure() {
  try {
    console.log('🔍 Debugging assessment submission failure...');
    
    // 1. Find an assigned (not completed) assignment to test with
    const { data: assignedAssignments, error: assignedError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessment:bulk_assessments!inner(
          id,
          assessment_type,
          assessment_name
        )
      `)
      .eq('status', 'assigned')
      .gt('expires_at', new Date().toISOString())
      .limit(5);
    
    if (assignedError) {
      console.error('❌ Error fetching assigned assessments:', assignedError);
      return;
    }
    
    if (!assignedAssignments || assignedAssignments.length === 0) {
      console.log('❌ No assigned assessments found for testing');
      
      // Create a test assignment
      console.log('\n🧪 Creating test assignment...');
      
      // Get a bulk assessment
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
      
      // Get a student
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
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test assignment:', createError);
        return;
      }
      
      console.log('✅ Created test assignment:', testAssignment.id);
      
      // Add bulk assessment info
      testAssignment.bulk_assessment = bulkAssessment;
      assignedAssignments = [testAssignment];
    }
    
    const assignment = assignedAssignments[0];
    console.log(`\n📋 Testing with assignment:`);
    console.log(`   Assignment ID: ${assignment.id}`);
    console.log(`   Student ID: ${assignment.student_id}`);
    console.log(`   Assessment: ${assignment.bulk_assessment.assessment_name}`);
    console.log(`   Type: ${assignment.bulk_assessment.assessment_type}`);
    
    // 2. Simulate the exact submission process from the endpoint
    console.log('\n🔄 Simulating submission process step by step...');
    
    const assessmentType = assignment.bulk_assessment.assessment_type;
    const expectedCount = assessmentType === 'ryff_84' ? 84 : 42;
    
    // Generate responses
    const responses = {};
    for (let i = 1; i <= expectedCount; i++) {
      responses[i] = Math.floor(Math.random() * 6) + 1;
    }
    
    console.log(`✅ Generated ${Object.keys(responses).length} responses`);
    
    // Validate responses (same as endpoint)
    if (!responses || typeof responses !== 'object') {
      console.error('❌ Invalid responses format');
      return;
    }
    
    const responseCount = Object.keys(responses).length;
    if (responseCount !== expectedCount) {
      console.error(`❌ Expected ${expectedCount} responses, but received ${responseCount}`);
      return;
    }
    
    console.log('✅ Response validation passed');
    
    // Calculate scores (same as endpoint)
    const scores = calculateRyffScores(responses, assessmentType);
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const riskLevel = determineRiskLevel(scores, overallScore, assessmentType);
    
    console.log('✅ Scores calculated:', {
      overallScore: parseFloat(overallScore.toFixed(2)),
      riskLevel,
      dimensionCount: Object.keys(scores).length
    });
    
    // Determine table name (same as endpoint)
    let tableName = 'assessments_42items';
    if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    console.log(`\n💾 Attempting to insert into ${tableName}...`);
    
    // Test the exact insertion query from the endpoint
    const insertData = {
      student_id: assignment.student_id,
      assignment_id: assignment.id,
      assessment_type: assessmentType,
      responses: responses,
      scores: scores,
      overall_score: parseFloat(overallScore.toFixed(2)),
      risk_level: riskLevel,
      completed_at: new Date().toISOString(),
      completion_time: 15
    };
    
    console.log('📝 Insert data structure:', {
      student_id: insertData.student_id,
      assignment_id: insertData.assignment_id,
      assessment_type: insertData.assessment_type,
      has_responses: !!insertData.responses,
      has_scores: !!insertData.scores,
      overall_score: insertData.overall_score,
      risk_level: insertData.risk_level,
      response_count: Object.keys(insertData.responses).length,
      score_dimensions: Object.keys(insertData.scores).length
    });
    
    // Try the insertion
    const { data: assessmentRecord, error: assessmentInsertError } = await supabaseAdmin
      .from(tableName)
      .insert(insertData)
      .select()
      .single();
    
    if (assessmentInsertError) {
      console.error('❌ Assessment insertion failed:', assessmentInsertError);
      
      // Check if it's a constraint violation
      if (assessmentInsertError.code) {
        console.log(`   Error code: ${assessmentInsertError.code}`);
        console.log(`   Error details: ${assessmentInsertError.details}`);
        console.log(`   Error hint: ${assessmentInsertError.hint}`);
      }
      
      // Check if assignment_id already has an assessment record
      const { data: existingRecord, error: checkError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('assignment_id', assignment.id);
      
      if (!checkError && existingRecord && existingRecord.length > 0) {
        console.log('💡 Assignment already has an assessment record - this might be a duplicate submission');
        console.log(`   Existing record ID: ${existingRecord[0].id}`);
      }
      
      return;
    }
    
    console.log('✅ Assessment record created successfully:', assessmentRecord.id);
    
    // Update assignment status (same as endpoint)
    console.log('\n📝 Updating assignment status...');
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('assessment_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignment.id)
      .select();
    
    if (updateError) {
      console.error('❌ Assignment update failed:', updateError);
    } else {
      console.log('✅ Assignment status updated successfully');
    }
    
    // Get student college info (same as endpoint)
    console.log('\n🏫 Getting student college info...');
    
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('college')
      .eq('id', assignment.student_id)
      .single();
    
    if (studentError || !studentData) {
      console.error('❌ Failed to get student college:', studentError);
      return;
    }
    
    console.log(`✅ Student college: ${studentData.college}`);
    
    // Trigger college score computation (same as endpoint)
    console.log('\n🎯 Triggering college score computation...');
    
    const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');
    const assessmentName = assignment.bulk_assessment.assessment_name;
    
    console.log(`Computing for: ${studentData.college}, ${assessmentType}, ${assessmentName}`);
    
    const result = await computeAndStoreCollegeScores(studentData.college, assessmentType, assessmentName);
    
    if (result.success) {
      console.log('✅ College score computation successful:', result.message);
    } else {
      console.error('❌ College score computation failed:', result.error);
    }
    
    // Verify everything worked
    console.log('\n🔍 Final verification...');
    
    // Check assessment record
    const { data: finalAssessment, error: finalError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', assessmentRecord.id)
      .single();
    
    if (finalError) {
      console.error('❌ Assessment record verification failed:', finalError);
    } else {
      console.log('✅ Assessment record verified:', {
        id: finalAssessment.id,
        student_id: finalAssessment.student_id,
        assignment_id: finalAssessment.assignment_id,
        has_scores: !!finalAssessment.scores,
        overall_score: finalAssessment.overall_score
      });
    }
    
    // Check assignment status
    const { data: finalAssignment, error: assignmentCheckError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('id', assignment.id)
      .single();
    
    if (assignmentCheckError) {
      console.error('❌ Assignment verification failed:', assignmentCheckError);
    } else {
      console.log('✅ Assignment verified:', {
        id: finalAssignment.id,
        status: finalAssignment.status,
        completed_at: finalAssignment.completed_at
      });
    }
    
    // Check college scores
    const { data: collegeScores, error: scoreError } = await supabaseAdmin
      .from('college_scores')
      .select('*')
      .eq('college_name', studentData.college)
      .eq('assessment_name', assessmentName)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (scoreError) {
      console.error('❌ College score verification failed:', scoreError);
    } else if (collegeScores && collegeScores.length > 0) {
      console.log('✅ College scores verified:', {
        college: collegeScores[0].college_name,
        assessment: collegeScores[0].assessment_name,
        created: collegeScores[0].created_at
      });
    } else {
      console.log('❌ No college scores found');
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugSubmissionFailure().then(() => {
  console.log('\n🏁 Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});