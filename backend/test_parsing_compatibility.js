const aiService = require('./utils/aiService');
const db = require('./config/database');

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

async function testParsingCompatibility() {
  console.log('🔍 Testing Parsing Compatibility...\n');
  
  try {
    // Generate a varied intervention
    console.log('📝 Generating AI intervention...');
    const intervention = await aiService.generateStructuredIntervention(
      testStudentData, 
      riskLevel
    );
    
    console.log('✅ AI generation successful');
    console.log(`📊 Title: ${intervention.title}`);
    
    // Test 1: Check overall strategy parsing
    console.log('\n🎯 Test 1: Overall Strategy Parsing');
    console.log('=' .repeat(40));
    
    if (intervention.overallStrategy && intervention.overallStrategy.length > 0) {
      console.log('✅ Overall strategy parsed successfully');
      console.log(`📝 Length: ${intervention.overallStrategy.length} characters`);
      console.log(`🔍 Preview: ${intervention.overallStrategy.substring(0, 100)}...`);
    } else {
      console.log('❌ Overall strategy parsing failed');
    }
    
    // Test 2: Check dimension interventions parsing
    console.log('\n🎯 Test 2: Dimension Interventions Parsing');
    console.log('=' .repeat(40));
    
    const expectedDimensions = ['autonomy', 'personal_growth', 'purpose_in_life', 'self_acceptance', 'positive_relations', 'environmental_mastery'];
    let parsedDimensions = 0;
    let failedDimensions = [];
    
    expectedDimensions.forEach(dimension => {
      if (intervention.dimensionInterventions[dimension] && intervention.dimensionInterventions[dimension].length > 0) {
        parsedDimensions++;
        console.log(`✅ ${dimension}: Parsed (${intervention.dimensionInterventions[dimension].length} chars)`);
      } else {
        failedDimensions.push(dimension);
        console.log(`❌ ${dimension}: Failed to parse`);
      }
    });
    
    console.log(`\n📊 Parsing Success Rate: ${parsedDimensions}/${expectedDimensions.length} dimensions`);
    
    // Test 3: Check action plan parsing
    console.log('\n🎯 Test 3: Action Plan Parsing');
    console.log('=' .repeat(40));
    
    if (intervention.actionPlan && Array.isArray(intervention.actionPlan) && intervention.actionPlan.length > 0) {
      console.log(`✅ Action plan parsed successfully`);
      console.log(`📋 Items count: ${intervention.actionPlan.length}`);
      intervention.actionPlan.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.substring(0, 60)}...`);
      });
    } else {
      console.log('❌ Action plan parsing failed');
    }
    
    // Test 4: Validate data structure
    console.log('\n🎯 Test 4: Data Structure Validation');
    console.log('=' .repeat(40));
    
    const requiredFields = ['title', 'overallStrategy', 'dimensionInterventions', 'actionPlan'];
    let validStructure = true;
    
    requiredFields.forEach(field => {
      if (intervention[field] !== undefined) {
        console.log(`✅ ${field}: Present`);
      } else {
        console.log(`❌ ${field}: Missing`);
        validStructure = false;
      }
    });
    
    // Test 5: Check for score information in content
    console.log('\n🎯 Test 5: Score Information Validation');
    console.log('=' .repeat(40));
    
    let scoresFound = 0;
    Object.entries(intervention.dimensionInterventions).forEach(([dimension, content]) => {
      // Look for score patterns in the content
      const scorePattern = /\d+\s*(?:out of|\/)\s*42/i;
      if (scorePattern.test(content)) {
        scoresFound++;
        console.log(`✅ ${dimension}: Score information found`);
      } else {
        console.log(`⚠️  ${dimension}: No explicit score found (may be naturally integrated)`);
      }
    });
    
    console.log(`\n📊 Dimensions with explicit scores: ${scoresFound}/${expectedDimensions.length}`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PARSING COMPATIBILITY SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Overall Strategy: ${intervention.overallStrategy ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dimension Parsing: ${parsedDimensions}/${expectedDimensions.length} (${parsedDimensions === expectedDimensions.length ? 'PASS' : 'FAIL'})`);
    console.log(`✅ Action Plan: ${intervention.actionPlan && intervention.actionPlan.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Data Structure: ${validStructure ? 'PASS' : 'FAIL'}`);
    
    if (failedDimensions.length > 0) {
      console.log(`\n❌ Failed Dimensions: ${failedDimensions.join(', ')}`);
    }
    
    const overallSuccess = intervention.overallStrategy && 
                          parsedDimensions === expectedDimensions.length && 
                          intervention.actionPlan && intervention.actionPlan.length > 0 && 
                          validStructure;
    
    console.log(`\n🎉 Overall Compatibility: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      success: overallSuccess,
      details: {
        overallStrategy: !!intervention.overallStrategy,
        dimensionsParsed: parsedDimensions,
        totalDimensions: expectedDimensions.length,
        actionPlan: !!(intervention.actionPlan && intervention.actionPlan.length > 0),
        validStructure,
        failedDimensions
      }
    };
    
  } catch (error) {
    console.error('❌ Parsing compatibility test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testParsingCompatibility()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 All parsing compatibility tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Parsing compatibility tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testParsingCompatibility };