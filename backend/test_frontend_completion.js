require('dotenv').config();
const fetch = require('node-fetch');

async function testFrontendCompletion() {
  try {
    console.log('🧪 Testing frontend completion data display...');
    
    // Test the exact API call that the frontend makes
    const testCases = [
      {
        name: 'Test 1: CCS with specific assessment',
        college: 'CCS',
        assessmentType: 'ryff_42',
        assessmentName: '2025-2026 1st Semester - test 1st year'
      },
      {
        name: 'Test 2: College of Arts and Sciences with different assessment',
        college: 'College of Arts and Sciences',
        assessmentType: 'ryff_42',
        assessmentName: '2025-2026 2nd Semester - 1st Test 42'
      },
      {
        name: 'Test 3: College of Arts and Sciences without specific assessment',
        college: 'College of Arts and Sciences',
        assessmentType: 'ryff_42',
        assessmentName: null
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📊 ${testCase.name}`);
      
      // Build query parameters like the frontend does
      const params = new URLSearchParams();
      params.append('college', testCase.college);
      params.append('assessmentType', testCase.assessmentType);
      
      if (testCase.assessmentName) {
        params.append('assessmentName', testCase.assessmentName);
      }
      
      const url = `http://localhost:3000/api/accounts/colleges/scores?${params.toString()}`;
      console.log(`🔗 URL: ${url}`);
      
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
        
        if (data.success && data.colleges && data.colleges.length > 0) {
          const college = data.colleges[0];
          console.log(`✅ College: ${college.name}`);
          
          // Check completion data structure
          if (college.completionData) {
            console.log(`📊 Assessment-specific completion: ${college.completionData.completed}/${college.completionData.total}`);
          }
          
          if (college.completionDataByAssessment) {
            console.log('📋 Completion data by assessment:');
            Object.entries(college.completionDataByAssessment).forEach(([name, data]) => {
              console.log(`   - ${name}: ${data.completed}/${data.total} (${data.assessment_type})`);
            });
          }
          
          // Simulate frontend logic
          let displayValue;
          if (testCase.assessmentName && college.completionDataByAssessment) {
            const assessmentData = college.completionDataByAssessment[testCase.assessmentName];
            if (assessmentData) {
              displayValue = `${assessmentData.completed}/${assessmentData.total}`;
              console.log(`🎯 Frontend would display (assessment-specific): ${displayValue}`);
            } else {
              console.log('⚠️ Assessment-specific data not found, would fall back to aggregated');
              if (college.completionData) {
                displayValue = `${college.completionData.completed}/${college.completionData.total}`;
                console.log(`🎯 Frontend would display (aggregated): ${displayValue}`);
              }
            }
          } else if (college.completionData) {
            displayValue = `${college.completionData.completed}/${college.completionData.total}`;
            console.log(`🎯 Frontend would display (aggregated): ${displayValue}`);
          } else {
            console.log('❌ No completion data available');
          }
          
        } else {
          console.log('❌ No colleges found in response');
          console.log('Response:', JSON.stringify(data, null, 2));
        }
        
      } catch (error) {
        console.error(`❌ Error in API call: ${error.message}`);
      }
    }
    
    console.log('\n✅ Frontend completion testing completed!');
    
  } catch (error) {
    console.error('❌ Error in testing:', error);
  }
}

// Run the test
testFrontendCompletion().catch(console.error);