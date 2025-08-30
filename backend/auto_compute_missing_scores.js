// Auto-compute missing college scores for assessments that have completed assignments
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function autoComputeMissingScores() {
  console.log('🔍 Checking for assessments with missing college scores...');
  
  try {
    // Get all bulk assessments that are completed/sent
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .in('status', ['sent', 'completed']);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`Found ${bulkAssessments.length} bulk assessments to check`);
    
    for (const assessment of bulkAssessments) {
      console.log(`\n📋 Checking: ${assessment.assessment_name} (${assessment.assessment_type})`);
      
      // Check if college scores already exist for this assessment
      const { data: existingScores, error: scoresError } = await supabase
        .from('college_scores')
        .select('id')
        .eq('assessment_name', assessment.assessment_name)
        .eq('assessment_type', assessment.assessment_type)
        .limit(1);
      
      if (scoresError) {
        console.error('Error checking existing scores:', scoresError);
        continue;
      }
      
      if (existingScores && existingScores.length > 0) {
        console.log('✅ College scores already exist, skipping...');
        continue;
      }
      
      // Check if there are completed assignments for this assessment
      const { data: completedAssignments, error: assignError } = await supabase
        .from('assessment_assignments')
        .select('id')
        .eq('bulk_assessment_id', assessment.id)
        .eq('status', 'completed')
        .limit(1);
      
      if (assignError) {
        console.error('Error checking completed assignments:', assignError);
        continue;
      }
      
      if (!completedAssignments || completedAssignments.length === 0) {
        console.log('⏳ No completed assignments yet, skipping...');
        continue;
      }
      
      // Compute college scores for this assessment
      console.log('🔄 Computing missing college scores...');
      const result = await computeAndStoreCollegeScores(
        null, // all colleges
        assessment.assessment_type,
        assessment.assessment_name
      );
      
      if (result.success) {
        console.log(`✅ Successfully computed scores: ${result.collegeCount} colleges, ${result.scoreCount} records`);
      } else {
        console.error(`❌ Failed to compute scores: ${result.error}`);
      }
    }
    
    console.log('\n🎉 Auto-computation completed!');
    
  } catch (error) {
    console.error('❌ Error in auto-computation:', error);
  }
}

// Run if called directly
if (require.main === module) {
  autoComputeMissingScores().catch(console.error);
}

module.exports = { autoComputeMissingScores };