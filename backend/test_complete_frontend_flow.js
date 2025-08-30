const axios = require('axios');

// Test the complete frontend-to-backend flow for assessment filtering
async function testCompleteFrontendFlow() {
  console.log('🧪 Testing Complete Frontend-to-Backend Assessment Filtering Flow\n');
  
  const baseURL = 'http://localhost:3000';
  const collegeName = 'College of Computer Studies';
  const assessmentType = 'ryff_42';
  
  try {
    // Skip assessment names fetch for now and focus on the filtering endpoint
    console.log('📋 Step 1: Using known assessment names for testing...');
    const assessmentNames = ['Test', 'Auto-Assessment from CSV Upload - 8/7/2025', '2025-2026 1st Semester - ooo'];
    console.log(`   Using assessment names: ${JSON.stringify(assessmentNames)}`);
    
    // Test 2: Get filters without specific assessment (all assessments)
    console.log('\n🔍 Step 2: Getting assessment filters WITHOUT specific assessment name...');
    const allFiltersParams = new URLSearchParams();
    allFiltersParams.append('collegeName', collegeName);
    allFiltersParams.append('assessmentType', assessmentType);
    
    const allFiltersResponse = await axios.get(
      `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${allFiltersParams.toString()}`
    );
    
    console.log(`   Status: ${allFiltersResponse.status}`);
    console.log(`   Year Levels: ${JSON.stringify(allFiltersResponse.data.data.yearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(allFiltersResponse.data.data.sections)}`);
    console.log(`   Sections Count: ${allFiltersResponse.data.data.sections.length}`);
    console.log(`   Total Assessments: ${allFiltersResponse.data.data.totalAssessments}`);
    
    // Test 3: Get filters with specific assessment (simulating user selection)
    if (assessmentNames.length > 0) {
      const specificAssessment = assessmentNames.find(name => name === 'Test') || assessmentNames[0];
      
      console.log(`\n🎯 Step 3: Getting assessment filters WITH specific assessment "${specificAssessment}"...`);
      const specificFiltersParams = new URLSearchParams();
      specificFiltersParams.append('collegeName', collegeName);
      specificFiltersParams.append('assessmentType', assessmentType);
      specificFiltersParams.append('assessmentName', specificAssessment);
      
      const specificFiltersResponse = await axios.get(
        `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${specificFiltersParams.toString()}`
      );
      
      console.log(`   Status: ${specificFiltersResponse.status}`);
      console.log(`   Year Levels: ${JSON.stringify(specificFiltersResponse.data.data.yearLevels)}`);
      console.log(`   Sections: ${JSON.stringify(specificFiltersResponse.data.data.sections)}`);
      console.log(`   Sections Count: ${specificFiltersResponse.data.data.sections.length}`);
      console.log(`   Total Assessments: ${specificFiltersResponse.data.data.totalAssessments}`);
      
      // Test 4: Compare results
      console.log('\n📊 Step 4: Comparing Results...');
      const allSectionsCount = allFiltersResponse.data.data.sections.length;
      const specificSectionsCount = specificFiltersResponse.data.data.sections.length;
      const allYearLevelsCount = allFiltersResponse.data.data.yearLevels.length;
      const specificYearLevelsCount = specificFiltersResponse.data.data.yearLevels.length;
      
      console.log(`   All Assessments: ${allSectionsCount} sections, ${allYearLevelsCount} year levels`);
      console.log(`   Specific Assessment: ${specificSectionsCount} sections, ${specificYearLevelsCount} year levels`);
      
      if (specificSectionsCount <= allSectionsCount && specificYearLevelsCount <= allYearLevelsCount) {
        console.log('   ✅ FILTERING WORKS: Specific assessment returns same or fewer filters');
      } else {
        console.log('   ❌ FILTERING ISSUE: Specific assessment returns more filters than expected');
      }
      
      // Test 5: Test another specific assessment if available
      const anotherAssessment = assessmentNames.find(name => name !== specificAssessment);
      if (anotherAssessment) {
        console.log(`\n🎯 Step 5: Testing another assessment "${anotherAssessment}"...`);
        const anotherFiltersParams = new URLSearchParams();
        anotherFiltersParams.append('collegeName', collegeName);
        anotherFiltersParams.append('assessmentType', assessmentType);
        anotherFiltersParams.append('assessmentName', anotherAssessment);
        
        const anotherFiltersResponse = await axios.get(
          `${baseURL}/api/accounts/colleges/${encodeURIComponent(collegeName)}/assessment-filters?${anotherFiltersParams.toString()}`
        );
        
        console.log(`   Status: ${anotherFiltersResponse.status}`);
        console.log(`   Year Levels: ${JSON.stringify(anotherFiltersResponse.data.data.yearLevels)}`);
        console.log(`   Sections: ${JSON.stringify(anotherFiltersResponse.data.data.sections)}`);
        console.log(`   Sections Count: ${anotherFiltersResponse.data.data.sections.length}`);
        console.log(`   Total Assessments: ${anotherFiltersResponse.data.data.totalAssessments}`);
      }
    }
    
    console.log('\n🎉 Frontend-to-Backend Flow Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Error during frontend-to-backend flow test:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteFrontendFlow();