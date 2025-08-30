require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubmissionTrigger() {
  try {
    console.log('🧪 Testing the exact submission trigger logic...');
    
    // 1. Find an assignment that doesn't have college scores yet
    console.log('\n📋 Finding assignments without college scores...');
    
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        status,
        bulk_assessment:bulk_assessments(
          assessment_name,
          assessment_type
        )
      `)
      .eq('status', 'completed')
      .limit(10);
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`✅ Found ${assignments.length} completed assignments`);
    
    // 2. For each assignment, check if college scores exist
    for (const assignment of assignments) {
      console.log(`\n🔍 Checking assignment: ${assignment.bulk_assessment.assessment_name}`);
      
      // Get student college
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .select('college')
        .eq('id', assignment.student_id)
        .single();
      
      if (studentError || !studentData) {
        console.log('   ❌ Could not find student college');
        continue;
      }
      
      console.log(`   Student college: ${studentData.college}`);
      
      // Check existing college scores
      const { data: existingScores, error: scoresError } = await supabaseAdmin
        .from('college_scores')
        .select('id')
        .eq('college_name', studentData.college)
        .eq('assessment_type', assignment.bulk_assessment.assessment_type)
        .eq('assessment_name', assignment.bulk_assessment.assessment_name);
      
      if (scoresError) {
        console.log('   ❌ Error checking scores:', scoresError);
        continue;
      }
      
      if (!existingScores || existingScores.length === 0) {
        console.log('   ❌ No college scores found - testing trigger...');
        
        // Simulate the exact trigger logic from studentAssessments.js
        const assessmentName = assignment.bulk_assessment.assessment_name;
        const assessmentType = assignment.bulk_assessment.assessment_type;
        
        console.log(`   🔄 Triggering: computeAndStoreCollegeScores("${studentData.college}", "${assessmentType}", "${assessmentName}")`);
        
        try {
          const result = await computeAndStoreCollegeScores(
            studentData.college,
            assessmentType,
            assessmentName
          );
          
          if (result.success) {
            console.log(`   ✅ Trigger successful: ${result.scoreCount} records created`);
            console.log(`   📊 Message: ${result.message}`);
          } else {
            console.log(`   ❌ Trigger failed: ${result.error}`);
          }
        } catch (error) {
          console.log(`   💥 Trigger threw error: ${error.message}`);
          console.log(`   Stack: ${error.stack}`);
        }
        
        // Only test one to avoid creating duplicate data
        break;
      } else {
        console.log(`   ✅ College scores already exist: ${existingScores.length} records`);
      }
    }
    
    // 3. Test what happens when the async operation fails
    console.log('\n🔬 Testing async error handling...');
    
    // Simulate the async call like in studentAssessments.js
    const testCollege = 'Test College';
    const testAssessmentType = 'ryff_42';
    const testAssessmentName = 'Test Assessment';
    
    console.log('   🔄 Testing async computation with invalid data...');
    
    computeAndStoreCollegeScores(testCollege, testAssessmentType, testAssessmentName)
      .then(result => {
        if (result.success) {
          console.log(`   ✅ Async test successful: ${result.message}`);
        } else {
          console.log(`   ❌ Async test failed: ${result.error}`);
        }
      })
      .catch(error => {
        console.log(`   💥 Async test threw error: ${error.message}`);
      });
    
    // Wait a bit for async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n💡 Analysis:');
    console.log('If the automatic trigger is not working, possible causes:');
    console.log('1. The async operation is failing silently');
    console.log('2. The student college lookup is failing');
    console.log('3. The assessment_name from bulk_assessment is null/undefined');
    console.log('4. Database transaction issues during async operation');
    console.log('5. The trigger code is not being reached (check server logs)');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testSubmissionTrigger().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});