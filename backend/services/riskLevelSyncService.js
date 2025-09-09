const { supabaseAdmin } = require('../config/database');

class RiskLevelSyncService {
  /**
   * Maps risk_level values from assessment tables to assessment_assignments format
   * @param {string} assessmentRiskLevel - Risk level from assessment table (low, moderate, high)
   * @returns {string} - Mapped risk level for assessment_assignments (healthy, moderate, at-risk)
   */
  mapRiskLevelForAssignments(assessmentRiskLevel) {
    const riskLevelMapping = {
      'low': 'healthy',
      'moderate': 'moderate',
      'high': 'at-risk'
    };
    
    return riskLevelMapping[assessmentRiskLevel] || assessmentRiskLevel;
  }

  /**
   * Syncs risk_level from assessment table to assessment_assignments
   * @param {string} assessmentId - ID of the assessment record
   * @param {string} tableName - Name of the assessment table (assessments_42items or assessments_84items)
   * @param {string} newRiskLevel - New risk level value
   * @returns {Promise<Object>} - Result of the sync operation
   */
  async syncRiskLevelToAssignments(assessmentId, tableName, newRiskLevel = null) {
    try {
      console.log(`🔄 Syncing risk_level from ${tableName} to assessment_assignments`);
      console.log(`   Assessment ID: ${assessmentId}`);
      
      // Get the assessment record with assignment_id and risk_level
      const { data: assessmentRecord, error: assessmentError } = await supabaseAdmin
        .from(tableName)
        .select('assignment_id, risk_level')
        .eq('id', assessmentId)
        .single();
      
      // Use provided newRiskLevel or fetch from assessment record
      const riskLevelToSync = newRiskLevel || assessmentRecord?.risk_level;
      console.log(`   Risk Level to sync: ${riskLevelToSync}`);
      
      if (assessmentError || !assessmentRecord) {
        throw new Error(`Assessment record not found: ${assessmentError?.message}`);
      }
      
      if (!assessmentRecord.assignment_id) {
        console.log(`   ⚠️  No assignment_id found for assessment ${assessmentId}`);
        return { success: false, message: 'No assignment_id found' };
      }
      
      if (!riskLevelToSync) {
        console.log(`   ⚠️  No risk_level found for assessment ${assessmentId}`);
        return { success: false, message: 'No risk_level found' };
      }
      
      // Map the risk level to the correct format for assessment_assignments
      const mappedRiskLevel = this.mapRiskLevelForAssignments(riskLevelToSync);
      console.log(`   📋 Mapping '${riskLevelToSync}' to '${mappedRiskLevel}'`);
      
      // Update the assessment_assignments record
      const { error: updateError } = await supabaseAdmin
        .from('assessment_assignments')
        .update({ 
          risk_level: mappedRiskLevel
        })
        .eq('id', assessmentRecord.assignment_id);
      
      if (updateError) {
        throw new Error(`Failed to update assessment_assignments: ${updateError.message}`);
      }
      
      console.log(`   ✅ Successfully synced risk_level to assessment_assignments`);
      console.log(`   📊 Assignment ${assessmentRecord.assignment_id}: ${riskLevelToSync} -> ${mappedRiskLevel}`);
      
      return {
        success: true,
        message: 'Risk level synced successfully',
        assignmentId: assessmentRecord.assignment_id,
        originalRiskLevel: riskLevelToSync,
        mappedRiskLevel: mappedRiskLevel
      };
      
    } catch (error) {
      console.error(`❌ Error syncing risk_level:`, error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Syncs risk_level for a 42-item assessment
   * @param {string} assessmentId - ID of the assessment record
   * @param {string} newRiskLevel - New risk level value
   * @returns {Promise<Object>} - Result of the sync operation
   */
  async sync42ItemRiskLevel(assessmentId, newRiskLevel) {
    return this.syncRiskLevelToAssignments(assessmentId, 'assessments_42items', newRiskLevel);
  }

  /**
   * Syncs risk_level for an 84-item assessment
   * @param {string} assessmentId - ID of the assessment record
   * @param {string} newRiskLevel - New risk level value
   * @returns {Promise<Object>} - Result of the sync operation
   */
  async sync84ItemRiskLevel(assessmentId, newRiskLevel) {
    return this.syncRiskLevelToAssignments(assessmentId, 'assessments_84items', newRiskLevel);
  }

  /**
   * Syncs all existing assessment records to ensure assessment_assignments has correct risk_levels
   * @returns {Promise<Object>} - Result of the bulk sync operation
   */
  async syncAllExistingAssessments() {
    console.log('🔄 Starting bulk sync of all existing assessments...');
    
    let totalSynced = 0;
    let totalErrors = 0;
    const errors = [];
    
    try {
      // Sync 42-item assessments
      console.log('\n📊 Syncing 42-item assessments...');
      const { data: assessments42, error: error42 } = await supabaseAdmin
        .from('assessments_42items')
        .select('id, risk_level, assignment_id')
        .not('risk_level', 'is', null)
        .not('assignment_id', 'is', null);
      
      if (error42) {
        console.error('Error fetching 42-item assessments:', error42);
      } else if (assessments42) {
        for (const assessment of assessments42) {
          const result = await this.sync42ItemRiskLevel(assessment.id, assessment.risk_level);
          if (result.success) {
            totalSynced++;
          } else {
            totalErrors++;
            errors.push({ assessmentId: assessment.id, error: result.message });
          }
        }
      }
      
      // Sync 84-item assessments
      console.log('\n📊 Syncing 84-item assessments...');
      const { data: assessments84, error: error84 } = await supabaseAdmin
        .from('assessments_84items')
        .select('id, risk_level, assignment_id')
        .not('risk_level', 'is', null)
        .not('assignment_id', 'is', null);
      
      if (error84) {
        console.error('Error fetching 84-item assessments:', error84);
      } else if (assessments84) {
        for (const assessment of assessments84) {
          const result = await this.sync84ItemRiskLevel(assessment.id, assessment.risk_level);
          if (result.success) {
            totalSynced++;
          } else {
            totalErrors++;
            errors.push({ assessmentId: assessment.id, error: result.message });
          }
        }
      }
      
      console.log(`\n✅ Bulk sync completed: ${totalSynced} synced, ${totalErrors} errors`);
      
      return {
        success: true,
        message: 'Bulk sync completed',
        totalSynced,
        totalErrors,
        errors
      };
      
    } catch (error) {
      console.error('❌ Error during bulk sync:', error);
      return {
        success: false,
        message: error.message,
        totalSynced,
        totalErrors,
        errors
      };
    }
  }

  /**
   * Verifies that assessment_assignments risk_levels match their corresponding assessments
   * @returns {Promise<Object>} - Verification results
   */
  async verifyRiskLevelSync() {
    console.log('🔍 Verifying risk_level synchronization...');
    
    try {
      // Check 42-item assessments
      const { data: mismatches42, error: error42 } = await supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id,
          risk_level as assignment_risk_level,
          assessments_42items!inner(
            id,
            risk_level as assessment_risk_level
          )
        `)
        .neq('risk_level', 'assessments_42items.risk_level');
      
      // Check 84-item assessments
      const { data: mismatches84, error: error84 } = await supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id,
          risk_level as assignment_risk_level,
          assessments_84items!inner(
            id,
            risk_level as assessment_risk_level
          )
        `)
        .neq('risk_level', 'assessments_84items.risk_level');
      
      const totalMismatches = (mismatches42?.length || 0) + (mismatches84?.length || 0);
      
      console.log(`📊 Verification Results:`);
      console.log(`   42-item mismatches: ${mismatches42?.length || 0}`);
      console.log(`   84-item mismatches: ${mismatches84?.length || 0}`);
      console.log(`   Total mismatches: ${totalMismatches}`);
      
      return {
        success: true,
        totalMismatches,
        mismatches42: mismatches42 || [],
        mismatches84: mismatches84 || [],
        isInSync: totalMismatches === 0
      };
      
    } catch (error) {
      console.error('❌ Error during verification:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Create singleton instance
const riskLevelSyncService = new RiskLevelSyncService();

module.exports = riskLevelSyncService;