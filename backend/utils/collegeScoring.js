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
 * Calculate risk level based on raw score (7-42 range)
 * Uses exact calculated average before rounding for categorization
 * @param {number} rawScore - Raw score from 7-42
 * @returns {string} Risk level: 'At Risk', 'Moderate', or 'Healthy'
 */
function getCollegeDimensionRiskLevel(rawScore) {
  if (rawScore <= 18) return 'At Risk';   // ≤18 = At-Risk
  if (rawScore <= 30) return 'Moderate';  // 19-30 = Moderate  
  return 'Healthy';                       // ≥31 = Healthy
}

/**
 * Compute college scores from assessment data and store in database
 * @param {string} collegeName - Optional: compute for specific college only
 * @param {string} assessmentType - Optional: filter by assessment type (ryff_42 or ryff_84)
 * @returns {Object} Result with success status and computed scores
 */
async function computeAndStoreCollegeScores(collegeName = null, assessmentType = null) {
  try {
    // Require assessmentType to prevent mixing of data
    if (!assessmentType) {
      throw new Error('Assessment type is required to compute college scores');
    }
    
    console.log(`Computing college scores${collegeName ? ` for ${collegeName}` : ' for all colleges'} (${assessmentType})...`);
    
    // Determine which table to query based on assessment type
    let tableName = 'assessments'; // Default to unified view
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    // Build query to get assessments with student college info
    let query;
    if (tableName === 'assessments') {
      // For unified view, use the existing relationship
      query = supabaseAdmin
        .from(tableName)
        .select(`
          id,
          scores,
          assessment_type,
          students!inner(
            college
          )
        `)
        .not('scores', 'is', null);
    } else {
      // For specific tables, join through student_id
      query = supabaseAdmin
        .from(tableName)
        .select(`
          id,
          scores,
          assessment_type,
          student_id,
          students!inner(
            college
          )
        `)
        .not('scores', 'is', null);
    }
    
    // Filter by college if specified
    if (collegeName) {
      query = query.eq('students.college', collegeName);
    }
    
    // Filter by assessment type if specified and using unified view
    if (assessmentType && tableName === 'assessments') {
      query = query.eq('assessment_type', assessmentType);
    }
    
    const { data: assessments, error: assessmentError } = await query;
    
    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      throw assessmentError;
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('No assessment data found');
      return { success: true, message: 'No assessment data to process', scores: [] };
    }
    
    console.log(`Found ${assessments.length} assessments to process`);
    
    // Group assessments by college
    const collegeData = {};
    
    assessments.forEach(assessment => {
      const college = assessment.students.college;
      if (!college) return;
      
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
 * Get college scores from database
 * @param {string} collegeName - Optional: get scores for specific college
 * @param {string} assessmentType - Optional: filter by assessment type (ryff_42 or ryff_84)
 * @returns {Object} College scores grouped by college and dimension
 */
async function getCollegeScores(collegeName = null, assessmentType = null) {
  try {
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
    
    const { data: scores, error } = await query;
    
    if (error) {
      console.error('Error fetching college scores:', error);
      throw error;
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

module.exports = {
  computeAndStoreCollegeScores,
  getCollegeScores,
  getCollegeDimensionRiskLevel,
  RYFF_DIMENSIONS
};