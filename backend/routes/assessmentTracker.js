const express = require('express');
const { verifyCounselorSession } = require('../middleware/sessionManager');
const assessmentTrackerService = require('../services/assessmentTrackerService');

const router = express.Router();

/**
 * GET /api/assessment-tracker/incomplete
 * Get all incomplete assessments with optional filters
 * Protected route - requires counselor authentication
 */
router.get('/incomplete', verifyCounselorSession, async (req, res) => {
  try {
    const { college_id, counselor_id } = req.query;
    
    // Build filters object
    const filters = {};
    if (college_id) filters.college_id = college_id;
    if (counselor_id) filters.counselor_id = counselor_id;
    
    console.log(`🔍 Fetching incomplete assessments for counselor ${req.user.id}`, filters);
    
    const result = await assessmentTrackerService.getIncompleteAssessments(filters);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch incomplete assessments'
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      summary: result.summary,
      message: `Found ${result.data.length} incomplete assessments`
    });
    
  } catch (error) {
    console.error('Error in /incomplete endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch incomplete assessments'
    });
  }
});

/**
 * GET /api/assessment-tracker/summary
 * Get summary statistics for incomplete assessments
 * Protected route - requires counselor authentication
 */
router.get('/summary', verifyCounselorSession, async (req, res) => {
  try {
    const { college_id, counselor_id } = req.query;
    
    // Build filters object
    const filters = {};
    if (college_id) filters.college_id = college_id;
    if (counselor_id) filters.counselor_id = counselor_id;
    
    console.log(`📊 Fetching summary stats for counselor ${req.user.id}`, filters);
    
    const result = await assessmentTrackerService.getSummaryStats(filters);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch summary statistics'
      });
    }
    
    res.json({
      success: true,
      summary: result.summary,
      total_students: result.total_students,
      message: 'Summary statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error in /summary endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch summary statistics'
    });
  }
});

/**
 * GET /api/assessment-tracker/by-college/:collegeId
 * Get incomplete assessments for a specific college
 * Protected route - requires counselor authentication
 */
router.get('/by-college/:collegeId', verifyCounselorSession, async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    if (!collegeId) {
      return res.status(400).json({
        success: false,
        error: 'College ID is required',
        message: 'Please provide a valid college ID'
      });
    }
    
    console.log(`🏫 Fetching incomplete assessments for college ${collegeId} by counselor ${req.user.id}`);
    
    const result = await assessmentTrackerService.getIncompleteByCollege(collegeId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch incomplete assessments for college'
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      summary: result.summary,
      college_id: collegeId,
      message: `Found ${result.data.length} incomplete assessments for college`
    });
    
  } catch (error) {
    console.error('Error in /by-college endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch incomplete assessments for college'
    });
  }
});

/**
 * GET /api/assessment-tracker/by-counselor/:counselorId
 * Get incomplete assessments for a specific counselor
 * Protected route - requires counselor authentication
 */
router.get('/by-counselor/:counselorId', verifyCounselorSession, async (req, res) => {
  try {
    const { counselorId } = req.params;
    
    if (!counselorId) {
      return res.status(400).json({
        success: false,
        error: 'Counselor ID is required',
        message: 'Please provide a valid counselor ID'
      });
    }
    
    // Optional: Check if requesting counselor has permission to view other counselor's data
    // For now, allowing all counselors to view any counselor's incomplete assessments
    
    console.log(`👨‍💼 Fetching incomplete assessments for counselor ${counselorId} by counselor ${req.user.id}`);
    
    const result = await assessmentTrackerService.getIncompleteByCounselor(counselorId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to fetch incomplete assessments for counselor'
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      summary: result.summary,
      counselor_id: counselorId,
      message: `Found ${result.data.length} incomplete assessments for counselor`
    });
    
  } catch (error) {
    console.error('Error in /by-counselor endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch incomplete assessments for counselor'
    });
  }
});

/**
 * GET /api/assessment-tracker/status
 * Get service status and health check
 * Protected route - requires counselor authentication
 */
router.get('/status', verifyCounselorSession, async (req, res) => {
  try {
    const status = assessmentTrackerService.getStatus();
    
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString(),
      message: 'Assessment Tracker Service is running'
    });
    
  } catch (error) {
    console.error('Error in /status endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get service status'
    });
  }
});

module.exports = router;