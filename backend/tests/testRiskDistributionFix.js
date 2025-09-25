const { computeAndStoreCollegeScores } = require('../utils/collegeScoring');

/**
 * Test the fixed at-risk student detection
 */
async function testRiskDistributionFix() {
  console.log('=== Testing Risk Distribution Fix ===\n');
  
  try {
    // Test with ryff_42 assessment type (which should have the at-risk student)
    console.log('Running college scoring with ryff_42...');
    
    const result = await computeAndStoreCollegeScores(null, 'ryff_42');
    
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✓ College scoring completed successfully');
      console.log(`✓ Processed ${result.scores?.length || 0} college score records`);
    } else {
      console.log('✗ College scoring failed:', result.message);
    }
    
  } catch (error) {
    console.error('✗ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
if (require.main === module) {
  testRiskDistributionFix().catch(console.error);
}

module.exports = { testRiskDistributionFix };