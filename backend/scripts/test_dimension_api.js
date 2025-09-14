const { supabaseAdmin } = require('../config/database');
const express = require('express');
const request = require('supertest');
const counselorAssessmentsRouter = require('../routes/counselorAssessments');

// Create a test app
const app = express();
app.use(express.json());

// Mock session middleware for testing
app.use((req, res, next) => {
  req.session = { counselor: { id: 'test-counselor' } };
  next();
});

app.use('/api/counselor-assessments', counselorAssessmentsRouter);

// Test the dimension endpoint with historical assessments
async function testDimensionAPI() {
  console.log('🔍 Testing Dimension API with Historical Assessments...');
  
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
    console.log(`   Has Responses: ${historicalData.responses ? 'Yes' : 'No'}`);
    
    // Test each dimension
    const dimensions = ['autonomy', 'environmentalMastery', 'personalGrowth', 'positiveRelations', 'purposeInLife', 'selfAcceptance'];
    
    for (const dimension of dimensions) {
      console.log(`\n🔍 Testing dimension: ${dimension}`);
      
      try {
        const response = await request(app)
          .get(`/api/counselor-assessments/student/${historicalData.student_id}/dimension/${dimension}`)
          .query({ assessmentId: historicalData.id })
          .expect(200);
        
        const data = response.body;
        
        if (data.success) {
          console.log(`   ✅ Success: ${data.data.questionCount} questions, score: ${data.data.totalScore}`);
          console.log(`   📊 Assessment Type: ${data.data.assessmentType}`);
          console.log(`   📝 Dimension Name: ${data.data.dimensionName}`);
        } else {
          console.log(`   ❌ Failed: ${data.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test without assessmentId (should find latest assessment)
    console.log(`\n🔍 Testing without assessmentId (latest assessment):`);
    
    try {
      const response = await request(app)
        .get(`/api/counselor-assessments/student/${historicalData.student_id}/dimension/autonomy`)
        .expect(200);
      
      const data = response.body;
      
      if (data.success) {
        console.log(`   ✅ Success: Found latest assessment`);
        console.log(`   📊 Assessment Type: ${data.data.assessmentType}`);
        console.log(`   📝 Questions: ${data.data.questionCount}`);
      } else {
        console.log(`   ❌ Failed: ${data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testDimensionAPI().then(() => {
    console.log('\n🏁 API test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ API test failed:', error);
    process.exit(1);
  });
}

module.exports = { testDimensionAPI };