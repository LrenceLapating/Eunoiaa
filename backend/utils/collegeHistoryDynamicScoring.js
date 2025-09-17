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

// Helper function to determine individual dimension risk level based on dimension score
function getDimensionRiskLevel(dimensionScore) {
  // Ryff scale typically ranges from 1-6 per item, with 7 items per dimension = 7-42 range
  // Healthy: 30-42, Moderate: 20-29, At Risk: 7-19
  if (dimensionScore >= 30) return 'healthy';
  if (dimensionScore >= 20) return 'moderate';
  return 'at risk';
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

// Process data by working with existing aggregated data and applying filtering logic
async function processAggregatedData(supabase, filters) {
  const { collegeName, yearLevel, section } = filters;
  
  try {
    // Get aggregated data from college_scores_history
    let query = supabase
      .from('college_scores_history')
      .select('*');
    
    if (collegeName) {
      query = query.eq('college_name', collegeName);
    }
    
    const { data: aggregatedData, error } = await query;
    
    if (error) {
      console.error('Error fetching aggregated data:', error);
      throw error;
    }
    
    if (!aggregatedData || aggregatedData.length === 0) {
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
    
    // Get available year levels and sections from the data
    const allYearLevels = new Set();
    const allSections = new Set();
    
    aggregatedData.forEach(record => {
      if (record.available_year_levels) {
        record.available_year_levels.forEach(level => allYearLevels.add(level));
      }
      if (record.available_sections) {
        record.available_sections.forEach(sec => allSections.add(sec));
      }
    });
    
    const availableYearLevels = Array.from(allYearLevels).sort((a, b) => a - b);
    const availableSections = Array.from(allSections).sort();
    
    // Apply filtering logic - check if requested filters are available
    let filteredData = aggregatedData;
    
    if (yearLevel || section) {
      const yearLevelNum = yearLevel ? parseInt(yearLevel) : null;
      
      // Check if the requested filters are available in the data
      const hasRequestedYearLevel = !yearLevel || availableYearLevels.includes(yearLevelNum);
      const hasRequestedSection = !section || availableSections.includes(section);
      
      // If the requested filters are not available, return empty results
      if (!hasRequestedYearLevel || !hasRequestedSection) {
        filteredData = [];
      }
      // If filters are available, keep all records since aggregated data represents the filtered subset
    }
    
    if (filteredData.length === 0) {
      return {
        success: true,
        history: [],
        filteringMetadata: {
          totalRecords: 0,
          availableYearLevels,
          availableSections
        }
      };
    }
    
    // Group by assessment and calculate overall scores
    const assessmentGroups = {};
    
    filteredData.forEach(record => {
      const key = `${record.assessment_type}-${record.assessment_name}`;
      if (!assessmentGroups[key]) {
        assessmentGroups[key] = {
          assessment_type: record.assessment_type,
          assessment_name: record.assessment_name,
          records: [],
          last_calculated: record.last_calculated
        };
      }
      assessmentGroups[key].records.push(record);
    });
    
    const history = Object.values(assessmentGroups).map(group => {
      const records = group.records;
      
      // Build dimensions object from records
      const dimensions = {};
      let totalScore = 0;
      const riskCounts = { 'healthy': 0, 'moderate': 0, 'at_risk': 0 };
      let totalStudents = 0;
      
      records.forEach(record => {
        if (record.dimension_name) {
          dimensions[record.dimension_name] = {
            score: record.raw_score || 0,
            riskLevel: record.risk_level || 'moderate',
            studentCount: record.student_count || 0
          };
          totalScore += record.raw_score || 0;
          
          // Count risk levels
          const riskLevel = record.risk_level || 'moderate';
          if (riskLevel === 'at risk') {
            riskCounts.at_risk++;
          } else if (riskCounts.hasOwnProperty(riskLevel)) {
            riskCounts[riskLevel]++;
          }
          
          // Use the maximum student count (should be the same across dimensions)
          totalStudents = Math.max(totalStudents, record.student_count || 0);
        }
      });
      
      const overallScore = totalScore;
      const overallRiskLevel = getCollegeDimensionRiskLevel(overallScore);
      
      // Calculate risk distribution based on dimension risk levels
      const riskDistribution = {
        healthy: riskCounts.healthy,
        moderate: riskCounts.moderate,
        at_risk: riskCounts.at_risk
      };
      
      return {
        collegeName: collegeName,
        dimensions,
        overallScore: overallScore,
        overallRiskLevel: overallRiskLevel,
        totalStudents: totalStudents,
        riskDistribution: riskDistribution,
        assessmentType: group.assessment_type,
        assessmentName: group.assessment_name,
        lastCalculated: group.last_calculated
      };
    });
    
    return {
      success: true,
      history,
      filteringMetadata: {
        totalRecords: history.length,
        availableYearLevels,
        availableSections
      }
    };
    
  } catch (error) {
    console.error('Error in processAggregatedData:', error);
    throw error;
  }
}

/**
 * Calculate risk distribution from dimension scores
 */
function calculateRiskDistribution(dimensionScores, totalStudents) {
    const riskCounts = { healthy: 0, moderate: 0, at_risk: 0 };
    
    // For aggregated dimension data, we need to determine the overall risk level
    // based on the majority of dimensions or use a more sophisticated approach
    if (typeof dimensionScores === 'object' && Object.keys(dimensionScores).length > 0) {
        const firstDimension = Object.values(dimensionScores)[0];
        
        if (firstDimension && firstDimension.riskLevel) {
            // This is aggregated dimension data - count risk levels across dimensions
            const dimensionRiskCounts = { healthy: 0, moderate: 0, at_risk: 0 };
            
            Object.values(dimensionScores).forEach(dimension => {
                const riskLevel = dimension.riskLevel;
                if (dimensionRiskCounts.hasOwnProperty(riskLevel)) {
                    dimensionRiskCounts[riskLevel]++;
                }
            });
            
            // Determine overall college risk based on dimension distribution
            const totalDimensions = Object.values(dimensionRiskCounts).reduce((sum, count) => sum + count, 0);
            
            if (totalDimensions > 0) {
                const healthyRatio = dimensionRiskCounts.healthy / totalDimensions;
                const atRiskRatio = dimensionRiskCounts.at_risk / totalDimensions;
                const moderateRatio = dimensionRiskCounts.moderate / totalDimensions;
                
                // If majority of dimensions are in one category, assign all students to that category
                if (moderateRatio >= 0.5) {
                    // Majority moderate - all students are moderate
                    riskCounts.moderate = totalStudents;
                } else if (healthyRatio >= 0.5) {
                    // Majority healthy - all students are healthy
                    riskCounts.healthy = totalStudents;
                } else if (atRiskRatio >= 0.5) {
                    // Majority at-risk - all students are at-risk
                    riskCounts.at_risk = totalStudents;
                } else {
                    // Mixed distribution - distribute proportionally
                    riskCounts.healthy = Math.round(totalStudents * healthyRatio);
                    riskCounts.moderate = Math.round(totalStudents * moderateRatio);
                    riskCounts.at_risk = totalStudents - riskCounts.healthy - riskCounts.moderate;
                    
                    // Ensure no negative values
                    if (riskCounts.at_risk < 0) {
                        riskCounts.moderate += riskCounts.at_risk;
                        riskCounts.at_risk = 0;
                    }
                }
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
        // Default distribution - assume moderate risk
        riskCounts.moderate = totalStudents;
    }
    
    return riskCounts;
}

module.exports = {
  computeDynamicCollegeHistoryScores,
  computeDynamicHistoryForAssessment,
  getCollegeDimensionRiskLevel,
  RYFF_DIMENSIONS
};