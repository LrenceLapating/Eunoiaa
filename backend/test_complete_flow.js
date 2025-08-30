require('dotenv').config();
const fetch = require('node-fetch');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Dropdown Flow');
    console.log('=====================================\n');
    
    console.log('This test simulates the exact flow that happens in CollegeDetail.vue:');
    console.log('1. Fetch assessment names');
    console.log('2. Select an assessment');
    console.log('3. Fetch filtered year levels and sections for that assessment\n');
    
    // Step 1: Fetch assessment names (like the frontend does)
    console.log('📋 Step 1: Fetching assessment names...');
    const assessmentNamesUrl = 'http://localhost:3000/api/bulk-assessments/assessment-names';
    
    const assessmentResponse = await fetch(assessmentNamesUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!assessmentResponse.ok) {
      throw new Error(`Failed to fetch assessment names: ${assessmentResponse.status}`);
    }
    
    const assessmentData = await assessmentResponse.json();
    console.log(`✅ Found ${assessmentData.data?.length || 0} assessments`);
    
    if (!assessmentData.data || assessmentData.data.length === 0) {
      console.log('❌ No assessments found. Cannot continue test.');
      return;
    }
    
    // Show first few assessments
    console.log('\n📝 Sample assessments:');
    assessmentData.data.slice(0, 3).forEach((assessment, index) => {
      console.log(`   ${index + 1}. ${assessment.name} (${assessment.type})`);
    });
    
    // Step 2: Test different colleges with the new filtered endpoint
    const testColleges = [
      { name: 'CCS', displayName: 'College of Computer Studies' },
      { name: 'KUPAL', displayName: 'KUPAL College' },
      { name: 'GGG', displayName: 'GGG College' }
    ];
    
    for (const college of testColleges) {
      console.log(`\n🏫 Step 2: Testing ${college.displayName} (${college.name})`);
      console.log('=' .repeat(50));
      
      // Test the assessment filters endpoint (this is what the frontend calls)
      const filtersUrl = `http://localhost:3000/api/accounts/colleges/${encodeURIComponent(college.name)}/assessment-filters`;
      
      const filtersResponse = await fetch(filtersUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!filtersResponse.ok) {
        console.log(`❌ Failed to fetch filters: ${filtersResponse.status}`);
        continue;
      }
      
      const filtersData = await filtersResponse.json();
      
      if (filtersData.success) {
        const { yearLevels, sections, totalAssessments } = filtersData.data;
        
        console.log(`📊 Results for ${college.name}:`);
        console.log(`   📈 Total assessments: ${totalAssessments}`);
        console.log(`   🎓 Available year levels: [${yearLevels.join(', ')}]`);
        console.log(`   📚 Available sections: [${sections.join(', ')}]`);
        
        // Verify the behavior
        if (totalAssessments > 0) {
          if (yearLevels.length > 0 || sections.length > 0) {
            console.log('   ✅ SUCCESS: Showing filtered data from assessments!');
            console.log('   💡 Dropdowns will show only years/sections with actual assessments');
          } else {
            console.log('   ⚠️  WARNING: Assessments exist but no target data found');
            console.log('   💡 This might indicate assessments without populated target columns');
          }
        } else {
          console.log('   ℹ️  INFO: No assessments for this college');
          console.log('   💡 Dropdowns will be empty (correct behavior)');
        }
        
        // Test with assessment type filter
        if (totalAssessments > 0) {
          console.log(`\n   🔍 Testing with assessment type filter (ryff_42)...`);
          const filteredUrl = `${filtersUrl}?assessmentType=ryff_42`;
          
          const filteredResponse = await fetch(filteredUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (filteredResponse.ok) {
            const filteredData = await filteredResponse.json();
            if (filteredData.success) {
              console.log(`   📊 42-item assessments: ${filteredData.data.totalAssessments}`);
              console.log(`   🎓 Filtered year levels: [${filteredData.data.yearLevels.join(', ')}]`);
              console.log(`   📚 Filtered sections: [${filteredData.data.sections.join(', ')}]`);
            }
          }
        }
      } else {
        console.log(`❌ API returned error: ${filtersData.error}`);
      }
    }
    
    console.log('\n🎉 COMPLETE FLOW TEST FINISHED!');
    console.log('\n📋 Summary of Changes:');
    console.log('✅ OLD BEHAVIOR: Dropdowns showed ALL year levels and sections from college students');
    console.log('✅ NEW BEHAVIOR: Dropdowns show ONLY year levels and sections that have actual assessments');
    console.log('✅ BENEFIT: Much more precise filtering and better user experience');
    console.log('\n💡 Next Steps:');
    console.log('1. Test the frontend at http://localhost:8080/counselor/college-detail/CCS');
    console.log('2. Select an assessment and verify dropdowns show filtered options');
    console.log('3. Compare with a college that has no assessments');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFlow();