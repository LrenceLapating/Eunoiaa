require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');
const { calculateRyffScores, determineRiskLevel } = require('./utils/ryffScoring');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simulate the EXACT submission process from studentAssessments.js
async function simulateRealSubmission() {
  try {
    console.log('🎯 Simulating EXACT submission process from studentAssessments.js...');
    
    // Get a completed 84-item assignment
    const { data: completed84Assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        status,
        completed_at,
        bulk_assessments!inner(
          assessment_type,
          assessment_name
        )
      `)
      .eq('status', 'completed')
      .eq('bulk_assessments.assessment_type', 'ryff_84')
      .limit(1);
    
    if (assignmentError || !completed84Assignments?.length) {
      console.error('❌ No completed 84-item assignments found:', assignmentError?.message);
      return;
    }
    
    const assignment = completed84Assignments[0];
    console.log('\n📋 Using assignment:', {
      id: assignment.id,
      student_id: assignment.student_id,
      bulk_assessment_id: assignment.bulk_assessment_id,
      assessment_type: assignment.bulk_assessments.assessment_type,
      assessment_name: assignment.bulk_assessments.assessment_name
    });
    
    // Simulate request data (exactly as it would come from frontend)
    const studentId = assignment.student_id;
    const assignmentId = assignment.id;
    const assessmentType = 'ryff_84';
    
    // Generate 84 responses
    const responses = {};
    for (let i = 1; i <= 84; i++) {
      responses[i] = Math.floor(Math.random() * 6) + 1;
    }
    
    console.log('\n🔄 Starting submission simulation...');
    console.log('Request parameters:', {
      studentId,
      assignmentId,
      assessmentType,
      responseCount: Object.keys(responses).length
    });
    
    // EXACT LOGIC FROM studentAssessments.js submit endpoint
    
    // Validate assignment exists and belongs to student
    console.log('\n1. Validating assignment...');
    const { data: assignmentData, error: fetchError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        status,
        bulk_assessments (
          assessment_type
        )
      `)
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .single();
    
    if (fetchError) {
      console.error('❌ Assignment validation failed:', fetchError.message);
      return;
    }
    
    if (assignmentData.status === 'completed') {
      console.log('⚠️ Assignment already completed, but continuing simulation...');
    }
    
    console.log('✅ Assignment validation passed');
    
    // Validate response count
    console.log('\n2. Validating response count...');
    const expectedCount = assessmentType === 'ryff_84' ? 84 : 42;
    const responseCount = Object.keys(responses).length;
    
    if (responseCount !== expectedCount) {
      console.error(`❌ Expected ${expectedCount} responses, but received ${responseCount}`);
      return;
    }
    
    console.log('✅ Response count validation passed');
    
    // Calculate scores
    console.log('\n3. Calculating scores...');
    const scores = calculateRyffScores(responses, assessmentType);
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const riskLevel = determineRiskLevel(scores, overallScore, assessmentType);
    
    console.log('Calculated scores:', {
      scores: Object.keys(scores).map(key => `${key}: ${scores[key]}`),
      overallScore,
      riskLevel
    });
    
    // Determine table name
    console.log('\n4. Determining table name...');
    let tableName = 'assessments_42items';
    if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    console.log('Table name:', tableName);
    
    // Create assessment record (EXACT LOGIC)
    console.log('\n5. Creating assessment record...');
    const insertData = {
      student_id: studentId,
      assignment_id: assignmentId,
      assessment_type: assessmentType,
      responses: responses,
      scores: scores,
      overall_score: parseFloat(overallScore.toFixed(2)),
      risk_level: riskLevel,
      completed_at: new Date().toISOString()
    };
    
    console.log('Insert data structure:', {
      student_id: insertData.student_id,
      assignment_id: insertData.assignment_id,
      assessment_type: insertData.assessment_type,
      responses: `Object with ${Object.keys(insertData.responses).length} keys`,
      scores: `Object with ${Object.keys(insertData.scores).length} keys`,
      overall_score: insertData.overall_score,
      risk_level: insertData.risk_level,
      completed_at: insertData.completed_at
    });
    
    const { data: assessmentRecord, error: assessmentInsertError } = await supabaseAdmin
      .from(tableName)
      .insert(insertData)
      .select()
      .single();
    
    if (assessmentInsertError) {
      console.error('❌ Assessment insertion error:', assessmentInsertError);
      console.error('Error details:', {
        message: assessmentInsertError.message,
        details: assessmentInsertError.details,
        hint: assessmentInsertError.hint,
        code: assessmentInsertError.code
      });
      return;
    }
    
    console.log('✅ Assessment record created successfully!');
    console.log('Record ID:', assessmentRecord.id);
    
    // Update assignment status
    console.log('\n6. Updating assignment status...');
    const { error: updateError } = await supabaseAdmin
      .from('assessment_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId);
    
    if (updateError) {
      console.error('❌ Assignment update error:', updateError.message);
    } else {
      console.log('✅ Assignment status updated successfully');
    }
    
    // Verify the record exists
    console.log('\n7. Verifying record exists...');
    const { data: verifyRecord, error: verifyError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', assessmentRecord.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
    } else {
      console.log('✅ Record verified in database');
      console.log('Verified record:', {
        id: verifyRecord.id,
        student_id: verifyRecord.student_id,
        assignment_id: verifyRecord.assignment_id,
        assessment_type: verifyRecord.assessment_type,
        overall_score: verifyRecord.overall_score,
        risk_level: verifyRecord.risk_level,
        created_at: verifyRecord.created_at,
        completed_at: verifyRecord.completed_at
      });
    }
    
    // Check if record persists after a delay
    console.log('\n8. Checking record persistence...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const { data: persistCheck, error: persistError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', assessmentRecord.id)
      .single();
    
    if (persistError) {
      console.error('❌ Record disappeared after 2 seconds:', persistError.message);
    } else {
      console.log('✅ Record still exists after 2 seconds');
      
      // Clean up
      console.log('\n🧹 Cleaning up test record...');
      const { error: deleteError } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('id', assessmentRecord.id);
      
      if (deleteError) {
        console.error('❌ Cleanup error:', deleteError.message);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('\n🎉 Simulation completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

simulateRealSubmission();