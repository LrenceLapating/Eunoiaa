const aiService = require('./utils/aiService');
require('dotenv').config();

async function testScoreMentions() {
  try {
    console.log('=== TESTING SCORE MENTIONS IN INTERVENTIONS ===\n');
    
    // Sample student data
    const studentData = {
      name: 'Lemuel',
      college: 'College of Computer Studies',
      section: 'BSIT-4A',
      overallScore: 145,
      overallMaxScore: 252,
      riskLevel: 'Moderate',
      assessmentType: 'ryff_42',
      subscales: {
        autonomy: 26,
        personal_growth: 27,
        purpose_in_life: 24,
        self_acceptance: 25,
        positive_relations: 22,
        environmental_mastery: 21
      }
    };

    console.log('Student Data:');
    console.log('- Name:', studentData.name);
    console.log('- Overall Score:', studentData.overallScore + '/' + studentData.overallMaxScore);
    console.log('- Dimension Scores:');
    console.log('  * Autonomy:', studentData.subscales.autonomy);
    console.log('  * Personal Growth:', studentData.subscales.personal_growth);
    console.log('  * Purpose in Life:', studentData.subscales.purpose_in_life);
    console.log('  * Self Acceptance:', studentData.subscales.self_acceptance);
    console.log('  * Positive Relations:', studentData.subscales.positive_relations);
    console.log('  * Environmental Mastery:', studentData.subscales.environmental_mastery);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Generate intervention
    console.log('Generating AI intervention...');
    const result = await aiService.generateIntervention(studentData, studentData.riskLevel);
    
    console.log('Generated Intervention:');
    console.log('Title:', result.title);
    console.log('Text length:', result.text.length);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Check for score mentions in each dimension
    const dimensions = [
      { name: 'Autonomy', score: 26 },
      { name: 'Personal Growth', score: 27 },
      { name: 'Purpose in Life', score: 24 },
      { name: 'Self Acceptance', score: 25 },
      { name: 'Positive Relations', score: 22 },
      { name: 'Environmental Mastery', score: 21 }
    ];
    
    console.log('=== SCORE MENTION VERIFICATION ===');
    let allScoresMentioned = true;
    
    dimensions.forEach((dimension) => {
      // Look for the specific score number in the text
      const scorePattern = new RegExp(`\\b${dimension.score}\\b`, 'g');
      const matches = result.text.match(scorePattern);
      const found = matches && matches.length > 0;
      
      console.log(`${dimension.name} (${dimension.score}): ${found ? '✓ FOUND' : '✗ NOT FOUND'}`);
      
      if (found) {
        console.log(`  - Found ${matches.length} mention(s) of score "${dimension.score}"`);
      } else {
        allScoresMentioned = false;
        console.log(`  - Score "${dimension.score}" not found in intervention text`);
      }
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    if (allScoresMentioned) {
      console.log('✅ SUCCESS: All dimension scores are mentioned in the intervention!');
    } else {
      console.log('❌ ISSUE: Some dimension scores are missing from the intervention.');
    }
    
    // Show a sample of the intervention text for manual verification
    console.log('\n=== INTERVENTION TEXT SAMPLE ===');
    console.log('First 800 characters:');
    console.log(result.text.substring(0, 800) + '...');
    
  } catch (error) {
    console.error('Error in score mention test:', error);
  }
}

testScoreMentions();