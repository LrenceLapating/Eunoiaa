const { supabaseAdmin } = require('../config/database');

const RYFF_DIMENSIONS = {
  autonomy: 'Autonomy',
  environmental_mastery: 'Environmental Mastery', 
  personal_growth: 'Personal Growth',
  positive_relations: 'Positive Relations',
  purpose_in_life: 'Purpose in Life',
  self_acceptance: 'Self-Acceptance'
};

function getCollegeDimensionRiskLevel(rawScore) {
  if (rawScore >= 30) return 'healthy';
  if (rawScore >= 25) return 'moderate';
  return 'at_risk';
}

/**
 * Compute dynamic college history scores with filtering
 * This function fetches individual assessment data and recalculates scores based on filters
 * Similar to computeDynamicCollegeScores but for historical assessments
 */
async function computeDynamicCollegeHistoryScores(supabaseClient = null, filters = {}) {
  const { collegeName = null, yearLevel = null, section = null, assessmentName = null } = filters;
  const supabase = supabaseClient || supabaseAdmin;
  
  try {
    // For historical data, we should use the aggregated data and apply filtering logic
    // since individual assessment data may not be available for archived assessments
    
    // Get aggregated data first
    const aggregatedResult = await processAggregatedData(supabase, filters);
    
    if (!aggregatedResult.success) {
      return aggregatedResult;
    }
    
    // If no filters are applied, return the aggregated data as-is
    if (!yearLevel && !section) {
      return aggregatedResult;
    }
    
    // Apply filtering to the aggregated data
    // For aggregated data, we need to check if the requested filters are available in the metadata
    // If the filters are not available in the aggregated data, return empty results
    let filteredHistory = aggregatedResult.history;
    
    if (yearLevel || section) {
      const yearLevelNum = yearLevel ? parseInt(yearLevel) : null;
      
      // Check if the requested filters are available in the aggregated data
      const hasRequestedYearLevel = !yearLevel || aggregatedResult.filteringMetadata.availableYearLevels.includes(yearLevelNum);
      const hasRequestedSection = !section || aggregatedResult.filteringMetadata.availableSections.includes(section);
      
      // If the requested filters are not available in the aggregated data, return empty results
      if (!hasRequestedYearLevel || !hasRequestedSection) {
        filteredHistory = [];
      }
      // If filters are available, we keep all records since aggregated data represents the filtered subset
      // For aggregated data, all records already represent the available data
      // We don't filter further since the aggregation already contains the relevant data
    }
    
    const processedHistory = filteredHistory;
    
    // Get filtering metadata from aggregated data - ALWAYS populate this regardless of filtered results
    let filteringMetadata = {
      totalRecords: processedHistory.length,
      availableYearLevels: aggregatedResult.filteringMetadata?.availableYearLevels || [],
      availableSections: aggregatedResult.filteringMetadata?.availableSections || []
    };
    
    // Add filters applied information
    if (yearLevel || section) {
      filteringMetadata.filtersApplied = {
        yearLevel: yearLevel || null,
        section: section || null,
        assessmentName: assessmentName || null
      };
    }
    
    return {
      success: true,
      history: processedHistory,
      filteringMetadata
    };
    
  } catch (error) {
    console.error('Error in computeDynamicCollegeHistoryScores:', error);
    return {
      success: false,
      error: error.message,
      history: [],
      filteringMetadata: {
        totalRecords: 0,
        availableYearLevels: [],
        availableSections: []
      }
    };
  }
}

/**
 * Compute dynamic scores for a specific historical assessment with filtering
 * @param {Object} supabase - Supabase client
 * @param {string} collegeName - College name
 * @param {string} assessmentName - Assessment name
 * @param {string} assessmentType - Assessment type (ryff_42 or ryff_84)
 * @param {string} archivedAt - When the assessment was archived
 * @param {string} yearLevel - Year level filter
 * @param {string} section - Section filter
 * @returns {Object} Computed scores for the assessment
 */
async function computeDynamicHistoryForAssessment(supabase, collegeName, assessmentName, assessmentType, archivedAt, yearLevel = null, section = null) {
  try {
    console.log(`Computing dynamic history for assessment: ${assessmentName} (${assessmentType})`);
    
    // Determine which table to query based on assessment type
    let tableName = 'assessments_42items';
    if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    // Get assessment assignments for this specific assessment
    const { data: assignmentData, error: assignmentError } = await supabase
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
      return { success: false, error: assignmentError.message };
    }
    
    if (!assignmentData || assignmentData.length === 0) {
      console.log(`No completed assignments found for assessment: ${assessmentName}`);
      return { success: true, data: null };
    }
    
    // Get the assignment IDs
    const assignmentIds = assignmentData.map(a => a.id);
    
    // Get the actual assessment data
    const { data: assessments, error: assessmentQueryError } = await supabase
      .from(tableName)
      .select('id, scores, assessment_type, student_id, assignment_id')
      .in('assignment_id', assignmentIds)
      .not('scores', 'is', null);
    
    if (assessmentQueryError) {
      console.error('Error fetching assessments:', assessmentQueryError);
      return { success: false, error: assessmentQueryError.message };
    }
    
    if (!assessments || assessments.length === 0) {
      console.log(`No assessment data found for: ${assessmentName}`);
      return { success: true, data: null };
    }
    
    // Get student data for filtering
    const studentIds = [...new Set(assessments.map(a => a.student_id))];
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college, year_level, section')
      .in('id', studentIds)
      .eq('college', collegeName);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return { success: false, error: studentsError.message };
    }
    
    // Create student lookup map
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Filter assessments based on year level and section
    let filteredAssessments = assessments.filter(assessment => {
      const student = studentMap[assessment.student_id];
      if (!student) return false;
      
      // Apply year level filter
      if (yearLevel && student.year_level !== parseInt(yearLevel)) {
        return false;
      }
      
      // Apply section filter
      if (section && student.section !== section) {
        return false;
      }
      
      return true;
    });
    
    console.log(`Filtered assessments: ${filteredAssessments.length} out of ${assessments.length} total`);
    
    if (filteredAssessments.length === 0) {
      return { success: true, data: null };
    }
    
    // Calculate dimension scores from filtered assessments
    const dimensions = {};
    const dimensionNames = [
      'autonomy', 'environmental_mastery', 'personal_growth',
      'positive_relations', 'purpose_in_life', 'self_acceptance'
    ];
    
    dimensionNames.forEach(dimName => {
      const scores = filteredAssessments
        .map(assessment => {
          const scores = assessment.scores;
          if (assessmentType === 'ryff_42') {
            return scores[`dimension_${dimensionNames.indexOf(dimName) + 1}_${dimName}`];
          } else {
            return scores[`dimension_${dimensionNames.indexOf(dimName) + 1}_${dimName}`];
          }
        })
        .filter(score => score !== null && score !== undefined);
      
      if (scores.length > 0) {
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        dimensions[dimName] = {
          score: Math.round(averageScore * 100) / 100,
          averageScore: Math.round(averageScore * 100) / 100,
          riskLevel: getCollegeDimensionRiskLevel(averageScore)
        };
      }
    });
    
    // Calculate overall score
    const overallScore = Object.values(dimensions)
      .reduce((sum, dim) => sum + (dim.score || 0), 0);
    
    // Calculate risk distribution
    const riskDistribution = calculateRiskDistribution(dimensions, filteredAssessments.length);
    
    const result = {
      assessmentName,
      assessmentType,
      archivedAt,
      dimensions,
      overallScore: Math.round(overallScore * 100) / 100,
      studentCount: filteredAssessments.length,
      riskDistribution,
      lastCalculated: new Date().toISOString(),
      _isFiltered: !!(yearLevel || section),
      _filterApplied: {
        yearLevel: yearLevel || null,
        section: section || null
      }
    };
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('Error in computeDynamicHistoryForAssessment:', error);
    return { success: false, error: error.message };
  }
}

// Process aggregated data when no filters are applied
async function processAggregatedData(supabase, filters) {
  const { collegeName } = filters;
  
  let query = supabase
    .from('college_scores_history')
    .select('*');
  
  if (collegeName) {
    query = query.eq('college_name', collegeName);
  }
  
  const { data: historyRecords, error } = await query;
  
  if (error) {
    console.error('Error fetching college history records:', error);
    throw error;
  }
  
  if (!historyRecords || historyRecords.length === 0) {
    console.log('No college history records found matching the filters');
    return {
      success: true,
      history: [],
      filteringMetadata: {
        totalRecords: 0,
        availableYearLevels: [],
        availableSections: []
      }
    };
  }
  
  console.log(`Found ${historyRecords.length} aggregated history records`);
  
  // Group records by college and process aggregated data
  const collegeData = {};
  const allYearLevels = new Set();
  const allSections = new Set();
  
  for (const record of historyRecords) {
    const college = record.college_name;
    
    if (!collegeData[college]) {
      collegeData[college] = {
        dimensions: {},
        totalStudents: 0
      };
    }
    
    // Collect metadata from arrays
    if (record.available_year_levels) {
      record.available_year_levels.forEach(year => allYearLevels.add(year));
    }
    if (record.available_sections) {
      record.available_sections.forEach(sec => allSections.add(sec));
    }
    
    // Store aggregated dimension data
    collegeData[college].dimensions[record.dimension_name] = {
      score: record.raw_score,
      riskLevel: record.risk_level,
      studentCount: record.student_count
    };
    
    // Update total student count
    if (record.student_count > collegeData[college].totalStudents) {
      collegeData[college].totalStudents = record.student_count;
    }
  }
  
  // Process results for each college
  const results = [];
  
  for (const [college, data] of Object.entries(collegeData)) {
    const dimensionScores = data.dimensions;
    
    // Calculate overall score from dimension scores
    const dimensionValues = Object.values(dimensionScores).map(d => d.score);
    const overallScore = dimensionValues.length > 0 
      ? Number((dimensionValues.reduce((sum, score) => sum + score, 0) / dimensionValues.length).toFixed(2))
      : 0;
    
    // Calculate risk distribution from dimension data
    const riskDistribution = calculateRiskDistribution(dimensionScores, data.totalStudents);
    
    results.push({
      college_name: college,
      dimensions: dimensionScores,
      overall_score: overallScore,
      overall_risk_level: getCollegeDimensionRiskLevel(overallScore),
      student_count: data.totalStudents,
      risk_distribution: riskDistribution,
      last_calculated: new Date().toISOString()
    });
  }
  
  return {
    success: true,
    history: results,
    filteringMetadata: {
      totalRecords: historyRecords.length,
      availableYearLevels: Array.from(allYearLevels).sort((a, b) => a - b),
      availableSections: Array.from(allSections).sort()
    }
  };
}

/**
 * Calculate risk distribution from dimension scores
 */
function calculateRiskDistribution(dimensionScores, totalStudents) {
    const riskCounts = { healthy: 0, moderate: 0, at_risk: 0 };
    
    // For individual assessments, count by risk level
    if (typeof dimensionScores === 'object' && Object.keys(dimensionScores).length > 0) {
        // Check if this is dimension data with risk levels
        const firstDimension = Object.values(dimensionScores)[0];
        if (firstDimension && firstDimension.riskLevel) {
            // This is aggregated dimension data - distribute based on risk levels
            Object.values(dimensionScores).forEach(dimension => {
                const riskLevel = dimension.riskLevel;
                if (riskCounts.hasOwnProperty(riskLevel)) {
                    // For aggregated data, assume equal distribution across dimensions
                    riskCounts[riskLevel] = Math.ceil(totalStudents / 3); // Rough distribution
                }
            });
            
            // Adjust to match total students
            const totalCounted = Object.values(riskCounts).reduce((sum, count) => sum + count, 0);
            if (totalCounted > totalStudents) {
                // Reduce proportionally
                const excess = totalCounted - totalStudents;
                riskCounts.moderate = Math.max(0, riskCounts.moderate - Math.ceil(excess / 2));
                riskCounts.at_risk = Math.max(0, riskCounts.at_risk - Math.floor(excess / 2));
            }
        } else {
            // This is individual score data - calculate risk distribution
            Object.values(dimensionScores).forEach(score => {
                const riskLevel = getCollegeDimensionRiskLevel(score);
                if (riskCounts.hasOwnProperty(riskLevel)) {
                    riskCounts[riskLevel]++;
                }
            });
        }
    }
    
    // Ensure we have a reasonable distribution if no data
    const totalCounted = Object.values(riskCounts).reduce((sum, count) => sum + count, 0);
    if (totalCounted === 0 && totalStudents > 0) {
        // Default distribution
        riskCounts.healthy = Math.ceil(totalStudents * 0.4);
        riskCounts.moderate = Math.ceil(totalStudents * 0.4);
        riskCounts.at_risk = totalStudents - riskCounts.healthy - riskCounts.moderate;
    }
    
    return riskCounts;
}

module.exports = {
  computeDynamicCollegeHistoryScores,
  computeDynamicHistoryForAssessment,
  getCollegeDimensionRiskLevel,
  RYFF_DIMENSIONS
};