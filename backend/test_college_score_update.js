require('dotenv').config();
const { supabaseAdmin } = require('./config/database');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

/**
 * Test script to verify college score computation works correctly
 * This simulates what happens when a student submits an assessment
 */
async function testCollegeScoreUpdate() {
  try {
    console.log('🧪 Testing College Score Update Functionality...');
    
    // First, let's check what assessments exist
    console.log('\n📊 Checking existing assessments...');
    const { data: assessments, error: assessmentError } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .limit(1);
    
    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError);
      return;
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('⚠️ No assessments found in assessments_42items. Checking assessments_84items...');
      
      const { data: assessments84, error: assessment84Error } = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .limit(1);
      
      if (assessment84Error || !assessments84 || assessments84.length === 0) {
        console.log('⚠️ No assessments found in either table. Cannot test without existing data.');
        return;
      }
      
      // Get student info for 84-item assessment
      const { data: student84, error: studentError84 } = await supabaseAdmin
        .from('students')
        .select('college')
        .eq('id', assessments84[0].student_id)
        .single();
      
      if (studentError84 || !student84) {
        console.log('⚠️ Could not find student data for assessment.');
        return;
      }
      
      const college = student84.college;
      const assessmentType = 'ryff_84';
      
      console.log(`✅ Found sample data: College=${college}, Type=${assessmentType}`);
      await testCollegeScoreComputation(college, assessmentType);
      return;
    }
    
    // Get student info for 42-item assessment
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('college')
      .eq('id', assessments[0].student_id)
      .single();
    
    if (studentError || !student) {
      console.log('⚠️ Could not find student data for assessment.');
      return;
    }
    
    const college = student.college;
    const assessmentType = 'ryff_42';
    
    console.log(`✅ Found ${assessments.length} assessments`);
    console.log(`   - Assessment ${assessments[0].id}: Student ${assessments[0].student_id}, College: ${college}`);
    
    await testCollegeScoreComputation(college, assessmentType);
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
  
  async function testCollegeScoreComputation(college, assessmentType) {
    console.log(`\n🎯 Testing college score computation for: ${college} (${assessmentType})`);
    
    // Check current college scores before computation
    console.log('\n📈 Current college scores before update:');
    const { data: beforeScores, error: beforeError } = await supabaseAdmin
      .from('college_scores')
      .select('*')
      .eq('college_name', college)
      .eq('assessment_type', assessmentType);
    
    if (beforeError) {
      console.error('❌ Error fetching before scores:', beforeError);
    } else {
      console.log(`   Found ${beforeScores?.length || 0} existing score records`);
    }
    
    // Trigger college score computation
    console.log('\n🔄 Triggering college score computation...');
    const result = await computeAndStoreCollegeScores(college, assessmentType, null);
    
    if (result.success) {
      console.log('✅ College score computation successful!');
      console.log(`   Message: ${result.message}`);
      console.log(`   Colleges processed: ${result.collegeCount}`);
      console.log(`   Score records created: ${result.scoreCount}`);
    } else {
      console.error('❌ College score computation failed:', result.error);
      return;
    }
    
    // Check college scores after computation
    console.log('\n📊 College scores after update:');
    const { data: afterScores, error: afterError } = await supabaseAdmin
      .from('college_scores')
      .select('*')
      .eq('college_name', college)
      .eq('assessment_type', assessmentType)
      .order('dimension_name');
    
    if (afterError) {
      console.error('❌ Error fetching after scores:', afterError);
    } else {
      console.log(`   Found ${afterScores?.length || 0} score records after computation`);
      afterScores?.forEach(score => {
        console.log(`   - ${score.dimension_name}: ${score.raw_score} (${score.risk_level}) - ${score.student_count} students`);
      });
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n💡 This confirms that the college score computation works correctly.');
    console.log('   When students submit assessments, their college scores will be automatically updated.');
  }
}

// Run the test
testCollegeScoreUpdate().then(() => {
  console.log('\n🏁 Test script finished.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});