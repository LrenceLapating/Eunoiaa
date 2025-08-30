// Ryff Scales Scoring Utilities
// Based on the 6-factor model of psychological well-being

// Dimension mappings for different versions
const RYFF_DIMENSIONS = {
  autonomy: 'autonomy',
  environmental_mastery: 'environmental_mastery', 
  personal_growth: 'personal_growth',
  positive_relations: 'positive_relations',
  purpose_in_life: 'purpose_in_life',
  self_acceptance: 'self_acceptance'
};

// Items that need reverse scoring (higher numbers become lower)
const REVERSE_SCORED_ITEMS = {
  // 84-item version reverse scored items
  ryff_84: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
  // 42-item version reverse scored items  
  ryff_42: [1, 3, 5, 6, 8, 9, 11, 12, 13, 15, 16, 17, 19, 23, 26, 27, 29, 32, 34, 36, 39, 41]
};

// Item-to-dimension mapping for 42-item version
const ITEM_DIMENSION_MAP_42 = {
  1: 'autonomy', 2: 'autonomy', 3: 'autonomy', 4: 'autonomy', 5: 'autonomy', 6: 'autonomy', 7: 'autonomy',
  8: 'environmental_mastery', 9: 'environmental_mastery', 10: 'environmental_mastery', 11: 'environmental_mastery', 12: 'environmental_mastery', 13: 'environmental_mastery', 14: 'environmental_mastery',
  15: 'personal_growth', 16: 'personal_growth', 17: 'personal_growth', 18: 'personal_growth', 19: 'personal_growth', 20: 'personal_growth', 21: 'personal_growth',
  22: 'positive_relations', 23: 'positive_relations', 24: 'positive_relations', 25: 'positive_relations', 26: 'positive_relations', 27: 'positive_relations', 28: 'positive_relations',
  29: 'purpose_in_life', 30: 'purpose_in_life', 31: 'purpose_in_life', 32: 'purpose_in_life', 33: 'purpose_in_life', 34: 'purpose_in_life', 35: 'purpose_in_life',
  36: 'self_acceptance', 37: 'self_acceptance', 38: 'self_acceptance', 39: 'self_acceptance', 40: 'self_acceptance', 41: 'self_acceptance', 42: 'self_acceptance'
};

// Item-to-dimension mapping for 84-item version
const ITEM_DIMENSION_MAP_84 = {
  // Autonomy (14 items)
  1: 'autonomy', 2: 'autonomy', 3: 'autonomy', 4: 'autonomy', 5: 'autonomy', 6: 'autonomy', 7: 'autonomy',
  8: 'autonomy', 9: 'autonomy', 10: 'autonomy', 11: 'autonomy', 12: 'autonomy', 13: 'autonomy', 14: 'autonomy',
  
  // Environmental Mastery (14 items)
  15: 'environmental_mastery', 16: 'environmental_mastery', 17: 'environmental_mastery', 18: 'environmental_mastery',
  19: 'environmental_mastery', 20: 'environmental_mastery', 21: 'environmental_mastery', 22: 'environmental_mastery',
  23: 'environmental_mastery', 24: 'environmental_mastery', 25: 'environmental_mastery', 26: 'environmental_mastery',
  27: 'environmental_mastery', 28: 'environmental_mastery',
  
  // Personal Growth (14 items)
  29: 'personal_growth', 30: 'personal_growth', 31: 'personal_growth', 32: 'personal_growth',
  33: 'personal_growth', 34: 'personal_growth', 35: 'personal_growth', 36: 'personal_growth',
  37: 'personal_growth', 38: 'personal_growth', 39: 'personal_growth', 40: 'personal_growth',
  41: 'personal_growth', 42: 'personal_growth',
  
  // Positive Relations (14 items)
  43: 'positive_relations', 44: 'positive_relations', 45: 'positive_relations', 46: 'positive_relations',
  47: 'positive_relations', 48: 'positive_relations', 49: 'positive_relations', 50: 'positive_relations',
  51: 'positive_relations', 52: 'positive_relations', 53: 'positive_relations', 54: 'positive_relations',
  55: 'positive_relations', 56: 'positive_relations',
  
  // Purpose in Life (14 items)
  57: 'purpose_in_life', 58: 'purpose_in_life', 59: 'purpose_in_life', 60: 'purpose_in_life',
  61: 'purpose_in_life', 62: 'purpose_in_life', 63: 'purpose_in_life', 64: 'purpose_in_life',
  65: 'purpose_in_life', 66: 'purpose_in_life', 67: 'purpose_in_life', 68: 'purpose_in_life',
  69: 'purpose_in_life', 70: 'purpose_in_life',
  
  // Self-Acceptance (14 items)
  71: 'self_acceptance', 72: 'self_acceptance', 73: 'self_acceptance', 74: 'self_acceptance',
  75: 'self_acceptance', 76: 'self_acceptance', 77: 'self_acceptance', 78: 'self_acceptance',
  79: 'self_acceptance', 80: 'self_acceptance', 81: 'self_acceptance', 82: 'self_acceptance',
  83: 'self_acceptance', 84: 'self_acceptance'
};

/**
 * Reverse score an item (6-point scale: 1->6, 2->5, 3->4, 4->3, 5->2, 6->1)
 * @param {number} score - Original score (1-6)
 * @returns {number} - Reverse scored value
 */
function reverseScore(score) {
  return 7 - score;
}

/**
 * Calculate Ryff dimension scores from responses using actual questionnaire structure
 * @param {Object} responses - Object with item numbers as keys and scores as values
 * @param {string} assessmentType - 'ryff_42' or 'ryff_84'
 * @returns {Object} - Dimension scores
 */
function calculateRyffScores(responses, assessmentType = 'ryff_42') {
  // Import the actual questionnaire structures
  const ryff42Questions = require('./ryff42ItemQuestionnaire');
  const ryff84Questions = require('./ryff84ItemQuestionnaire');
  
  const questions = assessmentType === 'ryff_84' ? ryff84Questions : ryff42Questions;
  
  // Initialize dimension totals
  const dimensionTotals = {
    autonomy: 0,
    environmental_mastery: 0,
    personal_growth: 0,
    positive_relations: 0,
    purpose_in_life: 0,
    self_acceptance: 0
  };
  
  // Process each question using actual questionnaire structure
  questions.forEach(question => {
    const response = responses[question.id.toString()];
    if (response !== null && response !== undefined) {
      let score = response;
      // Apply reverse scoring if needed (using questionnaire's reverse flag)
      if (question.reverse) {
        score = reverseScore(response);
      }
      dimensionTotals[question.dimension] += score;
    }
  });
  
  return dimensionTotals;
}

/**
 * Determine risk level based on scores using tertile thresholds
 * @param {Object} dimensionScores - Calculated dimension scores (raw totals)
 * @param {number} overallScore - Overall average score
 * @param {string} assessmentType - Type of assessment ('ryff_42' or 'ryff_84')
 * @returns {string} - 'low', 'moderate', or 'high' risk
 */
function determineRiskLevel(dimensionScores, overallScore, assessmentType = 'ryff_42') {
  // Define tertile thresholds for overall scores (sum of all 6 dimensions)
  // Risk level is determined ONLY by overall_score, not individual dimensions
  const overallThresholds = {
    ryff_42: {
      atRisk: 111,    // ≤111: At-Risk (42-111)
      moderate: 181   // 112-181: Moderate, ≥182: Healthy (182-252)
    },
    ryff_84: {
      atRisk: 222,    // ≤222: At-Risk (84-222) - scaled from 42-item
      moderate: 362   // 223-362: Moderate, ≥363: Healthy (363-504) - scaled from 42-item
    }
  };
  
  const threshold = overallThresholds[assessmentType] || overallThresholds.ryff_42;
  
  // Determine risk level based ONLY on overall score thresholds
  if (overallScore > threshold.moderate) {
    return 'low';
  } else if (overallScore > threshold.atRisk) {
    return 'moderate';
  } else {
    return 'high';
  }
}

/**
 * Get at-risk dimensions (scores below tertile threshold)
 * @param {Object} dimensionScores - Calculated dimension scores (raw totals)
 * @param {string} assessmentType - Type of assessment ('ryff_42' or 'ryff_84')
 * @returns {Array} - Array of at-risk dimension names
 */
function getAtRiskDimensions(dimensionScores, assessmentType = 'ryff_42') {
  // Define tertile thresholds for individual dimensions
  const thresholds = {
    ryff_42: 18,  // 7-18: At-Risk for each dimension (7 items per dimension)
    ryff_84: 36   // 14-36: At-Risk for each dimension (14 items per dimension)
  };
  
  const threshold = thresholds[assessmentType] || thresholds.ryff_42;
  
  return Object.entries(dimensionScores)
    .filter(([dimension, score]) => score <= threshold)
    .map(([dimension, score]) => dimension);
}

/**
 * Format dimension name for display
 * @param {string} dimension - Dimension key
 * @returns {string} - Formatted dimension name
 */
function formatDimensionName(dimension) {
  const nameMap = {
    autonomy: 'Autonomy',
    environmental_mastery: 'Environmental Mastery',
    personal_growth: 'Personal Growth',
    positive_relations: 'Positive Relations with Others',
    purpose_in_life: 'Purpose in Life',
    self_acceptance: 'Self-Acceptance'
  };
  return nameMap[dimension] || dimension
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color for dimension based on score using tertile thresholds
 * @param {number} score - Dimension score (raw total)
 * @param {string} assessmentType - Type of assessment ('ryff_42' or 'ryff_84')
 * @returns {string} - Color code
 */
function getDimensionColor(score, assessmentType = 'ryff_42') {
  // Define tertile thresholds for individual dimensions
  const thresholds = {
    ryff_42: {
      atRisk: 18,    // 7-18: At-Risk
      moderate: 30   // 19-30: Moderate, 31-42: Healthy
    },
    ryff_84: {
      atRisk: 36,    // 14-36: At-Risk
      moderate: 59   // 37-59: Moderate, 60-84: Healthy
    }
  };
  
  const threshold = thresholds[assessmentType] || thresholds.ryff_42;
  
  if (score > threshold.moderate) return '#4CAF50'; // Green - Healthy
  if (score > threshold.atRisk) return '#FF9800'; // Orange - Moderate
  return '#F44336'; // Red - At Risk
}

/**
 * Calculate college-level statistics
 * @param {Array} studentData - Array of student assessment data
 * @returns {Object} - College statistics
 */
function calculateCollegeStats(studentData) {
  if (!studentData || studentData.length === 0) {
    return {
      totalStudents: 0,
      averageScores: {},
      riskDistribution: { low: 0, moderate: 0, high: 0 },
      atRiskDimensions: {}
    };
  }
  
  const totalStudents = studentData.length;
  const dimensionTotals = {
    autonomy: 0,
    environmental_mastery: 0,
    personal_growth: 0,
    positive_relations: 0,
    purpose_in_life: 0,
    self_acceptance: 0
  };
  
  const riskCounts = { low: 0, moderate: 0, high: 0 };
  const atRiskCounts = {
    autonomy: 0,
    environmental_mastery: 0,
    personal_growth: 0,
    positive_relations: 0,
    purpose_in_life: 0,
    self_acceptance: 0
  };
  
  // Process each student's data
  studentData.forEach(student => {
    if (student.scores) {
      // Add to dimension totals
      Object.entries(student.scores).forEach(([dimension, score]) => {
        if (dimensionTotals.hasOwnProperty(dimension)) {
          dimensionTotals[dimension] += score;
          
          // Count at-risk dimensions
          if (score < 3.5) {
            atRiskCounts[dimension]++;
          }
        }
      });
      
      // Count risk levels
      if (student.risk_level && riskCounts.hasOwnProperty(student.risk_level)) {
        riskCounts[student.risk_level]++;
      }
    }
  });
  
  // Calculate averages
  const averageScores = {};
  Object.entries(dimensionTotals).forEach(([dimension, total]) => {
    averageScores[dimension] = parseFloat((total / totalStudents).toFixed(2));
  });
  
  // Calculate percentages for at-risk dimensions
  const atRiskPercentages = {};
  Object.entries(atRiskCounts).forEach(([dimension, count]) => {
    atRiskPercentages[dimension] = parseFloat(((count / totalStudents) * 100).toFixed(1));
  });
  
  return {
    totalStudents,
    averageScores,
    riskDistribution: riskCounts,
    atRiskDimensions: atRiskPercentages
  };
}

module.exports = {
  calculateRyffScores,
  determineRiskLevel,
  getAtRiskDimensions,
  formatDimensionName,
  getDimensionColor,
  calculateCollegeStats,
  RYFF_DIMENSIONS
};