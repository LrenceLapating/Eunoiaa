require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');
const { calculateRyffScores, determineRiskLevel } = require('./utils/ryffScoring');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simulate the exact submission process for 84-item assessments
async function simulateSubmission() {
  try {
    console.log('🎯 Simulating 84-item assessment submission process...');
    
    // Get 84-item bulk assessments first
    const { data: bulk84, error: bulk84Error } = await supabase
      .from('bulk_assessments')
      .select('id')
      .eq('assessment_type', 'ryff_84');
    
    if (bulk84Error || !bulk84?.length) {
      console.error('❌ No 84-item bulk assessments found:', bulk84Error?.message);
      return;
    }
    
    const bulk84Ids = bulk84.map(b => b.id);
    
    // Get a completed assignment for 84-item assessments
    const { data: completedAssignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'completed')
      .in('bulk_assessment_id', bulk84Ids)
      .limit(1);
    
    if (assignmentError || !completedAssignments?.length) {
      console.error('❌ No completed assignments found:', assignmentError?.message);
      return;
    }
    
    const assignment = completedAssignments[0];
    console.log('\n📋 Using assignment:', {
      id: assignment.id,
      student_id: assignment.student_id,
      bulk_assessment_id: assignment.bulk_assessment_id,
      status: assignment.status,
      completed_at: assignment.completed_at
    });
    
    // Check if this assignment is for a 84-item assessment
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('id', assignment.bulk_assessment_id)
      .single();
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessment:', bulkError.message);
      return;
    }
    
    console.log('\n📊 Bulk assessment details:', {
      id: bulkAssessment.id,
      assessment_type: bulkAssessment.assessment_type,
      assessment_name: bulkAssessment.assessment_name
    });
    
    if (bulkAssessment.assessment_type !== 'ryff_84') {
      console.log('⚠️ This is not a 84-item assessment, skipping...');
      return;
    }
    
    // Simulate the submission data (84 responses)
    console.log('\n🔄 Simulating submission process...');
    const responses = {};
    for (let i = 1; i <= 84; i++) {
      responses[i] = Math.floor(Math.random() * 6) + 1; // Random 1-6 response
    }
    
    const assessmentType = 'ryff_84';
    const studentId = assignment.student_id;
    const assignmentId = assignment.id;
    
    console.log('Parameters:', {
      assessmentType,
      studentId,
      assignmentId,
      responseCount: Object.keys(responses).length
    });
    
    // Calculate scores (same as submission logic)
    const scores = calculateRyffScores(responses, assessmentType);
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const riskLevel = determineRiskLevel(scores, overallScore, assessmentType);
    
    console.log('\n📊 Calculated scores:', {
      scores: Object.keys(scores).map(key => `${key}: ${scores[key]}`),
      overallScore,
      riskLevel
    });
    
    // Determine table name (same logic as submission)
    let tableName = 'assessments_42items';
    if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    console.log('\n💾 Inserting into table:', tableName);
    
    // Create assessment record (same as submission logic)
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
      responses: 'Object with ' + Object.keys(insertData.responses).length + ' keys',
      scores: 'Object with ' + Object.keys(insertData.scores).length + ' keys',
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
    } else {
      console.log('\n✅ Assessment record created successfully!');
      console.log('Record ID:', assessmentRecord.id);
      
      // Verify the record was inserted
      const { data: verifyRecord, error: verifyError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', assessmentRecord.id)
        .single();
      
      if (verifyError) {
        console.error('❌ Verification error:', verifyError.message);
      } else {
        console.log('✅ Record verified in database');
        
        // Clean up the test record
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
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

simulateSubmission();