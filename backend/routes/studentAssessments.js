const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const { verifyStudentSession } = require('../middleware/sessionManager');
const { calculateRyffScores, determineRiskLevel } = require('../utils/ryffScoring');

// Create service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get assigned assessments for student
router.get('/assigned', verifyStudentSession, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get assigned assessments that are not completed or expired
    const { data: assignments, error } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessment:bulk_assessments(
          id,
          assessment_name,
          assessment_type,
          custom_message,
          scheduled_date
        )
      `)
      .eq('student_id', studentId)
      .in('status', ['assigned'])
      .gt('expires_at', new Date().toISOString())
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned assessments'
      });
    }

    res.json({
      success: true,
      data: assignments || []
    });

  } catch (error) {
    console.error('Error in assigned assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get assessment details for taking
router.get('/take/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessment:bulk_assessments(
          id,
          assessment_name,
          assessment_type,
          custom_message
        )
      `)
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .eq('status', 'assigned')
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment assignment not found or already completed'
      });
    }

    // Check if assignment is expired
    if (new Date(assignment.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This assessment has expired'
      });
    }

    res.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error in assessment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit assessment responses
router.post('/submit/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { responses } = req.body;
    const studentId = req.user.id;

    // Validate responses
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid responses format'
      });
    }

    // Get assignment details
    const { data: assignment, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessment:bulk_assessments(
          id,
          assessment_type
        )
      `)
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .eq('status', 'assigned')
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment assignment not found or already completed'
      });
    }

    // Check if assignment is expired
    if (new Date(assignment.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This assessment has expired'
      });
    }

    const assessmentType = assignment.bulk_assessment.assessment_type;
    
    // Validate response count based on assessment type
    const expectedCount = assessmentType === 'ryff_84' ? 84 : 42;
    const responseCount = Object.keys(responses).length;
    
    if (responseCount !== expectedCount) {
      return res.status(400).json({
        success: false,
        message: `Expected ${expectedCount} responses, but received ${responseCount}`
      });
    }

    // Calculate scores using the scoring utility
    const scores = calculateRyffScores(responses, assessmentType);
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const riskLevel = determineRiskLevel(scores, overallScore, assessmentType);

    // Determine which table to insert into based on assessment type
    let tableName = 'assessments_42items'; // Default to 42-item table
    if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }

    // Create assessment record in the appropriate table using admin client to bypass RLS
    const { data: assessmentRecord, error: assessmentInsertError } = await supabaseAdmin
      .from(tableName)
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        assessment_type: assessmentType,
        responses: responses,
        scores: scores,
        overall_score: parseFloat(overallScore.toFixed(2)),
        risk_level: riskLevel,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assessmentInsertError) {
      console.error('Error creating assessment record:', assessmentInsertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save assessment responses'
      });
    }

    // Update assignment status to completed using admin client
    const { error: updateError } = await supabaseAdmin
      .from('assessment_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (updateError) {
      console.error('Error updating assignment status:', updateError);
      // Don't fail the whole operation, assessment is already saved
    }

    res.json({
      success: true,
      message: 'Assessment completed successfully',
      data: {
        assessmentId: assessmentRecord.id,
        scores: scores,
        overallScore: overallScore,
        riskLevel: riskLevel
      }
    });

  } catch (error) {
    console.error('Error in assessment submission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get student's assessment history
router.get('/history', verifyStudentSession, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;

    // Get completed assessments
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching assessment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment history'
      });
    }

    res.json({
      success: true,
      data: assessments || []
    });

  } catch (error) {
    console.error('Error in assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get latest assessment results
router.get('/latest', verifyStudentSession, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get most recent assessment
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching latest assessment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch latest assessment'
      });
    }

    res.json({
      success: true,
      data: assessment || null
    });

  } catch (error) {
    console.error('Error in latest assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Save assessment progress
router.post('/progress/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { currentQuestionIndex, responses, startTime, assessmentType } = req.body;

    // Verify assignment belongs to student
    const { data: assignment, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('id')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .eq('status', 'assigned')
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Upsert progress record
    const { data: progress, error: progressError } = await supabase
      .from('assessment_progress')
      .upsert({
        student_id: studentId,
        assignment_id: assignmentId,
        assessment_type: assessmentType,
        current_question_index: currentQuestionIndex,
        responses: responses,
        start_time: startTime,
        last_saved: new Date().toISOString()
      }, {
        onConflict: 'student_id,assignment_id'
      })
      .select()
      .single();

    if (progressError) {
      console.error('Error saving progress:', progressError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save progress'
      });
    }

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: progress
    });

  } catch (error) {
    console.error('Error in save progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Load assessment progress
router.get('/progress/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // Get progress record
    const { data: progress, error: progressError } = await supabase
      .from('assessment_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error loading progress:', progressError);
      return res.status(500).json({
        success: false,
        message: 'Failed to load progress'
      });
    }

    res.json({
      success: true,
      data: progress || null
    });

  } catch (error) {
    console.error('Error in load progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete assessment progress (when assessment is completed)
router.delete('/progress/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const { error: deleteError } = await supabase
      .from('assessment_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId);

    if (deleteError) {
      console.error('Error deleting progress:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete progress'
      });
    }

    res.json({
      success: true,
      message: 'Progress deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;