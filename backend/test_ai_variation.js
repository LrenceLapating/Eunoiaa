const aiService = require('./utils/aiService');

// Test data - sample student assessment
const testStudentData = {
  name: 'Test Student',
  subscales: {
    autonomy: 25,
    personal_growth: 30,
    purpose_in_life: 20,
    self_acceptance: 35,
    positive_relations: 28,
    environmental_mastery: 22
  },
  overallScore: 160,
  atRiskDimensions: ['purpose_in_life', 'environmental_mastery'],
  college: 'Test University',
  section: 'Test Section',
  assessmentType: 'ryff_42'
};

const riskLevel = 'moderate';

async function testAIVariation() {
  console.log('🧪 Testing AI Prompt Variation...\n');
  const results = [];
  
  try {
    // Test multiple generations to check for variation
    for (let i = 1; i <= 3; i++) {
      console.log(`\n📝 Test Run ${i}:`);
      console.log('=' .repeat(50));
      
      try {
        // Generate intervention
        const intervention = await aiService.generateStructuredIntervention(
          testStudentData, 
          riskLevel
        );
        
        console.log('✅ Generation successful');
        console.log(`📊 Title: ${intervention.title}`);
        console.log(`📝 Overall Strategy Length: ${intervention.overallStrategy.length} characters`);
        console.log(`🎯 Dimensions Count: ${Object.keys(intervention.dimensionInterventions).length}`);
        console.log(`📋 Action Plan Items: ${intervention.actionPlan.length}`);
        
        // Check for variation indicators
        const overallStrategy = intervention.overallStrategy;
        const startsWithScore = overallStrategy.toLowerCase().startsWith('your overall score is');
        
        console.log(`🔍 Starts with "Your overall score is": ${startsWithScore ? '❌ TEMPLATED' : '✅ VARIED'}`);
        
        // Check dimension variations
        const dimensions = intervention.dimensionInterventions;
        let templatedCount = 0;
        let variedCount = 0;
        
        Object.entries(dimensions).forEach(([dim, text]) => {
          const isTemplated = text.toLowerCase().includes(`your score for ${dim.replace('_', ' ')} is`);
          if (isTemplated) {
            templatedCount++;
            console.log(`   ${dim}: ❌ TEMPLATED`);
          } else {
            variedCount++;
            console.log(`   ${dim}: ✅ VARIED`);
          }
        });
        
        console.log(`📈 Dimension Variation: ${variedCount}/${variedCount + templatedCount} varied`);
        
        // Store result for comparison
        results.push({
          run: i,
          overallStrategy: overallStrategy.substring(0, 100) + '...',
          autonomyStart: dimensions.autonomy ? dimensions.autonomy.substring(0, 50) + '...' : 'N/A',
          personalGrowthStart: dimensions.personal_growth ? dimensions.personal_growth.substring(0, 50) + '...' : 'N/A',
          startsWithScore,
          templatedDimensions: templatedCount,
          variedDimensions: variedCount
        });
        
      } catch (error) {
        console.error(`❌ Test Run ${i} failed:`, error.message);
        results.push({
          run: i,
          error: error.message
        });
      }
      
      // Wait between tests to avoid rate limiting
      if (i < 3) {
        console.log('\n⏳ Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VARIATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    const successfulRuns = results.filter(r => !r.error);
    const failedRuns = results.filter(r => r.error);
    
    console.log(`✅ Successful runs: ${successfulRuns.length}/3`);
    console.log(`❌ Failed runs: ${failedRuns.length}/3`);
    
    if (successfulRuns.length > 0) {
      const templatedOverall = successfulRuns.filter(r => r.startsWithScore).length;
      const variedOverall = successfulRuns.filter(r => !r.startsWithScore).length;
      
      console.log(`\n📝 Overall Strategy Variation:`);
      console.log(`   Varied openings: ${variedOverall}/${successfulRuns.length}`);
      console.log(`   Templated openings: ${templatedOverall}/${successfulRuns.length}`);
      
      console.log(`\n🎯 Dimension Variation:`);
      successfulRuns.forEach(result => {
        console.log(`   Run ${result.run}: ${result.variedDimensions} varied, ${result.templatedDimensions} templated`);
      });
      
      // Check if responses are different
      if (successfulRuns.length > 1) {
        const uniqueOverallStarts = new Set(successfulRuns.map(r => r.overallStrategy));
        const uniqueAutonomyStarts = new Set(successfulRuns.map(r => r.autonomyStart));
        
        console.log(`\n🔄 Response Uniqueness:`);
        console.log(`   Unique overall strategy openings: ${uniqueOverallStarts.size}/${successfulRuns.length}`);
        console.log(`   Unique autonomy dimension openings: ${uniqueAutonomyStarts.size}/${successfulRuns.length}`);
      }
    }
    
    if (failedRuns.length > 0) {
      console.log(`\n❌ Failed Runs:`);
      failedRuns.forEach(result => {
        console.log(`   Run ${result.run}: ${result.error}`);
      });
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testAIVariation().catch(console.error);
}

module.exports = { testAIVariation };