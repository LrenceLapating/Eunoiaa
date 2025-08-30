const fetch = require('node-fetch');

async function testFrontendAPICall() {
  console.log('🔍 Testing Frontend API Call with Exact Parameters');
  console.log('=' .repeat(60));

  try {
    // Use the exact same parameters as the frontend
    const params = new URLSearchParams({
      college: 'College of Arts and Sciences',
      assessmentName: '2025-2026 2nd Semester - 1st Test 42'
    });
    
    console.log('\n🎯 Testing with frontend parameters:');
    console.log('   College:', 'College of Arts and Sciences');
    console.log('   Assessment Name:', '2025-2026 2nd Semester - 1st Test 42');
    console.log('   URL:', `http://localhost:3000/api/counselor-assessments/risk-distribution?${params.toString()}`);
    
    const response = await fetch(`http://localhost:3000/api/counselor-assessments/risk-distribution?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'counselor_session=test-session' // Mock session for testing
      }
    });
    
    console.log('\n📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Response Success:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('\n❌ API Response Error:');
      console.log('Status:', response.status);
      console.log('Error Text:', errorText);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testFrontendAPICall();