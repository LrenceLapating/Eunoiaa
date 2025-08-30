require('dotenv').config();
const { getCollegeScores } = require('./utils/collegeScoring');

async function testCompletionSeparation() {
  try {
    console.log('🧪 Testing completion data separation by assessment name...');
    
    // Test 1: Get completion data for a specific college without assessment filter
    console.log('\n📊 Test 1: Get all completion data for CCS (should show data by assessment)');
    const result1 = await getCollegeScores('CCS', 'ryff_42', null, null, null);
    
    if (result1.success && result1.colleges.length > 0) {
      const college = result1.colleges[0];
      console.log('✅ College found:', college.name);
      console.log('📋 Completion data by assessment:', college.completionDataByAssessment);
      console.log('📊 Aggregated completion data:', college.completionData);
      
      if (college.completionDataByAssessment) {
        const assessmentNames = Object.keys(college.completionDataByAssessment);
        console.log(`📝 Found ${assessmentNames.length} assessments:`);
        assessmentNames.forEach(name => {
          const data = college.completionDataByAssessment[name];
          console.log(`   - ${name}: ${data.completed}/${data.total} (${data.assessment_type})`);
        });
      }
    } else {
      console.log('❌ No colleges found or error:', result1.error);
    }
    
    // Test 2: Get completion data for a specific assessment
    console.log('\n📊 Test 2: Get completion data for specific assessment');
    const specificAssessment = '2025-2026 1st Semester - test 1st year';
    const result2 = await getCollegeScores('CCS', 'ryff_42', specificAssessment, null, null);
    
    if (result2.success && result2.colleges.length > 0) {
      const college = result2.colleges[0];
      console.log('✅ College found:', college.name);
      console.log('📋 Assessment-specific completion data:', college.completionData);
      console.log('📊 Completion data by assessment:', college.completionDataByAssessment);
    } else {
      console.log('❌ No colleges found or error:', result2.error);
    }
    
    // Test 3: Check multiple colleges
    console.log('\n📊 Test 3: Get completion data for all colleges');
    const result3 = await getCollegeScores(null, 'ryff_42', null, null, null);
    
    if (result3.success) {
      console.log(`✅ Found ${result3.colleges.length} colleges`);
      result3.colleges.forEach(college => {
        console.log(`\n🏫 ${college.name}:`);
        if (college.completionDataByAssessment) {
          const assessmentCount = Object.keys(college.completionDataByAssessment).length;
          console.log(`   📝 Has ${assessmentCount} assessments`);
          Object.entries(college.completionDataByAssessment).forEach(([name, data]) => {
            console.log(`      - ${name}: ${data.completed}/${data.total}`);
          });
        } else {
          console.log('   ❌ No completion data by assessment');
        }
        
        if (college.completionData) {
          console.log(`   📊 Aggregated: ${college.completionData.completed}/${college.completionData.total}`);
        }
      });
    } else {
      console.log('❌ Error getting colleges:', result3.error);
    }
    
    console.log('\n✅ Completion separation testing completed!');
    
  } catch (error) {
    console.error('❌ Error in testing:', error);
  }
}

// Run the test
testCompletionSeparation().catch(console.error);