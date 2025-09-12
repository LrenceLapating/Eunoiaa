const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/database');
const { verifyStudentSession } = require('../middleware/sessionManager');
const { calculateRyffScores, determineRiskLevel } = require('../utils/ryffScoring');
const { computeAndStoreCollegeScores } = require('../utils/collegeScoring');
const riskLevelSyncService = require('../services/riskLevelSyncService');

// Get assigned assessments for student
router.get('/assigned', verifyStudentSession, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log(`Fetching assigned assessments for student: ${studentId}`);

    // Get assigned assessments that are not completed or expired
    const { data: assignments, error } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['assigned', 'in_progress'])
      .gt('expires_at', new Date().toISOString())
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned assessments'
      });
    }

    // Fetch bulk assessment details separately
    let enrichedAssignments = [];
    if (assignments && assignments.length > 0) {
      const bulkAssessmentIds = assignments.map(a => a.bulk_assessment_id);
      const { data: bulkAssessments, error: bulkError } = await supabase
        .from('bulk_assessments')
        .select('id, assessment_name, assessment_type, custom_message, scheduled_date')
        .in('id', bulkAssessmentIds);

      if (bulkError) {
        console.error('Error fetching bulk assessments:', bulkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch assessment details'
        });
      }

      // Create a map for quick lookup
      const bulkAssessmentMap = {};
      bulkAssessments?.forEach(bulk => {
        bulkAssessmentMap[bulk.id] = bulk;
      });

      // Enrich assignments with bulk assessment data
      enrichedAssignments = assignments.map(assignment => ({
        ...assignment,
        bulk_assessment: bulkAssessmentMap[assignment.bulk_assessment_id] || null
      }));
    }

    console.log(`Found ${enrichedAssignments?.length || 0} assigned assessments for student ${studentId}`);
    if (enrichedAssignments && enrichedAssignments.length > 0) {
      console.log('Assignment details:', enrichedAssignments.map(a => ({
        id: a.id,
        status: a.status,
        assigned_at: a.assigned_at,
        completed_at: a.completed_at,
        expires_at: a.expires_at,
        assessment_name: a.bulk_assessment?.assessment_name
      })));
    }

    res.json({
      success: true,
      data: enrichedAssignments || []
    });

  } catch (error) {
    console.error('Error in assigned assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Debug endpoint to check all assessment assignments for a student
router.get('/debug/all-assignments', verifyStudentSession, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log(`Debug: Fetching ALL assignments for student: ${studentId}`);

    // Get ALL assignments for this student regardless of status
    const { data: allAssignments, error } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('student_id', studentId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Debug: Error fetching all assignments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch all assignments'
      });
    }

    // Fetch bulk assessment details separately
    let enrichedAllAssignments = [];
    if (allAssignments && allAssignments.length > 0) {
      const bulkAssessmentIds = allAssignments.map(a => a.bulk_assessment_id);
      const { data: bulkAssessments, error: bulkError } = await supabase
        .from('bulk_assessments')
        .select('id, assessment_name, assessment_type, custom_message, scheduled_date')
        .in('id', bulkAssessmentIds);

      if (bulkError) {
        console.error('Debug: Error fetching bulk assessments:', bulkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch assessment details'
        });
      }

      // Create a map for quick lookup
      const bulkAssessmentMap = {};
      bulkAssessments?.forEach(bulk => {
        bulkAssessmentMap[bulk.id] = bulk;
      });

      // Enrich assignments with bulk assessment data
      enrichedAllAssignments = allAssignments.map(assignment => ({
        ...assignment,
        bulk_assessment: bulkAssessmentMap[assignment.bulk_assessment_id] || null
      }));
    }

    console.log(`Debug: Found ${enrichedAllAssignments?.length || 0} total assignments for student ${studentId}`);
    if (enrichedAllAssignments && enrichedAllAssignments.length > 0) {
      console.log('Debug: All assignment details:', enrichedAllAssignments.map(a => ({
        id: a.id,
        status: a.status,
        assigned_at: a.assigned_at,
        completed_at: a.completed_at,
        expires_at: a.expires_at,
        assessment_name: a.bulk_assessment?.assessment_name
      })));
    }

    res.json({
      success: true,
      data: enrichedAllAssignments || [],
      debug: {
        studentId,
        totalCount: enrichedAllAssignments?.length || 0,
        statusBreakdown: enrichedAllAssignments?.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {}) || {}
      }
    });

  } catch (error) {
    console.error('Debug: Error in all assignments fetch:', error);
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
      .select('*')
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

    // Get bulk assessment details separately
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type, custom_message')
      .eq('id', assignment.bulk_assessment_id)
      .single();

    if (bulkError || !bulkAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment details not found'
      });
    }

    // Attach bulk assessment to assignment
    assignment.bulk_assessment = bulkAssessment;

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
    const { responses, timeTakenMinutes, questionTimes, startTime, endTime } = req.body;
    const studentId = req.user.id;
    
    console.log('Received submission with timing data:', {
      timeTakenMinutes,
      hasQuestionTimes: !!questionTimes,
      startTime,
      endTime
    });

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
      .select('*')
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

    // Get bulk assessment details separately
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_type, assessment_name')
      .eq('id', assignment.bulk_assessment_id)
      .single();

    if (bulkError || !bulkAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment details not found'
      });
    }

    // Attach bulk assessment to assignment
    assignment.bulk_assessment = bulkAssessment;

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
    console.log(`Attempting to insert assessment record into ${tableName} for student ${studentId}, assignment ${assignmentId}`);
    
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
        completed_at: new Date().toISOString(),
        completion_time: timeTakenMinutes || null
      })
      .select()
      .single();

    if (assessmentInsertError) {
      console.error('❌ CRITICAL ERROR: Failed to create assessment record:', {
        error: assessmentInsertError,
        tableName,
        studentId,
        assignmentId,
        assessmentType
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to save assessment responses'
      });
    }
    
    console.log(`✅ Assessment record created successfully:`, {
       assessmentId: assessmentRecord.id,
       tableName,
       studentId,
       assignmentId
     });

    // Assessment data is now stored directly in assessments_42items/assessments_84items tables
    // Counselor dashboard accesses data from these tables via counselorAssessments.js
    // No additional ryffscoring table insert needed

    // Create assessment analytics record if timing data is provided
    if (timeTakenMinutes !== undefined && timeTakenMinutes !== null) {
      const analyticsData = {
        assessment_id: assessmentRecord.id,
        student_id: studentId,
        time_taken_minutes: timeTakenMinutes,
        question_times: questionTimes || {},
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        navigation_pattern: [], // Can be enhanced later to track navigation
        created_at: new Date().toISOString()
      };

      const { error: analyticsError } = await supabaseAdmin
        .from('assessment_analytics')
        .insert(analyticsData);

      if (analyticsError) {
        console.error('Error creating assessment analytics:', analyticsError);
        // Don't fail the whole operation, assessment is already saved
      } else {
        console.log('Assessment analytics saved successfully');
      }
    }

    // Update assignment status to completed using admin client
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('assessment_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select();

    if (updateError) {
      console.error('Error updating assignment status:', updateError);
      // Don't fail the whole operation, assessment is already saved
    } else {
      console.log('Assignment status updated successfully:', updateData);
    }

    // Sync risk level to assessment_assignments using centralized service
    try {
      await riskLevelSyncService.syncRiskLevelToAssignments(assessmentRecord.id, tableName);
      console.log('Risk level synchronized to assessment_assignments successfully');
    } catch (syncError) {
      console.error('Error synchronizing risk level:', syncError);
      // Don't fail the whole operation, assessment is already saved
    }

    // Get student's college information for college score computation
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('college')
      .eq('id', studentId)
      .single();

    // Trigger college score computation for the student's college
    if (studentData && studentData.college && !studentError) {
      const assessmentName = assignment.bulk_assessment.assessment_name;
      console.log(`🎯 Triggering college score computation for ${studentData.college}, assessment: ${assessmentName}, type: ${assessmentType}`);
      
      // Run college score computation asynchronously (don't wait for it to complete)
      computeAndStoreCollegeScores(studentData.college, assessmentType, assessmentName)
        .then(result => {
          if (result.success) {
            console.log(`✅ College scores updated successfully for ${studentData.college}:`, result.message);
          } else {
            console.error(`❌ Failed to update college scores for ${studentData.college}:`, result.error);
          }
        })
        .catch(error => {
          console.error(`💥 CRITICAL ERROR in college score computation for ${studentData.college}:`, {
            error: error.message,
            stack: error.stack,
            assessmentName,
            assessmentType,
            studentId,
            assignmentId,
            assessmentRecordId: assessmentRecord.id
          });
        });
    } else {
      console.error(`⚠️  Could not determine student college for score computation:`, {
        studentError,
        studentData,
        studentId,
        assignmentId
      });
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

// Save assessment progress (simplified - no database storage)
router.post('/progress/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { currentQuestionIndex, responses, startTime, assessmentType } = req.body;

    // Verify assignment belongs to student
    const { data: assignment, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('id, status')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // If assignment is already completed, just return success (no need to save progress)
    if (assignment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Assessment already completed - no progress to save',
        data: {
          student_id: studentId,
          assignment_id: assignmentId,
          status: 'completed',
          last_saved: new Date().toISOString()
        }
      });
    }

    // Since we don't have assessment_progress table, just return success
    // Progress will be handled client-side (localStorage/sessionStorage)
    console.log(`Progress saved for assignment ${assignmentId}: question ${currentQuestionIndex}/${Object.keys(responses).length} responses`);

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        student_id: studentId,
        assignment_id: assignmentId,
        assessment_type: assessmentType,
        current_question_index: currentQuestionIndex,
        responses_count: Object.keys(responses).length,
        last_saved: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in save progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Load assessment progress (simplified - no database storage)
router.get('/progress/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // Verify assignment belongs to student
    const { data: assignment, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('id, status')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // If assignment is completed, return empty progress
    if (assignment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Assessment completed - no progress data available',
        data: null
      });
    }

    // Since we don't have assessment_progress table, return null
    // Progress will be handled client-side (localStorage/sessionStorage)
    console.log(`Progress requested for assignment ${assignmentId} - using client-side storage`);

    res.json({
      success: true,
      data: null // No server-side progress storage
    });

  } catch (error) {
    console.error('Error in load progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete assessment progress (simplified - no database storage)
router.delete('/progress/:assignmentId', verifyStudentSession, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    // Verify assignment belongs to student
    const { data: assignment, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('id, status')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .single();

    if (assignmentError || !assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Since we don't have assessment_progress table, just return success
    // Progress deletion will be handled client-side (localStorage/sessionStorage)
    console.log(`Progress deletion requested for assignment ${assignmentId} - using client-side storage`);

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