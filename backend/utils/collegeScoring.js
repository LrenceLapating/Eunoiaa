const { supabaseAdmin } = require('../config/database');

// Ryff dimensions mapping
const RYFF_DIMENSIONS = {
  autonomy: 'Autonomy',
  environmental_mastery: 'Environmental Mastery', 
  personal_growth: 'Personal Growth',
  positive_relations: 'Positive Relations',
  purpose_in_life: 'Purpose in Life',
  self_acceptance: 'Self-Acceptance'
};

/**
 * Get completion counts for assessments by college
 * @param {string} assessmentName - Optional: filter by specific assessment name
 * @param {string} yearLevel - Optional: filter by year level
 * @param {string} section - Optional: filter by section
 * @returns {Object} Completion data grouped by college and assessment
 */
async function getAssessmentCompletionCounts(assessmentName = null, yearLevel = null, section = null) {
  try {
    console.log(`Getting completion counts${assessmentName ? ` for ${assessmentName}` : ''}${yearLevel ? ` (Year ${yearLevel})` : ''}${section ? ` (Section ${section})` : ''}...`);
    
    // First, get all assessment assignments
    let assignmentQuery = supabaseAdmin
      .from('assessment_assignments')
      .select('id, bulk_assessment_id, student_id, status');
    
    const { data: assignments, error: assignmentError } = await assignmentQuery;
    
    if (assignmentError) {
      console.error('Error fetching assessment assignments:', assignmentError);
      throw assignmentError;
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('No assessment assignments found');
      return {};
    }
    
    // Get unique bulk assessment IDs
    const bulkAssessmentIds = [...new Set(assignments.map(a => a.bulk_assessment_id))];
    
    // Get bulk assessments data
    let bulkQuery = supabaseAdmin
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type, target_colleges')
      .in('id', bulkAssessmentIds);
    
    if (assessmentName) {
      bulkQuery = bulkQuery.eq('assessment_name', assessmentName);
    }
    
    const { data: bulkAssessments, error: bulkError } = await bulkQuery;
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
      throw bulkError;
    }
    
    // Get unique student IDs
    const studentIds = [...new Set(assignments.map(a => a.student_id))];
    
    // Get students data
    let studentQuery = supabaseAdmin
      .from('students')
      .select('id, college, year_level, section')
      .in('id', studentIds);
    
    if (yearLevel) {
      studentQuery = studentQuery.eq('year_level', parseInt(yearLevel));
    }
    
    if (section) {
      studentQuery = studentQuery.eq('section', section);
    }
    
    const { data: students, error: studentError } = await studentQuery;
    
    if (studentError) {
      console.error('Error fetching students:', studentError);
      throw studentError;
    }
    
    // Create maps for quick lookup
    const bulkAssessmentMap = {};
    bulkAssessments.forEach(bulk => {
      bulkAssessmentMap[bulk.id] = bulk;
    });
    
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Filter assignments based on available bulk assessments and students
    const filteredAssignments = assignments.filter(assignment => 
      bulkAssessmentMap[assignment.bulk_assessment_id] && 
      studentMap[assignment.student_id]
    );
    
    console.log(`Found ${filteredAssignments.length} filtered assessment assignments`);
    
    // Group by college and assessment name
    const completionData = {};
    
    filteredAssignments.forEach(assignment => {
      const student = studentMap[assignment.student_id];
      const bulkAssessment = bulkAssessmentMap[assignment.bulk_assessment_id];
      
      if (!student || !bulkAssessment) return;
      
      const college = student.college;
      const assessmentNameKey = bulkAssessment.assessment_name;
      const isCompleted = assignment.status === 'completed';
      
      if (!completionData[college]) {
        completionData[college] = {};
      }
      
      if (!completionData[college][assessmentNameKey]) {
        completionData[college][assessmentNameKey] = {
          total: 0,
          completed: 0,
          assessment_type: bulkAssessment.assessment_type
        };
      }
      
      completionData[college][assessmentNameKey].total++;
      if (isCompleted) {
        completionData[college][assessmentNameKey].completed++;
      }
    });
    
    console.log(`Processed completion data for ${Object.keys(completionData).length} colleges`);
    return completionData;
    
  } catch (error) {
    console.error('Error in getAssessmentCompletionCounts:', error);
    throw error;
  }
}

/**
 * Calculate risk level based on raw score (7-42 range)
 * Uses exact calculated average before rounding for categorization
 * @param {number} rawScore - Raw score from 7-42
 * @returns {string} Risk level: 'At Risk', 'Moderate', or 'Healthy'
 */
function getCollegeDimensionRiskLevel(rawScore) {
  if (rawScore <= 18) return 'at-risk';   // ≤18 = At-Risk
  if (rawScore <= 30) return 'moderate';  // 19-30 = Moderate  
  return 'healthy';                       // ≥31 = Healthy
}

/**
 * Compute college scores from assessment data and store in database
 * @param {string} collegeName - Optional: compute for specific college only
 * @param {string} assessmentType - Optional: filter by assessment type (ryff_42 or ryff_84)
 * @param {string} assessmentName - Optional: filter by specific assessment name from bulk_assessments
 * @returns {Object} Result with success status and computed scores
 */
async function computeAndStoreCollegeScores(collegeName = null, assessmentType = null, assessmentName = null) {
  try {
    // Require assessmentType to prevent mixing of data
    if (!assessmentType) {
      throw new Error('Assessment type is required to compute college scores');
    }
    
    console.log(`Computing college scores${collegeName ? ` for ${collegeName}` : ' for all colleges'} (${assessmentType}${assessmentName ? `, assessment: ${assessmentName}` : ''})...`);
    
    // Determine which table to query based on assessment type
    let tableName = 'assessments'; // Default to unified view
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    // Get assessments from the appropriate table
    let assessments, assessmentError;
    
    if (assessmentName) {
      // When filtering by assessment name, we need to join with assignment and bulk_assessments tables
      console.log(`Filtering assessments by assessment name: ${assessmentName}`);
      
      const { data: assignmentData, error: assignmentError } = await supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id,
          student_id,
          bulk_assessment:bulk_assessments!inner(
            assessment_name,
            assessment_type
          )
        `)
        .eq('bulk_assessment.assessment_name', assessmentName)
        .eq('bulk_assessment.assessment_type', assessmentType)
        .eq('status', 'completed');
      
      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        throw assignmentError;
      }
      
      if (!assignmentData || assignmentData.length === 0) {
        console.log(`No completed assignments found for assessment: ${assessmentName}`);
        return { success: true, message: 'No assessment data to process', scores: [] };
      }
      
      // Get the assessment IDs from assignments
      const assignmentIds = assignmentData.map(a => a.id);
      
      // Now get the actual assessment data
      const { data: assessmentResults, error: assessmentQueryError } = await supabaseAdmin
        .from(tableName)
        .select('id, scores, assessment_type, student_id, assignment_id')
        .in('assignment_id', assignmentIds)
        .not('scores', 'is', null);
      
      assessments = assessmentResults;
      assessmentError = assessmentQueryError;
    } else {
      // No assessment name filter, get all assessments
      const { data: assessmentResults, error: assessmentQueryError } = await supabaseAdmin
        .from(tableName)
        .select('id, scores, assessment_type, student_id')
        .not('scores', 'is', null);
      
      assessments = assessmentResults;
      assessmentError = assessmentQueryError;
    }
    
    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      throw assessmentError;
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('No assessment data found');
      return { success: true, message: 'No assessment data to process', scores: [] };
    }
    
    console.log(`Found ${assessments.length} assessments to process`);
    
    // Get unique student IDs from assessments
    const studentIds = [...new Set(assessments.map(a => a.student_id))];
    
    // Fetch student data separately
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, college')
      .in('id', studentIds);
    
    if (studentError) {
      console.error('Error fetching student data:', studentError);
      throw studentError;
    }
    
    // Create a map of student ID to college
    const studentCollegeMap = {};
    students.forEach(student => {
      studentCollegeMap[student.id] = student.college;
    });
    
    // Group assessments by college
    const collegeData = {};
    
    assessments.forEach(assessment => {
      const college = studentCollegeMap[assessment.student_id];
      if (!college) return;
      
      // Filter by college if specified
      if (collegeName && college !== collegeName) return;
      
      if (!collegeData[college]) {
        collegeData[college] = {
          students: [],
          dimensionTotals: {},
          studentCount: 0
        };
        
        // Initialize dimension totals
        Object.keys(RYFF_DIMENSIONS).forEach(dim => {
          collegeData[college].dimensionTotals[dim] = 0;
        });
      }
      
      // Add student assessment data
      if (assessment.scores && typeof assessment.scores === 'object') {
        collegeData[college].students.push(assessment.scores);
        collegeData[college].studentCount++;
        
        // Sum dimension scores (these should be raw scores 7-42)
        Object.keys(RYFF_DIMENSIONS).forEach(dimension => {
          if (assessment.scores[dimension] !== undefined) {
            collegeData[college].dimensionTotals[dimension] += assessment.scores[dimension];
          }
        });
      }
    });
    
    console.log(`Processing ${Object.keys(collegeData).length} colleges`);
    
    // Calculate averages and prepare data for database
    const collegeScores = [];
    
    for (const [college, data] of Object.entries(collegeData)) {
      if (data.studentCount === 0) continue;
      
      console.log(`Processing ${college} with ${data.studentCount} students`);
      
      // Calculate average scores for each dimension
      Object.keys(RYFF_DIMENSIONS).forEach(dimension => {
        const averageScore = data.dimensionTotals[dimension] / data.studentCount;
        const riskLevel = getCollegeDimensionRiskLevel(averageScore);
        
        collegeScores.push({
          college_name: college,
          dimension_name: dimension,
          raw_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
          student_count: data.studentCount,
          risk_level: riskLevel,
          assessment_type: assessmentType, // Use the required assessmentType parameter
          assessment_name: assessmentName || 'General Assessment', // Provide default if null
          last_calculated: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    }
    
    if (collegeScores.length === 0) {
      console.log('No college scores to store');
      return { success: true, message: 'No scores calculated', scores: [] };
    }
    
    console.log(`Storing ${collegeScores.length} college score records`);
    
    // Delete existing scores for the colleges and assessment type we're updating
    const collegeNames = [...new Set(collegeScores.map(score => score.college_name))];
    const currentAssessmentType = assessmentType;
    
    let deleteQuery = supabaseAdmin
      .from('college_scores')
      .delete()
      .in('college_name', collegeNames)
      .eq('assessment_type', currentAssessmentType);
    
    // Also filter by assessment_name if provided
    if (assessmentName) {
      deleteQuery = deleteQuery.eq('assessment_name', assessmentName);
    }
    
    const { error: deleteError } = await deleteQuery;
    
    if (deleteError) {
      console.error('Error deleting existing scores:', deleteError);
      throw deleteError;
    }
    
    // Insert new scores
    const { data: insertedScores, error: insertError } = await supabaseAdmin
      .from('college_scores')
      .insert(collegeScores)
      .select();
    
    if (insertError) {
      console.error('Error inserting college scores:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully stored ${insertedScores.length} college score records`);
    
    return {
      success: true,
      message: `Computed scores for ${collegeNames.length} colleges`,
      scores: insertedScores,
      collegeCount: collegeNames.length,
      scoreCount: insertedScores.length
    };
    
  } catch (error) {
    console.error('Error in computeAndStoreCollegeScores:', error);
    return {
      success: false,
      error: error.message,
      scores: []
    };
  }
}

/**
 * Get college scores from database or compute dynamically with filtering
 * @param {string} collegeName - Optional: get scores for specific college
 * @param {string} assessmentType - Optional: filter by assessment type (ryff_42 or ryff_84)
 * @param {string} assessmentName - Optional: filter by specific assessment name
 * @param {number|string} yearLevel - Optional: filter by specific year level
 * @param {string} section - Optional: filter by specific section
 * @returns {Object} College scores grouped by college and dimension
 */
async function getCollegeScores(collegeName = null, assessmentType = null, assessmentName = null, yearLevel = null, section = null) {
  try {
    // Get completion data
    const completionData = await getAssessmentCompletionCounts(assessmentName, yearLevel, section);
    
    // If year or section filtering is requested, compute scores dynamically
    if (yearLevel || section) {
      const result = await computeDynamicCollegeScores(collegeName, assessmentType, assessmentName, yearLevel, section);
      
      // Add completion data to the result
      if (result.success && result.colleges) {
        result.colleges.forEach(college => {
          if (completionData[college.name] && assessmentName && completionData[college.name][assessmentName]) {
            college.completionData = completionData[college.name][assessmentName];
          } else {
            // Return completion data separated by assessment name instead of aggregated
            college.completionDataByAssessment = completionData[college.name] || {};
            // For backward compatibility, also provide aggregated data
            const collegeCompletions = completionData[college.name] || {};
            let totalAssigned = 0;
            let totalCompleted = 0;
            
            Object.values(collegeCompletions).forEach(assessment => {
              totalAssigned += assessment.total;
              totalCompleted += assessment.completed;
            });
            
            college.completionData = {
              total: totalAssigned,
              completed: totalCompleted
            };
          }
        });
      }
      
      return result;
    }
    
    // Otherwise, use the pre-computed scores from the database
    let query = supabaseAdmin
      .from('college_scores')
      .select('*')
      .order('college_name')
      .order('dimension_name');

    if (collegeName) {
      query = query.eq('college_name', collegeName);
    }

    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }

    if (assessmentName) {
      query = query.eq('assessment_name', assessmentName);
    }

    const { data: scores, error } = await query;

    if (error) {
      console.error('Error fetching college scores:', error);
      throw error;
    }

    // If no pre-computed scores found for specific assessment, compute dynamically
    if (assessmentName && scores.length === 0) {
      console.log(`No pre-computed scores found for assessment: ${assessmentName}. Computing dynamically...`);
      const result = await computeDynamicCollegeScores(collegeName, assessmentType, assessmentName, yearLevel, section);
      
      // If dynamic computation returns no colleges but we have completion data, create placeholder colleges
      if (result.success && result.colleges.length === 0 && Object.keys(completionData).length > 0) {
        console.log('No completed assessments found, but creating placeholder colleges with completion data...');
        result.colleges = [];
        
        // Create colleges based on completion data
        Object.keys(completionData).forEach(collegeName => {
          if (completionData[collegeName][assessmentName]) {
            result.colleges.push({
              name: collegeName,
              dimensions: {}, // Empty dimensions since no completed assessments
              studentCount: 0,
              lastCalculated: new Date().toISOString(),
              completionData: completionData[collegeName][assessmentName]
            });
          }
        });
      } else if (result.success && result.colleges) {
        // Add completion data to existing colleges
        result.colleges.forEach(college => {
          // Always provide completionDataByAssessment for frontend flexibility
          college.completionDataByAssessment = completionData[college.name] || {};
          
          if (completionData[college.name] && assessmentName && completionData[college.name][assessmentName]) {
            college.completionData = completionData[college.name][assessmentName];
          } else {
            // For backward compatibility, also provide aggregated data
            const collegeCompletions = completionData[college.name] || {};
            let totalAssigned = 0;
            let totalCompleted = 0;
            
            Object.values(collegeCompletions).forEach(assessment => {
              totalAssigned += assessment.total;
              totalCompleted += assessment.completed;
            });
            
            college.completionData = {
              total: totalAssigned,
              completed: totalCompleted
            };
          }
        });
      }
      
      return result;
    }

    // Group scores by college
    const collegeScores = {};
    
    scores.forEach(score => {
      if (!collegeScores[score.college_name]) {
        collegeScores[score.college_name] = {
          name: score.college_name,
          dimensions: {},
          studentCount: score.student_count,
          lastCalculated: score.last_calculated
        };
      }
      
      collegeScores[score.college_name].dimensions[score.dimension_name] = {
        score: score.raw_score,
        riskLevel: score.risk_level,
        studentCount: score.student_count
      };
    });
    
    // Add completion data to each college
    Object.values(collegeScores).forEach(college => {
      // Always provide completionDataByAssessment for frontend flexibility
      college.completionDataByAssessment = completionData[college.name] || {};
      
      if (completionData[college.name] && assessmentName && completionData[college.name][assessmentName]) {
        college.completionData = completionData[college.name][assessmentName];
      } else {
        // For backward compatibility, also provide aggregated data
        const collegeCompletions = completionData[college.name] || {};
        let totalAssigned = 0;
        let totalCompleted = 0;
        
        Object.values(collegeCompletions).forEach(assessment => {
          totalAssigned += assessment.total;
          totalCompleted += assessment.completed;
        });
        
        college.completionData = {
          total: totalAssigned,
          completed: totalCompleted
        };
      }
    });
    
    return {
      success: true,
      colleges: Object.values(collegeScores)
    };
    
  } catch (error) {
    console.error('Error in getCollegeScores:', error);
    return {
      success: false,
      error: error.message,
      colleges: []
    };
  }
}

/**
 * Compute college scores dynamically with year and section filtering
 * @param {string} collegeName - Optional: get scores for specific college
 * @param {string} assessmentType - Optional: filter by assessment type (ryff_42 or ryff_84)
 * @param {string} assessmentName - Optional: filter by specific assessment name
 * @param {number|string} yearLevel - Optional: filter by specific year level
 * @param {string} section - Optional: filter by specific section
 * @returns {Object} Dynamically computed college scores
 */
async function computeDynamicCollegeScores(collegeName = null, assessmentType = null, assessmentName = null, yearLevel = null, section = null) {
  try {
    console.log(`Computing dynamic college scores with filters: college=${collegeName}, type=${assessmentType}, assessment=${assessmentName}, year=${yearLevel}, section=${section}`);
    
    // Determine which table to query based on assessment type
    let tableName = 'assessments_42items'; // Default
    if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    // Get assessments from the appropriate table
    let assessments, assessmentError;
    
    if (assessmentName) {
      // When filtering by assessment name, we need to join with assignment and bulk_assessments tables
      console.log(`Filtering assessments by assessment name: ${assessmentName}`);
      
      const { data: assignmentData, error: assignmentError } = await supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id,
          student_id,
          bulk_assessment:bulk_assessments!inner(
            assessment_name,
            assessment_type
          )
        `)
        .eq('bulk_assessment.assessment_name', assessmentName)
        .eq('bulk_assessment.assessment_type', assessmentType)
        .eq('status', 'completed');
      
      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        throw assignmentError;
      }
      
      if (!assignmentData || assignmentData.length === 0) {
        console.log(`No completed assignments found for assessment: ${assessmentName}`);
        return { success: true, colleges: [] };
      }
      
      // Get the assessment IDs from assignments
      const assignmentIds = assignmentData.map(a => a.id);
      
      // Now get the actual assessment data
      const { data: assessmentResults, error: assessmentQueryError } = await supabaseAdmin
        .from(tableName)
        .select('id, scores, assessment_type, student_id, assignment_id')
        .in('assignment_id', assignmentIds)
        .not('scores', 'is', null);
      
      assessments = assessmentResults;
      assessmentError = assessmentQueryError;
    } else {
      // No assessment name filter, get all assessments
      const { data: assessmentResults, error: assessmentQueryError } = await supabaseAdmin
        .from(tableName)
        .select('id, scores, assessment_type, student_id')
        .not('scores', 'is', null);
      
      assessments = assessmentResults;
      assessmentError = assessmentQueryError;
    }
    
    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      throw assessmentError;
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('No assessment data found');
      return { success: true, colleges: [] };
    }
    
    // Get unique student IDs from assessments
    const studentIds = [...new Set(assessments.map(a => a.student_id))];
    
    // Fetch student data with filtering
    let studentQuery = supabaseAdmin
      .from('students')
      .select('id, college, year_level, section')
      .in('id', studentIds)
      .eq('status', 'active');
    
    // Apply filters
    if (collegeName) {
      studentQuery = studentQuery.eq('college', collegeName);
    }
    
    if (yearLevel) {
      studentQuery = studentQuery.eq('year_level', parseInt(yearLevel));
    }
    
    if (section) {
      studentQuery = studentQuery.eq('section', section);
    }
    
    const { data: students, error: studentError } = await studentQuery;
    
    if (studentError) {
      console.error('Error fetching student data:', studentError);
      throw studentError;
    }
    
    if (!students || students.length === 0) {
      console.log('No students found matching the filters');
      return { success: true, colleges: [] };
    }
    
    // Create a map of student ID to student data
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Filter assessments to only include students that match our criteria
    const filteredAssessments = assessments.filter(assessment => 
      studentMap[assessment.student_id]
    );
    
    console.log(`Found ${filteredAssessments.length} assessments from ${students.length} students matching filters`);
    
    // Group assessments by college
    const collegeData = {};
    
    filteredAssessments.forEach(assessment => {
      const student = studentMap[assessment.student_id];
      if (!student) return;
      
      const college = student.college;
      
      if (!collegeData[college]) {
        collegeData[college] = {
          students: [],
          dimensionTotals: {},
          studentCount: 0
        };
        
        // Initialize dimension totals
        Object.keys(RYFF_DIMENSIONS).forEach(dim => {
          collegeData[college].dimensionTotals[dim] = 0;
        });
      }
      
      // Add student assessment data
      if (assessment.scores && typeof assessment.scores === 'object') {
        collegeData[college].students.push(assessment.scores);
        collegeData[college].studentCount++;
        
        // Sum dimension scores (these should be raw scores 7-42)
        Object.keys(RYFF_DIMENSIONS).forEach(dimension => {
          if (assessment.scores[dimension] !== undefined) {
            collegeData[college].dimensionTotals[dimension] += assessment.scores[dimension];
          }
        });
      }
    });
    
    // Calculate averages and prepare response
    const collegeScores = {};
    
    for (const [college, data] of Object.entries(collegeData)) {
      if (data.studentCount === 0) continue;
      
      console.log(`Processing ${college} with ${data.studentCount} students`);
      
      collegeScores[college] = {
        name: college,
        dimensions: {},
        studentCount: data.studentCount,
        lastCalculated: new Date().toISOString()
      };
      
      // Calculate average scores for each dimension
      Object.keys(RYFF_DIMENSIONS).forEach(dimension => {
        const averageScore = data.dimensionTotals[dimension] / data.studentCount;
        const riskLevel = getCollegeDimensionRiskLevel(averageScore);
        
        collegeScores[college].dimensions[dimension] = {
          score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
          riskLevel: riskLevel,
          studentCount: data.studentCount
        };
      });
    }
    
    return {
      success: true,
      colleges: Object.values(collegeScores)
    };
    
  } catch (error) {
    console.error('Error in computeDynamicCollegeScores:', error);
    return {
      success: false,
      error: error.message,
      colleges: []
    };
  }
}

module.exports = {
  computeAndStoreCollegeScores,
  getCollegeScores,
  getAssessmentCompletionCounts,
  getCollegeDimensionRiskLevel,
  RYFF_DIMENSIONS
};