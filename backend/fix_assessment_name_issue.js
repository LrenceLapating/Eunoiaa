require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixAssessmentNameIssue() {
  console.log('🔍 Analyzing assessment name issue in college_scores table...');
  
  try {
    // 1. Check current state of college_scores table
    console.log('\n📊 Current state of college_scores table:');
    const { data: currentScores, error: currentError } = await supabase
      .from('college_scores')
      .select('assessment_name');
    
    if (currentError) {
      console.error('Error fetching current scores:', currentError);
      return;
    }
    
    // Count assessment names manually
    const assessmentCounts = {};
    currentScores.forEach(score => {
      assessmentCounts[score.assessment_name] = (assessmentCounts[score.assessment_name] || 0) + 1;
    });
    
    console.log('Assessment name distribution:', assessmentCounts);
    
    // 2. Find all bulk assessments that should have college scores
    console.log('\n🔍 Finding bulk assessments with completed assignments...');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select(`
        id,
        assessment_name,
        assessment_type,
        status,
        created_at
      `)
      .in('status', ['sent', 'completed'])
      .order('created_at', { ascending: false });
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`Found ${bulkAssessments.length} bulk assessments with sent/completed status`);
    
    // 3. For each bulk assessment, check if it has proper college scores
    const assessmentsNeedingFix = [];
    
    for (const assessment of bulkAssessments) {
      // Check if there are completed assignments for this assessment
      const { data: assignments, error: assignError } = await supabase
        .from('assessment_assignments')
        .select('id')
        .eq('bulk_assessment_id', assessment.id)
        .eq('status', 'completed')
        .limit(1);
      
      if (assignError) {
        console.error(`Error checking assignments for ${assessment.assessment_name}:`, assignError);
        continue;
      }
      
      if (assignments && assignments.length > 0) {
        // Check if college scores exist with the correct assessment name
        const { data: existingScores, error: scoreError } = await supabase
          .from('college_scores')
          .select('id')
          .eq('assessment_name', assessment.assessment_name)
          .limit(1);
        
        if (scoreError) {
          console.error(`Error checking scores for ${assessment.assessment_name}:`, scoreError);
          continue;
        }
        
        if (!existingScores || existingScores.length === 0) {
          assessmentsNeedingFix.push(assessment);
          console.log(`❌ Missing college scores for: ${assessment.assessment_name}`);
        } else {
          console.log(`✅ College scores exist for: ${assessment.assessment_name}`);
        }
      }
    }
    
    console.log(`\n🔧 Found ${assessmentsNeedingFix.length} assessments needing college score computation`);
    
    // 4. Compute missing college scores with correct assessment names
    for (const assessment of assessmentsNeedingFix) {
      console.log(`\n⚙️ Computing college scores for: ${assessment.assessment_name}`);
      
      const result = await computeAndStoreCollegeScores(
        null, // college (null = all colleges)
        assessment.assessment_type,
        assessment.assessment_name // This is the key fix - passing the actual assessment name
      );
      
      if (result.success) {
        console.log(`✅ Successfully computed scores for ${assessment.assessment_name}:`);
        console.log(`   - Colleges processed: ${result.collegeCount}`);
        console.log(`   - Score records created: ${result.scoreCount}`);
      } else {
        console.error(`❌ Failed to compute scores for ${assessment.assessment_name}:`, result.error);
      }
    }
    
    // 5. Final verification - show updated state
    console.log('\n📊 Final state of college_scores table:');
    const { data: finalScores, error: finalError } = await supabase
      .from('college_scores')
      .select('assessment_name');
    
    if (finalError) {
      console.error('Error fetching final scores:', finalError);
      return;
    }
    
    // Count assessment names manually
    const finalAssessmentCounts = {};
    finalScores.forEach(score => {
      finalAssessmentCounts[score.assessment_name] = (finalAssessmentCounts[score.assessment_name] || 0) + 1;
    });
    
    console.log('Updated assessment name distribution:', finalAssessmentCounts);
    
    // 6. Identify any remaining "General Assessment" records that might be incorrect
    const { data: generalAssessments, error: generalError } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_name', 'General Assessment')
      .limit(5);
    
    if (generalError) {
      console.error('Error fetching general assessments:', generalError);
    } else if (generalAssessments && generalAssessments.length > 0) {
      console.log('\n⚠️ Remaining "General Assessment" records (sample):');
      generalAssessments.forEach(record => {
        console.log(`   - College: ${record.college_name}, Type: ${record.assessment_type}, Created: ${record.created_at}`);
      });
      console.log('\n💡 These might be legitimate "General Assessment" records or need manual review.');
    }
    
    console.log('\n✅ Assessment name issue analysis and fix completed!');
    
  } catch (error) {
    console.error('❌ Error in fix process:', error);
  }
}

// Run the fix
fixAssessmentNameIssue()
  .then(() => {
    console.log('\n🎉 Fix process completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fix process failed:', error);
    process.exit(1);
  });