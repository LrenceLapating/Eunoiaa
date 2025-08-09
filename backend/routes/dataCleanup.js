const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');

// Get statistics about deactivated student data
router.get('/deactivated-stats', verifyCounselorSession, async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_deactivated_student_stats');

    if (error) {
      console.error('Error fetching deactivated student stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }

    res.json({
      success: true,
      data: data[0] || {
        inactive_students: 0,
        pending_assignments: 0,
        completed_assessments: 0,
        total_assignments: 0
      }
    });

  } catch (error) {
    console.error('Error in deactivated stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Archive assessment assignments for deactivated students
router.post('/archive-deactivated', verifyCounselorSession, async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('archive_deactivated_student_assignments');

    if (error) {
      console.error('Error archiving deactivated student assignments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to archive assignments'
      });
    }

    const result = data[0] || { archived_assignments: 0, archived_assessments: 0 };

    res.json({
      success: true,
      message: `Successfully archived ${result.archived_assignments} assignments and ${result.archived_assessments} assessments for deactivated students`,
      data: result
    });

  } catch (error) {
    console.error('Error in archive deactivated:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Clean up old assessment data (use with caution)
router.post('/cleanup-old-data', verifyCounselorSession, async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    
    // Validate daysOld parameter
    if (!Number.isInteger(daysOld) || daysOld < 30) {
      return res.status(400).json({
        success: false,
        message: 'daysOld must be an integer of at least 30 days'
      });
    }

    const { data, error } = await supabase
      .rpc('cleanup_old_assessment_data', { days_old: daysOld });

    if (error) {
      console.error('Error cleaning up old data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cleanup old data'
      });
    }

    const result = data[0] || { deleted_assignments: 0, deleted_assessments: 0, deleted_progress: 0 };

    res.json({
      success: true,
      message: `Successfully deleted ${result.deleted_assignments} assignments, ${result.deleted_assessments} assessments, and ${result.deleted_progress} progress records older than ${daysOld} days`,
      data: result
    });

  } catch (error) {
    console.error('Error in cleanup old data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get statistics about orphaned bulk assessments
router.get('/orphaned-assessments', verifyCounselorSession, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_orphaned_assessment_stats');

    if (error) {
      console.error('Error fetching orphaned assessment stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orphaned assessment statistics'
      });
    }

    res.json({
      success: true,
      data: data[0] || {
        orphaned_bulk_assessments: 0,
        deactivated_assignments: 0,
        total_bulk_assessments: 0,
        active_bulk_assessments: 0
      }
    });

  } catch (error) {
    console.error('Error in orphaned assessments stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Archive orphaned bulk assessments
router.post('/archive-orphaned', verifyCounselorSession, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('archive_orphaned_bulk_assessments');

    if (error) {
      console.error('Error archiving orphaned assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to archive orphaned assessments'
      });
    }

    const result = data[0] || { archived_assessments: 0, archived_assignments: 0 };

    res.json({
      success: true,
      message: `Successfully archived ${result.archived_assessments} bulk assessments and ${result.archived_assignments} assignments`,
      data: result
    });

  } catch (error) {
    console.error('Error in archive orphaned assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get fresh assessment data summary (only active students)
router.get('/fresh-data-summary', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.session.user_id;

    // Get active students count
    const { count: activeStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (studentsError) {
      console.error('Error counting active students:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student count'
      });
    }

    // Get active assessment assignments for this counselor
    const { count: activeAssignments, error: assignmentsError } = await supabase
      .from('assessment_assignments')
      .select('*, bulk_assessments!inner(counselor_id), students!inner(status)', { count: 'exact', head: true })
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('students.status', 'active')
      .in('status', ['assigned', 'completed']);

    if (assignmentsError) {
      console.error('Error counting active assignments:', assignmentsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment count'
      });
    }

    // Get completed assessments for active students
    const { count: completedAssessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*, assessment_assignments!inner(bulk_assessment_id), bulk_assessments!inner(counselor_id), students!inner(status)', { count: 'exact', head: true })
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('students.status', 'active');

    if (assessmentsError) {
      console.error('Error counting completed assessments:', assessmentsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment count'
      });
    }

    res.json({
      success: true,
      data: {
        activeStudents: activeStudents || 0,
        activeAssignments: activeAssignments || 0,
        completedAssessments: completedAssessments || 0,
        completionRate: activeAssignments > 0 ? Math.round((completedAssessments / activeAssignments) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error in fresh data summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;