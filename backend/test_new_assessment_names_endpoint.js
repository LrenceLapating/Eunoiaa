require('dotenv').config();
const fetch = require('node-fetch');

async function testNewAssessmentNamesEndpoint() {
  try {
    console.log('🧪 Testing new assessment names endpoint...');
    
    // Test without college filter
    console.log('\n1. Testing without college filter:');
    const response1 = await fetch('http://localhost:3000/api/accounts/colleges/assessment-names', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data1 = await response1.json();
    console.log('Response:', data1);
    
    // Test with college filter
    console.log('\n2. Testing with college filter (College of Nursing):');
    const response2 = await fetch('http://localhost:3000/api/accounts/colleges/assessment-names?college=College%20of%20Nursing', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data2 = await response2.json();
    console.log('Response:', data2);
    
    // Test with another college filter
    console.log('\n3. Testing with college filter (College of Computer Studies):');
    const response3 = await fetch('http://localhost:3000/api/accounts/colleges/assessment-names?college=College%20of%20Computer%20Studies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data3 = await response3.json();
    console.log('Response:', data3);
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

testNewAssessmentNamesEndpoint();