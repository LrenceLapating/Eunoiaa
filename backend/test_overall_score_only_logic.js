require('dotenv').config();
const { calculateRyffScores, determineRiskLevel } = require('./utils/ryffScoring');

/**
 * Test the updated risk level logic that uses ONLY overall_score
 * This verifies that dimension-based overrides are removed
 */
function testOverallScoreOnlyLogic() {
  console.log('🧪 Testing Overall Score Only Risk Level Logic');
  console.log('=' .repeat(60));
  
  // Test cases with different scenarios
  const testCases = [
    {
      name: 'High overall score with at-risk dimension',
      assessmentType: 'ryff_42',
      dimensionScores: {
        autonomy: 15,  // At-risk (≤18)
        environmental_mastery: 35,
        personal_growth: 35,
        positive_relations: 35,
        purpose_in_life: 35,
        self_acceptance: 35
      },
      overallScore: 190,  // Should be 'low' despite at-risk dimension
      expectedRiskLevel: 'low'
    },
    {
      name: 'Moderate overall score with at-risk dimension',
      assessmentType: 'ryff_42',
      dimensionScores: {
        autonomy: 12,  // At-risk (≤18)
        environmental_mastery: 25,
        personal_growth: 25,
        positive_relations: 25,
        purpose_in_life: 25,
        self_acceptance: 25
      },
      overallScore: 137,  // Should be 'moderate' despite at-risk dimension
      expectedRiskLevel: 'moderate'
    },
    {
      name: 'Low overall score with healthy dimensions',
      assessmentType: 'ryff_42',
      dimensionScores: {
        autonomy: 20,  // Healthy
        environmental_mastery: 20,
        personal_growth: 20,
        positive_relations: 20,
        purpose_in_life: 20,
        self_acceptance: 10  // Low but not at-risk threshold
      },
      overallScore: 110,  // Should be 'high' based on overall score
      expectedRiskLevel: 'high'
    },
    {
      name: 'Boundary case - exactly at moderate threshold',
      assessmentType: 'ryff_42',
      dimensionScores: {
        autonomy: 30,
        environmental_mastery: 30,
        personal_growth: 30,
        positive_relations: 30,
        purpose_in_life: 31,
        self_acceptance: 30
      },
      overallScore: 181,  // Exactly at moderate threshold
      expectedRiskLevel: 'moderate'
    },
    {
      name: 'Boundary case - one point above moderate threshold',
      assessmentType: 'ryff_42',
      dimensionScores: {
        autonomy: 30,
        environmental_mastery: 30,
        personal_growth: 30,
        positive_relations: 30,
        purpose_in_life: 31,
        self_acceptance: 31
      },
      overallScore: 182,  // One point above moderate threshold
      expectedRiskLevel: 'low'
    },
    {
      name: '84-item test - high score with multiple at-risk dimensions',
      assessmentType: 'ryff_84',
      dimensionScores: {
        autonomy: 30,  // At-risk (≤36)
        environmental_mastery: 35,  // At-risk (≤36)
        personal_growth: 70,
        positive_relations: 70,
        purpose_in_life: 70,
        self_acceptance: 70
      },
      overallScore: 375,  // Should be 'low' despite multiple at-risk dimensions
      expectedRiskLevel: 'low'
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n🧪 Test ${index + 1}: ${testCase.name}`);
    console.log(`   Assessment Type: ${testCase.assessmentType}`);
    console.log(`   Overall Score: ${testCase.overallScore}`);
    console.log(`   Expected Risk Level: ${testCase.expectedRiskLevel}`);
    
    // Show at-risk dimensions for context
    const atRiskThreshold = testCase.assessmentType === 'ryff_42' ? 18 : 36;
    const atRiskDimensions = Object.entries(testCase.dimensionScores)
      .filter(([dim, score]) => score <= atRiskThreshold)
      .map(([dim, score]) => `${dim}(${score})`);
    
    if (atRiskDimensions.length > 0) {
      console.log(`   At-Risk Dimensions: ${atRiskDimensions.join(', ')}`);
    } else {
      console.log(`   At-Risk Dimensions: None`);
    }
    
    // Test the actual function
    const actualRiskLevel = determineRiskLevel(
      testCase.dimensionScores,
      testCase.overallScore,
      testCase.assessmentType
    );
    
    console.log(`   Actual Risk Level: ${actualRiskLevel}`);
    
    if (actualRiskLevel === testCase.expectedRiskLevel) {
      console.log(`   ✅ PASSED`);
      passedTests++;
    } else {
      console.log(`   ❌ FAILED - Expected '${testCase.expectedRiskLevel}' but got '${actualRiskLevel}'`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS:');
  console.log(`Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   The risk level logic now correctly uses ONLY overall_score');
    console.log('   Individual dimension at-risk status no longer overrides classification');
  } else {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('   The risk level logic may still have dimension-based overrides');
  }
}

testOverallScoreOnlyLogic();