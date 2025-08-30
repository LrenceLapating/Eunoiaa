const axios = require('axios');
require('dotenv').config();

async function testFinalFix() {
  console.log('🔍 Testing final 500 error fix...');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // Test 1: Test with parameters that previously caused 500 error
    console.log('\n1. Testing with College of Engineering + specific assessment name...');
    
    const response1 = await axios.get(`${baseURL}/api/counselor-assessments/results`, {
      params: {
        limit: 1000,
        college: 'College of Engineering',
        assessmentType: 'ryff_42',
        assessment_name: '2025-2026 2nd Semester - 1st Test 42'
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Test 1 Response Status:', response1.status);
    console.log('✅ Test 1 Response Data:', {
      success: response1.data.success,
      dataLength: response1.data.data?.length || 0,
      pagination: response1.data.pagination
    });
    
    // Test 2: Test with different college
    console.log('\n2. Testing with different college...');
    
    const response2 = await axios.get(`${baseURL}/api/counselor-assessments/results`, {
      params: {
        limit: 1000,
        college: 'College of Arts and Sciences',
        assessmentType: 'ryff_42',
        assessment_name: '2025-2026 2nd Semester - 1st Test 42'
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Test 2 Response Status:', response2.status);
    console.log('✅ Test 2 Response Data:', {
      success: response2.data.success,
      dataLength: response2.data.data?.length || 0,
      pagination: response2.data.pagination
    });
    
    // Test 3: Test 84-item assessments with college filter
    console.log('\n3. Testing 84-item assessments with college filter...');
    
    const response3 = await axios.get(`${baseURL}/api/counselor-assessments/results`, {
      params: {
        limit: 1000,
        college: 'College of Engineering',
        assessmentType: 'ryff_84',
        assessment_name: '2025-2026 2nd Semester - 1st Test 84'
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Test 3 Response Status:', response3.status);
    console.log('✅ Test 3 Response Data:', {
      success: response3.data.success,
      dataLength: response3.data.data?.length || 0,
      pagination: response3.data.pagination
    });
    
    // Test 4: Test without college filter (should work as before)
    console.log('\n4. Testing without college filter...');
    
    const response4 = await axios.get(`${baseURL}/api/counselor-assessments/results`, {
      params: {
        limit: 20,
        assessmentType: 'ryff_42'
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Test 4 Response Status:', response4.status);
    console.log('✅ Test 4 Response Data:', {
      success: response4.data.success,
      dataLength: response4.data.data?.length || 0,
      pagination: response4.data.pagination
    });
    
    console.log('\n🎉 All tests passed! The 500 error has been fixed.');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('❌ Network Error:', error.message);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testFinalFix();