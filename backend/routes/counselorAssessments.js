const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');
const { formatDimensionName, getDimensionColor, getAtRiskDimensions } = require('../utils/ryffScoring');

// Get all assessment results for counselor's bulk assessments
router.get('/results', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.session.user_id;
    const { page = 1, limit = 20, riskLevel, assessmentType, college } = req.query;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build query using manual joins since Supabase relationships aren't properly configured
    const { data: assessments, error } = await supabase
      .rpc('get_counselor_assessment_results', {
        counselor_id_param: counselorId,
        limit_param: limitNum,
        offset_param: offset
      });

    if (error) {
      console.error('Error fetching assessment results:', error);
      // Fallback to manual query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('assessments')
        .select('*')
        .limit(limitNum)
        .range(offset, offset + limitNum - 1);
      
      if (fallbackError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch assessment results'
        });
      }
      
      // Manually fetch related data for each assessment
      const enrichedData = [];
      for (const assessment of fallbackData) {
        // Get student data (only active students)
        const { data: student } = await supabase
          .from('students')
          .select('id, id_number, name, college, section, email')
          .eq('id', assessment.student_id)
          .eq('status', 'active')  // Only include active students
          .single();
        
        // Get assignment data
        const { data: assignment } = await supabase
          .from('assessment_assignments')
          .select('id, assigned_at, completed_at, bulk_assessment_id')
          .eq('id', assessment.assignment_id)
          .single();
        
        // Get bulk assessment data if assignment exists
        let bulkAssessment = null;
        if (assignment) {
          const { data: bulk } = await supabase
            .from('bulk_assessments')
            .select('id, assessment_name, counselor_id')
            .eq('id', assignment.bulk_assessment_id)
            .eq('counselor_id', counselorId)
            .neq('status', 'archived')  // Exclude archived bulk assessments
            .single();
          bulkAssessment = bulk;
        }
        
        // Only include if it belongs to this counselor AND student is active
        if (bulkAssessment && student) {
          enrichedData.push({
            ...assessment,
            student,
            assignment: {
              ...assignment,
              bulk_assessment: bulkAssessment
            }
          });
        }
      }
      
      const assessments = enrichedData;
    }

    // Apply filters to the enriched data
    let filteredAssessments = assessments;
    if (riskLevel) {
      filteredAssessments = filteredAssessments.filter(a => a.risk_level === riskLevel);
    }
    if (assessmentType) {
      filteredAssessments = filteredAssessments.filter(a => a.assessment_type === assessmentType);
    }
    if (college) {
      filteredAssessments = filteredAssessments.filter(a => a.student?.college === college);
    }

    // Sort by completion date
    filteredAssessments.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    
    const totalCount = filteredAssessments.length;

    // Enrich data with formatted information
    const enrichedAssessments = filteredAssessments.map(assessment => {
      const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
      const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
      
      return {
        ...assessment,
        at_risk_dimensions: atRiskDimensions,
        formatted_scores: Object.entries(assessment.scores).map(([dimension, score]) => ({
          dimension: formatDimensionName(dimension),
          score: parseFloat(score).toFixed(2),
          color: getDimensionColor(score, assessmentTypeParam),
          is_at_risk: score <= (assessmentTypeParam === 'ryff_84' ? 36 : 18)
        }))
      };
    });

    res.json({
      success: true,
      data: enrichedAssessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / parseInt(limit))
      }
    });

    console.log(`Returned ${enrichedAssessments.length} assessments out of ${totalCount} total for counselor ${counselorId}`);

  } catch (error) {
    console.error('Error in assessment results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed assessment result for a specific student
router.get('/results/:assessmentId', verifyCounselorSession, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const counselorId = req.session.user_id;

    // Get assessment with full details
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select(`
        *,
        students!inner(
          id,
          name,
          email,
          id_number,
          college,
          section,
          year_level
        ),
        assessment_assignments!inner(
          id,
          assigned_at,
          completed_at,
          bulk_assessments!inner(
            id,
            assessment_name,
            counselor_id,
            custom_message
          )
        ),
        assessment_analytics(
          time_taken_minutes,
          question_times,
          navigation_pattern
        )
      `)
      .eq('id', assessmentId)
      .eq('assessment_assignments.bulk_assessments.counselor_id', counselorId)
      .single();

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or access denied'
      });
    }

    // Get at-risk dimensions
    const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
    const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
    
    // Format dimension scores
    const formattedScores = Object.entries(assessment.scores).map(([dimension, score]) => ({
      dimension: formatDimensionName(dimension),
      raw_dimension: dimension,
      score: parseFloat(score).toFixed(2),
      color: getDimensionColor(score, assessmentTypeParam),
      is_at_risk: score <= (assessmentTypeParam === 'ryff_84' ? 36 : 18)
    }));

    // Calculate response patterns
    const responseAnalysis = {
      total_responses: Object.keys(assessment.responses).length,
      average_response: Object.values(assessment.responses).reduce((sum, val) => sum + val, 0) / Object.keys(assessment.responses).length,
      response_distribution: {
        1: Object.values(assessment.responses).filter(r => r === 1).length,
        2: Object.values(assessment.responses).filter(r => r === 2).length,
        3: Object.values(assessment.responses).filter(r => r === 3).length,
        4: Object.values(assessment.responses).filter(r => r === 4).length,
        5: Object.values(assessment.responses).filter(r => r === 5).length,
        6: Object.values(assessment.responses).filter(r => r === 6).length
      }
    };

    res.json({
      success: true,
      data: {
        ...assessment,
        at_risk_dimensions: atRiskDimensions,
        formatted_scores: formattedScores,
        response_analysis: responseAnalysis
      }
    });

  } catch (error) {
    console.error('Error in detailed assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get assessment statistics and analytics
router.get('/statistics', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.session.user_id;

    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_assessment_statistics', { counselor_uuid: counselorId });

    if (statsError) {
      console.error('Error fetching statistics:', statsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }

    // Get dimension risk summary
    const { data: dimensionRisks, error: dimensionError } = await supabase
      .rpc('get_dimension_risk_summary', { counselor_uuid: counselorId });

    if (dimensionError) {
      console.error('Error fetching dimension risks:', dimensionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dimension risk data'
      });
    }

    // Get recent assessments for trend analysis
    const { data: recentAssessments, error: recentError } = await supabase
      .from('assessments')
      .select(`
        completed_at,
        overall_score,
        risk_level,
        assessment_type,
        assignment:assessment_assignments!inner(
          bulk_assessment:bulk_assessments!inner(
            counselor_id,
            status
          )
        )
      `)
      .eq('assignment.bulk_assessment.counselor_id', counselorId)
      .neq('assignment.bulk_assessment.status', 'archived')  // Exclude archived bulk assessments
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('completed_at', { ascending: true });

    if (recentError) {
      console.error('Error fetching recent assessments:', recentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent assessment data'
      });
    }

    // Calculate trends
    const trends = {
      daily_completions: {},
      risk_level_trends: {
        healthy: 0,
        moderate: 0,
        at_risk: 0
      },
      average_scores_by_type: {}
    };

    recentAssessments.forEach(assessment => {
      const date = new Date(assessment.completed_at).toISOString().split('T')[0];
      trends.daily_completions[date] = (trends.daily_completions[date] || 0) + 1;
      trends.risk_level_trends[assessment.risk_level]++;
      
      if (!trends.average_scores_by_type[assessment.assessment_type]) {
        trends.average_scores_by_type[assessment.assessment_type] = {
          total: 0,
          count: 0
        };
      }
      trends.average_scores_by_type[assessment.assessment_type].total += assessment.overall_score;
      trends.average_scores_by_type[assessment.assessment_type].count++;
    });

    // Calculate averages
    Object.keys(trends.average_scores_by_type).forEach(type => {
      const data = trends.average_scores_by_type[type];
      trends.average_scores_by_type[type] = data.count > 0 ? (data.total / data.count).toFixed(2) : 0;
    });

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total_assessments: 0,
          completed_assessments: 0,
          pending_assessments: 0,
          at_risk_students: 0,
          average_score: 0,
          completion_rate: 0
        },
        dimension_risks: dimensionRisks || [],
        trends
      }
    });

  } catch (error) {
    console.error('Error in assessment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get students by risk level
router.get('/students/at-risk', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.session.user_id;
    const { riskLevel = 'at_risk', page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;

    // Get students with specified risk level
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        id,
        overall_score,
        risk_level,
        scores,
        completed_at,
        assessment_type,
        student:students(
          id,
          name,
          email,
          id_number,
          college,
          section,
          year_level,
          status
        ),
        assignment:assessment_assignments!inner(
          bulk_assessment:bulk_assessments!inner(
            counselor_id,
            assessment_name,
            status
          )
        )
      `)
      .eq('risk_level', riskLevel)
      .eq('assignment.bulk_assessment.counselor_id', counselorId)
      .eq('student.status', 'active')  // Only include active students
      .neq('assignment.bulk_assessment.status', 'archived')  // Exclude archived bulk assessments
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching at-risk students:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student data'
      });
    }

    // Enrich with at-risk dimensions
    const enrichedStudents = assessments.map(assessment => {
      const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
      const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
      
      return {
        ...assessment,
        at_risk_dimensions: atRiskDimensions.map(dim => formatDimensionName(dim))
      };
    });

    res.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: enrichedStudents.length
      }
    });

  } catch (error) {
    console.error('Error in at-risk students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export assessment data (CSV format)
router.get('/export', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.session.user_id;
    const { format = 'csv', riskLevel, assessmentType } = req.query;

    // Get all assessment data
    let query = supabase
      .from('assessments')
      .select(`
        *,
        student:students(
          name,
          email,
          id_number,
          college,
          section,
          year_level,
          status
        ),
        assignment:assessment_assignments!inner(
          assigned_at,
          completed_at,
          bulk_assessment:bulk_assessments!inner(
            assessment_name,
            counselor_id,
            status
          )
        )
      `)
      .eq('assignment.bulk_assessment.counselor_id', counselorId)
      .eq('student.status', 'active')  // Only include active students
      .neq('assignment.bulk_assessment.status', 'archived')  // Exclude archived bulk assessments
      .order('completed_at', { ascending: false });

    // Apply filters
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Error fetching export data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch export data'
      });
    }

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Student Name',
        'Email',
        'ID Number',
        'College',
        'Section',
        'Year Level',
        'Assessment Type',
        'Assessment Name',
        'Completed Date',
        'Overall Score',
        'Risk Level',
        'Autonomy Score',
        'Environmental Mastery Score',
        'Personal Growth Score',
        'Positive Relations Score',
        'Purpose in Life Score',
        'Self Acceptance Score',
        'At Risk Dimensions'
      ];

      const csvRows = assessments.map(assessment => {
        const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
        const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
        
        return [
          assessment.student.name,
          assessment.student.email,
          assessment.student.id_number,
          assessment.student.college,
          assessment.student.section,
          assessment.student.year_level,
          assessment.assessment_type,
          assessment.assignment.bulk_assessment.assessment_name,
          new Date(assessment.completed_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
          assessment.overall_score,
          assessment.risk_level,
          assessment.scores.autonomy || 0,
          assessment.scores.environmental_mastery || 0,
          assessment.scores.personal_growth || 0,
          assessment.scores.positive_relations || 0,
          assessment.scores.purpose_in_life || 0,
          assessment.scores.self_acceptance || 0,
          atRiskDimensions.map(dim => formatDimensionName(dim)).join('; ')
        ];
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="assessment_results_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: assessments
      });
    }

  } catch (error) {
    console.error('Error in export:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;