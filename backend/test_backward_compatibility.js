// Test script to verify backward compatibility of college scores API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data based on actual database content
const testData = {
  colleges: [
    'Business Administration',
    'College of Arts and Sciences', 
    'College of Computer Studies'
  ],
  assessmentNames: [
    '2025-2026 1st Semester - Testing for Section Filtering',
    '2025-2026 2nd Semester - 1st Test 42'
  ],
  assessmentTypes: ['ryff_42', 'ryff_84']
};

async function testBackwardCompatibility() {
  console.log('🔄 Testing Backward Compatibility of College Scores API...');
  
  const tests = [
    {
      name: 'Original API call (college + assessmentType only)',
      params: {
        college: testData.colleges[0],
        assessmentType: testData.assessmentTypes[0]
      }
    },
    {
      name: 'Original API call with assessment name',
      params: {
        college: testData.colleges[1],
        assessmentType: testData.assessmentTypes[0],
        assessmentName: testData.assessmentNames[0]
      }
    },
    {
      name: 'Different college with 84-item assessment',
      params: {
        college: testData.colleges[2],
        assessmentType: testData.assessmentTypes[1],
        assessmentName: testData.assessmentNames[0]
      }
    },
    {
      name: 'Minimal parameters (college only)',
      params: {
        college: testData.colleges[0]
      }
    },
    {
      name: 'Assessment type only (no college)',
      params: {
        assessmentType: testData.assessmentTypes[0]
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log('Parameters:', JSON.stringify(test.params, null, 2));
    
    try {
      const response = await axios.get(`${BASE_URL}/api/accounts/colleges/scores`, {
        params: test.params
      });
      
      console.log('✅ Status:', response.status);
      console.log('📊 Response structure:');
      
      if (response.data && typeof response.data === 'object') {
        console.log('   - Object keys:', Object.keys(response.data));
        
        // Check for expected response structure
        if (response.data.success !== undefined) {
          console.log(`   - Success: ${response.data.success}`);
        }
        
        if (response.data.colleges) {
          console.log(`   - Colleges array length: ${response.data.colleges.length}`);
          
          if (response.data.colleges.length > 0) {
            const firstCollege = response.data.colleges[0];
            console.log(`   - First college name: ${firstCollege.name || 'N/A'}`);
            
            if (firstCollege.dimensions) {
              console.log(`   - Dimensions count: ${Object.keys(firstCollege.dimensions).length}`);
              
              // Show sample dimension
              const dimensionNames = Object.keys(firstCollege.dimensions);
              if (dimensionNames.length > 0) {
                const sampleDimension = firstCollege.dimensions[dimensionNames[0]];
                console.log(`   - Sample dimension (${dimensionNames[0]}):`, {
                  averageScore: sampleDimension.averageScore,
                  riskLevel: sampleDimension.riskLevel
                });
              }
            }
          }
        }
        
        if (response.data.collegeScores) {
          console.log(`   - College scores found: ${Object.keys(response.data.collegeScores).length} colleges`);
          
          const firstCollegeKey = Object.keys(response.data.collegeScores)[0];
          if (firstCollegeKey) {
            const collegeData = response.data.collegeScores[firstCollegeKey];
            console.log(`   - Sample college (${firstCollegeKey}):`);
            console.log(`     * Dimensions: ${Object.keys(collegeData).length}`);
            
            const firstDimension = Object.keys(collegeData)[0];
            if (firstDimension) {
              console.log(`     * Sample dimension (${firstDimension}):`, collegeData[firstDimension]);
            }
          }
        }
      } else {
        console.log('   - Response data:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.status || 'Network Error');
      if (error.response?.data) {
        console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('   Error message:', error.message);
      }
    }
  }
  
  console.log('\n🏁 Backward compatibility testing completed!');
}

// Run the tests
testBackwardCompatibility().catch(console.error);