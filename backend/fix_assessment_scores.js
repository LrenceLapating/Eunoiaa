// Fix the college scores for the specific assessment
require('dotenv').config();
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

const ASSESSMENT_NAME = '2025-2026 2nd Semester - 1st Test 42';
const ASSESSMENT_TYPE = 'ryff_42';

async function fixAssessmentScores() {
  console.log('🔧 Fixing college scores for assessment:', ASSESSMENT_NAME);
  console.log('📊 Assessment type:', ASSESSMENT_TYPE);
  
  try {
    // Compute and store college scores for this specific assessment
    console.log('\n⚙️ Computing college scores...');
    const result = await computeAndStoreCollegeScores(null, ASSESSMENT_TYPE, ASSESSMENT_NAME);
    
    if (result.success) {
      console.log('✅ College scores computed successfully!');
      console.log('📈 Result:', {
        message: result.message,
        collegeCount: result.collegeCount,
        scoreCount: result.scoreCount
      });
      
      // Verify the scores were created
      console.log('\n🔍 Verifying created scores...');
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      const { data: verifyScores, error: verifyError } = await supabase
        .from('college_scores')
        .select('*')
        .eq('assessment_name', ASSESSMENT_NAME)
        .eq('assessment_type', ASSESSMENT_TYPE);
      
      if (verifyError) {
        console.error('❌ Error verifying scores:', verifyError);
      } else {
        console.log(`✅ Verification: Found ${verifyScores.length} college score records`);
        
        // Group by college
        const collegeGroups = verifyScores.reduce((acc, score) => {
          if (!acc[score.college_name]) acc[score.college_name] = [];
          acc[score.college_name].push(score);
          return acc;
        }, {});
        
        console.log('\n📊 Scores by college:');
        Object.entries(collegeGroups).forEach(([college, scores]) => {
          console.log(`- ${college}: ${scores.length} dimensions`);
          scores.forEach(score => {
            console.log(`  • ${score.dimension_name}: ${score.raw_score} (${score.risk_level}) - ${score.student_count} students`);
          });
        });
      }
      
    } else {
      console.error('❌ Failed to compute college scores:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAssessmentScores().catch(console.error);