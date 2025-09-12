const { supabaseAdmin } = require('./config/database');
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');

/**
 * Backfill script to compute college scores for completed assignments
 * This addresses the issue where completed assignments exist but no college scores were computed
 */
async function backfillCollegeScores() {
  try {
    console.log('🔄 Starting college scores backfill process...');
    
    // Get all completed assignments with their bulk assessment details
    const { data: completedAssignments, error: assignmentsError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        completed_at
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    
    if (assignmentsError) {
      console.error('❌ Error fetching completed assignments:', assignmentsError);
      return;
    }
    
    console.log(`📋 Found ${completedAssignments.length} completed assignments`);
    
    if (completedAssignments.length === 0) {
      console.log('✅ No completed assignments found. Nothing to backfill.');
      return;
    }
    
    // Get bulk assessment details for all completed assignments
    const bulkAssessmentIds = [...new Set(completedAssignments.map(a => a.bulk_assessment_id))];
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type')
      .in('id', bulkAssessmentIds);
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    // Create a map for quick lookup
    const bulkAssessmentMap = {};
    bulkAssessments.forEach(bulk => {
      bulkAssessmentMap[bulk.id] = bulk;
    });
    
    // Get student college information for all students
    const studentIds = [...new Set(completedAssignments.map(a => a.student_id))];
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, college')
      .in('id', studentIds);
    
    if (studentsError) {
      console.error('❌ Error fetching student data:', studentsError);
      return;
    }
    
    // Create a map for quick lookup
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Group assignments by college and assessment type/name
    const collegeAssessmentGroups = {};
    
    completedAssignments.forEach(assignment => {
      const bulkAssessment = bulkAssessmentMap[assignment.bulk_assessment_id];
      const student = studentMap[assignment.student_id];
      
      if (!bulkAssessment || !student || !student.college) {
        console.log(`⚠️  Skipping assignment ${assignment.id}: missing data`);
        return;
      }
      
      const key = `${student.college}|${bulkAssessment.assessment_type}|${bulkAssessment.assessment_name}`;
      
      if (!collegeAssessmentGroups[key]) {
        collegeAssessmentGroups[key] = {
          college: student.college,
          assessmentType: bulkAssessment.assessment_type,
          assessmentName: bulkAssessment.assessment_name,
          assignments: []
        };
      }
      
      collegeAssessmentGroups[key].assignments.push(assignment);
    });
    
    console.log(`🎯 Found ${Object.keys(collegeAssessmentGroups).length} unique college-assessment combinations`);
    
    // Process each group
    let successCount = 0;
    let errorCount = 0;
    
    for (const [key, group] of Object.entries(collegeAssessmentGroups)) {
      try {
        console.log(`\n🏫 Processing: ${group.college} - ${group.assessmentName} (${group.assessmentType})`);
        console.log(`   📊 ${group.assignments.length} completed assignments`);
        
        const result = await computeAndStoreCollegeScores(
          group.college,
          group.assessmentType,
          group.assessmentName
        );
        
        if (result.success) {
          console.log(`   ✅ Success: ${result.message}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
          errorCount++;
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Error processing ${key}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Backfill Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📋 Total processed: ${Object.keys(collegeAssessmentGroups).length}`);
    
    // Verify the results
    console.log(`\n🔍 Verifying results...`);
    const { data: collegeScores, error: verifyError } = await supabaseAdmin
      .from('college_scores')
      .select('college_name, assessment_name, assessment_type, last_calculated')
      .order('last_calculated', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
    } else {
      console.log(`✅ Verification complete: ${collegeScores.length} college scores now exist`);
      
      // Show unique assessment names
      const uniqueAssessmentNames = [...new Set(collegeScores.map(score => score.assessment_name))];
      console.log(`📝 Unique assessment names in college_scores:`);
      uniqueAssessmentNames.forEach((name, index) => {
        console.log(`   ${index + 1}. "${name}"`);
      });
    }
    
    console.log(`\n🎉 Backfill process completed!`);
    
  } catch (error) {
    console.error('💥 Backfill process failed:', error);
  }
  
  process.exit(0);
}

// Run the backfill if this script is executed directly
if (require.main === module) {
  backfillCollegeScores();
}

module.exports = { backfillCollegeScores };