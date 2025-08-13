// Test the exact API call with debug logging using fetch
async function testDebugAPICall() {
  try {
    console.log('🎯 Testing API call with debug logging...');
    
    // Make the API call that the frontend makes
    const response = await fetch('http://localhost:3000/api/counselor-assessments/results?limit=1000&assessmentType=ryff_84', {
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=s%3AyourSessionId.signature' // This will fail auth but trigger the logic
      }
    });
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testDebugAPICall();