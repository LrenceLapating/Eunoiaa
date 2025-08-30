require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutomaticScoring() {
  try {
    console.log('🧪 Testing automatic college score computation after assessment submission...');
    
    // 1. Find a recent assessment submission
    console.log('\n📋 Finding recent assessment submissions...');
    const { data: recentAssignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        status,
        completed_at,
        bulk_assessment:bulk_assessments(
          assessment_name,
          assessment_type
        )
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }
    
    if (!recentAssignments || recentAssignments.length === 0) {
      console.log('❌ No completed assignments found');
      return;
    }
    
    console.log(`✅ Found ${recentAssignments.length} recent completed assignments`);
    
    // 2. Check each assignment for college scores
    for (const assignment of recentAssignments) {
      console.log(`\n🔍 Checking assignment ${assignment.id}:`);
      console.log(`   Assessment: ${assignment.bulk_assessment.assessment_name}`);
      console.log(`   Type: ${assignment.bulk_assessment.assessment_type}`);
      console.log(`   Completed: ${assignment.completed_at}`);
      
      // Get student's college
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('college')
        .eq('id', assignment.student_id)
        .single();
      
      if (studentError || !student) {
        console.log('   ❌ Could not find student college');
        continue;
      }
      
      console.log(`   Student college: ${student.college}`);
      
      // Check if college scores exist for this assessment
      const { data: collegeScores, error: scoresError } = await supabaseAdmin
        .from('college_scores')
        .select('*')
        .eq('college_name', student.college)
        .eq('assessment_type', assignment.bulk_assessment.assessment_type)
        .eq('assessment_name', assignment.bulk_assessment.assessment_name);
      
      if (scoresError) {
        console.log('   ❌ Error checking college scores:', scoresError);
        continue;
      }
      
      if (collegeScores && collegeScores.length > 0) {
        console.log(`   ✅ College scores exist: ${collegeScores.length} dimension records`);
        console.log(`   📊 Sample: ${collegeScores[0].dimension_name} = ${collegeScores[0].raw_score}`);
      } else {
        console.log('   ❌ No college scores found - automatic computation may have failed');
        
        // Try to manually trigger computation
        console.log('   🔄 Manually triggering college score computation...');
        const result = await computeAndStoreCollegeScores(
          student.college,
          assignment.bulk_assessment.assessment_type,
          assignment.bulk_assessment.assessment_name
        );
        
        if (result.success) {
          console.log(`   ✅ Manual computation successful: ${result.scoreCount} records created`);
        } else {
          console.log(`   ❌ Manual computation failed: ${result.error}`);
        }
      }
    }
    
    // 3. Test the automatic trigger by checking server logs
    console.log('\n📝 Recommendations:');
    console.log('1. Check server logs when submitting assessments to see if automatic computation is triggered');
    console.log('2. If automatic computation is not working, the issue might be:');
    console.log('   - Error in the async computation (check server logs)');
    console.log('   - Missing assessment_name in bulk_assessment');
    console.log('   - Student college not found');
    console.log('   - Database connection issues during async operation');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testAutomaticScoring().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});