const fetch = require('node-fetch');

// Test script to verify duplicate prevention in bulk assessment creation
async function testDuplicatePrevention() {
  console.log('🧪 Testing Bulk Assessment Duplicate Prevention');
  console.log('=' .repeat(50));

  const baseUrl = 'http://localhost:3000';
  
  // Test payload
  const testPayload = {
    assessmentName: 'Test Duplicate Prevention Assessment',
    assessmentType: 'ryff_42',
    targetType: 'college',
    targetColleges: ['College of Computer Studies'],
    targetYearLevels: [1, 2],
    targetSections: ['BSCS-1A', 'BSCS-2A'],
    customMessage: 'This is a test assessment for duplicate prevention',
    scheduleOption: 'now',
    scheduledDate: null
  };

  try {
    console.log('📝 Test Payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('');

    // First request - should succeed
    console.log('🚀 Sending first request...');
    const response1 = await fetch(`${baseUrl}/api/bulk-assessments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=your_test_session_token' // Replace with actual session token
      },
      body: JSON.stringify(testPayload)
    });

    const data1 = await response1.json();
    console.log(`📊 First Response Status: ${response1.status}`);
    console.log(`📊 First Response:`, data1);
    console.log('');

    // Second request immediately - should be blocked
    console.log('🚀 Sending second request immediately...');
    const response2 = await fetch(`${baseUrl}/api/bulk-assessments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=your_test_session_token' // Replace with actual session token
      },
      body: JSON.stringify(testPayload)
    });

    const data2 = await response2.json();
    console.log(`📊 Second Response Status: ${response2.status}`);
    console.log(`📊 Second Response:`, data2);
    console.log('');

    // Third request with slight variation - should succeed
    console.log('🚀 Sending third request with different target...');
    const modifiedPayload = {
      ...testPayload,
      targetYearLevels: [3, 4], // Different year levels
      targetSections: ['BSCS-3A', 'BSCS-4A'] // Different sections
    };
    
    const response3 = await fetch(`${baseUrl}/api/bulk-assessments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=your_test_session_token' // Replace with actual session token
      },
      body: JSON.stringify(modifiedPayload)
    });

    const data3 = await response3.json();
    console.log(`📊 Third Response Status: ${response3.status}`);
    console.log(`📊 Third Response:`, data3);
    console.log('');

    // Test Results Summary
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('=' .repeat(30));
    console.log(`✅ First request (original): ${response1.status === 200 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Second request (duplicate): ${response2.status === 409 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Third request (different): ${response3.status === 200 ? 'PASSED' : 'FAILED'}`);
    
    if (response1.status === 200 && response2.status === 409 && response3.status === 200) {
      console.log('🎉 ALL TESTS PASSED! Duplicate prevention is working correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED! Please check the implementation.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Instructions for running the test
console.log('📖 INSTRUCTIONS:');
console.log('1. Make sure the backend server is running on localhost:3000');
console.log('2. Replace "your_test_session_token" with a valid counselor session token');
console.log('3. Run this script: node test-duplicate-prevention.js');
console.log('');

// Run the test if this file is executed directly
if (require.main === module) {
  testDuplicatePrevention();
}

module.exports = { testDuplicatePrevention };