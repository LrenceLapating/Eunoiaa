require('dotenv').config();
const fetch = require('node-fetch');

async function testFiltersOnly() {
  try {
    console.log('🔍 Testing Assessment Filters Endpoint (No Auth Required)');
    console.log('========================================================\n');
    
    console.log('Testing the updated endpoint that now uses target_year_levels and target_sections');
    console.log('instead of querying all students from the college.\n');
    
    // Test different colleges
    const testCases = [
      {
        college: 'CCS',
        description: 'College with many assessments'
      },
      {
        college: 'College of Computer Studies', 
        description: 'Same college, different name format'
      },
      {
        college: 'KUPAL',
        description: 'Another college with assessments'
      },
      {
        college: 'GGG',
        description: 'Third test college'
      },
      {
        college: 'NonExistentCollege',
        description: 'College with no assessments (should return empty)'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🏫 Testing: ${testCase.college}`);
      console.log(`📝 Description: ${testCase.description}`);
      console.log('-'.repeat(60));
      
      const url = `http://localhost:3000/api/accounts/colleges/${encodeURIComponent(testCase.college)}/assessment-filters`;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data.success) {
          const { yearLevels, sections, totalAssessments } = data.data;
          
          console.log(`📊 Results:`);
          console.log(`   📈 Total assessments: ${totalAssessments}`);
          console.log(`   🎓 Year levels: [${yearLevels.join(', ')}]`);
          console.log(`   📚 Sections: [${sections.join(', ')}]`);
          
          // Analysis
          if (totalAssessments === 0) {
            console.log(`   ✅ CORRECT: No assessments = empty dropdowns`);
          } else if (yearLevels.length === 0 && sections.length === 0) {
            console.log(`   ⚠️  WARNING: Has assessments but no target data`);
            console.log(`   💡 This suggests target columns weren't populated for some assessments`);
          } else {
            console.log(`   ✅ SUCCESS: Showing filtered data from actual assessments!`);
            console.log(`   💡 OLD: Would show ALL students from college`);
            console.log(`   💡 NEW: Shows only years/sections with assessments`);
          }
          
          // Test with assessment type filter if there are assessments
          if (totalAssessments > 0) {
            console.log(`\n   🔍 Testing with ryff_42 filter...`);
            const filteredUrl = `${url}?assessmentType=ryff_42`;
            
            const filteredResponse = await fetch(filteredUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (filteredResponse.ok) {
              const filteredData = await filteredResponse.json();
              if (filteredData.success) {
                console.log(`   📊 42-item only: ${filteredData.data.totalAssessments} assessments`);
                console.log(`   🎓 Filtered years: [${filteredData.data.yearLevels.join(', ')}]`);
                console.log(`   📚 Filtered sections: [${filteredData.data.sections.join(', ')}]`);
              }
            }
          }
          
        } else {
          console.log(`❌ API Error: ${data.error}`);
        }
        
      } catch (fetchError) {
        console.log(`❌ Network Error: ${fetchError.message}`);
      }
    }
    
    console.log('\n🎉 FILTER TESTING COMPLETE!');
    console.log('\n📋 Key Changes Made:');
    console.log('1. ✅ Modified /api/accounts/colleges/:collegeName/assessment-filters endpoint');
    console.log('2. ✅ Now queries bulk_assessments.target_year_levels and target_sections');
    console.log('3. ✅ Instead of querying ALL students from the college');
    console.log('4. ✅ Populated target columns with real data from existing students');
    console.log('\n🎯 Expected Frontend Behavior:');
    console.log('- Year dropdown: Shows only years that have assessments assigned');
    console.log('- Section dropdown: Shows only sections that have assessments assigned');
    console.log('- Much more precise filtering for counselors!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFiltersOnly();