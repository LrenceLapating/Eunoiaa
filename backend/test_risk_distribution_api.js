const axios = require('axios');

async function testRiskDistributionAPI() {
  console.log('🧪 Testing Risk Distribution API Endpoint');
  console.log('=' .repeat(50));

  try {
    // Test the API endpoint directly
    const baseURL = 'http://localhost:3000';
    const endpoint = '/api/counselor-assessments/risk-distribution';
    
    // Test parameters
    const params = {
      college: 'College of Engineering',
      assessmentName: 'Ryff'
    };
    
    console.log('\n🎯 Testing endpoint:', `${baseURL}${endpoint}`);
    console.log('📋 Parameters:', params);
    
    const response = await axios.get(`${baseURL}${endpoint}`, {
      params: params,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.success) {
      const { riskDistribution, totalStudents, filters } = response.data.data;
      console.log('\n📈 Risk Distribution Summary:');
      console.log(`   At Risk: ${riskDistribution.atRisk}`);
      console.log(`   Moderate: ${riskDistribution.moderate}`);
      console.log(`   Healthy: ${riskDistribution.healthy}`);
      console.log(`   Total: ${riskDistribution.total}`);
      console.log(`   Total Students: ${totalStudents}`);
      console.log('🔍 Applied Filters:', filters);
    }
    
    console.log('\n✅ Risk Distribution API Test Completed!');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('❌ Network Error:', error.message);
      console.log('💡 Make sure the backend server is running on http://localhost:3000');
    } else {
      console.error('❌ Test failed with error:', error.message);
    }
  }
}

// Run the test
testRiskDistributionAPI();