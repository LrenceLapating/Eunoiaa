// Test function for Ryff 84-item questionnaire scoring
// This will calculate dimension scores and overall score from your provided answers

const ryffScoring = require('./utils/ryffScoring');
const ryff84Questions = require('./utils/ryff84ItemQuestionnaire');

/**
 * Test function to calculate Ryff scores from provided answers
 * @param {Array} answers - Array of 84 answers (1-6 scale)
 * @returns {Object} - Detailed scoring results
 */
function testRyff84Scoring(answers) {
  console.log('=== RYFF 84-ITEM QUESTIONNAIRE SCORING TEST ===\n');
  
  // Validate input
  if (!answers || answers.length !== 84) {
    throw new Error('Please provide exactly 84 answers');
  }
  
  // Convert array to object format expected by scoring function
  const responses = {};
  for (let i = 0; i < 84; i++) {
    responses[(i + 1).toString()] = answers[i];
  }
  
  console.log('Input answers:', answers.join(','));
  console.log('\n--- PROCESSING RESPONSES ---');
  
  // Calculate dimension scores using existing scoring logic
  const dimensionScores = ryffScoring.calculateRyffScores(responses, 'ryff_84');
  
  // Calculate overall score (sum of all dimension scores)
  const overallScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0);
  
  // Get dimension statistics
  const dimensionStats = {};
  const dimensionNames = {
    autonomy: 'Autonomy',
    environmental_mastery: 'Environmental Mastery',
    personal_growth: 'Personal Growth',
    positive_relations: 'Positive Relations',
    purpose_in_life: 'Purpose in Life',
    self_acceptance: 'Self-Acceptance'
  };
  
  // Calculate detailed stats for each dimension
  Object.keys(dimensionScores).forEach(dimension => {
    const score = dimensionScores[dimension];
    const maxPossible = 84; // 14 items × 6 points max
    const minPossible = 14; // 14 items × 1 point min
    const percentage = ((score - minPossible) / (maxPossible - minPossible)) * 100;
    
    dimensionStats[dimension] = {
      name: dimensionNames[dimension],
      score: score,
      maxPossible: maxPossible,
      minPossible: minPossible,
      percentage: Math.round(percentage * 100) / 100,
      interpretation: getScoreInterpretation(percentage)
    };
  });
  
  // Display results
  console.log('\n=== DIMENSION SCORES ===');
  Object.keys(dimensionStats).forEach((dimension, index) => {
    const stats = dimensionStats[dimension];
    console.log(`${index + 1}. ${stats.name}:`);
    console.log(`   Score: ${stats.score}/${stats.maxPossible} (${stats.percentage}%)`);
    console.log(`   Interpretation: ${stats.interpretation}`);
    console.log('');
  });
  
  console.log('=== OVERALL RESULTS ===');
  console.log(`Total Overall Score: ${overallScore}/504`);
  console.log(`Overall Percentage: ${Math.round(((overallScore - 84) / (504 - 84)) * 10000) / 100}%`);
  
  // Determine risk level using existing logic
  const riskLevel = ryffScoring.determineRiskLevel(dimensionScores, 'ryff_84');
  const atRiskDimensions = ryffScoring.getAtRiskDimensions(dimensionScores, 'ryff_84');
  
  console.log(`Risk Level: ${riskLevel.toUpperCase()}`);
  if (atRiskDimensions.length > 0) {
    console.log(`At-Risk Dimensions: ${atRiskDimensions.join(', ')}`);
  } else {
    console.log('No dimensions at risk');
  }
  
  // Show item-by-item breakdown for verification
  console.log('\n=== ITEM-BY-ITEM BREAKDOWN ===');
  showItemBreakdown(responses);
  
  return {
    dimensionScores,
    dimensionStats,
    overallScore,
    riskLevel,
    atRiskDimensions,
    responses
  };
}

/**
 * Get interpretation of score percentage
 */
function getScoreInterpretation(percentage) {
  if (percentage >= 80) return 'Very High';
  if (percentage >= 60) return 'High';
  if (percentage >= 40) return 'Moderate';
  if (percentage >= 20) return 'Low';
  return 'Very Low';
}

/**
 * Show detailed item breakdown by dimension
 */
function showItemBreakdown(responses) {
  const dimensionItems = {
    autonomy: [],
    environmental_mastery: [],
    personal_growth: [],
    positive_relations: [],
    purpose_in_life: [],
    self_acceptance: []
  };
  
  // Group items by dimension
  ryff84Questions.forEach(question => {
    const response = responses[question.id.toString()];
    const processedScore = question.reverse ? (7 - response) : response;
    
    dimensionItems[question.dimension].push({
      id: question.id,
      original: response,
      processed: processedScore,
      reverse: question.reverse
    });
  });
  
  // Display breakdown
  Object.keys(dimensionItems).forEach(dimension => {
    const items = dimensionItems[dimension];
    const total = items.reduce((sum, item) => sum + item.processed, 0);
    
    console.log(`\n${dimension.toUpperCase().replace('_', ' ')}:`);
    console.log(`Items: ${items.map(item => 
      `${item.id}(${item.original}${item.reverse ? '→' + item.processed : ''})`
    ).join(', ')}`);
    console.log(`Total: ${total}/84`);
  });
}

// Run the test with your provided answers
const yourAnswers = [4,5,3,5,5,2,3,3,3,5,4,3,6,5,2,4,6,6,2,4,5,1,4,2,6,5,4,1,1,3,3,2,4,4,6,6,6,3,4,4,1,3,5,3,5,1,2,4,1,4,6,2,2,1,2,5,2,4,4,4,4,5,3,6,1,4,2,4,2,6,6,6,2,4,6,5,2,2,4,2,2,6,4,6];

console.log('Starting Ryff 84-Item Questionnaire Scoring Test...\n');

try {
  const results = testRyff84Scoring(yourAnswers);
  console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
} catch (error) {
  console.error('Error during testing:', error.message);
}