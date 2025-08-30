// Test script for year and section filtering functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data based on actual database content
const testData = {
  colleges: [
    'Business Administration',
    'College of Arts and Sciences', 
    'College of Computer Studies',
    'College of Education',
    'College of Engineering',
    'Nursing College'
  ],
  assessmentNames: [
    '2025-2026 1st Semester - Testing for Section Filtering',
    '2025-2026 2nd Semester - 1st Test 42'
  ],
  assessmentTypes: ['ryff_42', 'ryff_84'],
  yearLevels: ['1', '2', '3', '4'],
  sections: ['BSBA-1A', 'BSBA-2A', 'BSC-1A', 'BSC-1B']
};

async function testCollegeScoresAPI() {
  console.log('🧪 Testing College Scores API with Year/Section Filtering...');
  
  const tests = [
    {
      name: 'Basic filtering (no year/section)',
      params: {
        college: testData.colleges[0],
        assessmentType: testData.assessmentTypes[0],
        assessmentName: testData.assessmentNames[0]
      }
    },
    {
      name: 'Filter by year only',
      params: {
        college: testData.colleges[0],
        assessmentType: testData.assessmentTypes[0],
        assessmentName: testData.assessmentNames[0],
        yearLevel: testData.yearLevels[0]
      }
    },
    {
      name: 'Filter by section only',
      params: {
        college: testData.colleges[0],
        assessmentType: testData.assessmentTypes[0],
        assessmentName: testData.assessmentNames[0],
        section: testData.sections[0]
      }
    },
    {
      name: 'Filter by both year and section',
      params: {
        college: testData.colleges[0],
        assessmentType: testData.assessmentTypes[0],
        assessmentName: testData.assessmentNames[0],
        yearLevel: testData.yearLevels[0],
        section: testData.sections[0]
      }
    },
    {
      name: 'Test with different college',
      params: {
        college: testData.colleges[2], // College of Computer Studies
        assessmentType: testData.assessmentTypes[0],
        assessmentName: testData.assessmentNames[0],
        yearLevel: testData.yearLevels[1],
        section: testData.sections[2]
      }
    },
    {
      name: 'Test with 84-item assessment',
      params: {
        college: testData.colleges[1], // College of Arts and Sciences
        assessmentType: testData.assessmentTypes[1], // ryff_84
        assessmentName: testData.assessmentNames[0],
        yearLevel: testData.yearLevels[2]
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
      console.log('📊 Response data structure:');
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`   - Array with ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log('   - First item keys:', Object.keys(response.data[0]));
          }
        } else {
          console.log('   - Object keys:', Object.keys(response.data));
          
          // Check if it has the expected structure
          if (response.data.collegeScores) {
            console.log(`   - College scores found: ${Object.keys(response.data.collegeScores).length} colleges`);
            
            // Show sample data for first college
            const firstCollege = Object.keys(response.data.collegeScores)[0];
            if (firstCollege) {
              const collegeData = response.data.collegeScores[firstCollege];
              console.log(`   - Sample college (${firstCollege}):`);
              console.log(`     * Dimensions: ${Object.keys(collegeData).length}`);
              
              // Show first dimension data
              const firstDimension = Object.keys(collegeData)[0];
              if (firstDimension) {
                console.log(`     * Sample dimension (${firstDimension}):`, collegeData[firstDimension]);
              }
            }
          }
        }
      } else {
        console.log('   - Response data:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.status || 'Network Error');
      if (error.response?.data) {
        console.log('   Error details:', error.response.data);
      } else {
        console.log('   Error message:', error.message);
      }
    }
  }
}

// Run the tests
testCollegeScoresAPI().catch(console.error);