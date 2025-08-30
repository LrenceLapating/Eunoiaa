const fetch = require('node-fetch');

async function testFrontendAPICall() {
  try {
    console.log('Testing frontend API call simulation...');
    
    // Simulate the exact API call that the frontend makes
    const collegeName = 'CCS';
    const assessmentType = 'ryff_42';
    
    const params = new URLSearchParams();
    params.append('collegeName', collegeName);
    params.append('assessmentType', assessmentType);
    
    const url = `http://localhost:3000/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${params.toString()}`;
    
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ API call successful!');
      console.log('Available years:', data.data.yearLevels);
      console.log('Available sections:', data.data.sections);
      console.log('Total assessments:', data.data.totalAssessments);
    } else {
      console.log('\n❌ API call failed:', data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error in API call:', error.message);
  }
}

testFrontendAPICall();