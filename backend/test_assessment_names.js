const fetch = require('node-fetch');

async function testAssessmentNames() {
  try {
    console.log('Testing assessment names API...');
    
    // Test with CCS college and ryff_42 assessment type
    const params = new URLSearchParams();
    params.append('college_id', 'CCS');
    params.append('assessment_type', 'ryff_42');
    
    const url = `http://localhost:3000/api/bulk-assessments/assessment-names?${params.toString()}`;
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Assessment names response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('\nFound assessment names:');
      data.data.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    } else {
      console.log('No assessment names found or API returned empty data');
    }
    
  } catch (error) {
    console.error('Error testing assessment names:', error.message);
  }
}

testAssessmentNames();