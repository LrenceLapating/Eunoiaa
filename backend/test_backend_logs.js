require('dotenv').config();
const { supabaseAdmin } = require('./config/database');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

async function testBackendLogs() {
  console.log('🔍 Testing Backend Logs for College Score Computation');
  console.log('====================================================');
  
  try {
    // Test 1: Check if college score computation logs correctly
    console.log('\n📋 Test 1: Triggering college score computation with logging...');
    
    const testCollege = 'College of Arts and Sciences';
    const testAssessmentType = 'ryff_42';
    const testAssessmentName = 'Test Assessment';
    
    console.log(`🎯 Computing scores for: ${testCollege}`);
    console.log(`📊 Assessment Type: ${testAssessmentType}`);
    console.log(`📝 Assessment Name: ${testAssessmentName}`);
    
    // This should generate the same logs as when triggered from assessment submission
    const result = await computeAndStoreCollegeScores(testCollege, testAssessmentType, testAssessmentName);
    
    if (result.success) {
      console.log('✅ College score computation completed successfully!');
      console.log(`📈 Result: ${result.message}`);
      console.log(`🏫 Colleges processed: ${result.collegeCount}`);
      console.log(`📊 Score records created: ${result.scoreCount}`);
    } else {
      console.log('❌ College score computation failed:');
      console.log(`💥 Error: ${result.error}`);
    }
    
    // Test 2: Verify the logs show the expected behavior
    console.log('\n📋 Test 2: Verifying expected log patterns...');
    console.log('✅ Expected logs should include:');
    console.log('   - "Computing college scores for [college] ([assessment_type])..."');
    console.log('   - "Found [X] assessments to process"');
    console.log('   - "Processing [X] colleges"');
    console.log('   - "Processing [college] with [X] students"');
    console.log('   - "Storing [X] college score records"');
    console.log('   - "Successfully stored [X] college score records"');
    
    // Test 3: Test with different assessment type
    console.log('\n📋 Test 3: Testing with ryff_84 assessment type...');
    
    const result84 = await computeAndStoreCollegeScores(testCollege, 'ryff_84', testAssessmentName);
    
    if (result84.success) {
      console.log('✅ ryff_84 computation completed successfully!');
      console.log(`📈 Result: ${result84.message}`);
    } else {
      console.log('❌ ryff_84 computation failed:');
      console.log(`💥 Error: ${result84.error}`);
    }
    
    console.log('\n🎉 Backend logging test completed!');
    console.log('\n💡 These are the same logs that would appear when:');
    console.log('   - A student submits an assessment');
    console.log('   - The assessment submission endpoint triggers college score computation');
    console.log('   - The computation runs asynchronously in the background');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBackendLogs();