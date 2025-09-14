const { supabaseAdmin } = require('../config/database');
const fetch = require('node-fetch');

// Test the dimension endpoint fix for historical assessments
async function testDimensionFix() {
  console.log('🔍 Testing Dimension Endpoint Fix for Historical Assessments...');
  
  try {
    // First, get a sample historical assessment
    const { data: historicalData, error } = await supabaseAdmin
      .from('ryff_history')
      .select('id, student_id, assessment_type')
      .limit(1)
      .single();
    
    if (error || !historicalData) {
      console.log('❌ No historical assessments found for testing');
      return;
    }
    
    console.log(`✅ Found historical assessment:`);
    console.log(`   ID: ${historicalData.id}`);
    console.log(`   Student ID: ${historicalData.student_id}`);
    console.log(`   Assessment Type: ${historicalData.assessment_type}`);
    
    // Test the dimension endpoint with this historical assessment
    const testDimension = 'autonomy';
    const testUrl = `http://localhost:3001/api/counselor-assessments/student/${historicalData.student_id}/dimension/${testDimension}?assessmentId=${historicalData.id}`;
    
    console.log(`\n🔍 Testing dimension endpoint:`);
    console.log(`   URL: ${testUrl}`);
    
    // Note: This would require authentication in a real test
    // For now, we'll just verify the database query logic
    
    // Test the database query directly
    const { data: testAssessment, error: testError } = await supabaseAdmin
      .from('ryff_history')
      .select('*')
      .eq('id', historicalData.id)
      .eq('student_id', historicalData.student_id)
      .single();
    
    if (testError) {
      console.log('❌ Error fetching historical assessment:', testError.message);
      return;
    }
    
    if (testAssessment && testAssessment.responses) {
      console.log('✅ Historical assessment found with responses');
      console.log(`   Assessment Type: ${testAssessment.assessment_type}`);
      console.log(`   Response Count: ${Object.keys(testAssessment.responses).length}`);
      
      // Test questionnaire loading
      let questionnaireQuestions;
      if (testAssessment.assessment_type === 'ryff_84') {
        questionnaireQuestions = require('../utils/ryff84ItemQuestionnaire');
      } else {
        questionnaireQuestions = require('../utils/ryff42ItemQuestionnaire');
      }
      
      const dimensionQuestions = questionnaireQuestions.filter(q => q.dimension === testDimension);
      console.log(`   Questions for ${testDimension}: ${dimensionQuestions.length}`);
      
      if (dimensionQuestions.length > 0) {
        console.log('✅ Dimension questions loaded successfully');
        console.log('✅ Fix should work correctly!');
      } else {
        console.log('❌ No questions found for dimension');
      }
    } else {
      console.log('❌ Historical assessment has no responses');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

// Run the test
testDimensionFix().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});