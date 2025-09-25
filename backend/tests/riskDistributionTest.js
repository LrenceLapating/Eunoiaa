const { computeAndStoreCollegeScores, getCollegeDimensionRiskLevel } = require('../utils/collegeScoring');

/**
 * Test script to verify at-risk student detection in risk distribution
 */
async function testAtRiskStudentDetection() {
  console.log('=== Testing At-Risk Student Detection ===\n');
  
  // Test 1: Verify risk level calculation for individual scores
  console.log('Test 1: Individual Risk Level Calculation');
  const testScores = [
    { score: 87, expected: 'at-risk', description: 'Low overall score (87)' },
    { score: 111, expected: 'at-risk', description: 'Threshold score (111)' },
    { score: 112, expected: 'moderate', description: 'Just above at-risk (112)' },
    { score: 181, expected: 'moderate', description: 'Moderate threshold (181)' },
    { score: 182, expected: 'healthy', description: 'Healthy score (182)' }
  ];
  
  // Import the determineStudentRiskLevel function
  const determineStudentRiskLevel = require('../utils/collegeScoring').determineStudentRiskLevel || 
    function(overallScore, assessmentType = 'ryff_42') {
      const thresholds = {
        ryff_42: {
          atRisk: 111,
          moderate: 181
        }
      };
      
      const threshold = thresholds[assessmentType];
      
      if (overallScore <= threshold.atRisk) {
        return 'at-risk';
      } else if (overallScore <= threshold.moderate) {
        return 'moderate';
      } else {
        return 'healthy';
      }
    };
  
  testScores.forEach(test => {
    const result = determineStudentRiskLevel(test.score);
    const passed = result === test.expected;
    console.log(`  ${passed ? '✓' : '✗'} ${test.description}: ${test.score} → "${result}" (expected: "${test.expected}")`);
  });
  
  console.log('\nTest 2: Risk Distribution Object Structure');
  
  // Test the risk distribution counting logic
  const mockStudentRiskLevels = ['at-risk', 'moderate', 'healthy', 'at-risk'];
  const riskDistribution = {
    at_risk: 0,
    moderate: 0,
    healthy: 0
  };
  
  console.log('  Mock student risk levels:', mockStudentRiskLevels);
  console.log('  Risk distribution object keys:', Object.keys(riskDistribution));
  
  // Test the counting logic
  mockStudentRiskLevels.forEach(riskLevel => {
    console.log(`  Checking "${riskLevel}" - hasOwnProperty: ${riskDistribution.hasOwnProperty(riskLevel)}`);
    if (riskDistribution.hasOwnProperty(riskLevel)) {
      riskDistribution[riskLevel]++;
      console.log(`    ✓ Incremented ${riskLevel} to ${riskDistribution[riskLevel]}`);
    } else {
      console.log(`    ✗ Risk level "${riskLevel}" not found in riskDistribution object`);
    }
  });
  
  console.log('  Final distribution:', riskDistribution);
  
  // Test 3: Check for naming mismatch
  console.log('\nTest 3: Property Name Mismatch Detection');
  const riskLevelVariants = ['at-risk', 'at_risk', 'moderate', 'healthy'];
  const distributionKeys = ['at_risk', 'moderate', 'healthy'];
  
  riskLevelVariants.forEach(variant => {
    const hasMatch = distributionKeys.includes(variant);
    console.log(`  "${variant}" matches distribution keys: ${hasMatch ? '✓' : '✗'}`);
  });
  
  // Test 4: Simulate the actual problem
  console.log('\nTest 4: Simulating the Actual Problem');
  const studentData = {
    student_id: 'test-student-1',
    scores: {
      autonomy: 22,
      personal_growth: 12,
      purpose_in_life: 17,
      self_acceptance: 17,
      positive_relations: 7,
      environmental_mastery: 12
    }
  };
  
  // Calculate overall score
  let overallScore = 0;
  Object.values(studentData.scores).forEach(score => {
    overallScore += score;
  });
  
  console.log(`  Student scores:`, studentData.scores);
  console.log(`  Calculated overall score: ${overallScore}`);
  
  const assignedRiskLevel = determineStudentRiskLevel(overallScore);
  console.log(`  Assigned risk level: "${assignedRiskLevel}"`);
  
  // Test the distribution counting
  const testDistribution = { at_risk: 0, moderate: 0, healthy: 0 };
  console.log(`  Distribution before counting:`, testDistribution);
  
  if (testDistribution.hasOwnProperty(assignedRiskLevel)) {
    testDistribution[assignedRiskLevel]++;
    console.log(`  ✓ Successfully incremented ${assignedRiskLevel}`);
  } else {
    console.log(`  ✗ Failed to increment - "${assignedRiskLevel}" not found in distribution`);
    console.log(`  Available keys:`, Object.keys(testDistribution));
  }
  
  console.log(`  Distribution after counting:`, testDistribution);
  
  // Test 5: Proposed fix
  console.log('\nTest 5: Testing Proposed Fix');
  const fixedDistribution = { 'at-risk': 0, moderate: 0, healthy: 0 };
  console.log(`  Fixed distribution keys:`, Object.keys(fixedDistribution));
  
  if (fixedDistribution.hasOwnProperty(assignedRiskLevel)) {
    fixedDistribution[assignedRiskLevel]++;
    console.log(`  ✓ Successfully incremented with fixed keys`);
  } else {
    console.log(`  ✗ Still failed with fixed keys`);
  }
  
  console.log(`  Fixed distribution after counting:`, fixedDistribution);
  
  console.log('\n=== Test Complete ===');
  
  // Summary
  console.log('\nSUMMARY:');
  console.log('- The issue is likely a property name mismatch');
  console.log('- Risk levels use "at-risk" (with hyphen)');
  console.log('- Distribution object uses "at_risk" (with underscore)');
  console.log('- Fix: Change distribution object to use "at-risk" or map the values');
}

// Run the test
if (require.main === module) {
  testAtRiskStudentDetection().catch(console.error);
}

module.exports = { testAtRiskStudentDetection };