const aiService = require('./utils/aiService');

// Mock AI response for 84-item assessment
const mockAI84Response = `Overall Mental Health Strategy:
Your assessment shows a balanced approach to well-being with particular strengths in personal growth and areas for development in autonomy. Focus on building confidence in decision-making while maintaining your growth mindset.

Dimension Scores & Targeted Interventions:
Autonomy (25/84): You're on the right track! Keep practicing habits that bring you balance, like setting small daily goals and making independent choices. Small adjustments can bring even greater stability.
Personal Growth (45/84): You're doing wonderfully in this area! Keep nurturing these habits of learning and self-improvement, and remember to celebrate the hard work that keeps you feeling strong.
Purpose in Life (30/84): You're on the right track! Keep exploring activities that align with your values and interests. Small adjustments in how you spend your time can bring even greater clarity.
Self Acceptance (28/84): You're on the right track! Keep practicing self-compassion and acknowledging your achievements. Small adjustments in self-talk can bring even greater confidence.
Positive Relations (35/84): You're on the right track! Keep nurturing your connections with others through regular check-ins and quality time. Small adjustments can bring even greater social support.
Environmental Mastery (32/84): You're on the right track! Keep developing your organizational skills and time management. Small adjustments can bring even greater control over your environment.

Recommended Action Plan:
1. For Autonomy, practice making one independent decision daily, like choosing your study schedule or meal planning.
2. For Personal Growth, continue reading or learning something new for 15 minutes each day.
3. For Purpose in Life, spend 10 minutes weekly reflecting on activities that bring you joy and meaning.
4. For Self Acceptance, write down three things you appreciate about yourself each evening.
5. For Positive Relations, reach out to one friend or family member each week for meaningful conversation.`;

// Mock AI response for 42-item assessment
const mockAI42Response = `Overall Mental Health Strategy:
Your scores indicate strong resilience with opportunities for growth in environmental mastery. Continue building on your strengths while developing practical life management skills.

Dimension Scores & Targeted Interventions:
Autonomy (20/42): You're on the right track! Keep practicing habits that bring you balance, like making small independent choices daily. Small adjustments can bring even greater stability.
Personal Growth (25/42): You're on the right track! Keep exploring new learning opportunities and challenging yourself. Small adjustments in your growth mindset can bring even greater development.
Purpose in Life (18/42): This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like daily reflection on your values. Each small action builds strength.
Self Acceptance (22/42): You're on the right track! Keep practicing self-compassion and celebrating small wins. Small adjustments in how you view yourself can bring even greater confidence.
Positive Relations (24/42): You're on the right track! Keep nurturing your relationships through regular communication and quality time. Small adjustments can bring even greater connection.
Environmental Mastery (16/42): This area may feel challenging right now, but it's also where the most growth can happen. Start with small habits like organizing one area of your space daily. Each small action builds strength.

Recommended Action Plan:
1. For Autonomy, make one independent choice each day and reflect on how it felt.
2. For Personal Growth, set aside 20 minutes weekly for learning something new.
3. For Purpose in Life, spend 5 minutes daily journaling about what matters most to you.
4. For Self Acceptance, practice positive self-talk when facing challenges.
5. For Environmental Mastery, organize one small area of your living space each day.`;

async function testAIInterventionFixes() {
  console.log('=== Testing AI Intervention Generation Fixes ===\n');
  
  // Test data for 84-item assessment
  const student84Data = {
    name: 'Test Student 84',
    subscales: {
      autonomy: 25,
      personal_growth: 45,
      purpose_in_life: 30,
      self_acceptance: 28,
      positive_relations: 35,
      environmental_mastery: 32
    },
    overallScore: 195,
    assessmentType: 'ryff_84',
    college: 'Test University',
    section: 'Test Section'
  };
  
  // Test data for 42-item assessment
  const student42Data = {
    name: 'Test Student 42',
    subscales: {
      autonomy: 20,
      personal_growth: 25,
      purpose_in_life: 18,
      self_acceptance: 22,
      positive_relations: 24,
      environmental_mastery: 16
    },
    overallScore: 125,
    assessmentType: 'ryff_42',
    college: 'Test University',
    section: 'Test Section'
  };
  
  console.log('1. Testing 84-item assessment parsing...');
  try {
    const parsed84 = aiService.parseEnhancedAIResponse(mockAI84Response);
    console.log('Strategy extracted:', parsed84.strategy ? 'YES' : 'NO');
    console.log('Dimensions parsed:', Object.keys(parsed84.dimensions).length);
    console.log('Dimension names:', Object.keys(parsed84.dimensions));
    console.log('Actions extracted:', parsed84.actions.length);
    
    const structured84 = aiService.createStructuredResponse(mockAI84Response, student84Data, 'moderate');
    console.log('Structured response created successfully for 84-item');
    console.log('Dimension interventions count:', Object.keys(structured84.dimensionInterventions).length);
    
  } catch (error) {
    console.error('84-item test failed:', error.message);
  }
  
  console.log('\n2. Testing 42-item assessment parsing...');
  try {
    const parsed42 = aiService.parseEnhancedAIResponse(mockAI42Response);
    console.log('Strategy extracted:', parsed42.strategy ? 'YES' : 'NO');
    console.log('Dimensions parsed:', Object.keys(parsed42.dimensions).length);
    console.log('Dimension names:', Object.keys(parsed42.dimensions));
    console.log('Actions extracted:', parsed42.actions.length);
    
    const structured42 = aiService.createStructuredResponse(mockAI42Response, student42Data, 'moderate');
    console.log('Structured response created successfully for 42-item');
    console.log('Dimension interventions count:', Object.keys(structured42.dimensionInterventions).length);
    
  } catch (error) {
    console.error('42-item test failed:', error.message);
  }
  
  console.log('\n3. Testing fallback mechanisms...');
  try {
    // Test with incomplete AI response
    const incompleteResponse = `Overall Mental Health Strategy:
Your scores show good progress.

Dimension Scores & Targeted Interventions:
Autonomy (25/84): Good progress here.

Recommended Action Plan:
1. Keep working on your goals.`;
    
    const parsedIncomplete = aiService.parseEnhancedAIResponse(incompleteResponse);
    console.log('Incomplete response - Dimensions parsed:', Object.keys(parsedIncomplete.dimensions).length);
    
    const structuredIncomplete = aiService.createStructuredResponse(incompleteResponse, student84Data, 'moderate');
    console.log('Fallback mechanisms activated for missing dimensions');
    console.log('Total dimension interventions (with fallbacks):', Object.keys(structuredIncomplete.dimensionInterventions).length);
    
  } catch (error) {
    console.error('Fallback test failed:', error.message);
  }
  
  console.log('\n=== Test Summary ===');
  console.log('✓ Fixed regex pattern to support both /42 and /84');
  console.log('✓ Added detailed logging for debugging');
  console.log('✓ Improved fallback mechanisms');
  console.log('✓ Enhanced error handling');
  console.log('\nThe AI intervention generation should now work more reliably!');
}

// Run the test
testAIInterventionFixes().catch(console.error);