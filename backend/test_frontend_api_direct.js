require('dotenv').config();
const fetch = require('node-fetch');

async function testFrontendAPIDirectly() {
  try {
    console.log('Testing the exact API call that frontend makes...');
    
    // Test both 42-item and 84-item assessments
    const testCases = [
      {
        name: '42-item assessments',
        params: new URLSearchParams({
          assessmentType: 'ryff_42',
          limit: '1000'
        })
      },
      {
        name: '84-item assessments', 
        params: new URLSearchParams({
          assessmentType: 'ryff_84',
          limit: '1000'
        })
      },
      {
        name: 'All assessments (no filter)',
        params: new URLSearchParams({
          limit: '1000'
        })
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n=== Testing ${testCase.name} ===`);
      
      const url = `http://localhost:3000/api/counselor-assessments/results?${testCase.params.toString()}`;
      console.log(`Making request to: ${url}`);
      
      try {
        // Note: This won't work without proper session cookies
        // But we can see if the server is running and what error we get
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log(`Response body: ${responseText}`);
        
        if (response.status === 401) {
          console.log('✅ Expected 401 - Authentication required (endpoint exists)');
        } else if (response.status === 404) {
          console.log('❌ 404 - Endpoint not found (route issue)');
        } else {
          console.log(`ℹ️  Unexpected status: ${response.status}`);
        }
        
      } catch (fetchError) {
        console.log(`❌ Fetch error: ${fetchError.message}`);
        if (fetchError.code === 'ECONNREFUSED') {
          console.log('❌ Server is not running on localhost:3000');
        }
      }
    }
    
    console.log('\n=== Testing server health ===');
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      console.log(`Health check status: ${healthResponse.status}`);
      const healthText = await healthResponse.text();
      console.log(`Health response: ${healthText}`);
    } catch (healthError) {
      console.log(`❌ Health check failed: ${healthError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFrontendAPIDirectly();