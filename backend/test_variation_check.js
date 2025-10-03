const aiService = require('./utils/aiService');

// Sample student data for testing
const sampleStudentData = {
  name: 'Alex',
  college: 'University of Technology',
  section: 'Computer Science',
  overall_score: 145,
  overall_max_score: 252,
  assessment_type: 'ryff_42',
  subscales: {
    autonomy: 26,
    personal_growth: 27,
    purpose_in_life: 24,
    self_acceptance: 25,
    positive_relations: 22,
    environmental_mastery: 21
  }
};

async function testScoreVariation() {
  console.log('=== TESTING SCORE MENTION VARIATION ===\n');
  
  try {
    // Generate multiple interventions to check for variation
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Test Run ${i} ---`);
      
      const intervention = await aiService.generateIntervention(sampleStudentData, 'Moderate');
      
      // Extract dimension sections
      const dimensionSections = intervention.text.split(/(?=Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)/);
      
      console.log('\nHow scores are mentioned in each dimension:');
      
      dimensionSections.forEach(section => {
        if (section.includes('26') || section.includes('27') || section.includes('24') || 
            section.includes('25') || section.includes('22') || section.includes('21')) {
          
          const lines = section.split('\n');
          const dimensionName = lines[0].split(':')[0];
          
          // Find the sentence that mentions the score
          const scorePattern = /(26|27|24|25|22|21)/;
          const scoreLine = lines.find(line => scorePattern.test(line));
          
          if (scoreLine) {
            console.log(`${dimensionName}: "${scoreLine.trim()}"`);
            
            // Check if it starts with "Your score of" pattern
            const startsWithYourScore = /^Your score of \d+/.test(scoreLine.trim());
            const startsWithWithScore = /^With a score of \d+/.test(scoreLine.trim());
            
            if (startsWithYourScore) {
              console.log('  ⚠️  Still using "Your score of..." pattern');
            } else if (startsWithWithScore) {
              console.log('  ⚠️  Using "With a score of..." pattern');
            } else {
              console.log('  ✅ Using varied score mention');
            }
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing score variation:', error);
  }
}

testScoreVariation();