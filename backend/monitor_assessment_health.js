const { supabaseAdmin } = require('./config/database');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

/**
 * Health monitoring script for the assessment submission process
 * This script checks for inconsistencies and missing college scores
 */
async function monitorAssessmentHealth() {
  try {
    console.log('🔍 Starting assessment health monitoring...');
    
    // 1. Check for completed assignments without assessment records
    console.log('\n📋 Checking for completed assignments without assessment records...');
    
    const { data: completedAssignments, error: assignmentsError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, student_id, bulk_assessment_id, completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    
    if (assignmentsError) {
      console.error('❌ Error fetching completed assignments:', assignmentsError);
      return;
    }
    
    console.log(`Found ${completedAssignments.length} completed assignments`);
    
    // Check for missing assessment records
    const assignmentIds = completedAssignments.map(a => a.id);
    
    const { data: assessments42, error: assessments42Error } = await supabaseAdmin
      .from('assessments_42items')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);
    
    const { data: assessments84, error: assessments84Error } = await supabaseAdmin
      .from('assessments_84items')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);
    
    if (assessments42Error || assessments84Error) {
      console.error('❌ Error checking assessment records:', { assessments42Error, assessments84Error });
      return;
    }
    
    const assessmentAssignmentIds = new Set([
      ...(assessments42 || []).map(a => a.assignment_id),
      ...(assessments84 || []).map(a => a.assignment_id)
    ]);
    
    const missingAssessments = completedAssignments.filter(a => !assessmentAssignmentIds.has(a.id));
    
    if (missingAssessments.length > 0) {
      console.log(`⚠️  Found ${missingAssessments.length} completed assignments without assessment records:`);
      missingAssessments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Assignment ID: ${assignment.id}, Completed: ${assignment.completed_at}`);
      });
    } else {
      console.log('✅ All completed assignments have corresponding assessment records');
    }
    
    // 2. Check for assessments without college scores
    console.log('\n🏫 Checking for missing college scores...');
    
    // Get all bulk assessments for completed assignments
    const bulkAssessmentIds = [...new Set(completedAssignments.map(a => a.bulk_assessment_id))];
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type')
      .in('id', bulkAssessmentIds);
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    // Get existing college scores
    const { data: existingScores, error: scoresError } = await supabaseAdmin
      .from('college_scores')
      .select('assessment_name, assessment_type, college_name');
    
    if (scoresError) {
      console.error('❌ Error fetching college scores:', scoresError);
      return;
    }
    
    // Create a set of existing score combinations
    const existingScoreKeys = new Set(
      existingScores.map(score => `${score.college_name}|${score.assessment_type}|${score.assessment_name}`)
    );
    
    // Get student colleges for completed assignments
    const studentIds = [...new Set(completedAssignments.map(a => a.student_id))];
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, college')
      .in('id', studentIds);
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }
    
    const studentCollegeMap = {};
    students.forEach(student => {
      studentCollegeMap[student.id] = student.college;
    });
    
    const bulkAssessmentMap = {};
    bulkAssessments.forEach(bulk => {
      bulkAssessmentMap[bulk.id] = bulk;
    });
    
    // Check for missing college scores
    const expectedScores = new Set();
    completedAssignments.forEach(assignment => {
      const college = studentCollegeMap[assignment.student_id];
      const bulkAssessment = bulkAssessmentMap[assignment.bulk_assessment_id];
      
      if (college && bulkAssessment) {
        const key = `${college}|${bulkAssessment.assessment_type}|${bulkAssessment.assessment_name}`;
        expectedScores.add(key);
      }
    });
    
    const missingScores = [...expectedScores].filter(key => !existingScoreKeys.has(key));
    
    if (missingScores.length > 0) {
      console.log(`⚠️  Found ${missingScores.length} missing college score combinations:`);
      missingScores.forEach((key, index) => {
        const [college, assessmentType, assessmentName] = key.split('|');
        console.log(`   ${index + 1}. ${college} - ${assessmentName} (${assessmentType})`);
      });
    } else {
      console.log('✅ All expected college scores exist');
    }
    
    // 3. Summary
    console.log('\n📊 Health Summary:');
    console.log(`   📋 Total completed assignments: ${completedAssignments.length}`);
    console.log(`   📝 Assignments with assessment records: ${completedAssignments.length - missingAssessments.length}`);
    console.log(`   ❌ Missing assessment records: ${missingAssessments.length}`);
    console.log(`   🏫 Expected college score combinations: ${expectedScores.size}`);
    console.log(`   ✅ Existing college scores: ${existingScores.length}`);
    console.log(`   ❌ Missing college scores: ${missingScores.length}`);
    
    // 4. Recommendations
    if (missingAssessments.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   - Investigate why assessment submissions are not creating records in assessment tables');
      console.log('   - Check for errors in the assessment submission endpoint');
      console.log('   - Review database permissions and constraints');
    }
    
    if (missingScores.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   - Run the backfill script to compute missing college scores');
      console.log('   - Check college score computation logs for errors');
      console.log('   - Verify that college score computation is triggered after assessment submission');
    }
    
    if (missingAssessments.length === 0 && missingScores.length === 0) {
      console.log('\n🎉 Assessment system is healthy!');
    }
    
  } catch (error) {
    console.error('💥 Health monitoring failed:', error);
  }
  
  process.exit(0);
}

// Run the monitoring if this script is executed directly
if (require.main === module) {
  monitorAssessmentHealth();
}

module.exports = { monitorAssessmentHealth };