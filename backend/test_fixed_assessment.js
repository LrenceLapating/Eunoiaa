// Test the fixed assessment API
const axios = require('axios');

const ASSESSMENT_NAME = '2025-2026 2nd Semester - 1st Test 42';
const BULK_ASSESSMENT_ID = '873d2505-42a9-44e0-91aa-801f55743934';
const BASE_URL = 'http://localhost:3000';

async function testFixedAssessment() {
  console.log('🧪 Testing fixed assessment API...');
  console.log('📝 Assessment:', ASSESSMENT_NAME);
  console.log('🆔 Bulk ID:', BULK_ASSESSMENT_ID);
  
  try {
    // Test 1: Basic API call with assessment name
    console.log('\n🔍 Test 1: Basic API call with assessment name');
    const response1 = await axios.get(`${BASE_URL}/api/accounts/colleges/scores`, {
      params: {
        assessmentName: ASSESSMENT_NAME,
        assessmentType: 'ryff_42'
      }
    });
    
    console.log('✅ Status:', response1.status);
    console.log('📊 Response:', {
      success: response1.data.success,
      collegeCount: response1.data.colleges?.length || 0,
      colleges: response1.data.colleges?.map(c => ({
        name: c.name,
        dimensionCount: Object.keys(c.dimensions || {}).length,
        studentCount: c.studentCount
      })) || []
    });
    
    // Test 2: Test with specific college
    console.log('\n🔍 Test 2: Filter by College of Arts and Sciences');
    const response2 = await axios.get(`${BASE_URL}/api/accounts/colleges/scores`, {
      params: {
        assessmentName: ASSESSMENT_NAME,
        assessmentType: 'ryff_42',
        college: 'College of Arts and Sciences'
      }
    });
    
    console.log('✅ Status:', response2.status);
    console.log('📊 Response:', {
      success: response2.data.success,
      collegeCount: response2.data.colleges?.length || 0,
      colleges: response2.data.colleges?.map(c => ({
        name: c.name,
        dimensionCount: Object.keys(c.dimensions || {}).length,
        studentCount: c.studentCount,
        sampleDimension: c.dimensions?.autonomy || 'N/A'
      })) || []
    });
    
    // Test 3: Test year and section filtering (should use dynamic computation)
    console.log('\n🔍 Test 3: Test with year and section filtering');
    const response3 = await axios.get(`${BASE_URL}/api/accounts/colleges/scores`, {
      params: {
        assessmentType: 'ryff_42',
        yearLevel: 1,
        section: 'BSC-1A'
      }
    });
    
    console.log('✅ Status:', response3.status);
    console.log('📊 Response:', {
      success: response3.data.success,
      collegeCount: response3.data.colleges?.length || 0,
      colleges: response3.data.colleges?.map(c => ({
        name: c.name,
        dimensionCount: Object.keys(c.dimensions || {}).length,
        studentCount: c.studentCount
      })) || []
    });
    
    // Test 4: Test backward compatibility (no assessment name)
    console.log('\n🔍 Test 4: Backward compatibility test (no assessment name)');
    const response4 = await axios.get(`${BASE_URL}/api/accounts/colleges/scores`, {
      params: {
        assessmentType: 'ryff_42'
      }
    });
    
    console.log('✅ Status:', response4.status);
    console.log('📊 Response:', {
      success: response4.data.success,
      collegeCount: response4.data.colleges?.length || 0,
      colleges: response4.data.colleges?.map(c => ({
        name: c.name,
        dimensionCount: Object.keys(c.dimensions || {}).length,
        studentCount: c.studentCount
      })) || []
    });
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testFixedAssessment().catch(console.error);