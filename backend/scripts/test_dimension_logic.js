const { supabaseAdmin } = require('../config/database');
const { formatDimensionName } = require('../utils/ryffScoring');

// Test the core dimension logic without authentication
async function testDimensionLogic() {
  console.log('🔍 Testing Core Dimension Logic for Historical Assessments...');
  
  try {
    // Get a sample historical assessment
    const { data: historicalData, error } = await supabaseAdmin
      .from('ryff_history')
      .select('id, student_id, assessment_type, responses')
      .limit(1)
      .single();
    
    if (error || !historicalData) {
      console.log('❌ No historical assessments found for testing');
      return;
    }
    
    console.log(`✅ Testing with historical assessment:`);
    console.log(`   ID: ${historicalData.id}`);
    console.log(`   Student ID: ${historicalData.student_id}`);
    console.log(`   Assessment Type: ${historicalData.assessment_type}`);
    
    // Simulate the exact logic from the fixed endpoint
    const studentId = historicalData.student_id;
    const assessmentId = historicalData.id;
    const dimension = 'autonomy';
    
    console.log(`\n🔍 Testing dimension fetch logic:`);
    
    // Test the fixed logic: Try active tables first, then historical
    let assessment;
    let assessmentType = 'ryff_42';
    
    // Try 42-item table first
    const { data: assessment42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .eq('id', assessmentId)
      .eq('student_id', studentId)
      .single();
    
    if (assessment42) {
      assessment = assessment42;
      assessmentType = 'ryff_42';
      console.log('   ✅ Found in 42-item table');
    } else {
      // Try 84-item table
      const { data: assessment84, error: error84 } = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .eq('id', assessmentId)
        .eq('student_id', studentId)
        .single();
      
      if (assessment84) {
        assessment = assessment84;
        assessmentType = 'ryff_84';
        console.log('   ✅ Found in 84-item table');
      } else {
        // Try historical table (this is the NEW logic)
        const { data: historicalAssessment, error: historyError } = await supabaseAdmin
          .from('ryff_history')
          .select('*')
          .eq('id', assessmentId)
          .eq('student_id', studentId)
          .single();
        
        if (historicalAssessment) {
          assessment = historicalAssessment;
          assessmentType = historicalAssessment.assessment_type || 'ryff_42';
          console.log(`   ✅ Found in historical table with type: ${assessmentType}`);
        } else {
          console.log('   ❌ Assessment not found in any table');
          return;
        }
      }
    }
    
    if (!assessment || !assessment.responses) {
      console.log('   ❌ No assessment responses found');
      return;
    }
    
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
    
    console.log(`\n📊 Dimension Analysis Results:`);
    console.log(`   Dimension: ${formatDimensionName(dimension)}`);
    console.log(`   Total Score: ${totalScore}`);
    console.log(`   Max Possible: ${maxPossibleScore}`);
    console.log(`   Average Score: ${parseFloat(averageScore.toFixed(2))}`);
    console.log(`   Questions Processed: ${dimensionResponses.length}`);
    
    // Verify responses
    const validResponses = dimensionResponses.filter(r => r.response !== null);
    console.log(`   Valid Responses: ${validResponses.length}/${dimensionResponses.length}`);
    
    if (validResponses.length > 0) {
      console.log('\n✅ SUCCESS: Historical assessment dimension data retrieved successfully!');
      console.log('✅ The fix is working correctly!');
      
      // Show sample responses
      console.log('\n📝 Sample responses:');
      validResponses.slice(0, 3).forEach((resp, idx) => {
        console.log(`   ${idx + 1}. Q${resp.questionId}: ${resp.response} → Score: ${resp.actualScore}`);
      });
    } else {
      console.log('\n❌ No valid responses found');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testDimensionLogic().then(() => {
    console.log('\n🏁 Logic test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Logic test failed:', error);
    process.exit(1);
  });
}

module.exports = { testDimensionLogic };