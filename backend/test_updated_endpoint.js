require('dotenv').config();
const fetch = require('node-fetch');

async function testUpdatedEndpoint() {
  try {
    console.log('Testing updated /api/accounts/colleges/:collegeName/assessment-filters endpoint...');
    console.log('This should now show only year levels and sections that have actual assessments\n');
    
    // Test different colleges
    const testColleges = ['CCS', 'College of Computer Studies', 'KUPAL', 'GGG'];
    
    for (const college of testColleges) {
      console.log(`\n=== Testing college: ${college} ===`);
      
      const url = `http://localhost:3000/api/accounts/colleges/${encodeURIComponent(college)}/assessment-filters`;
      console.log(`URL: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log('✅ Response received:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success) {
          const { yearLevels, sections, totalAssessments } = data.data;
          console.log(`\n📊 Summary for ${college}:`);
          console.log(`   - Total assessments: ${totalAssessments}`);
          console.log(`   - Available year levels: [${yearLevels.join(', ')}]`);
          console.log(`   - Available sections: [${sections.join(', ')}]`);
          
          if (totalAssessments === 0) {
            console.log('   ⚠️  No assessments found for this college');
          } else if (yearLevels.length === 0 && sections.length === 0) {
            console.log('   ⚠️  Assessments exist but no target data populated');
          } else {
            console.log('   ✅ Successfully showing filtered data!');
          }
        }
        
      } catch (fetchError) {
        console.error(`❌ Error fetching data for ${college}:`, fetchError.message);
      }
    }
    
    console.log('\n=== Testing with assessment type filter ===');
    
    // Test with assessment type filter
    const testUrl = `http://localhost:3000/api/accounts/colleges/CCS/assessment-filters?assessmentType=ryff_42`;
    console.log(`\nTesting with filter: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Filtered response:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error testing filtered endpoint:', error.message);
    }
    
    console.log('\n🎉 Test completed!');
    console.log('\n💡 Expected behavior:');
    console.log('   - Colleges with assessments should show only year levels/sections from those assessments');
    console.log('   - Colleges without assessments should show empty arrays');
    console.log('   - This replaces the old behavior of showing ALL students from the college');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUpdatedEndpoint();