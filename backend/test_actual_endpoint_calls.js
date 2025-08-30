require('dotenv').config();
const axios = require('axios');

async function testActualEndpointCalls() {
  console.log('🌐 Testing Actual Endpoint Calls with Detailed Logging');
  console.log('============================================================');
  
  try {
    const baseURL = 'http://localhost:3000';
    const collegeName = 'College of Computer Studies';
    const assessmentType = 'ryff_42';
    
    // Test 1: Call without assessment name
    console.log('📞 Test 1: WITHOUT assessment name');
    const url1 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?collegeName=${encodeURIComponent(collegeName)}&assessmentType=${assessmentType}`;
    console.log(`   URL: ${url1}`);
    
    const response1 = await axios.get(url1);
    console.log(`   Status: ${response1.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response1.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response1.data.data.sections)}`);
    console.log(`   Sections Count: ${response1.data.data.sections.length}`);
    console.log(`   Total Assessments: ${response1.data.data.totalAssessments}`);
    console.log('');
    
    // Test 2: Call with specific assessment name
    console.log('📞 Test 2: WITH specific assessment name "Test"');
    const url2 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?collegeName=${encodeURIComponent(collegeName)}&assessmentType=${assessmentType}&assessmentName=${encodeURIComponent('Test')}`;
    console.log(`   URL: ${url2}`);
    
    const response2 = await axios.get(url2);
    console.log(`   Status: ${response2.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response2.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response2.data.data.sections)}`);
    console.log(`   Sections Count: ${response2.data.data.sections.length}`);
    console.log(`   Total Assessments: ${response2.data.data.totalAssessments}`);
    console.log('');
    
    // Test 3: Call with different assessment name
    console.log('📞 Test 3: WITH different assessment name "Auto-Assessment from CSV Upload - 8/7/2025"');
    const url3 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?collegeName=${encodeURIComponent(collegeName)}&assessmentType=${assessmentType}&assessmentName=${encodeURIComponent('Auto-Assessment from CSV Upload - 8/7/2025')}`;
    console.log(`   URL: ${url3}`);
    
    const response3 = await axios.get(url3);
    console.log(`   Status: ${response3.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response3.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response3.data.data.sections)}`);
    console.log(`   Sections Count: ${response3.data.data.sections.length}`);
    console.log(`   Total Assessments: ${response3.data.data.totalAssessments}`);
    console.log('');
    
    // Test 4: Call exactly like frontend does (using URLSearchParams)
    console.log('📞 Test 4: Using URLSearchParams like frontend');
    const params = new URLSearchParams();
    params.append('collegeName', collegeName);
    params.append('assessmentType', assessmentType);
    // No assessment name - this should return all sections
    
    const url4 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${params.toString()}`;
    console.log(`   URL: ${url4}`);
    
    const response4 = await axios.get(url4);
    console.log(`   Status: ${response4.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response4.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response4.data.data.sections)}`);
    console.log(`   Sections Count: ${response4.data.data.sections.length}`);
    console.log(`   Total Assessments: ${response4.data.data.totalAssessments}`);
    console.log('');
    
    // Test 5: Call with URLSearchParams and assessment name
    console.log('📞 Test 5: Using URLSearchParams with assessment name');
    const params5 = new URLSearchParams();
    params5.append('collegeName', collegeName);
    params5.append('assessmentType', assessmentType);
    params5.append('assessmentName', 'Test');
    
    const url5 = `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${params5.toString()}`;
    console.log(`   URL: ${url5}`);
    
    const response5 = await axios.get(url5);
    console.log(`   Status: ${response5.status}`);
    console.log(`   Year Levels: ${JSON.stringify(response5.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(response5.data.data.sections)}`);
    console.log(`   Sections Count: ${response5.data.data.sections.length}`);
    console.log(`   Total Assessments: ${response5.data.data.totalAssessments}`);
    console.log('');
    
    // Compare results
    console.log('🔍 COMPARISON RESULTS:');
    console.log(`   Test 1 (no assessment name): ${response1.data.data.sections.length} sections, ${response1.data.data.totalAssessments} assessments`);
    console.log(`   Test 2 ("Test" assessment): ${response2.data.data.sections.length} sections, ${response2.data.data.totalAssessments} assessments`);
    console.log(`   Test 3 ("Auto-Assessment" assessment): ${response3.data.data.sections.length} sections, ${response3.data.data.totalAssessments} assessments`);
    console.log(`   Test 4 (URLSearchParams no name): ${response4.data.data.sections.length} sections, ${response4.data.data.totalAssessments} assessments`);
    console.log(`   Test 5 (URLSearchParams with name): ${response5.data.data.sections.length} sections, ${response5.data.data.totalAssessments} assessments`);
    console.log('');
    
    if (response1.data.data.sections.length > response2.data.data.sections.length) {
      console.log('✅ SUCCESS: Filtering by assessment name works correctly!');
      console.log('   The frontend will now show only relevant sections when an assessment is selected.');
    } else {
      console.log('❌ ISSUE: Filtering is not working as expected.');
    }
    
  } catch (error) {
    console.error('❌ Error testing actual endpoint calls:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

testActualEndpointCalls();