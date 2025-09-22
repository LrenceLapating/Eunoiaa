const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/database');
const { verifyCounselorSession } = require('../middleware/sessionManager');
const { formatDimensionName, getDimensionColor, getAtRiskDimensions } = require('../utils/ryffScoring');

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
      
      let assessmentData;
      let studentIds = [];
      
      if (college) {
        // OPTIMIZED: First get students from the specified college
        console.log(`🔍 Getting students from college: ${college}`);
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, name, college, year_level, section')
          .eq('college', college)
          .eq('status', 'active');
        
        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          return res.status(500).json({ success: false, message: 'Failed to fetch students' });
        }
        
        console.log(`✅ Found ${students?.length || 0} students in ${college}`);
        
        if (!students || students.length === 0) {
          assessments = [];
        } else {
          studentIds = students.map(s => s.id);
          
          // Fetch assessments for these students only
          const { data: filteredAssessments, error: assessmentError } = await supabase
            .from('assessments_42items')
            .select('*')
            .in('student_id', studentIds)
            .limit(limitNum)
            .range(offset, offset + limitNum - 1);
          
          if (assessmentError) {
            console.error('Error fetching 42-item assessments:', assessmentError);
            return res.status(500).json({
              success: false,
              message: 'Failed to fetch 42-item assessments'
            });
          }
          
          assessmentData = filteredAssessments;
          console.log(`✅ Found ${assessmentData?.length || 0} 42-item assessments for college`);
          
          // Create student map for quick lookup
          const studentMap = {};
          students.forEach(student => {
            studentMap[student.id] = student;
          });
          
          // Combine assessment and student data
          assessments = assessmentData.map(assessment => {
            const student = studentMap[assessment.student_id];
            
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
          }).filter(a => a.student);
        }
      } else {
        // Original logic when no college filter
        const { data: allAssessments, error: assessmentError } = await supabase
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
        
        console.log(`✅ Found ${allAssessments?.length || 0} 42-item assessments`);
        
        if (!allAssessments || allAssessments.length === 0) {
          assessments = [];
        } else {
          // Get student data for these assessments
          studentIds = [...new Set(allAssessments.map(a => a.student_id))];
          
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
                  assessment_name: '42-Item Ryff Assessment',
                  assessment_type: 'ryff_42'
                }
              }
            };
          }).filter(a => a.student); // Only include assessments with valid students
        }
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
      // OPTIMIZED: For unified view - use single query with UNION for better performance
      console.log('🎯 Fetching all assessments from unified view with optimized query...');
      
      // Build filters for both queries
      let collegeFilter = '';
      let riskFilter = '';
      let assessmentTypeFilter = '';
      
      if (college) {
        collegeFilter = `AND s.college = '${college}'`;
      }
      if (riskLevel) {
        riskFilter = `AND a.risk_level = '${riskLevel}'`;
      }
      if (assessmentType) {
        assessmentTypeFilter = `AND a.assessment_type = '${assessmentType}'`;
      }
      
      // Use raw SQL with UNION for optimal performance
      const query = `
        (
          SELECT 
            a.id, a.student_id, a.assessment_type, a.total_score, a.risk_level, 
            a.scores, a.created_at, a.completed_at, a.assignment_id,
            s.id as student_id_ref, s.id_number, s.name, s.college, s.section, s.email
          FROM assessments_42items a
          JOIN students s ON a.student_id = s.id
          WHERE s.status = 'active' ${collegeFilter} ${riskFilter} ${assessmentTypeFilter}
        )
        UNION ALL
        (
          SELECT 
            a.id, a.student_id, a.assessment_type, a.total_score, a.risk_level, 
            a.scores, a.created_at, a.completed_at, a.assignment_id,
            s.id as student_id_ref, s.id_number, s.name, s.college, s.section, s.email
          FROM assessments_84items a
          JOIN students s ON a.student_id = s.id
          WHERE s.status = 'active' ${collegeFilter} ${riskFilter} ${assessmentTypeFilter}
        )
        ORDER BY completed_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      
      // OPTIMIZED: Use efficient queries with JOINs instead of Promise.all
      let allAssessments = [];
      
      // Build query filters
      let query42 = supabase
        .from('assessments_42items')
        .select(`
          *,
          student:students!inner(
            id, id_number, name, college, section, email
          )
        `)
        .eq('students.status', 'active')
        .order('completed_at', { ascending: false });
      
      let query84 = supabaseAdmin
        .from('assessments_84items')
        .select(`
          *,
          student:students!inner(
            id, id_number, name, college, section, email
          )
        `)
        .eq('students.status', 'active')
        .order('completed_at', { ascending: false });
      
      // Apply filters at database level
      if (college) {
        query42 = query42.eq('students.college', college);
        query84 = query84.eq('students.college', college);
      }
      if (riskLevel) {
        query42 = query42.eq('risk_level', riskLevel);
        query84 = query84.eq('risk_level', riskLevel);
      }
      
      // Execute queries sequentially to avoid overwhelming the database
      const { data: assessments42, error: error42 } = await query42;
      if (error42) {
        console.error('Error fetching 42-item assessments:', error42);
      } else if (assessments42) {
        allAssessments = allAssessments.concat(assessments42.map(a => ({
          ...a,
          student: a.student,
          assignment: {
            id: a.assignment_id || 'N/A',
            assigned_at: a.created_at,
            completed_at: a.completed_at,
            bulk_assessment_id: 'direct-fetch',
            bulk_assessment: {
              assessment_name: '42-Item Ryff Assessment',
              assessment_type: 'ryff_42'
            }
          }
        })));
      }
      
      const { data: assessments84, error: error84 } = await query84;
      if (error84) {
        console.error('Error fetching 84-item assessments:', error84);
      } else if (assessments84) {
        allAssessments = allAssessments.concat(assessments84.map(a => ({
          ...a,
          student: a.student,
          assignment: {
            id: a.assignment_id || 'N/A',
            assigned_at: a.created_at,
            completed_at: a.completed_at,
            bulk_assessment_id: 'direct-fetch',
            bulk_assessment: {
              assessment_name: '84-Item Ryff Assessment',
              assessment_type: 'ryff_84'
            }
          }
        })));
      }
      
      // Apply assessment type filter if needed
      if (assessmentType) {
        allAssessments = allAssessments.filter(a => a.assessment_type === assessmentType);
      }
      
      // Sort by completion date
      allAssessments.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
      
      // Apply pagination
      assessments = allAssessments.slice(offset, offset + limitNum);
      
      console.log(`✅ Optimized query returned ${assessments.length} assessments out of ${allAssessments.length} total`);
    }

    // OPTIMIZED: Filtering is now done at database level, no need for application-level filtering
    let filteredAssessments = assessments;
    console.log(`🔍 Final assessments count: ${filteredAssessments.length} assessments`);
    
    // Get total count for pagination (this would need to be calculated differently for accurate pagination)
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

// Get students by risk level - Updated to include both 42-item and 84-item assessments
router.get('/students/at-risk', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 20, assessmentType } = req.query;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Fetch at-risk students based on assessment type filter
    let result42 = { data: [], error: null };
    let result84 = { data: [], error: null };
    
    if (!assessmentType || assessmentType === 'ryff_42') {
      result42 = await supabase
        .from('assessments_42items')
        .select('*')
        .eq('risk_level', 'high')
        .order('created_at', { ascending: false });
    }
    
    if (!assessmentType || assessmentType === 'ryff_84') {
      result84 = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .eq('risk_level', 'high')
        .order('created_at', { ascending: false });
    }

    if (result42.error) {
      console.error('Error fetching 42-item at-risk students:', result42.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 42-item at-risk student data'
      });
    }

    if (result84.error) {
      console.error('Error fetching 84-item at-risk students:', result84.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 84-item at-risk student data'
      });
    }

    // Combine assessments from both tables
    let allAssessments = [];
    if (result42.data) {
      allAssessments = allAssessments.concat(result42.data.map(a => ({...a, assessment_type: 'ryff_42'})));
    }
    if (result84.data) {
      allAssessments = allAssessments.concat(result84.data.map(a => ({...a, assessment_type: 'ryff_84'})));
    }

    // Sort by created_at and deduplicate by student_id (keep only latest assessment per student)
    allAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Deduplicate: keep only the latest assessment per student
    const uniqueAssessments = [];
    const seenStudents = new Set();
    
    for (const assessment of allAssessments) {
      if (!seenStudents.has(assessment.student_id)) {
        uniqueAssessments.push(assessment);
        seenStudents.add(assessment.student_id);
      }
    }
    
    // Apply pagination to deduplicated results
    const paginatedAssessments = uniqueAssessments.slice(offset, offset + limitNum);

    let enrichedStudents = [];
    
    if (paginatedAssessments && paginatedAssessments.length > 0) {
      // Get student data for these assessments
      const studentIds = [...new Set(paginatedAssessments.map(a => a.student_id))];
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, id_number, name, college, section, email, year_level')
        .in('id', studentIds)
        .eq('status', 'active');
      
      if (studentError) {
        console.error('Error fetching students:', studentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch student data'
        });
      }
      
      // Combine assessment and student data
      enrichedStudents = paginatedAssessments.map(assessment => {
        const student = students.find(s => s.id === assessment.student_id);
        if (!student) return null;
        
        const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
        const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
        
        return {
          ...assessment,
          student: student,
          at_risk_dimensions: atRiskDimensions.map(dim => formatDimensionName(dim))
        };
      }).filter(a => a !== null);
    }

    res.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: uniqueAssessments.length
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

// Get moderate risk students - Updated to include both 42-item and 84-item assessments
router.get('/students/moderate', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 20, assessmentType } = req.query;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Fetch moderate students based on assessment type filter
    let result42 = { data: [], error: null };
    let result84 = { data: [], error: null };
    
    if (!assessmentType || assessmentType === 'ryff_42') {
      result42 = await supabase
        .from('assessments_42items')
        .select('*')
        .eq('risk_level', 'moderate')
        .order('created_at', { ascending: false });
    }
    
    if (!assessmentType || assessmentType === 'ryff_84') {
      result84 = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .eq('risk_level', 'moderate')
        .order('created_at', { ascending: false });
    }

    if (result42.error) {
      console.error('Error fetching 42-item moderate students:', result42.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 42-item moderate student data'
      });
    }

    if (result84.error) {
      console.error('Error fetching 84-item moderate students:', result84.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 84-item moderate student data'
      });
    }

    // Combine assessments from both tables
    let allAssessments = [];
    if (result42.data) {
      allAssessments = allAssessments.concat(result42.data.map(a => ({...a, assessment_type: 'ryff_42'})));
    }
    if (result84.data) {
      allAssessments = allAssessments.concat(result84.data.map(a => ({...a, assessment_type: 'ryff_84'})));
    }

    // Sort by created_at and deduplicate by student_id (keep only latest assessment per student)
    allAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Deduplicate: keep only the latest assessment per student
    const uniqueAssessments = [];
    const seenStudents = new Set();
    
    for (const assessment of allAssessments) {
      if (!seenStudents.has(assessment.student_id)) {
        uniqueAssessments.push(assessment);
        seenStudents.add(assessment.student_id);
      }
    }
    
    // Apply pagination to deduplicated results
    const paginatedAssessments = uniqueAssessments.slice(offset, offset + limitNum);

    let enrichedStudents = [];
    
    if (paginatedAssessments && paginatedAssessments.length > 0) {
      // Get student data for these assessments
      const studentIds = [...new Set(paginatedAssessments.map(a => a.student_id))];
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, id_number, name, college, section, email, year_level')
        .in('id', studentIds)
        .eq('status', 'active');
      
      if (studentError) {
        console.error('Error fetching students:', studentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch student data'
        });
      }
      
      // Combine assessment and student data
      enrichedStudents = paginatedAssessments.map(assessment => {
        const student = students.find(s => s.id === assessment.student_id);
        if (!student) return null;
        
        const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
        const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
        
        return {
          ...assessment,
          student: student,
          at_risk_dimensions: atRiskDimensions.map(dim => formatDimensionName(dim))
        };
      }).filter(a => a !== null);
    }

    res.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: uniqueAssessments.length
      }
    });

  } catch (error) {
    console.error('Error in moderate students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get healthy students - Updated to include both 42-item and 84-item assessments
router.get('/students/healthy', verifyCounselorSession, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { page = 1, limit = 20, assessmentType } = req.query;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Fetch healthy students based on assessment type filter
    let result42 = { data: [], error: null };
    let result84 = { data: [], error: null };
    
    if (!assessmentType || assessmentType === 'ryff_42') {
      result42 = await supabase
        .from('assessments_42items')
        .select('*')
        .eq('risk_level', 'low')
        .order('created_at', { ascending: false });
    }
    
    if (!assessmentType || assessmentType === 'ryff_84') {
      result84 = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .eq('risk_level', 'low')
        .order('created_at', { ascending: false });
    }

    if (result42.error) {
      console.error('Error fetching 42-item healthy students:', result42.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 42-item healthy student data'
      });
    }

    if (result84.error) {
      console.error('Error fetching 84-item healthy students:', result84.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 84-item healthy student data'
      });
    }

    // Combine assessments from both tables
    let allAssessments = [];
    if (result42.data) {
      allAssessments = allAssessments.concat(result42.data.map(a => ({...a, assessment_type: 'ryff_42'})));
    }
    if (result84.data) {
      allAssessments = allAssessments.concat(result84.data.map(a => ({...a, assessment_type: 'ryff_84'})));
    }

    // Sort by created_at and apply pagination
    allAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const paginatedAssessments = allAssessments.slice(offset, offset + limitNum);

    let enrichedStudents = [];
    
    if (paginatedAssessments && paginatedAssessments.length > 0) {
      // Get student data for these assessments
      const studentIds = [...new Set(paginatedAssessments.map(a => a.student_id))];
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, id_number, name, college, section, email, year_level')
        .in('id', studentIds)
        .eq('status', 'active');
      
      if (studentError) {
        console.error('Error fetching students:', studentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch student data'
        });
      }
      
      // Combine assessment and student data
      enrichedStudents = paginatedAssessments.map(assessment => {
        const student = students.find(s => s.id === assessment.student_id);
        if (!student) return null;
        
        const assessmentTypeParam = assessment.assessment_type || 'ryff_42';
        const atRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentTypeParam);
        
        return {
          ...assessment,
          student: student,
          at_risk_dimensions: atRiskDimensions.map(dim => formatDimensionName(dim))
        };
      }).filter(a => a !== null);
    }

    res.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allAssessments.length
      }
    });

  } catch (error) {
    console.error('Error in healthy students:', error);
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

// Get historical assessment results from ryff_history table
router.get('/history', verifyCounselorSession, async (req, res) => {
  try {
    const { page = 1, limit = 50, riskLevel, assessmentType, college } = req.query;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    console.log('🔍 Fetching historical assessment data from ryff_history table...');
    
    // Build query for ryff_history table
    let query = supabaseAdmin
      .from('ryff_history')
      .select(`
        id,
        original_id,
        student_id,
        assessment_type,
        responses,
        scores,
        overall_score,
        risk_level,
        at_risk_dimensions,
        assignment_id,
        completed_at,
        created_at,
        updated_at,
        archived_at,
        completion_time
      `)
      .order('archived_at', { ascending: false })
      .order('completed_at', { ascending: false });

    // Apply filters
    if (assessmentType && assessmentType !== 'all') {
      query = query.eq('assessment_type', assessmentType);
    }
    
    if (riskLevel && riskLevel !== 'all') {
      query = query.eq('risk_level', riskLevel);
    }

    // Execute query with pagination
    const { data: historyData, error: historyError, count } = await query
      .range(offset, offset + limitNum - 1)
      .limit(limitNum);

    if (historyError) {
      console.error('Error fetching historical data:', historyError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch historical assessment data'
      });
    }

    console.log(`✅ Found ${historyData?.length || 0} historical assessments`);

    if (!historyData || historyData.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Get unique student IDs from historical data
    const studentIds = [...new Set(historyData.map(h => h.student_id))];
    
    // Fetch student data (including both active and inactive students)
    // We need to get student data from both active students table and potentially students_history
    const { data: activeStudents, error: activeStudentError } = await supabase
      .from('students')
      .select('id, id_number, name, college, section, email, status')
      .in('id', studentIds);

    if (activeStudentError) {
      console.error('Error fetching active students:', activeStudentError);
    }

    // For students not found in active table, try to get basic info from the history data itself
    // or create placeholder student objects
    const studentMap = new Map();
    
    if (activeStudents) {
      activeStudents.forEach(student => {
        studentMap.set(student.id, student);
      });
    }

    // completion_time is now directly available from ryff_history table
    // No need to fetch from original assessment tables

    // Create combined assessment data with student information
    const combinedData = historyData.map(assessment => {
      const student = studentMap.get(assessment.student_id) || {
        id: assessment.student_id,
        id_number: `HIST-${assessment.student_id.slice(-8)}`,
        name: 'Historical Student',
        college: 'Unknown',
        section: 'Unknown',
        email: '',
        status: 'inactive'
      };

      // completion_time is now directly available from ryff_history
      return {
        ...assessment,
        completion_time: assessment.completion_time,
        student: student,
        assignment: {
          id: assessment.assignment_id || 'N/A',
          assigned_at: assessment.created_at,
          completed_at: assessment.completed_at,
          bulk_assessment_id: 'historical-data',
          bulk_assessment: {
            assessment_name: assessment.assessment_type === 'ryff_42' ? '42-Item Ryff Assessment' : '84-Item Ryff Assessment',
            assessment_type: assessment.assessment_type
          }
        }
      };
    });

    // Apply college filter if specified
    let filteredData = combinedData;
    if (college && college !== 'all') {
      filteredData = combinedData.filter(item => item.student.college === college);
    }

    const totalPages = Math.ceil((count || filteredData.length) / limitNum);

    res.json({
      success: true,
      data: filteredData,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: count || filteredData.length,
        totalPages: totalPages
      }
    });

  } catch (error) {
    console.error('Error in historical data fetch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching historical data'
    });
  }
});

// Get specific student's assessment history for reports
router.get('/student/:studentId/history', verifyCounselorSession, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { includeArchived = 'true' } = req.query;

    console.log(`🔍 Fetching assessment history for student ID: ${studentId}`);

    // First, get student information
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, id_number, name, college, section, email, status')
      .eq('id', studentId)
      .single();

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('Error fetching student:', studentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student information'
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Optimized: Get current assessments from both tables sequentially to avoid Promise.all overhead
    let allAssessments = [];
    
    // Fetch 42-item assessments
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select(`
        id,
        student_id,
        assessment_type,
        responses,
        scores,
        overall_score,
        risk_level,
        at_risk_dimensions,
        assignment_id,
        completed_at,
        created_at,
        updated_at
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (error42) {
      console.error('Error fetching 42-item assessments:', error42);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 42-item assessments'
      });
    }

    // Fetch 84-item assessments
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select(`
        id,
        student_id,
        assessment_type,
        responses,
        scores,
        overall_score,
        risk_level,
        at_risk_dimensions,
        assignment_id,
        completed_at,
        created_at,
        updated_at
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (error84) {
      console.error('Error fetching 84-item assessments:', error84);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch 84-item assessments'
      });
    }

    // Combine assessments from both tables
    allAssessments = [
      ...(assessments42 || []),
      ...(assessments84 || [])
    ];

    // If includeArchived is true, also get historical assessments
    if (includeArchived === 'true') {
      const { data: historicalAssessments, error: historyError } = await supabaseAdmin
        .from('ryff_history')
        .select(`
          id,
          original_id,
          student_id,
          assessment_type,
          responses,
          scores,
          overall_score,
          risk_level,
          at_risk_dimensions,
          assignment_id,
          completed_at,
          created_at,
          updated_at,
          archived_at
        `)
        .eq('student_id', studentId)
        .order('archived_at', { ascending: false });

      if (historyError) {
        console.error('Error fetching historical assessments:', historyError);
        // Don't fail the request, just log the error
      } else if (historicalAssessments && historicalAssessments.length > 0) {
        // Mark historical assessments and add them to the list
        const markedHistoricalAssessments = historicalAssessments.map(assessment => ({
          ...assessment,
          isArchived: true,
          displayDate: assessment.archived_at || assessment.completed_at
        }));
        allAssessments = [...allAssessments, ...markedHistoricalAssessments];
      }
    }

    // Sort all assessments by completion date (most recent first)
    allAssessments.sort((a, b) => {
      const dateA = new Date(a.displayDate || a.completed_at);
      const dateB = new Date(b.displayDate || b.completed_at);
      return dateB - dateA;
    });

    // Transform assessments to include additional metadata
    const transformedAssessments = allAssessments.map((assessment, index) => {
      const assessmentTypeMapping = {
        'ryff_42': '42-item',
        'ryff_84': '84-item'
      };

      return {
        id: assessment.id,
        originalId: assessment.original_id || assessment.id,
        studentId: assessment.student_id,
        assessmentType: assessmentTypeMapping[assessment.assessment_type] || '42-item',
        assessmentTypeRaw: assessment.assessment_type,
        responses: assessment.responses,
        scores: assessment.scores,
        overallScore: assessment.overall_score,
        riskLevel: assessment.risk_level,
        atRiskDimensions: assessment.at_risk_dimensions || [],
        assignmentId: assessment.assignment_id,
        completedAt: assessment.completed_at,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at,
        archivedAt: assessment.archived_at || null,
        isArchived: assessment.isArchived || false,
        assessmentNumber: allAssessments.length - index, // Number from oldest to newest
        displayDate: assessment.displayDate || assessment.completed_at
      };
    });

    console.log(`✅ Found ${transformedAssessments.length} assessments for student ${student.name}`);

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          idNumber: student.id_number,
          name: student.name,
          college: student.college,
          section: student.section,
          email: student.email,
          status: student.status
        },
        assessments: transformedAssessments,
        totalAssessments: transformedAssessments.length,
        currentAssessments: transformedAssessments.filter(a => !a.isArchived).length,
        archivedAssessments: transformedAssessments.filter(a => a.isArchived).length
      }
    });

  } catch (error) {
    console.error('Error fetching student assessment history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate PDF report for individual student
router.get('/student/:studentId/report/pdf', verifyCounselorSession, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student information
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, id_number, name, college, year_level, email')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all assessment data for the student from both tables
    const assessmentData = [];
    
    // Fetch from 42-item assessments
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });
    
    if (assessments42 && assessments42.length > 0) {
      assessmentData.push(...assessments42.map(assessment => ({
        ...assessment,
        assessment_type: 'ryff_42'
      })));
    }
    
    // Fetch from 84-item assessments
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });
    
    if (assessments84 && assessments84.length > 0) {
      assessmentData.push(...assessments84.map(assessment => ({
        ...assessment,
        assessment_type: 'ryff_84'
      })));
    }
    
    // Check if student has any assessments
    if (assessmentData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No assessments found for this student'
      });
    }
    
    // Sort all assessments by completion date (newest first)
    assessmentData.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    if (assessmentData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No assessment data found for the specified assessments'
      });
    }

    // Generate PDF using puppeteer
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Create HTML content for the PDF
    const htmlContent = generateReportHTML(student, assessmentData);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    // Set response headers for PDF download
    const filename = `${student.name.replace(/\s+/g, '_')}_Wellbeing_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating PDF'
    });
  }
});

// Helper function to generate HTML content for PDF
function generateReportHTML(student, assessmentData) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate average scores across assessments
  const dimensionNames = ['autonomy', 'environmental_mastery', 'personal_growth', 'positive_relations', 'purpose_in_life', 'self_acceptance'];
  const averageScores = {};
  
  dimensionNames.forEach(dimension => {
    const scores = assessmentData.map(assessment => assessment.scores[dimension]).filter(score => score !== undefined);
    averageScores[dimension] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });

  const overallAverage = Math.round(Object.values(averageScores).reduce((a, b) => a + b, 0));

  // Determine risk level based on overall average
  let riskLevel = 'healthy';
  if (overallAverage < 126) riskLevel = 'at-risk';
  else if (overallAverage < 168) riskLevel = 'moderate';

  const riskColor = riskLevel === 'at-risk' ? '#dc3545' : riskLevel === 'moderate' ? '#ffc107' : '#28a745';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Psychological Well-Being Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 300;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .student-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .student-info h2 {
          margin-top: 0;
          color: #495057;
          font-size: 20px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .info-label {
          font-weight: 600;
          color: #6c757d;
        }
        .info-value {
          color: #495057;
        }
        .summary-section {
          margin-bottom: 30px;
        }
        .summary-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .overall-score {
          font-size: 48px;
          font-weight: bold;
          color: ${riskColor};
          margin: 10px 0;
        }
        .risk-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          background-color: ${riskColor};
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .dimensions-section {
          margin-bottom: 30px;
        }
        .dimensions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .dimension-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .dimension-name {
          font-weight: 600;
          color: #495057;
          margin-bottom: 10px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dimension-score {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 5px;
        }
        .dimension-max {
          font-size: 12px;
          color: #6c757d;
        }
        .assessments-section {
          margin-bottom: 30px;
        }
        .assessment-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .assessment-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }
        .assessment-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #dee2e6;
        }
        .assessment-table tr:last-child td {
          border-bottom: none;
        }
        .footer {
          margin-top: 40px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
        h2 {
          color: #495057;
          font-size: 20px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #667eea;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>EUNOIA Psychological Well-Being Report</h1>
        <p>Comprehensive Assessment Based on Ryff's Six-Factor Model</p>
      </div>

      <div class="student-info">
        <h2>Student Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">${student.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Student ID:</span>
            <span class="info-value">${student.id_number}</span>
          </div>
          <div class="info-item">
            <span class="info-label">College:</span>
            <span class="info-value">${student.college}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Year Level:</span>
            <span class="info-value">${student.year_level}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Report Date:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Assessments Included:</span>
            <span class="info-value">${assessmentData.length}</span>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <h2>Overall Well-Being Summary</h2>
        <div class="summary-card">
          <div class="overall-score">${overallAverage}</div>
          <div class="risk-badge">${riskLevel.replace('-', ' ')}</div>
          <p style="margin-top: 15px; color: #6c757d;">
            Average score across ${assessmentData.length} assessment${assessmentData.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div class="dimensions-section">
        <h2>Well-Being Dimensions</h2>
        <div class="dimensions-grid">
          ${dimensionNames.map(dimension => `
            <div class="dimension-card">
              <div class="dimension-name">${dimension.replace('_', ' ')}</div>
              <div class="dimension-score">${averageScores[dimension]}</div>
              <div class="dimension-max">out of 42</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="assessments-section">
        <h2>Assessment History</h2>
        <table class="assessment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Overall Score</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${assessmentData.map(assessment => `
              <tr>
                <td>${new Date(assessment.completed_at).toLocaleDateString()}</td>
                <td>${assessment.assessment_type.toUpperCase()}</td>
                <td>${assessment.overall_score}</td>
                <td style="color: ${assessment.risk_level === 'at-risk' ? '#dc3545' : assessment.risk_level === 'moderate' ? '#ffc107' : '#28a745'}">
                  ${assessment.risk_level.replace('-', ' ').toUpperCase()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This report was generated by EUNOIA - AI-Powered Psychological Well-Being Assessment System</p>
        <p>University of the Immaculate Conception | Generated on ${currentDate}</p>
        <p><strong>Confidential:</strong> This report contains sensitive psychological assessment data and should be handled according to institutional privacy policies.</p>
      </div>
    </body>
    </html>
  `;
}

// Get student assessment responses by dimension
router.get('/student/:studentId/dimension/:dimension', verifyCounselorSession, async (req, res) => {
  try {
    const { studentId, dimension } = req.params;
    const { assessmentId } = req.query;
    
    console.log(`Fetching ${dimension} responses for student ${studentId}`);
    
    // Fetch the specific assessment from active tables and historical table
    let assessment;
    let assessmentType = 'ryff_42'; // default
    
    if (assessmentId) {
      // Try to fetch from 42-item table first
      const { data: assessment42, error: error42 } = await supabaseAdmin
        .from('assessments_42items')
        .select('*')
        .eq('id', assessmentId)
        .eq('student_id', studentId)
        .single();
        
      if (assessment42) {
        assessment = assessment42;
        assessmentType = 'ryff_42';
      } else {
        // Try 84-item table
        const { data: assessment84, error: error84 } = await supabaseAdmin
          .from('assessments_84items')
          .select('*')
          .eq('id', assessmentId)
          .eq('student_id', studentId)
          .single();
          
        if (assessment84) {
          assessment = assessment84;
          assessmentType = 'ryff_84';
        } else {
          // Try historical table (ryff_history) for archived assessments
          const { data: historicalAssessment, error: historyError } = await supabaseAdmin
            .from('ryff_history')
            .select('*')
            .eq('id', assessmentId)
            .eq('student_id', studentId)
            .single();
            
          if (historicalAssessment) {
            assessment = historicalAssessment;
            assessmentType = historicalAssessment.assessment_type || 'ryff_42';
            console.log(`Found historical assessment with type: ${assessmentType}`);
          } else {
            console.error('Assessment not found in any table:', { error42, error84, historyError });
            return res.status(404).json({
              success: false,
              message: 'Assessment not found'
            });
          }
        }
      }
    } else {
      // Fetch latest assessment for the student from active and historical tables
      const [result42, result84, resultHistory] = await Promise.all([
        supabaseAdmin
          .from('assessments_42items')
          .select('*')
          .eq('student_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from('assessments_84items')
          .select('*')
          .eq('student_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from('ryff_history')
          .select('*')
          .eq('student_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);
      
      // Choose the most recent assessment from all sources
      const assessments = [];
      if (result42.data) assessments.push({ ...result42.data, type: 'ryff_42' });
      if (result84.data) assessments.push({ ...result84.data, type: 'ryff_84' });
      if (resultHistory.data) assessments.push({ ...resultHistory.data, type: resultHistory.data.assessment_type || 'ryff_42' });
      
      if (assessments.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No assessments found for this student'
        });
      }
      
      // Sort by completion date and get the latest
      assessments.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
      const latestAssessment = assessments[0];
      assessment = latestAssessment;
      assessmentType = latestAssessment.type;
    }
    
    if (!assessment || !assessment.responses) {
      return res.status(404).json({
        success: false,
        message: 'No assessment responses found'
      });
    }
    
    // Import the appropriate questionnaire based on assessment type
    let questionnaireQuestions;
    if (assessmentType === 'ryff_84') {
      questionnaireQuestions = require('../utils/ryff84ItemQuestionnaire');
    } else {
      questionnaireQuestions = require('../utils/ryff42ItemQuestionnaire');
    }
    
    // Filter questions by dimension
    const dimensionQuestions = questionnaireQuestions.filter(q => q.dimension === dimension);
    
    // Get responses for this dimension
    const dimensionResponses = dimensionQuestions.map(question => {
      const response = assessment.responses[question.id.toString()];
      const responseValue = response || null;
      let actualScore = 0;
      
      if (responseValue !== null) {
        actualScore = question.reverse ? (7 - responseValue) : responseValue;
      }
      
      return {
        questionId: question.id,
        questionText: question.text,
        response: responseValue,
        reverse: question.reverse,
        actualScore: actualScore
      };
    });
    
    // Calculate dimension score
    const totalScore = dimensionResponses.reduce((sum, item) => sum + (item.actualScore || 0), 0);
    const maxPossibleScore = dimensionQuestions.length * 6; // 6 is max score per question
    const averageScore = dimensionQuestions.length > 0 ? totalScore / dimensionQuestions.length : 0;
    
    res.json({
      success: true,
      data: {
        dimension,
        dimensionName: formatDimensionName(dimension),
        assessmentType,
        questions: dimensionResponses,
        totalScore,
        maxPossibleScore,
        averageScore: parseFloat(averageScore.toFixed(2)),
        questionCount: dimensionQuestions.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching dimension responses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get risk distribution for a specific college and assessment
router.get('/risk-distribution', verifyCounselorSession, async (req, res) => {
  try {
    const { college, assessmentName, yearLevel, section, course } = req.query;
    
    console.log('🎯 Fetching risk distribution from assessment_assignments:', {
      college,
      assessmentName,
      yearLevel,
      section,
      course
    });
    
    if (!college || !assessmentName) {
      return res.status(400).json({
        success: false,
        message: 'College and assessment name are required'
      });
    }
    
    // First, get bulk assessments that match the assessment name
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type')
      .ilike('assessment_name', `%${assessmentName}%`);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bulk assessments'
      });
    }
    
    if (!bulkAssessments || bulkAssessments.length === 0) {
      return res.json({
        success: true,
        data: {
          riskDistribution: { atRisk: 0, moderate: 0, healthy: 0, total: 0 },
          totalStudents: 0,
          filters: { college, assessmentName, yearLevel: yearLevel || 'All Years', section: section || 'All Sections', course: course || 'All Courses' }
        }
      });
    }
    
    const bulkAssessmentIds = bulkAssessments.map(ba => ba.id);
    
    // Get assessment assignments for these bulk assessments
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, student_id, bulk_assessment_id, status, risk_level')
      .in('bulk_assessment_id', bulkAssessmentIds)
      .eq('status', 'completed');
    
    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assignments'
      });
    }
    
    if (!assignments || assignments.length === 0) {
      return res.json({
        success: true,
        data: {
          riskDistribution: { atRisk: 0, moderate: 0, healthy: 0, total: 0 },
          totalStudents: 0,
          filters: { college, assessmentName, yearLevel: yearLevel || 'All Years', section: section || 'All Sections', course: course || 'All Courses' }
        }
      });
    }
    
    // Get student data for filtering
    const studentIds = assignments.map(a => a.student_id);
    let studentQuery = supabaseAdmin
      .from('students')
      .select('id, name, college, year_level, section, course, status')
      .in('id', studentIds)
      .eq('status', 'active')
      .eq('college', college);
    
    // Apply additional filters if provided
    if (yearLevel && yearLevel !== 'All Years') {
      studentQuery = studentQuery.eq('year_level', yearLevel);
    }
    
    if (section && section !== 'All Sections') {
      studentQuery = studentQuery.eq('section', section);
    }
    
    if (course && course !== 'All Courses') {
      studentQuery = studentQuery.eq('course', course);
    }
    
    const { data: students, error: studentError } = await studentQuery;
    
    if (studentError) {
      console.error('Error fetching students:', studentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch students'
      });
    }
    
    // Filter assignments to only include students that match our criteria
    const validStudentIds = new Set(students?.map(s => s.id) || []);
    const filteredAssignments = assignments.filter(a => validStudentIds.has(a.student_id));
    
    console.log(`✅ Found ${filteredAssignments?.length || 0} completed assignments after filtering`);
    
    // Calculate risk distribution
    const riskDistribution = {
      atRisk: 0,
      moderate: 0,
      healthy: 0,
      total: 0
    };
    
    if (filteredAssignments && filteredAssignments.length > 0) {
      filteredAssignments.forEach(assignment => {
        const riskLevel = assignment.risk_level;
        const student = students?.find(s => s.id === assignment.student_id);
        const bulkAssessment = bulkAssessments?.find(ba => ba.id === assignment.bulk_assessment_id);
        
        console.log('🔍 Processing assignment:', {
          studentName: student?.name,
          riskLevel: riskLevel,
          assessmentName: bulkAssessment?.assessment_name
        });
        
        // Map risk levels to distribution categories
        if (riskLevel === 'at-risk' || riskLevel === 'high') {
          riskDistribution.atRisk++;
        } else if (riskLevel === 'moderate') {
          riskDistribution.moderate++;
        } else if (riskLevel === 'healthy' || riskLevel === 'low') {
          riskDistribution.healthy++;
        }
        
        riskDistribution.total++;
      });
    }
    
    console.log('📊 Risk distribution calculated:', riskDistribution);
    
    res.json({
      success: true,
      data: {
        riskDistribution,
        totalStudents: riskDistribution.total,
        filters: {
          college,
          assessmentName,
          yearLevel: yearLevel || 'All Years',
          section: section || 'All Sections',
          course: course || 'All Courses'
        }
      }
    });
    
  } catch (error) {
    console.error('Error in risk distribution endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;