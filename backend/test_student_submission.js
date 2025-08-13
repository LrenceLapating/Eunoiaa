require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');
const { calculateRyffScores, determineRiskLevel } = require('./utils/ryffScoring');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStudentSubmission() {
  try {
    console.log('Testing student submission process for 84-item assessment...');
    
    // Get a real 84-item assignment that's marked as completed
    console.log('\nStep 1: Finding a completed 84-item assignment...');
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessments!inner(
          id,
          assessment_type
        )
      `)
      .eq('status', 'completed')
      .eq('bulk_assessments.assessment_type', 'ryff_84')
      .limit(1)
      .single();
    
    if (assignmentError || !assignment) {
      console.log('❌ No completed 84-item assignments found');
      console.log('Error:', assignmentError);
      return;
    }
    
    console.log('✅ Found completed assignment:');
    console.log(`  - Assignment ID: ${assignment.id}`);
    console.log(`  - Student ID: ${assignment.student_id}`);
    console.log(`  - Assessment Type: ${assignment.bulk_assessments.assessment_type}`);
    console.log(`  - Status: ${assignment.status}`);
    console.log(`  - Completed At: ${assignment.completed_at}`);
    console.log(`  - Bulk Assessment ID: ${assignment.bulk_assessment_id}`);
    
    // Check if there's already an assessment record for this assignment
    console.log('\nStep 2: Checking if assessment record exists...');
    const { data: existingAssessment, error: checkError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .eq('assignment_id', assignment.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('Error checking existing assessment:', checkError);
      return;
    }
    
    if (existingAssessment) {
      console.log('✅ Assessment record already exists:');
      console.log(`  - Assessment ID: ${existingAssessment.id}`);
      console.log(`  - Overall Score: ${existingAssessment.overall_score}`);
      console.log(`  - Risk Level: ${existingAssessment.risk_level}`);
      console.log(`  - Completed At: ${existingAssessment.completed_at}`);
      console.log('\n🎯 CONCLUSION: The assignment_id column works and data exists!');
      console.log('The issue might be in the API query logic, not the submission process.');
    } else {
      console.log('❌ No assessment record found for this completed assignment');
      console.log('This confirms the issue: assignments are marked complete but no assessment data is saved.');
      
      // Simulate what should happen during submission
      console.log('\nStep 3: Simulating submission process...');
      
      // Create dummy responses for 84 questions
      const responses = {};
      for (let i = 1; i <= 84; i++) {
        responses[i] = Math.floor(Math.random() * 6) + 1; // Random 1-6 rating
      }
      
      const assessmentType = 'ryff_84';
      const scores = calculateRyffScores(responses, assessmentType);
      const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const riskLevel = determineRiskLevel(scores, overallScore, assessmentType);
      
      console.log('Calculated scores:', scores);
      console.log('Overall score:', overallScore);
      console.log('Risk level:', riskLevel);
      
      // Try to insert the assessment record
      console.log('\nStep 4: Inserting assessment record...');
      const { data: assessmentRecord, error: insertError } = await supabaseAdmin
        .from('assessments_84items')
        .insert({
          student_id: assignment.student_id,
          assignment_id: assignment.id,
          assessment_type: assessmentType,
          responses: responses,
          scores: scores,
          overall_score: parseFloat(overallScore.toFixed(2)),
          risk_level: riskLevel,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Error inserting assessment record:', insertError);
      } else {
        console.log('✅ Assessment record created successfully!');
        console.log(`  - New Assessment ID: ${assessmentRecord.id}`);
        
        // Clean up - delete the test record
        console.log('\nCleaning up test record...');
        await supabaseAdmin
          .from('assessments_84items')
          .delete()
          .eq('id', assessmentRecord.id);
        console.log('Test record deleted.');
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testStudentSubmission();