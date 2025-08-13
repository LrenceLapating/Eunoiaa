// Load environment variables
require('dotenv').config();

const { supabase } = require('../config/database');
const { calculateRyffScores, determineRiskLevel } = require('../utils/ryffScoring');

/**
 * Script to recalculate assessment scores from raw responses
 * This fixes the issue where existing assessments have averaged scores instead of raw totals
 */
async function recalculateAssessmentScores() {
  try {
    console.log('Starting assessment score recalculation...');
    
    // Get all assessments with their responses
    const { data: assessments, error: fetchError } = await supabase
      .from('assessments')
      .select('id, assessment_type, responses, scores, overall_score')
      .order('id');
    
    if (fetchError) {
      console.error('Error fetching assessments:', fetchError);
      return;
    }
    
    console.log(`Found ${assessments.length} assessments to recalculate`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const assessment of assessments) {
      try {
        const { id, assessment_type, responses } = assessment;
        
        if (!responses || typeof responses !== 'object') {
          console.warn(`Assessment ${id}: No valid responses found, skipping`);
          continue;
        }
        
        // Recalculate scores using current logic
        const newScores = calculateRyffScores(responses, assessment_type);
        const newOverallScore = Object.values(newScores).reduce((sum, score) => sum + score, 0);
        const newRiskLevel = determineRiskLevel(newScores, newOverallScore, assessment_type);
        
        // Check if scores actually changed
        const oldOverallScore = assessment.overall_score;
        const scoresChanged = Math.abs(newOverallScore - oldOverallScore) > 0.01;
        
        if (scoresChanged) {
          // Update the assessment with new scores
          const { error: updateError } = await supabase
            .from('assessments')
            .update({
              scores: newScores,
              overall_score: parseFloat(newOverallScore.toFixed(2)),
              risk_level: newRiskLevel
            })
            .eq('id', id);
          
          if (updateError) {
            console.error(`Error updating assessment ${id}:`, updateError);
            errorCount++;
          } else {
            console.log(`Updated assessment ${id}: ${oldOverallScore} -> ${newOverallScore}`);
            updatedCount++;
          }
        } else {
          console.log(`Assessment ${id}: No changes needed`);
        }
        
      } catch (error) {
        console.error(`Error processing assessment ${assessment.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n=== Recalculation Summary ===');
    console.log(`Total assessments processed: ${assessments.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`No changes needed: ${assessments.length - updatedCount - errorCount}`);
    
  } catch (error) {
    console.error('Fatal error during recalculation:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  recalculateAssessmentScores()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { recalculateAssessmentScores };