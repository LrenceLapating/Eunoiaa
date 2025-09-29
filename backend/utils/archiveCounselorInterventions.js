require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Archive all counselor interventions to counselor_intervention_history
 * This function moves all active counselor interventions to the history table
 * and marks them as 'deactivated' during student deactivation process
 */
async function archiveCounselorInterventions() {
  try {
    console.log('🗄️ Starting counselor interventions archiving...');
    
    // Get all active counselor interventions
    const { data: interventions, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching counselor interventions:', fetchError);
      return {
        success: false,
        error: fetchError.message,
        archivedCount: 0
      };
    }
    
    if (!interventions || interventions.length === 0) {
      console.log('ℹ️ No counselor interventions to archive');
      return {
        success: true,
        message: 'No counselor interventions to archive',
        archivedCount: 0
      };
    }
    
    console.log(`📊 Found ${interventions.length} counselor interventions to archive`);
    
    // Prepare interventions for history table
    const historyRecords = interventions.map(intervention => ({
      original_intervention_id: intervention.id,
      student_id: intervention.student_id,
      assessment_id: intervention.assessment_id,
      counselor_id: intervention.counselor_id,
      risk_level: intervention.risk_level,
      intervention_title: intervention.intervention_title,
      intervention_text: intervention.intervention_text,
      counselor_message: intervention.counselor_message,
      is_read: intervention.is_read,
      read_at: intervention.read_at,
      overall_strategy: intervention.overall_strategy,
      dimension_interventions: intervention.dimension_interventions,
      action_plan: intervention.action_plan,
      status: 'deactivated', // Mark as deactivated
      assessment_type: intervention.assessment_type || 'unknown',
      overall_score: intervention.overall_score,
      dimension_scores: intervention.dimension_scores || {},
      original_created_at: intervention.created_at,
      original_updated_at: intervention.updated_at,
      deactivated_at: new Date().toISOString(),
      deactivated_by: intervention.counselor_id // Track who deactivated it
    }));
    
    // Insert into history table
    const { data: insertData, error: insertError } = await supabase
      .from('counselor_intervention_history')
      .insert(historyRecords);
    
    if (insertError) {
      console.error('❌ Error inserting into counselor_intervention_history:', insertError);
      return {
        success: false,
        error: insertError.message,
        archivedCount: 0
      };
    }
    
    // Delete from original table
    const { error: deleteError } = await supabase
      .from('counselor_interventions')
      .delete()
      .in('id', interventions.map(i => i.id));
    
    if (deleteError) {
      console.error('❌ Error deleting from counselor_interventions:', deleteError);
      // Even if delete fails, we've archived the data
      return {
        success: false,
        error: `Archived successfully but failed to delete: ${deleteError.message}`,
        archivedCount: interventions.length
      };
    }
    
    console.log(`✅ Successfully archived ${interventions.length} counselor interventions`);
    
    return {
      success: true,
      message: `Successfully archived ${interventions.length} counselor interventions`,
      archivedCount: interventions.length,
      details: {
        interventions_archived: interventions.length,
        archived_at: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Unexpected error in archiveCounselorInterventions:', error);
    return {
      success: false,
      error: error.message,
      archivedCount: 0
    };
  }
}

module.exports = {
  archiveCounselorInterventions
};