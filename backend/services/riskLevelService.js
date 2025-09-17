const { supabaseAdmin } = require('../config/database');
const { determineRiskLevel, getAtRiskDimensions } = require('../utils/ryffScoring');

class RiskLevelService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Calculate and update risk levels for all completed assessments missing risk_level
   */
  async updateMissingRiskLevels() {
    if (this.isRunning) {
      console.log('⚠️ Risk level calculation already in progress');
      return { success: false, message: 'Already running' };
    }

    this.isRunning = true;
    console.log('🔍 Starting risk level calculation for completed assessments...');

    try {
      // Get all completed assessments from both assessment tables
      const assessments = [];
      
      // Fetch from assessments_42items with retry logic
      const assessments42 = await this.fetchWithRetry(async () => {
        const { data, error } = await supabaseAdmin
          .from('assessments_42items')
          .select('id, scores, overall_score, assignment_id, student_id')
          .not('scores', 'is', null)
          .not('overall_score', 'is', null);

        if (error) {
          throw new Error(`Failed to fetch 42-item assessments: ${error.message}`);
        }
        return data;
      }, '42-item assessments');
      
      // Fetch from assessments_84items with retry logic
      const assessments84 = await this.fetchWithRetry(async () => {
        const { data, error } = await supabaseAdmin
          .from('assessments_84items')
          .select('id, scores, overall_score, assignment_id, student_id')
          .not('scores', 'is', null)
          .not('overall_score', 'is', null);

        if (error) {
          throw new Error(`Failed to fetch 84-item assessments: ${error.message}`);
        }
        return data;
      }, '84-item assessments');
      
      // Combine assessments with their types
      if (assessments42) {
        assessments42.forEach(assessment => {
          assessments.push({ ...assessment, assessment_type: 'ryff_42' });
        });
      }
      
      if (assessments84) {
        assessments84.forEach(assessment => {
          assessments.push({ ...assessment, assessment_type: 'ryff_84' });
        });
      }

      if (!assessments || assessments.length === 0) {
        console.log('✅ No assessments need risk level calculation');
        return { success: true, message: 'No assessments to update', updated: 0 };
      }

      console.log(`📊 Found ${assessments.length} assessments needing risk level calculation`);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process each assessment
      for (const assessment of assessments) {
        try {
          await this.calculateAndUpdateRiskLevel(assessment);
          successCount++;
        } catch (error) {
          console.error(`Failed to update risk level for assessment ${assessment.id}:`, error);
          errorCount++;
          errors.push({
            assessmentId: assessment.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Risk level calculation completed: ${successCount} successful, ${errorCount} failed`);
      
      if (errors.length > 0) {
        console.log('❌ Errors encountered:', errors);
      }

      return {
        success: true,
        message: 'Risk level calculation completed',
        updated: successCount,
        failed: errorCount,
        errors: errors
      };
    } catch (error) {
      console.error('Error in updateMissingRiskLevels:', error);
      
      // If it's a network/connection error, don't throw - just log and continue
      if (error.message.includes('fetch failed') || error.message.includes('network') || error.message.includes('ECONNRESET')) {
        console.warn('⚠️ Network connectivity issue detected. Risk level calculation will be retried later.');
        return { success: false, message: 'Network connectivity issue - will retry later', error: error.message };
      }
      
      return {
        success: false,
        message: error.message,
        updated: 0,
        failed: 0
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Fetch data with retry logic for network resilience
   */
  async fetchWithRetry(fetchFunction, description, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting to fetch ${description} (attempt ${attempt}/${maxRetries})`);
        const result = await fetchFunction();
        console.log(`✅ Successfully fetched ${description}`);
        return result;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed for ${description}:`, error.message);
        
        if (attempt === maxRetries) {
          console.error(`🚫 All ${maxRetries} attempts failed for ${description}`);
          throw error;
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  /**
   * Calculate and update risk level for a single assessment
   */
  async calculateAndUpdateRiskLevel(assessment) {
    try {
      const { id, scores, overall_score, assessment_type } = assessment;
      
      // Validate required data
      if (!scores || !overall_score) {
        throw new Error('Missing scores or overall_score');
      }

      // Determine assessment type (default to ryff_42 if not specified)
      const assessmentType = assessment_type || 'ryff_42';
      
      // Calculate risk level using existing utility
      const riskLevel = determineRiskLevel(scores, overall_score, assessmentType);
      
      // Get at-risk dimensions
      const atRiskDimensions = getAtRiskDimensions(scores, assessmentType);
      
      console.log(`📊 Assessment ${id}: Risk Level = ${riskLevel}, At-Risk Dimensions = ${atRiskDimensions.length}`);
      
      // Determine which table to update based on assessment type
      const tableName = assessment_type === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
      
      // Update the assessment with calculated risk level
      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update({
          risk_level: riskLevel,
          at_risk_dimensions: atRiskDimensions,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        // If columns don't exist, log a warning but don't fail
        if (updateError.message.includes('at_risk_dimensions') || updateError.message.includes('risk_level')) {
          console.warn(`⚠️ Risk level columns not found in ${tableName}. Please run database migration to add them.`);
          console.warn(`Assessment ${id}: Risk Level = ${riskLevel}, At-Risk Dimensions = ${atRiskDimensions.length}`);
          return; // Don't throw error, just skip the update
        } else {
          throw new Error(`Database update failed: ${updateError.message}`);
        }
      }

      console.log(`✅ Updated risk level for assessment ${id}: ${riskLevel}`);
     } catch (error) {
      console.error(`❌ Failed to calculate risk level for assessment ${assessment.id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate risk level for a specific assessment by ID
   */
  async calculateRiskLevelForAssessment(assessmentId) {
    try {
      // Try to get the assessment from both tables
      let assessment = null;
      let fetchError = null;
      
      // First try 42-item assessments
      const { data: assessment42, error: error42 } = await supabaseAdmin
        .from('assessments_42items')
        .select('id, scores, overall_score, assignment_id, student_id')
        .eq('id', assessmentId)
        .single();
        
      if (assessment42) {
        assessment = { ...assessment42, assessment_type: 'ryff_42' };
      } else {
        // Try 84-item assessments
        const { data: assessment84, error: error84 } = await supabaseAdmin
          .from('assessments_84items')
          .select('id, scores, overall_score, assignment_id, student_id')
          .eq('id', assessmentId)
          .single();
          
        if (assessment84) {
          assessment = { ...assessment84, assessment_type: 'ryff_84' };
        } else {
          fetchError = error84 || error42;
        }
      }

      if (fetchError || !assessment) {
        throw new Error(`Assessment not found: ${fetchError?.message || 'Not found'}`);
      }

      if (assessment.status !== 'completed') {
        throw new Error('Assessment is not completed');
      }

      await this.calculateAndUpdateRiskLevel(assessment);
      
      return {
        success: true,
        message: 'Risk level calculated successfully',
        assessmentId: assessmentId
      };
    } catch (error) {
      console.error(`Error calculating risk level for assessment ${assessmentId}:`, error);
      return {
        success: false,
        message: error.message,
        assessmentId: assessmentId
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning
    };
  }

  /**
   * Initialize the service (run initial calculation)
   */
  async initialize() {
    console.log('🎯 Initializing Risk Level Service...');
    
    try {
      const result = await this.updateMissingRiskLevels();
      console.log('✅ Risk Level Service initialized successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to initialize Risk Level Service:', error);
      throw error;
    }
  }
}

// Create singleton instance
const riskLevelService = new RiskLevelService();

module.exports = riskLevelService;