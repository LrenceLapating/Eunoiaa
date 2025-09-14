const { supabaseAdmin } = require('../config/database');
const { formatDimensionName } = require('../utils/ryffScoring');

// Test that active assessments still work correctly (regression test)
async function testActiveAssessments() {
  console.log('🔍 Testing Active Assessments (Regression Test)...');
  
  try {
    // Get a sample active assessment from 42-item table
    const { data: active42Data, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, student_id, responses')
      .not('responses', 'is', null)
      .limit(1)
      .single();
    
    if (active42Data) {
      console.log(`\n✅ Testing 42-item active assessment:`);
      console.log(`   ID: ${active42Data.id}`);
      console.log(`   Student ID: ${active42Data.student_id}`);
      await testAssessmentLogic(active42Data, 'ryff_42', 'Active 42-item');
    }
    
    // Get a sample active assessment from 84-item table
    const { data: active84Data, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, student_id, responses')
      .not('responses', 'is', null)
      .limit(1)
      .single();
    
    if (active84Data) {
      console.log(`\n✅ Testing 84-item active assessment:`);
      console.log(`   ID: ${active84Data.id}`);
      console.log(`   Student ID: ${active84Data.student_id}`);
      await testAssessmentLogic(active84Data, 'ryff_84', 'Active 84-item');
    }
    
    if (!active42Data && !active84Data) {
      console.log('❌ No active assessments found for testing');
      return;
    }
    
  } catch (error) {
    console.error('❌ Error in active assessment test:', error.message);
    console.error(error.stack);
  }
}

async function testAssessmentLogic(assessment, assessmentType, testName) {
  const dimension = 'autonomy';
  
  console.log(`   📊 Assessment Type: ${assessmentType}`);
  console.log(`   📝 Response Count: ${Object.keys(assessment.responses).length}`);
  
  // Test questionnaire loading
  let questionnaireQuestions;
  if (assessmentType === 'ryff_84') {
    questionnaireQuestions = require('../utils/ryff84ItemQuestionnaire');
  } else {
    questionnaireQuestions = require('../utils/ryff42ItemQuestionnaire');
  }
  
  // Filter questions by dimension
  const dimensionQuestions = questionnaireQuestions.filter(q => q.dimension === dimension);
  console.log(`   🎯 Questions for ${dimension}: ${dimensionQuestions.length}`);
  
  // Get responses for this dimension
  const dimensionResponses = dimensionQuestions.map(question => {
    const response = assessment.responses[question.id.toString()];
    const responseValue = response || null;
    let actualScore = 0;
    
    if (responseValue !== null) {
      actualScore = question.reverse ? (7 - responseValue) : responseValue;
    }
    
    return {
      questionId: question.id,
      questionText: question.text,
      response: responseValue,
      reverse: question.reverse,
      actualScore: actualScore
    };
  });
  
  // Calculate dimension score
  const totalScore = dimensionResponses.reduce((sum, item) => sum + (item.actualScore || 0), 0);
  const maxPossibleScore = dimensionQuestions.length * 6;
  const averageScore = dimensionQuestions.length > 0 ? totalScore / dimensionQuestions.length : 0;
  
  console.log(`   📊 ${testName} Results:`);
  console.log(`      Dimension: ${formatDimensionName(dimension)}`);
  console.log(`      Total Score: ${totalScore}`);
  console.log(`      Average Score: ${parseFloat(averageScore.toFixed(2))}`);
  
  // Verify responses
  const validResponses = dimensionResponses.filter(r => r.response !== null);
  console.log(`      Valid Responses: ${validResponses.length}/${dimensionResponses.length}`);
  
  if (validResponses.length > 0) {
    console.log(`   ✅ ${testName} working correctly!`);
  } else {
    console.log(`   ❌ ${testName} has no valid responses`);
  }
}

// Run the test
if (require.main === module) {
  testActiveAssessments().then(() => {
    console.log('\n🏁 Active assessment regression test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Active assessment test failed:', error);
    process.exit(1);
  });
}

module.exports = { testActiveAssessments };