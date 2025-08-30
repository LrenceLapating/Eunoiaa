require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_ASSESSMENT = '2025-2026 2nd Semester - 1st Test 42';

async function restoreMissingAssessment() {
  console.log(`🔍 Investigating missing college scores for: "${TARGET_ASSESSMENT}"...`);
  
  try {
    // 1. Check if bulk assessment exists
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_name', TARGET_ASSESSMENT)
      .single();
    
    if (bulkError) {
      console.error('❌ Error finding bulk assessment:', bulkError);
      return;
    }
    
    if (!bulkAssessment) {
      console.log('❌ No bulk assessment found for this name.');
      return;
    }
    
    console.log('✅ Found bulk assessment:');
    console.log(`   - ID: ${bulkAssessment.id}`);
    console.log(`   - Status: ${bulkAssessment.status}`);
    console.log(`   - Assessment Type: ${bulkAssessment.assessment_type}`);
    console.log(`   - Target Colleges: ${JSON.stringify(bulkAssessment.target_colleges)}`);
    console.log(`   - Created: ${bulkAssessment.created_at}`);
    
    // 2. Check for completed assignments
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', bulkAssessment.id);
    
    if (assignError) {
      console.error('❌ Error checking assignments:', assignError);
      return;
    }
    
    console.log(`\n📋 Found ${assignments.length} assignments:`);
    const completedAssignments = assignments.filter(a => a.status === 'completed');
    console.log(`   - Completed: ${completedAssignments.length}`);
    console.log(`   - Other statuses: ${assignments.length - completedAssignments.length}`);
    
    if (completedAssignments.length === 0) {
      console.log('❌ No completed assignments found. Cannot generate college scores.');
      return;
    }
    
    // 3. Check current college scores
    const { data: existingScores, error: scoresError } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_name', TARGET_ASSESSMENT);
    
    if (scoresError) {
      console.error('❌ Error checking existing scores:', scoresError);
      return;
    }
    
    console.log(`\n📊 Current college scores: ${existingScores.length} records`);
    
    if (existingScores.length > 0) {
      console.log('✅ College scores already exist for this assessment.');
      existingScores.forEach(score => {
        console.log(`   - ${score.college}: ${score.student_count} students`);
      });
      return;
    }
    
    // 4. Regenerate college scores
    console.log('\n🔄 Regenerating college scores...');
    
    // Get the colleges that should have scores
    const targetColleges = bulkAssessment.target_colleges;
    
    for (const college of targetColleges) {
      console.log(`\n📊 Computing scores for ${college}...`);
      
      try {
        await computeAndStoreCollegeScores(
          college,
          bulkAssessment.assessment_type,
          TARGET_ASSESSMENT
        );
        console.log(`✅ Successfully computed scores for ${college}`);
      } catch (error) {
        console.error(`❌ Error computing scores for ${college}:`, error);
      }
    }
    
    // 5. Verify the restoration
    console.log('\n🔍 Verifying restoration...');
    const { data: newScores, error: verifyError } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_name', TARGET_ASSESSMENT);
    
    if (verifyError) {
      console.error('❌ Error verifying restoration:', verifyError);
      return;
    }
    
    console.log(`\n✅ Restoration complete! Generated ${newScores.length} college score records:`);
    newScores.forEach(score => {
      console.log(`   - ${score.college}: ${score.student_count} students`);
    });
    
  } catch (error) {
    console.error('❌ Error in restoration process:', error);
  }
}

// Run the restoration
restoreMissingAssessment()
  .then(() => {
    console.log('\n🎉 Restoration process finished!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Restoration process failed:', error);
    process.exit(1);
  });