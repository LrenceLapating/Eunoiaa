const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

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

// GET /api/counselor-interventions/sent - Get interventions sent by the current counselor
router.get('/sent', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    console.log(`Fetching sent interventions for counselor: ${counselorId}`);
    
    const offset = (page - 1) * limit;
    
    // Get interventions sent by this counselor
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
        students!inner(name, id_number, college)
      `)
      .eq('counselor_id', counselorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
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
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: interventions.length
      }
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
    
    console.log('Fetching latest intervention for student:', studentId);
    
    // Fetch the latest intervention for this student
    const { data: intervention, error } = await supabase
      .from('counselor_interventions')
      .select('*')
      .eq('student_id', studentId)
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
    const { studentId } = req.body;
    
    console.log('Marking existing intervention as sent for student:', studentId);
    
    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: studentId'
      });
    }
    
    // Find the latest intervention for this student
    const { data: intervention, error: fetchError } = await supabase
      .from('counselor_interventions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError) {
      console.error('Error fetching intervention:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'No intervention found for this student'
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

module.exports = router;