const express = require('express');
const { supabaseAdmin } = require('../config/database');
const router = express.Router();

// Risk thresholds - scores at or below these values are considered "at risk"
const RISK_THRESHOLDS = {
  ryff_42: 18,  // 7-18: At-Risk for each dimension (7 items per dimension)
  ryff_84: 36   // 14-36: At-Risk for each dimension (14 items per dimension)
};

// All 6 Ryff dimensions
const DIMENSIONS = [
  { key: 'autonomy', name: 'Autonomy' },
  { key: 'environmental_mastery', name: 'Environmental Mastery' },
  { key: 'personal_growth', name: 'Personal Growth' },
  { key: 'positive_relations', name: 'Positive Relations with Others' },
  { key: 'purpose_in_life', name: 'Purpose in Life' },
  { key: 'self_acceptance', name: 'Self-Acceptance' }
];

/**
 * GET /api/risk-alerts
 * Returns at-risk student counts by dimension and college
 */
router.get('/', async (req, res) => {
  try {
    const { assessmentType = '42-item' } = req.query;
    console.log('Fetching risk alerts data for assessment type:', assessmentType);
    
    // Fetch assessments from both tables and historical data
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, student_id, scores, completed_at')
      .not('scores', 'is', null)
      .order('completed_at', { ascending: false });

    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, student_id, scores, completed_at')
      .not('scores', 'is', null)
      .order('completed_at', { ascending: false });

    // Fetch historical 84-item assessments from ryff_history table
    // Only fetch historical data if not specifically filtering for 84-item assessments
    let historyAssessments84 = null;
    let errorHistory = null;
    
    if (assessmentType !== '84-item') {
      const result = await supabaseAdmin
        .from('ryff_history')
        .select('id, student_id, scores, completed_at, assessment_type')
        .eq('assessment_type', 'ryff_84')
        .not('scores', 'is', null)
        .order('completed_at', { ascending: false });
      
      historyAssessments84 = result.data;
      errorHistory = result.error;
    }
      
    // Fetch all active students
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, college, section, status')
      .eq('status', 'active');
      
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return res.status(500).json({ 
        error: 'Failed to fetch student data',
        details: studentsError.message
      });
    }

    if (error42 || error84 || errorHistory) {
      console.error('Database error:', error42 || error84 || errorHistory);
      return res.status(500).json({ 
        error: 'Failed to fetch assessment data',
        details: error42?.message || error84?.message || errorHistory?.message
      });
    }

    // Create a map of students for quick lookup
    const studentMap = {};
    students?.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Combine assessments from both tables and historical data
    const allAssessments = [];
    if (assessments42) {
      assessments42.forEach(assessment => {
        if (studentMap[assessment.student_id]) {
          allAssessments.push({
            ...assessment,
            student: studentMap[assessment.student_id],
            assessment_type: 'ryff_42'
          });
        }
      });
    }
    if (assessments84) {
      assessments84.forEach(assessment => {
        if (studentMap[assessment.student_id]) {
          allAssessments.push({
            ...assessment,
            student: studentMap[assessment.student_id],
            assessment_type: 'ryff_84'
          });
        }
      });
    }
    // Add historical 84-item assessments from ryff_history
    if (historyAssessments84) {
      historyAssessments84.forEach(assessment => {
        if (studentMap[assessment.student_id]) {
          allAssessments.push({
            ...assessment,
            student: studentMap[assessment.student_id],
            assessment_type: assessment.assessment_type // Already 'ryff_84' from the query filter
          });
        }
      });
    }
    
    // Filter assessments based on assessment type
    let filteredAssessments = allAssessments;
    if (assessmentType === '42-item') {
      filteredAssessments = allAssessments.filter(assessment => assessment.assessment_type === 'ryff_42');
    } else if (assessmentType === '84-item') {
      filteredAssessments = allAssessments.filter(assessment => assessment.assessment_type === 'ryff_84');
    }
    
    console.log(`Filtered ${filteredAssessments.length} assessments for type: ${assessmentType}`);
    
    // Get latest assessment for each student
    const latestAssessments = {};
    filteredAssessments.forEach(assessment => {
      const studentId = assessment.student_id;
      if (!latestAssessments[studentId] || 
          new Date(assessment.completed_at) > new Date(latestAssessments[studentId].completed_at)) {
        latestAssessments[studentId] = assessment;
      }
    });

    // Initialize result structure with all dimensions
    const riskAlerts = DIMENSIONS.map(dimension => ({
      dimension: dimension.name,
      dimensionKey: dimension.key,
      totalAtRisk: 0,
      colleges: []
    }));

    // Process each student's latest assessment
    Object.values(latestAssessments).forEach(assessment => {
      const student = assessment.student;
      const scores = assessment.scores;
      
      if (!student || !scores) return;

      // Get the appropriate risk threshold for this assessment type
      const riskThreshold = RISK_THRESHOLDS[assessment.assessment_type] || RISK_THRESHOLDS.ryff_42;
      
      // Check each dimension for at-risk status
      DIMENSIONS.forEach((dimension, index) => {
        const score = scores[dimension.key];
        
        if (score !== undefined && score <= riskThreshold) {
          // Student is at risk for this dimension
          riskAlerts[index].totalAtRisk++;
          
          // Find or create college entry
          let collegeEntry = riskAlerts[index].colleges.find(c => c.name === student.college);
          if (!collegeEntry) {
            collegeEntry = {
              name: student.college,
              studentCount: 0,
              students: []
            };
            riskAlerts[index].colleges.push(collegeEntry);
          }
          
          collegeEntry.studentCount++;
          collegeEntry.students.push({
            id: student.id,
            name: student.name,
            section: student.section,
            score: score,
            assessmentType: assessment.assessment_type
          });
        }
      });
    });

    // Sort colleges by student count (descending) for each dimension
    riskAlerts.forEach(alert => {
      alert.colleges.sort((a, b) => b.studentCount - a.studentCount);
    });

    console.log('Risk alerts data processed successfully');
    res.json({
      success: true,
      data: riskAlerts,
      summary: {
        totalStudentsProcessed: Object.keys(latestAssessments).length,
        riskThresholds: RISK_THRESHOLDS,
        assessmentTypes: {
          ryff_42: allAssessments.filter(a => a.assessment_type === 'ryff_42').length,
          ryff_84: allAssessments.filter(a => a.assessment_type === 'ryff_84').length
        }
      }
    });

  } catch (error) {
    console.error('Error in risk alerts endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/risk-alerts/colleges
 * Returns list of all colleges for dropdown filters
 */
router.get('/colleges', async (req, res) => {
  try {
    const { data: colleges, error } = await supabase
      .from('students')
      .select('college')
      .eq('status', 'active')
      .not('college', 'is', null);

    if (error) {
      console.error('Error fetching colleges:', error);
      return res.status(500).json({ error: 'Failed to fetch colleges' });
    }

    const uniqueColleges = [...new Set(colleges.map(s => s.college))].sort();
    
    res.json({
      success: true,
      colleges: uniqueColleges
    });
  } catch (error) {
    console.error('Error in colleges endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/risk-alerts/sections
 * Returns list of all sections for dropdown filters
 */
router.get('/sections', async (req, res) => {
  try {
    const { data: sections, error } = await supabase
      .from('students')
      .select('section')
      .eq('status', 'active')
      .not('section', 'is', null);

    if (error) {
      console.error('Error fetching sections:', error);
      return res.status(500).json({ error: 'Failed to fetch sections' });
    }

    const uniqueSections = [...new Set(sections.map(s => s.section))].sort();
    
    res.json({
      success: true,
      sections: uniqueSections
    });
  } catch (error) {
    console.error('Error in sections endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;