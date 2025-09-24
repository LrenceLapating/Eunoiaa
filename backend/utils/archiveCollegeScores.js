const { supabaseAdmin } = require('../config/database');

/**
 * Archive all college scores from college_scores to college_scores_history
 * This function should be called during student deactivation to preserve historical data
 * @returns {Object} Result object with success status and details
 */
async function archiveCollegeScores() {
  try {
    console.log('🗄️ Starting college scores archiving process...');
    
    // First, get all current college scores
    const { data: currentScores, error: fetchError } = await supabaseAdmin
      .from('college_scores')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching current college scores:', fetchError);
      throw fetchError;
    }
    
    if (!currentScores || currentScores.length === 0) {
      console.log('ℹ️ No college scores to archive');
      return {
        success: true,
        archived_count: 0,
        message: 'No college scores to archive'
      };
    }
    
    console.log(`📊 Found ${currentScores.length} college score records to archive`);
    
    // Prepare data for history table
    const historyData = currentScores.map(score => ({
      college_name: score.college_name,
      dimension_name: score.dimension_name,
      raw_score: score.raw_score,
      student_count: score.student_count,
      risk_level: score.risk_level,
      assessment_type: score.assessment_type,
      assessment_name: score.assessment_name,
      last_calculated: score.last_calculated,
      available_year_levels: score.available_year_levels,
      available_sections: score.available_sections,
      risk_distribution: score.risk_distribution, // Include risk distribution data
      student_id: null, // college scores don't have individual student_id
      archived_at: new Date().toISOString(),
      archived_from_id: score.id,
      archive_reason: 'student_deactivation'
    }));
    
    // Insert into history table
    const { data: insertedHistory, error: insertError } = await supabaseAdmin
      .from('college_scores_history')
      .insert(historyData)
      .select();
    
    if (insertError) {
      console.error('Error inserting into college_scores_history:', insertError);
      throw insertError;
    }
    
    console.log(`✅ Successfully archived ${insertedHistory.length} college score records`);
    
    // Clear the college_scores table
    const { error: deleteError } = await supabaseAdmin
      .from('college_scores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('Error clearing college_scores table:', deleteError);
      throw deleteError;
    }
    
    console.log('🗑️ Successfully cleared college_scores table');
    
    return {
      success: true,
      archived_count: insertedHistory.length,
      message: `Successfully archived ${insertedHistory.length} college score records`
    };
    
  } catch (error) {
    console.error('Error in archiveCollegeScores:', error);
    return {
      success: false,
      error: error.message,
      archived_count: 0,
      message: `Failed to archive college scores: ${error.message}`
    };
  }
}

module.exports = {
  archiveCollegeScores
};