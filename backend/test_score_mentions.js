const aiService = require('./utils/aiService');

async function testScoreMentions() {
  console.log('🧪 Testing Score Mentions in Dimension Interventions...\n');

  // Sample student data for testing
  const sampleStudentData = {
    name: 'Alex',
    overallScore: 145,
    overallMaxScore: 252,
    riskLevel: 'Moderate',
    assessmentType: 'RYFF',
    subscales: {
      autonomy: 26,
      personal_growth: 27,
      purpose_in_life: 24,
      self_acceptance: 25,
      positive_relations: 22,
      environmental_mastery: 21
    }
  };

  let testsPassed = 0;
  let totalTests = 0;

  try {
    // Generate AI intervention
    console.log('📝 Generating AI intervention...');
    const intervention = await aiService.generateStructuredIntervention(sampleStudentData);
    
    if (!intervention || !intervention.dimensionInterventions) {
      throw new Error('Failed to generate intervention or missing dimension interventions');
    }

    console.log('✅ AI intervention generated successfully\n');

    // Test each dimension for score mentions
    const dimensions = ['autonomy', 'personal_growth', 'purpose_in_life', 'self_acceptance', 'positive_relations', 'environmental_mastery'];
    const expectedScores = {
      autonomy: '26',
      personal_growth: '27', 
      purpose_in_life: '24',
      self_acceptance: '25',
      positive_relations: '22',
      environmental_mastery: '21'
    };

    console.log('🔍 Checking score mentions in each dimension:\n');

    for (const dimension of dimensions) {
      totalTests++;
      const dimensionText = intervention.dimensionInterventions[dimension];
      const expectedScore = expectedScores[dimension];
      
      if (!dimensionText) {
        console.log(`❌ ${dimension}: Missing intervention text`);
        continue;
      }

      // Check if the specific score is mentioned in the text
      const scorePattern = new RegExp(`\\b${expectedScore}\\b`, 'i');
      const hasScore = scorePattern.test(dimensionText);
      
      if (hasScore) {
        console.log(`✅ ${dimension}: Score ${expectedScore} mentioned`);
        testsPassed++;
      } else {
        console.log(`❌ ${dimension}: Score ${expectedScore} NOT mentioned`);
        console.log(`   Text: ${dimensionText.substring(0, 150)}...`);
      }
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`📈 Success Rate: ${((testsPassed/totalTests) * 100).toFixed(1)}%`);

    if (testsPassed === totalTests) {
      console.log('\n🎉 All dimension interventions properly mention their specific scores!');
    } else {
      console.log('\n⚠️  Some dimension interventions are missing score mentions.');
      console.log('The AI prompt may need further adjustment to ensure consistent score inclusion.');
    }

    // Show sample dimension interventions for verification
    console.log('\n📋 Sample Dimension Interventions:');
    console.log('─'.repeat(60));
    
    dimensions.slice(0, 2).forEach(dimension => {
      console.log(`\n${dimension.toUpperCase()}:`);
      console.log(intervention.dimensionInterventions[dimension]);
    });

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testScoreMentions().catch(console.error);