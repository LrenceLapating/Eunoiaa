const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyStudentSession } = require('../middleware/sessionManager');

// GET /api/student-interventions - Get AI interventions for the current student
router.get('/', verifyStudentSession, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    console.log('Fetching AI interventions for student:', studentId);
    
    // Get AI interventions sent to this student from counselor_interventions table
    // Only show interventions that have been manually sent by counselors (status = 'sent')
    const { data: interventions, error } = await supabase
      .from('counselor_interventions')
      .select(`
        id,
        intervention_title,
        intervention_text,
        risk_level,
        created_at,
        is_read,
        read_at,
        counselor_id,
        counselor_message,
        overall_strategy,
        dimension_interventions,
        action_plan
      `)
      .eq('student_id', studentId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching AI interventions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch AI interventions'
      });
    }

    // Transform interventions to ensure proper structure
    const transformedInterventions = interventions.map(intervention => {
      // Check if we have meaningful structured data in separate columns (new format)
      const hasOverallStrategy = intervention.overall_strategy && intervention.overall_strategy.trim().length > 0;
      const hasDimensionInterventions = intervention.dimension_interventions && 
        typeof intervention.dimension_interventions === 'object' && 
        Object.keys(intervention.dimension_interventions).length > 0;
      const hasActionPlan = intervention.action_plan && 
        Array.isArray(intervention.action_plan) && 
        intervention.action_plan.length > 0;
      
      if (hasOverallStrategy || hasDimensionInterventions || hasActionPlan) {
        // Use structured data from database columns
        return {
          ...intervention,
          overall_strategy: intervention.overall_strategy || 'No intervention strategy available.',
          dimension_interventions: intervention.dimension_interventions || {},
          action_plan: intervention.action_plan || []
        };
      } else {
        // Fallback: try to parse intervention_text as JSON (legacy format)
        try {
          const parsedIntervention = JSON.parse(intervention.intervention_text);
          return {
            ...intervention,
            overall_strategy: parsedIntervention.overallStrategy || 'No intervention strategy available.',
            dimension_interventions: parsedIntervention.dimensionInterventions || {},
            action_plan: parsedIntervention.actionPlan || []
          };
        } catch (error) {
          // If parsing fails, treat as legacy plain text format and parse it
          console.log('Intervention is in legacy text format, parsing structured sections');
          
          const text = intervention.intervention_text || '';
          
          // Extract overall strategy (everything before "Dimension Scores & Targeted Interventions:")
          const strategyMatch = text.match(/Overall Mental Health Strategy:\s*([\s\S]*?)(?=\n\n|Dimension Scores|$)/i);
          const overallStrategy = strategyMatch ? strategyMatch[1].trim() : 'No intervention strategy available.';
          
          // Extract dimension interventions
          const dimensionInterventions = {};
          const dimensionPattern = /(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*\([^)]+\):\s*([^\n]+)/gi;
          let match;
          while ((match = dimensionPattern.exec(text)) !== null) {
            const dimensionName = match[1].toLowerCase().replace(/\s+/g, '_');
            dimensionInterventions[dimensionName] = match[2].trim();
          }
          
          // Create action plan from dimension interventions if available
          const actionPlan = Object.values(dimensionInterventions).length > 0 
            ? Object.values(dimensionInterventions)
            : [
                'Schedule a follow-up consultation with your counselor',
                'Review the provided intervention guidance',
                'Implement suggested strategies gradually',
                'Monitor your progress and adjust as needed'
              ];
          
          return {
            ...intervention,
            overall_strategy: overallStrategy,
            dimension_interventions: dimensionInterventions,
            action_plan: actionPlan
          };
        }
      }
    });

    // Try to get assessment scores for this student from the correct table
    const { data: assessmentData } = await supabase
      .from('assessments_42items')
      .select('scores, overall_score, risk_level')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1);

    const dimensionScores = assessmentData && assessmentData[0] ? assessmentData[0].scores : null;

    // Add dimension scores to each transformed intervention
    const interventionsWithScores = transformedInterventions.map(intervention => ({
      ...intervention,
      dimension_scores: dimensionScores
    }));
    
    console.log(`Found ${interventionsWithScores.length} interventions for student ${studentId}`);
    
    res.json({
      success: true,
      data: interventionsWithScores
    });
    
  } catch (error) {
    console.error('Error in student interventions route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/student-interventions/:id/read - Mark an intervention as read
router.put('/:id/read', verifyStudentSession, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    
    console.log(`Marking intervention ${id} as read for student ${studentId}`);
    
    // First verify that this intervention belongs to the current student and has been sent
    const { data: intervention, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('id, student_id')
      .eq('id', id)
      .eq('student_id', studentId)
      .eq('status', 'sent')
      .single();
    
    if (fetchError || !intervention) {
      return res.status(404).json({
        success: false,
        error: 'Intervention not found or access denied'
      });
    }
    
    // Update the intervention as read
    const { error: updateError } = await supabase
      .from('counselor_interventions')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('student_id', studentId);
    
    if (updateError) {
      console.error('Error marking intervention as read:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to mark intervention as read'
      });
    }
    
    console.log(`Successfully marked intervention ${id} as read`);
    
    res.json({
      success: true,
      message: 'Intervention marked as read'
    });
    
  } catch (error) {
    console.error('Error in mark as read route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;