const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Create a new bulk assessment
router.post('/create', verifyCounselorSession, async (req, res) => {
  try {
    const {
      assessmentName,
      assessmentType, // 'ryff_42' or 'ryff_84'
      targetType, // 'specific_students', 'college', 'all_students'
      targetColleges,
      specificStudents,
      customMessage,
      scheduleOption, // 'now' or 'scheduled'
      scheduledDate
    } = req.body;

    const counselorId = req.user.id;

    // Validate required fields
    if (!assessmentName || !assessmentType || !targetType) {
      return res.status(400).json({
        success: false,
        message: 'Assessment name, type, and target type are required'
      });
    }

    // Determine scheduled date
    let finalScheduledDate = null;
    if (scheduleOption === 'scheduled' && scheduledDate) {
      finalScheduledDate = new Date(scheduledDate).toISOString();
    } else {
      finalScheduledDate = new Date().toISOString(); // Send now
    }

    // Create bulk assessment record
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .insert({
        counselor_id: counselorId,
        assessment_name: assessmentName,
        assessment_type: assessmentType,
        target_type: targetType,
        target_colleges: targetColleges || [],
        custom_message: customMessage,
        scheduled_date: finalScheduledDate,
        status: scheduleOption === 'now' ? 'sent' : 'pending'
      })
      .select()
      .single();

    if (bulkError) {
      console.error('Error creating bulk assessment:', bulkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create bulk assessment'
      });
    }

    // Get target students based on target type
    let targetStudents = [];
    
    if (targetType === 'specific_students' && specificStudents) {
      // Get specific students by IDs
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email, college')
        .in('id', specificStudents)
        .eq('status', 'active');
      
      if (!studentsError) {
        targetStudents = students;
      }
    } else if (targetType === 'college' && targetColleges && targetColleges.length > 0) {
      // Get students from specific colleges
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email, college')
        .in('college', targetColleges)
        .eq('status', 'active');
      
      if (!studentsError) {
        targetStudents = students;
      }
    } else if (targetType === 'all_students') {
      // Get all active students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email, college')
        .eq('status', 'active');
      
      if (!studentsError) {
        targetStudents = students;
      }
    }

    // Create assessment assignments for target students
    if (targetStudents.length > 0) {
      const assignments = targetStudents.map(student => ({
        bulk_assessment_id: bulkAssessment.id,
        student_id: student.id,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }));

      const { error: assignmentError } = await supabase
        .from('assessment_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError);
        // Don't fail the whole operation, just log the error
      }
    }

    res.json({
      success: true,
      message: `Bulk assessment created successfully. Assigned to ${targetStudents.length} students.`,
      data: {
        bulkAssessment,
        assignedStudents: targetStudents.length
      }
    });

  } catch (error) {
    console.error('Error in bulk assessment creation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get bulk assessment history for counselor
router.get('/history', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;

    // Get bulk assessments with assignment counts (exclude archived)
    const { data: assessments, error } = await supabase
      .from('bulk_assessments')
      .select(`
        *,
        assignment_count:assessment_assignments(count),
        completed_count:assessment_assignments(count).eq(status, 'completed')
      `)
      .eq('counselor_id', counselorId)
      .neq('status', 'archived')  // Exclude archived assessments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching assessment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment history'
      });
    }

    // Calculate completion percentages
    const enrichedAssessments = assessments.map(assessment => {
      const totalAssigned = assessment.assignment_count?.[0]?.count || 0;
      const totalCompleted = assessment.completed_count?.[0]?.count || 0;
      const completionPercentage = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      
      return {
        ...assessment,
        total_assigned: totalAssigned,
        total_completed: totalCompleted,
        completion_percentage: completionPercentage
      };
    });

    res.json({
      success: true,
      data: enrichedAssessments
    });

  } catch (error) {
    console.error('Error in assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed information about a specific bulk assessment
router.get('/:id/details', verifyCounselorSession, async (req, res) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.id;

    // Get bulk assessment details (exclude archived)
    const { data: assessment, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .neq('status', 'archived')  // Exclude archived assessments
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Get assignment details with student information (only active students)
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        student:students!inner(
          id,
          name,
          email,
          college,
          section
        )
      `)
      .eq('bulk_assessment_id', id)
      .eq('student.status', 'active');  // Only include active students

    if (assignmentError) {
      console.error('Error fetching assignment details:', assignmentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment details'
      });
    }

    res.json({
      success: true,
      data: {
        assessment,
        assignments
      }
    });

  } catch (error) {
    console.error('Error in assessment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel a pending bulk assessment
router.patch('/:id/cancel', verifyCounselorSession, async (req, res) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.id;

    // Update assessment status to cancelled
    const { data, error } = await supabase
      .from('bulk_assessments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('counselor_id', counselorId)
      .eq('status', 'pending') // Only allow cancelling pending assessments
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this assessment. It may have already been sent or completed.'
      });
    }

    res.json({
      success: true,
      message: 'Assessment cancelled successfully',
      data
    });

  } catch (error) {
    console.error('Error cancelling assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get dashboard statistics
router.get('/stats', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;

    // Get total assessments created (exclude archived)
    const { count: totalAssessments, error: totalError } = await supabase
      .from('bulk_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', counselorId)
      .neq('status', 'archived');  // Exclude archived assessments

    // Get pending assessments
    const { count: pendingAssessments, error: pendingError } = await supabase
      .from('bulk_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', counselorId)
      .eq('status', 'pending');

    // Get total assignments
    const { count: totalAssignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('*, bulk_assessments!inner(counselor_id)', { count: 'exact', head: true })
      .eq('bulk_assessments.counselor_id', counselorId);

    // Get completed assignments
    const { count: completedAssignments, error: completedError } = await supabase
      .from('assessment_assignments')
      .select('*, bulk_assessments!inner(counselor_id)', { count: 'exact', head: true })
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('status', 'completed');

    if (totalError || pendingError || assignmentError || completedError) {
      console.error('Error fetching stats:', { totalError, pendingError, assignmentError, completedError });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }

    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalAssessments: totalAssessments || 0,
        pendingAssessments: pendingAssessments || 0,
        totalAssignments: totalAssignments || 0,
        completedAssignments: completedAssignments || 0,
        completionRate
      }
    });

  } catch (error) {
    console.error('Error in stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;