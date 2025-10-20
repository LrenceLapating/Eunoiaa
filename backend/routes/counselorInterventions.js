const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Helper function to generate dynamic action plan based on dimension scores and risk levels
function generateDynamicActionPlan(dimensionScores, dimensionInterventions) {
  const actionPlan = [];
  
  // Define dimension mappings
  const dimensionMap = {
    'autonomy': 'Autonomy',
    'personal_growth': 'Personal Growth', 
    'purpose_in_life': 'Purpose in Life',
    'self_acceptance': 'Self Acceptance',
    'positive_relations': 'Positive Relations',
    'environmental_mastery': 'Environmental Mastery'
  };
  
  // Process each dimension based on its score
  Object.entries(dimensionScores).forEach(([dimension, score]) => {
    const dimensionName = dimensionMap[dimension] || dimension;
    
    // Determine risk level based on score (assuming 42 is max score)
    let riskLevel;
    if (score <= 14) riskLevel = 'At Risk';
    else if (score <= 28) riskLevel = 'Moderate';
    else riskLevel = 'Healthy';
    
    if (riskLevel === 'At Risk' || riskLevel === 'Moderate') {
      // Generate specific improvement actions for at-risk/moderate dimensions
      switch (dimension) {
        case 'autonomy':
          actionPlan.push(`For the ${dimensionName}: You need to practice making independent decisions (Example: choose your own study schedule and stick to it for one week).`);
          break;
        case 'personal_growth':
          actionPlan.push(`For the ${dimensionName}: You need to challenge yourself with new learning opportunities (Example: enroll in an online course or workshop related to your interests).`);
          break;
        case 'purpose_in_life':
          actionPlan.push(`For the ${dimensionName}: You need to identify meaningful goals that align with your values (Example: volunteer for a cause you care about for 2 hours per week).`);
          break;
        case 'self_acceptance':
          actionPlan.push(`For the ${dimensionName}: You need to practice self-compassion and positive self-talk (Example: write down 3 things you appreciate about yourself each morning).`);
          break;
        case 'positive_relations':
          actionPlan.push(`For the ${dimensionName}: Reach out to a friend or family member at least once a week (Example: have dinner together or call them for a meaningful conversation).`);
          break;
        case 'environmental_mastery':
          actionPlan.push(`For the ${dimensionName}: You need to develop better organizational and time management skills (Example: create a weekly planner and review it every Sunday).`);
          break;
      }
    } else if (riskLevel === 'Healthy') {
      // Generate positive reinforcement actions for healthy dimensions
      switch (dimension) {
        case 'autonomy':
          actionPlan.push(`For the ${dimensionName}: You're doing well! Keep it up by continuing to make confident decisions (Example: take on a leadership role in a group project).`);
          break;
        case 'personal_growth':
          actionPlan.push(`For the ${dimensionName}: You're doing well! Keep it up by continuing to seek new challenges (Example: mentor someone or share your knowledge with others).`);
          break;
        case 'purpose_in_life':
          actionPlan.push(`For the ${dimensionName}: You're doing well! Keep it up by continuing to pursue meaningful activities (Example: expand your current volunteer work or start a new meaningful project).`);
          break;
        case 'self_acceptance':
          actionPlan.push(`For the ${dimensionName}: You're doing well! Keep it up by continuing your positive self-care practices (Example: maintain your journaling habit or meditation routine).`);
          break;
        case 'positive_relations':
          actionPlan.push(`For the ${dimensionName}: You're doing well! Keep it up by continuing to nurture your relationships (Example: organize a group activity or be a supportive friend to someone in need).`);
          break;
        case 'environmental_mastery':
          actionPlan.push(`For the ${dimensionName}: You're doing well! Keep it up by continuing to manage your environment effectively (Example: help others with organization or time management tips).`);
          break;
      }
    }
  });
  
  // Add general wellness actions
  actionPlan.push('Schedule a follow-up session with your counselor within 2 weeks to discuss your progress.');
  actionPlan.push('Practice mindfulness or relaxation techniques for 10 minutes daily to maintain overall well-being.');
  
  return actionPlan;
}

// Helper function to extract dimension scores from intervention text
function extractDimensionScores(interventionText) {
  const scores = {};
  
  // Extract scores using regex patterns
  const scorePatterns = [
    /Autonomy \((\d+)\/\d+\)/i,
    /Personal Growth \((\d+)\/\d+\)/i, 
    /Purpose in Life \((\d+)\/\d+\)/i,
    /Self Acceptance \((\d+)\/\d+\)/i,
    /Positive Relations \((\d+)\/\d+\)/i,
    /Environmental Mastery \((\d+)\/\d+\)/i
  ];
  
  const dimensions = ['autonomy', 'personal_growth', 'purpose_in_life', 'self_acceptance', 'positive_relations', 'environmental_mastery'];
  
  scorePatterns.forEach((pattern, index) => {
    const match = interventionText.match(pattern);
    if (match) {
      scores[dimensions[index]] = parseInt(match[1]);
    }
  });
  
  return scores;
}

// POST /api/counselor-interventions/send - Send AI intervention to a student
router.post('/send', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const {
      studentId,
      assessmentId,
      riskLevel,
      interventionTitle,
      interventionText,
      counselorMessage
    } = req.body;
    
    console.log('Sending AI intervention:', {
      counselorId,
      studentId,
      riskLevel,
      interventionTitle: interventionTitle?.substring(0, 50) + '...'
    });
    
    // Validate required fields
    if (!studentId || !riskLevel || !interventionTitle || !interventionText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentId, riskLevel, interventionTitle, interventionText'
      });
    }
    
    // Get counselor name
    const { data: counselor, error: counselorError } = await supabase
      .from('counselors')
      .select('name')
      .eq('id', counselorId)
      .single();
    
    if (counselorError) {
      console.error('Error fetching counselor:', counselorError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch counselor information'
      });
    }
    
    // Create counselor intervention record
    const { data: intervention, error: insertError } = await supabase
      .from('counselor_interventions')
      .insert({
        student_id: studentId,
        assessment_id: assessmentId || null,
        risk_level: riskLevel,
        intervention_title: interventionTitle,
        intervention_text: interventionText,
        counselor_message: counselorMessage || null,
        counselor_id: counselorId,
        is_read: false
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating counselor intervention:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create counselor intervention'
      });
    }
    
    console.log(`Counselor intervention created successfully with ID: ${intervention.id}`);
    
    res.json({
      success: true,
      data: intervention,
      message: 'Counselor intervention sent successfully'
    });
    
  } catch (error) {
    console.error('Error in send intervention route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/counselor-interventions/bulk-send - Send AI interventions to multiple students
router.post('/bulk-send', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { interventions } = req.body;
    
    console.log(`Bulk sending ${interventions?.length || 0} AI interventions`);
    
    // Validate input
    if (!interventions || !Array.isArray(interventions) || interventions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interventions array'
      });
    }
    
    // Get counselor name
    const { data: counselor, error: counselorError } = await supabase
      .from('counselors')
      .select('name')
      .eq('id', counselorId)
      .single();
    
    if (counselorError) {
      console.error('Error fetching counselor:', counselorError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch counselor information'
      });
    }
    
    // Prepare intervention records
    const interventionRecords = interventions.map(intervention => ({
      student_id: intervention.studentId,
      assessment_id: intervention.assessmentId || null,
      risk_level: intervention.riskLevel,
      intervention_title: intervention.interventionTitle,
      intervention_text: intervention.interventionText,
      counselor_message: intervention.counselorMessage || null,
      counselor_id: counselorId,
      is_read: false
    }));
    
    // Bulk insert interventions
    const { data: createdInterventions, error: insertError } = await supabase
      .from('counselor_interventions')
      .insert(interventionRecords)
      .select();
    
    if (insertError) {
      console.error('Error bulk creating counselor interventions:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create counselor interventions'
      });
    }
    
    console.log(`Successfully created ${createdInterventions.length} counselor interventions`);
    
    res.json({
      success: true,
      data: createdInterventions,
      message: `Successfully sent ${createdInterventions.length} counselor interventions`
    });
    
  } catch (error) {
    console.error('Error in bulk send intervention route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/counselor-interventions - Get all interventions (for checking availability)
router.get('/', verifyCounselorSession, async (req, res) => {
  try {
    console.log('Fetching all interventions for availability check');
    
    // Get all interventions regardless of status
    const { data: interventions, error } = await supabase
      .from('counselor_interventions')
      .select('student_id, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all interventions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch interventions'
      });
    }
    
    console.log(`Found ${interventions.length} total interventions`);
    
    res.json({
      success: true,
      data: interventions
    });
    
  } catch (error) {
    console.error('Error in all interventions route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/counselor-interventions/sent - Get interventions sent by the current counselor
router.get('/sent', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    
    console.log(`Fetching sent interventions (all counselors) - NO PAGINATION LIMIT`);
    
    // Get ALL sent interventions without pagination limit
    // This ensures intervention status checking works for all students regardless of count
    // Removed pagination to fix intervention status display issue for students beyond first 20
    const { data: interventions, error } = await supabase
      .from('counselor_interventions')
      .select(`
        id,
        intervention_title,
        intervention_text,
        risk_level,
        status,
        created_at,
        is_read,
        student_id,
        counselor_id,
        assessment_type,
        students!inner(name, id_number, college)
      `)
      .eq('status', 'sent')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sent interventions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch sent interventions'
      });
    }
    
    console.log(`Found ${interventions.length} sent interventions`);
    
    res.json({
      success: true,
      data: interventions,
      total: interventions.length
    });
    
  } catch (error) {
    console.error('Error in sent interventions route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/counselor-interventions/student/:studentId/latest - Get latest intervention for a student
router.get('/student/:studentId/latest', verifyCounselorSession, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { assessmentType } = req.query; // Get assessment type from query parameters
    
    console.log('Fetching latest intervention for student:', studentId, 'assessmentType:', assessmentType);
    
    let query = supabase
      .from('counselor_interventions')
      .select('*')
      .eq('student_id', studentId);
    
    // If assessment type is specified, filter by it using the new assessment_type column
    // This is 100% safe because it falls back to existing behavior when assessmentType is not provided
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }
    
    // Fetch the latest intervention for this student (optionally filtered by assessment type)
    const { data: intervention, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching intervention:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch intervention'
      });
    }
    
    if (!intervention) {
      return res.status(404).json({
        success: false,
        error: 'No intervention found for this student'
      });
    }
    
    // Use the structured data directly from database columns
    let transformedIntervention;
    
    // DEBUG: Log the actual database values
    console.log('DEBUG - Raw database intervention for student:', studentId);
    console.log('- overall_strategy:', intervention.overall_strategy);
    console.log('- dimension_interventions:', intervention.dimension_interventions);
    console.log('- action_plan:', intervention.action_plan);
    console.log('- action_plan type:', typeof intervention.action_plan);
    console.log('- action_plan is array:', Array.isArray(intervention.action_plan));
    console.log('- action_plan length:', intervention.action_plan ? intervention.action_plan.length : 'null/undefined');
    
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
      transformedIntervention = {
        ...intervention,
        overall_strategy: intervention.overall_strategy || 'No intervention strategy available.',
        dimension_interventions: intervention.dimension_interventions || {},
        action_plan: intervention.action_plan || []
      };
    } else {
      // Fallback: try to parse intervention_text as JSON (legacy format)
      try {
        const parsedIntervention = JSON.parse(intervention.intervention_text);
        transformedIntervention = {
          ...intervention,
          overall_strategy: parsedIntervention.overallStrategy || 'No intervention strategy available.',
          dimension_interventions: parsedIntervention.dimensionInterventions || {},
          action_plan: parsedIntervention.actionPlan || []
        };
      } catch (error) {
        // If parsing fails, treat as legacy plain text format and parse it
        console.log('Intervention is in legacy text format, parsing structured sections');
        
        const text = intervention.intervention_text || '';
        
        // Extract overall strategy - try multiple patterns
        let overallStrategy = 'No intervention strategy available.';
        
        // Pattern 1: Look for "Overall Mental Health Strategy:" section
        let strategyMatch = text.match(/Overall Mental Health Strategy:\s*([\s\S]*?)(?=\n\n|Dimension Scores|Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery|$)/i);
        
        if (strategyMatch && strategyMatch[1].trim().length > 0) {
          overallStrategy = strategyMatch[1].trim();
        } else {
          // Pattern 2: Look for "Overview:" section (common AI format)
          strategyMatch = text.match(/Overview:\s*([\s\S]*?)(?=Dimension Scores & Targeted Interventions)/i);
          
          if (strategyMatch && strategyMatch[1].trim().length > 0) {
            overallStrategy = strategyMatch[1].trim();
          } else {
            // Pattern 3: Look for content before dimension scores
            strategyMatch = text.match(/^([\s\S]*?)(?=Dimension Scores & Targeted Interventions|Autonomy\s*\(|Personal Growth\s*\(|Purpose in Life\s*\(|Self Acceptance\s*\(|Positive Relations\s*\(|Environmental Mastery\s*\()/i);
            
            if (strategyMatch && strategyMatch[1].trim().length > 0) {
              // Clean up the extracted strategy
              let strategy = strategyMatch[1].trim();
              // Remove any leading labels or formatting
              strategy = strategy.replace(/^(Overall Mental Health Strategy:|Strategy:|Overall Strategy:|Overview:)\s*/i, '');
              strategy = strategy.replace(/\n\s*\n/g, ' '); // Replace double newlines with space
              strategy = strategy.trim();
              
              if (strategy.length > 10) { // Only use if it's substantial content
                overallStrategy = strategy;
              }
            }
          }
        }
        
        // Extract dimension interventions
        const dimensionInterventions = {};
        const dimensionPattern = /(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*\([^)]+\):\s*([^\n]+)/gi;
        let match;
        while ((match = dimensionPattern.exec(text)) !== null) {
          const dimensionName = match[1].toLowerCase().replace(/\s+/g, '_');
          dimensionInterventions[dimensionName] = match[2].trim();
        }
        
        // Extract dimension scores from the intervention text
        const dimensionScores = extractDimensionScores(text);
        
        // Create dynamic action plan based on dimension scores and risk levels
        const actionPlan = Object.keys(dimensionScores).length > 0 
          ? generateDynamicActionPlan(dimensionScores, dimensionInterventions)
          : [
              'Schedule a follow-up consultation with your counselor',
              'Review the provided intervention guidance', 
              'Implement suggested strategies gradually',
              'Monitor your progress and adjust as needed'
            ];
        
        transformedIntervention = {
          ...intervention,
          overall_strategy: overallStrategy,
          dimension_interventions: dimensionInterventions,
          action_plan: actionPlan
        };
      }
    }
    
    res.json({
      success: true,
      data: transformedIntervention
    });
    
  } catch (error) {
    console.error('Error in get latest intervention:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/counselor-interventions/send-existing - Mark existing intervention as sent to student
router.post('/send-existing', verifyCounselorSession, async (req, res) => {
  try {
    const { studentId, assessmentType } = req.body; // Add assessmentType parameter
    console.log('Marking existing intervention as sent for student:', studentId, 'assessment type:', assessmentType);
    
    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: studentId'
      });
    }

    let query = supabase
      .from('counselor_interventions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // If assessmentType is provided, filter by it using the assessment_type column directly
    // This is safer and avoids JOIN issues when assessment_id doesn't match the assessment_type
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }

    const { data: intervention, error: fetchError } = await query
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching intervention:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'No intervention found for this student' + (assessmentType ? ` with assessment type ${assessmentType}` : '')
      });
    }

    // Update the intervention to mark it as sent
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('counselor_interventions')
      .update({ 
        status: 'sent', // Change status from pending to sent
        updated_at: new Date().toISOString()
      })
      .eq('id', intervention.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating intervention:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to mark intervention as sent'
      });
    }
    
    console.log(`Intervention ${intervention.id} marked as sent to student ${studentId}`);
    
    res.json({
      success: true,
      data: updatedIntervention,
      message: 'Intervention marked as sent successfully'
    });
    
  } catch (error) {
    console.error('Error in send existing intervention route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DEBUG: GET /api/counselor-interventions/debug/all - Get all interventions for debugging
router.get('/debug/all', verifyCounselorSession, async (req, res) => {
  try {
    const { data: interventions, error } = await supabase
      .from('counselor_interventions')
      .select('id, student_id, intervention_title, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching all interventions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch interventions'
      });
    }
    
    res.json({
      success: true,
      data: interventions
    });
    
  } catch (error) {
    console.error('Error in debug all interventions route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DEBUG: GET /api/counselor-interventions/debug/students - Get all students for debugging
router.get('/debug/students', verifyCounselorSession, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, id_number, email')
      .limit(10);
    
    if (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch students'
      });
    }
    
    res.json({
      success: true,
      data: students
    });
    
  } catch (error) {
    console.error('Error in debug students route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/counselor-interventions/:id/action-plan - Update action plan for an intervention
router.put('/:id/action-plan', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const interventionId = req.params.id;
    const { actionPlan } = req.body;
    
    console.log('Updating action plan for intervention:', {
      interventionId,
      counselorId,
      actionPlanLength: actionPlan?.length || 0
    });
    
    // Validate input
    if (!actionPlan || !Array.isArray(actionPlan)) {
      return res.status(400).json({
        success: false,
        error: 'Action plan must be an array'
      });
    }
    
    // Verify the intervention exists (removed counselor ownership check for collaborative editing)
    const { data: intervention, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('id, counselor_id')
      .eq('id', interventionId)
      .single();
    
    if (fetchError || !intervention) {
      console.error('Error fetching intervention:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Intervention not found'
      });
    }
    
    console.log(`Allowing counselor ${counselorId} to update intervention originally created by ${intervention.counselor_id}`);
    
    // Update the action plan
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('counselor_interventions')
      .update({
        action_plan: actionPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', interventionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating action plan:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update action plan'
      });
    }
    
    console.log(`Action plan updated successfully for intervention ${interventionId}`);
    
    res.json({
      success: true,
      data: updatedIntervention,
      message: 'Action plan updated successfully'
    });
    
  } catch (error) {
    console.error('Error in update action plan route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/counselor-interventions/:id/overall-strategy - Update overall strategy for an intervention
router.put('/:id/overall-strategy', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const interventionId = req.params.id;
    const { overallStrategy } = req.body;
    
    console.log('Updating overall strategy for intervention:', {
      interventionId,
      counselorId,
      overallStrategyLength: overallStrategy?.length || 0
    });
    
    // Validate input
    if (!overallStrategy || typeof overallStrategy !== 'string' || overallStrategy.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Overall strategy must be a non-empty string'
      });
    }
    
    // Verify the intervention exists
    const { data: intervention, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('id, counselor_id')
      .eq('id', interventionId)
      .single();
    
    if (fetchError || !intervention) {
      console.error('Error fetching intervention:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Intervention not found'
      });
    }
    
    console.log(`Allowing counselor ${counselorId} to update intervention originally created by ${intervention.counselor_id}`);
    
    // Update the overall strategy
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('counselor_interventions')
      .update({
        overall_strategy: overallStrategy.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', interventionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating overall strategy:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update overall strategy'
      });
    }
    
    console.log(`Overall strategy updated successfully for intervention ${interventionId}`);
    
    res.json({
      success: true,
      data: {
        overall_strategy: updatedIntervention.overall_strategy
      },
      message: 'Overall strategy updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating overall strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update overall strategy'
    });
  }
});

// PUT /api/counselor-interventions/:id/dimension-interventions - Update dimension interventions for an intervention
router.put('/:id/dimension-interventions', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const interventionId = req.params.id;
    const { dimensionInterventions } = req.body;
    
    console.log('Updating dimension interventions for intervention:', {
      interventionId,
      counselorId,
      dimensionCount: dimensionInterventions ? Object.keys(dimensionInterventions).length : 0
    });
    
    // Validate input
    if (!dimensionInterventions || typeof dimensionInterventions !== 'object' || Array.isArray(dimensionInterventions)) {
      return res.status(400).json({
        success: false,
        error: 'Dimension interventions must be an object'
      });
    }
    
    // Verify the intervention exists
    const { data: intervention, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('id, counselor_id')
      .eq('id', interventionId)
      .single();
    
    if (fetchError || !intervention) {
      console.error('Error fetching intervention:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Intervention not found'
      });
    }
    
    console.log(`Allowing counselor ${counselorId} to update intervention originally created by ${intervention.counselor_id}`);
    
    // Update the dimension interventions
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('counselor_interventions')
      .update({
        dimension_interventions: dimensionInterventions,
        updated_at: new Date().toISOString()
      })
      .eq('id', interventionId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating dimension interventions:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update dimension interventions'
      });
    }
    
    console.log(`Dimension interventions updated successfully for intervention ${interventionId}`);
    
    res.json({
      success: true,
      data: {
        dimension_interventions: updatedIntervention.dimension_interventions
      },
      message: 'Dimension interventions updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating dimension interventions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dimension interventions'
    });
  }
});

// Deactivate intervention and move to history
router.post('/deactivate/:interventionId', verifyCounselorSession, async (req, res) => {
  try {
    const { interventionId } = req.params;
    const counselorId = req.session.counselorId;
    
    console.log(`Deactivating intervention ${interventionId} by counselor ${counselorId}`);
    
    // First, get the intervention to move to history
    const { data: intervention, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('*')
      .eq('id', interventionId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching intervention:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch intervention'
      });
    }
    
    if (!intervention) {
      return res.status(404).json({
        success: false,
        error: 'Intervention not found'
      });
    }
    
    // Start a transaction-like operation
    // First, insert into counselor_intervention_history
    const { data: historyRecord, error: historyError } = await supabase
      .from('counselor_intervention_history')
      .insert({
        original_intervention_id: intervention.id,
        student_id: intervention.student_id,
        counselor_id: intervention.counselor_id,
        assessment_id: intervention.assessment_id,
        risk_level: intervention.risk_level,
        intervention_title: intervention.intervention_title,
        intervention_text: intervention.intervention_text,
        counselor_message: intervention.counselor_message,
        is_read: intervention.is_read,
        read_at: intervention.read_at,
        assessment_type: intervention.assessment_type,
        overall_strategy: intervention.overall_strategy,
        dimension_interventions: intervention.dimension_interventions,
        action_plan: intervention.action_plan,
        status: 'deactivated',
        // Include new score fields (will be null if not set, which is fine)
        overall_score: intervention.overall_score,
        dimension_scores: intervention.dimension_scores,
        // Timestamp fields
        original_created_at: intervention.created_at,
        original_updated_at: intervention.updated_at,
        deactivated_at: new Date().toISOString(),
        deactivated_by: counselorId
      })
      .select()
      .single();

    if (historyError) {
      console.error('Error inserting into counselor_intervention_history:', historyError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create history record'
      });
    }
    
    // If history insertion successful, delete from counselor_interventions
    const { error: deleteError } = await supabase
      .from('counselor_interventions')
      .delete()
      .eq('id', interventionId);
    
    if (deleteError) {
      console.error('Error deleting intervention:', deleteError);
      
      // If deletion fails, try to rollback by deleting the history record
      await supabase
        .from('counselor_intervention_history')
        .delete()
        .eq('id', historyRecord.id);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to deactivate intervention'
      });
    }
    
    console.log(`Intervention ${interventionId} successfully moved to history`);
    
    res.json({
      success: true,
      message: 'Intervention deactivated and moved to history',
      historyId: historyRecord.id
    });
    
  } catch (error) {
    console.error('Error in deactivate intervention route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/counselor-interventions/history - Get intervention history for Guidance Feedback
router.get('/history', verifyCounselorSession, async (req, res) => {
  try {
    const { page = 1, limit = 20, studentId, assessmentType } = req.query;
    
    console.log('Fetching intervention history with filters:', { studentId, assessmentType });
    
    const offset = (page - 1) * limit;
    
    // Build query with optional filters
    let query = supabase
      .from('counselor_intervention_history')
      .select(`
        id,
        original_intervention_id,
        intervention_title,
        intervention_text,
        counselor_message,
        risk_level,
        status,
        original_created_at,
        original_updated_at,
        deactivated_at,
        deactivated_by,
        is_read,
        read_at,
        assessment_type,
        overall_strategy,
        dimension_interventions,
        action_plan,
        overall_score,
        dimension_scores,
        student_id,
        counselor_id,
        assessment_id,
        students!inner(name, id_number, college),
        counselors!fk_counselor_intervention_history_counselor(name),
        deactivated_counselor:counselors!fk_counselor_intervention_history_deactivated_by(name)
      `);
    
    // Apply filters if provided
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }
    
    // Order by deactivation date (most recent first) and apply pagination
    const { data: historyRecords, error } = await query
      .order('deactivated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching intervention history:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch intervention history'
      });
    }
    
    // Get total count for pagination (without filters for now - can be optimized later)
    const { count, error: countError } = await supabase
      .from('counselor_intervention_history')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting history count:', countError);
    }
    
    console.log(`Found ${historyRecords.length} intervention history records`);
    
    res.json({
      success: true,
      data: historyRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || historyRecords.length,
        hasMore: historyRecords.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error in intervention history route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;