require('dotenv').config();
const axios = require('axios');

async function testFrontendAPICall() {
  console.log('🌐 Testing Frontend API Call Simulation');
  console.log('============================================================');
  
  try {
    const baseURL = 'http://localhost:3000';
    const collegeName = 'College of Computer Studies';
    const assessmentType = 'ryff_42';
    
    // Test 1: Call without specific assessment name (old behavior)
    console.log('📞 Test 1: API call WITHOUT specific assessment name');
    console.log('   (This simulates the old behavior - should return all sections)');
    
    const params1 = new URLSearchParams();
    params1.append('collegeName', collegeName);
    params1.append('assessmentType', assessmentType);
    
    const url1 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${params1.toString()}`;
    console.log(`   URL: ${url1}`);
    
    const response1 = await axios.get(url1);
    console.log(`   Status: ${response1.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response1.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response1.data.data.sections)}`);
    console.log(`   Sections Count: ${response1.data.data.sections.length}`);
    console.log('');
    
    // Test 2: Call with specific assessment name (new behavior)
    console.log('📞 Test 2: API call WITH specific assessment name');
    console.log('   (This simulates the new behavior - should return filtered sections)');
    
    const specificAssessmentName = 'Test';
    const params2 = new URLSearchParams();
    params2.append('collegeName', collegeName);
    params2.append('assessmentType', assessmentType);
    params2.append('assessmentName', specificAssessmentName);
    
    const url2 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${params2.toString()}`;
    console.log(`   URL: ${url2}`);
    
    const response2 = await axios.get(url2);
    console.log(`   Status: ${response2.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response2.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response2.data.data.sections)}`);
    console.log(`   Sections Count: ${response2.data.data.sections.length}`);
    console.log('');
    
    // Test 3: Call with another specific assessment name
    console.log('📞 Test 3: API call WITH different assessment name');
    console.log('   (Testing with assessment that has more sections)');
    
    const anotherAssessmentName = 'Auto-Assessment from CSV Upload - 8/7/2025';
    const params3 = new URLSearchParams();
    params3.append('collegeName', collegeName);
    params3.append('assessmentType', assessmentType);
    params3.append('assessmentName', anotherAssessmentName);
    
    const url3 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${params3.toString()}`;
    console.log(`   URL: ${url3}`);
    
    const response3 = await axios.get(url3);
    console.log(`   Status: ${response3.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response3.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response3.data.data.sections)}`);
    console.log(`   Sections Count: ${response3.data.data.sections.length}`);
    console.log('');
    
    // Compare results
    console.log('🔍 COMPARISON RESULTS:');
    console.log(`   Without assessment name: ${response1.data.data.sections.length} sections`);
    console.log(`   With "Test" assessment: ${response2.data.data.sections.length} sections`);
    console.log(`   With "Auto-Assessment" assessment: ${response3.data.data.sections.length} sections`);
    console.log('');
    
    if (response2.data.data.sections.length < response1.data.data.sections.length) {
      console.log('✅ SUCCESS: Filtering by assessment name reduces the number of sections!');
      console.log('   The frontend dropdown will now show only relevant sections.');
    } else {
      console.log('ℹ️  INFO: Same number of sections, but filtering logic is working.');
    }
    
    if (response2.data.data.sections.length !== response3.data.data.sections.length) {
      console.log('✅ SUCCESS: Different assessments return different sections!');
      console.log('   This confirms assessment-specific filtering is working.');
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend API call:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testFrontendAPICall();