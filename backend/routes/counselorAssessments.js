const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const { verifyCounselorSession } = require('../middleware/sessionManager');
const { formatDimensionName, getDimensionColor, getAtRiskDimensions } = require('../utils/ryffScoring');

// Create admin client to bypass RLS for reading assessment data
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all assessment results for counselor's bulk assessments
router.get('/results', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 20, riskLevel, assessmentType, college } = req.query;
    

    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Determine which table to query based on assessment type
    let tableName = 'assessments'; // Default to unified view
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }

    // Manual approach: Get data step by step to avoid Supabase schema cache issues
    let assessments = [];
    
    if (tableName === 'assessments_42items') {
      console.log('🎯 Fetching 42-item assessments directly from table...');
      
      // SIMPLIFIED: Direct query to assessments_42items table
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments_42items')
        .select('*')
        .limit(limitNum)
        .range(offset, offset + limitNum - 1);

      if (assessmentError) {
        console.error('Error fetching 42-item assessments:', assessmentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch 42-item assessments'
        });
      }
      
      console.log(`✅ Found ${assessmentData?.length || 0} 42-item assessments`);
      
      if (!assessmentData || assessmentData.length === 0) {
        assessments = [];
      } else {
        // Get student data for these assessments
        const studentIds = [...new Set(assessmentData.map(a => a.student_id))];
        
        const { data: students, error: studentError } = await supabase
          .from('students')
          .select('id, id_number, name, college, section, email')
          .in('id', studentIds)
          .eq('status', 'active');
        
        if (studentError) {
          console.error('Error fetching students:', studentError);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch student data'
          });
        }
        
        // Combine assessment and student data (simplified structure)
        assessments = assessmentData.map(assessment => {
          const student = students.find(s => s.id === assessment.student_id);
          
          return {
            ...assessment,
            student: student,
            assignment: {
              id: assessment.assignment_id || 'N/A',
              assigned_at: assessment.created_at,
              completed_at: assessment.completed_at,
              bulk_assessment_id: 'direct-fetch',
              bulk_assessment: {
                assessment_name: '42-Item Ryff Assessment',
                assessment_type: 'ryff_42'
              }
            }
          };
        }).filter(a => a.student); // Only include assessments with valid students
      }
    } else if (tableName === 'assessments_84items') {
      console.log('🎯 Fetching 84-item assessments directly from table...');
      
      // SIMPLIFIED: Direct query to assessments_84items table using admin client to bypass RLS
      const { data: assessmentData, error: assessmentError } = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .limit(limitNum)
        .range(offset, offset + limitNum - 1);

      if (assessmentError) {
        console.error('Error fetching 84-item assessments:', assessmentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch 84-item assessments'
        });
      }
      
      console.log(`✅ Found ${assessmentData?.length || 0} 84-item assessments`);
      
      if (!assessmentData || assessmentData.length === 0) {
        assessments = [];
      } else {
        // Get student data for these assessments
        const studentIds = [...new Set(assessmentData.map(a => a.student_id))];
        
        const { data: students, error: studentError } = await supabase
          .from('students')
          .select('id, id_number, name, college, section, email')
          .in('id', studentIds)
          .eq('status', 'active');
        
        if (studentError) {
          console.error('Error fetching students:', studentError);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch student data'
          });
        }
        
        // Combine assessment and student data (simplified structure)
        assessments = assessmentData.map(assessment => {
          const student = students.find(s => s.id === assessment.student_id);
          
          console.log(`🔍 84-item assessment type in DB: ${assessment.assessment_type}`);
          
          return {
            ...assessment,
            student: student,
            assignment: {
              id: assessment.assignment_id || 'N/A',
              assigned_at: assessment.created_at,
              completed_at: assessment.completed_at,
              bulk_assessment_id: 'direct-fetch',
              bulk_assessment: {
                assessment_name: '84-Item Ryff Assessment',
                assessment_type: 'ryff_84'
              }
            }
          };
        }).filter(a => a.student); // Only include assessments with valid students
      }
    } else {
      // For unified view - fetch from both tables
      console.log('🎯 Fetching all assessments from unified view...');
      
      // Get both 42-item and 84-item assessments
      const [result42, result84] = await Promise.all([
        supabase.from('assessments_42items').select('*').limit(limitNum).range(offset, offset + limitNum - 1),
        supabase.from('assessments_84items').select('*').limit(limitNum).range(offset, offset + limitNum - 1)
      ]);
      
      let allAssessments = [];
      
      if (result42.data) allAssessments = allAssessments.concat(result42.data);
      if (result84.data) allAssessments = allAssessments.concat(result84.data);
      
      console.log(`✅ Found ${allAssessments.length} total assessments (${result42.data?.length || 0} 42-item + ${result84.data?.length || 0} 84-item)`);
      
      if (allAssessments.length === 0) {
        assessments = [];
      } else {
        // Get student data
        const studentIds = [...new Set(allAssessments.map(a => a.student_id))];
        
        const { data: students, error: studentError } = await supabase
          .from('students')
          .select('id, id_number, name, college, section, email')
          .in('id', studentIds)
          .eq('status', 'active');
        
        if (studentError) {
          console.error('Error fetching students:', studentError);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch student data'
          });
        }
        
        // Combine data
        assessments = allAssessments.map(assessment => {
          const student = students.find(s => s.id === assessment.student_id);
          
          return {
            ...assessment,
            student: student,
            assignment: {
              id: assessment.assignment_id || 'N/A',
              assigned_at: assessment.created_at,
              completed_at: assessment.completed_at,
              bulk_assessment_id: 'direct-fetch',
              bulk_assessment: {
                assessment_name: `${assessment.assessment_type === 'ryff_84' ? '84' : '42'}-Item Ryff Assessment`,
                assessment_type: assessment.assessment_type
              }
            }
          };
        }).filter(a => a.student);
      }
    }

    // Apply filters to the enriched data
    let filteredAssessments = assessments;
    console.log(`🔍 Before filtering: ${filteredAssessments.length} assessments`);
    
    if (riskLevel) {
      filteredAssessments = filteredAssessments.filter(a => a.risk_level === riskLevel);
      console.log(`🔍 After risk level filter: ${filteredAssessments.length} assessments`);
    }
    if (assessmentType) {
      console.log(`🔍 Applying assessment type filter: ${assessmentType}`);
      const beforeTypeFilter = filteredAssessments.length;
      filteredAssessments = filteredAssessments.filter(a => a.assessment_type === assessmentType);
      console.log(`🔍 After assessment type filter: ${filteredAssessments.length} assessments (was ${beforeTypeFilter})`);
    }
    if (college) {
      filteredAssessments = filteredAssessments.filter(a => a.student?.college === college);
      console.log(`🔍 After college filter: ${filteredAssessments.length} assessments`);
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
    const counselorId = req.user.id;

    // Get assessment details
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Determine which table to query based on assessment type
    let tableName = 'assessments'; // Default to unified view
    if (assessment.assessment_type === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessment.assessment_type === 'ryff_84') {
      tableName = 'assessments_84items';
    }

    // Get assessment with all related data - different approach for specific tables vs unified view
    let assessmentData, assessmentError;
    
    if (tableName === 'assessments') {
      // Use the original query for the unified view (which has assignment_id)
      const result = await supabase
        .from(tableName)
        .select(`
          *,
          student:students!inner(
            id, name, email, id_number, college, section, year_level
          ),
          assignment:assessment_assignments!inner(
            id, assigned_at, completed_at, bulk_assessment_id,
            bulk_assessment:bulk_assessments!inner(
              id, assessment_name, counselor_id, custom_message
            )
          ),
          analytics:assessment_analytics(
            time_taken_minutes, question_times, navigation_pattern
          )
        `)
        .eq('id', assessmentId)
        .eq('students.status', 'active')
        .eq('assessment_assignments.bulk_assessments.counselor_id', counselorId)
        .single();
      assessmentData = result.data;
      assessmentError = result.error;
    } else {
      // For specific tables, query without assignment joins and manually fetch related data
      // Use admin client for assessments_84items to bypass RLS
      const client = tableName === 'assessments_84items' ? supabaseAdmin : supabase;
      const result = await client
        .from(tableName)
        .select(`
          *,
          student:students!inner(
            id, name, email, id_number, college, section, year_level
          ),
          analytics:assessment_analytics(
            time_taken_minutes, question_times, navigation_pattern
          )
        `)
        .eq('id', assessmentId)
        .eq('students.status', 'active')
        .single();
      
      if (result.error || !result.data) {
        assessmentData = null;
        assessmentError = result.error;
      } else {
        // Manually fetch assignment data for this student
        const { data: assignments } = await supabase
          .from('assessment_assignments')
          .select(`
            id, assigned_at, completed_at, bulk_assessment_id,
            bulk_assessment:bulk_assessments!inner(
              id, assessment_name, counselor_id, custom_message
            )
          `)
          .eq('student_id', result.data.student_id)
          .eq('bulk_assessments.counselor_id', counselorId)
          .neq('bulk_assessments.status', 'archived')
          .order('assigned_at', { ascending: false })
          .limit(1);
        
        if (assignments && assignments.length > 0) {
          assessmentData = {
            ...result.data,
            assignment: assignments[0]
          };
          assessmentError = null;
        } else {
          assessmentData = null;
          assessmentError = { message: 'No valid assignment found for this assessment' };
        }
      }
    }

    if (assessmentError || !assessmentData) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or access denied'
      });
    }

    // Extract data from joined result
    const assessmentResult = assessmentData;
    const student = assessmentData.student;
    const assignment = assessmentData.assignment;
    const bulkAssessment = assessmentData.assignment.bulk_assessment;
    const analytics = assessmentData.analytics;

    // Get at-risk dimensions
    const assessmentTypeParam = assessmentResult.assessment_type || 'ryff_42';
    const atRiskDimensions = getAtRiskDimensions(assessmentResult.scores, assessmentTypeParam);
    
    // Format dimension scores
    const formattedScores = Object.entries(assessmentResult.scores).map(([dimension, score]) => ({
      dimension: formatDimensionName(dimension),
      raw_dimension: dimension,
      score: parseFloat(score).toFixed(2),
      color: getDimensionColor(score, assessmentTypeParam),
      is_at_risk: score <= (assessmentTypeParam === 'ryff_84' ? 36 : 18)
    }));

    // Calculate response patterns
    const responseAnalysis = {
      total_responses: Object.keys(assessmentResult.responses).length,
      average_response: Object.values(assessmentResult.responses).reduce((sum, val) => sum + val, 0) / Object.keys(assessmentResult.responses).length,
      response_distribution: {
        1: Object.values(assessmentResult.responses).filter(r => r === 1).length,
        2: Object.values(assessmentResult.responses).filter(r => r === 2).length,
        3: Object.values(assessmentResult.responses).filter(r => r === 3).length,
        4: Object.values(assessmentResult.responses).filter(r => r === 4).length,
        5: Object.values(assessmentResult.responses).filter(r => r === 5).length,
        6: Object.values(assessmentResult.responses).filter(r => r === 6).length
      }
    };

    res.json({
      success: true,
      data: {
        ...assessmentResult,
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
    const counselorId = req.user.id;

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
    const counselorId = req.user.id;
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
    const counselorId = req.user.id;
    const { format = 'csv', riskLevel, assessmentType } = req.query;

    // Determine which table to query based on assessment type
    let tableName = 'assessments'; // Default to unified view
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }

    // Get all assessment data - different approach for specific tables vs unified view
    let rawAssessments, error;
    
    if (tableName === 'assessments') {
      // Use the original query for the unified view (which has assignment_id)
      let query = supabase
        .from(tableName)
        .select(`
          *,
          student:students!inner(
            name, email, id_number, college, section, year_level, status
          ),
          assignment:assessment_assignments!inner(
            assigned_at, completed_at, bulk_assessment_id,
            bulk_assessment:bulk_assessments!inner(
              assessment_name, counselor_id, status
            )
          )
        `)
        .eq('students.status', 'active')
        .eq('assessment_assignments.bulk_assessments.counselor_id', counselorId)
        .neq('assessment_assignments.bulk_assessments.status', 'archived')
        .order('completed_at', { ascending: false });

      // Apply filters
      if (riskLevel) {
        query = query.eq('risk_level', riskLevel);
      }

      const result = await query;
      rawAssessments = result.data;
      error = result.error;
    } else {
      // For specific tables, query without assignment joins and manually fetch related data
      let query = supabase
        .from(tableName)
        .select(`
          *,
          student:students!inner(
            name, email, id_number, college, section, year_level, status
          )
        `)
        .eq('students.status', 'active')
        .order('completed_at', { ascending: false });

      // Apply filters
      if (riskLevel) {
        query = query.eq('risk_level', riskLevel);
      }

      const result = await query;
      
      if (result.error) {
        rawAssessments = null;
        error = result.error;
      } else {
        // Manually enrich with assignment data
        const enrichedData = [];
        for (const assessment of result.data) {
          // Find assignments for this student
          const { data: assignments } = await supabase
            .from('assessment_assignments')
            .select(`
              assigned_at, completed_at, bulk_assessment_id,
              bulk_assessment:bulk_assessments!inner(
                assessment_name, counselor_id, status
              )
            `)
            .eq('student_id', assessment.student_id)
            .eq('bulk_assessments.counselor_id', counselorId)
            .neq('bulk_assessments.status', 'archived')
            .order('assigned_at', { ascending: false })
            .limit(1);
          
          if (assignments && assignments.length > 0) {
            enrichedData.push({
              ...assessment,
              assignment: assignments[0]
            });
          }
        }
        rawAssessments = enrichedData;
        error = null;
      }
    }

    if (error) {
      console.error('Error fetching assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessments'
      });
    }

    // Process the joined data
    const assessments = rawAssessments.map(assessment => ({
      ...assessment,
      student: assessment.student,
      assignment: {
        ...assessment.assignment,
        bulk_assessment: assessment.assignment.bulk_assessment
      }
    }));

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