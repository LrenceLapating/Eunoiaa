const axios = require('axios');

// Test the actual API endpoint
async function testRealAPIEndpoint() {
  console.log('🧪 Testing real API endpoint...');
  
  const baseURL = 'http://localhost:3000';
  
  // Test parameters
  const testParams = {
    limit: 1000,
    college: 'College of Engineering',
    assessmentType: 'ryff_42',
    assessment_name: '2025-2026 2nd Semester - 1st Test 42'
  };
  
  console.log('📋 Test Parameters:', testParams);
  
  try {
    console.log('\n🚀 Making API call...');
    const response = await axios.get(`${baseURL}/api/counselor-assessments/results`, {
      params: testParams,
      timeout: 10000
    });
    
    console.log('✅ API call successful!');
    console.log('📊 Status:', response.status);
    console.log('📈 Response data length:', response.data.length);
    console.log('🎯 First few results:', response.data.slice(0, 3));
    
    // Test without assessment_name to see difference
    console.log('\n🔄 Testing without assessment_name filter...');
    const paramsWithoutFilter = {
      limit: 1000,
      college: 'College of Engineering',
      assessmentType: 'ryff_42'
      // No assessment_name
    };
    
    const responseWithoutFilter = await axios.get(`${baseURL}/api/counselor-assessments/results`, {
      params: paramsWithoutFilter,
      timeout: 10000
    });
    
    console.log('✅ API call without filter successful!');
    console.log('📊 Status:', responseWithoutFilter.status);
    console.log('📈 Response data length (without filter):', responseWithoutFilter.data.length);
    
    console.log('\n🎉 Both API calls completed successfully!');
    console.log('🔧 The 500 error fix is confirmed working!');
    
  } catch (error) {
    console.error('❌ API call failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    console.error('Response Data:', error.response?.data);
    
    if (error.response?.status === 500) {
      console.error('🚨 500 Internal Server Error still exists!');
    }
  }
}

// Run the test
testRealAPIEndpoint().catch(console.error);