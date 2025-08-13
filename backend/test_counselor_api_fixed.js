require('dotenv').config();
const fetch = require('node-fetch');

// Test the counselor API for 84-item assessments after the fix
async function testCounselorAPI() {
  try {
    console.log('🎯 Testing counselor API for 84-item assessments after admin client fix...');
    
    // Test the API endpoint for 84-item assessments
    const apiUrl = 'http://localhost:3000/api/counselor-assessments/results?assessmentType=ryff_84&page=1&limit=10';
    
    console.log('\n📡 Making API call to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail due to authentication, but we should see the debug logs
        'Cookie': 'session_token=placeholder_token'
      }
    });
    
    console.log('\n📊 Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\n📄 Response body:');
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (parseError) {
      console.log('Raw response (not JSON):', responseText);
    }
    
    console.log('\n✅ API call completed. Check server logs for debug information.');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testCounselorAPI();