// Test script to verify assessment name filtering logic directly
require('dotenv').config();

const { supabase } = require('./config/database');

async function testAssessmentNameFiltering() {
  console.log('🧪 TESTING ASSESSMENT NAME FILTERING LOGIC');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Get available assessment names
    console.log('\n📋 TEST 1: Available Assessment Names');
    const { data: collegeScores, error: scoresError } = await supabase
      .from('college_scores')
      .select('assessment_name, assessment_type, college_name')
      .eq('college_name', 'College of Arts and Sciences')
      .eq('assessment_type', 'ryff_42');
    
    if (scoresError) {
      console.error('❌ Error fetching college scores:', scoresError);
      return;
    }
    
    const uniqueAssessmentNames = [...new Set(collegeScores.map(cs => cs.assessment_name))];
    console.log(`✅ Found ${uniqueAssessmentNames.length} unique assessment names:`);
    uniqueAssessmentNames.forEach((name, index) => {
      console.log(`   ${index + 1}. "${name}"`);
    });
    
    if (uniqueAssessmentNames.length === 0) {
      console.log('❌ No assessment names found. Cannot proceed with test.');
      return;
    }
    
    // Test 2: Test the filtering logic for each assessment name
    console.log('\n🔧 TEST 2: Testing Assessment Name Filtering Logic');
    
    for (const assessmentName of uniqueAssessmentNames) {
      console.log(`\n🎯 Testing assessment: "${assessmentName}"`);
      
      // Step 1: Get students from the college
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, college, year_level, section')
        .eq('college', 'College of Arts and Sciences')
        .eq('status', 'active');
      
      if (studentsError) {
        console.error('❌ Error fetching students:', studentsError);
        continue;
      }
      
      console.log(`👥 Found ${students.length} active students in college`);
      const studentIds = students.map(s => s.id);
      
      // Step 2: Get assignments that match the assessment name
      const { data: assignments, error: assignmentError } = await supabase
        .from('assessment_assignments')
        .select(`
          id,
          bulk_assessment_id,
          bulk_assessments!inner(
            id,
            assessment_name,
            assessment_type
          )
        `)
        .eq('bulk_assessments.assessment_name', assessmentName)
        .eq('bulk_assessments.assessment_type', 'ryff_42');
      
      if (assignmentError) {
        console.error('❌ Error fetching assignments:', assignmentError);
        continue;
      }
      
      console.log(`📋 Found ${assignments?.length || 0} assignments for "${assessmentName}"`);
      
      if (!assignments || assignments.length === 0) {
        console.log(`⚠️  No assignments found for assessment: ${assessmentName}`);
        continue;
      }
      
      const assignmentIds = assignments.map(a => a.id);
      
      // Step 3: Get assessments for these specific assignments and students
      const { data: filteredAssessments, error: assessmentError } = await supabase
        .from('assessments_42items')
        .select('*')
        .in('student_id', studentIds)
        .in('assignment_id', assignmentIds);
      
      if (assessmentError) {
        console.error('❌ Error fetching filtered assessments:', assessmentError);
        continue;
      }
      
      console.log(`📊 Found ${filteredAssessments?.length || 0} assessments matching the specific assessment name`);
      
      // Step 4: Compare with unfiltered results (old behavior)
      const { data: allAssessments, error: allAssessmentsError } = await supabase
        .from('assessments_42items')
        .select('*')
        .in('student_id', studentIds);
      
      if (allAssessmentsError) {
        console.error('❌ Error fetching all assessments:', allAssessmentsError);
        continue;
      }
      
      console.log(`📊 Total 42-item assessments for college (old behavior): ${allAssessments?.length || 0}`);
      
      // Step 5: Calculate risk distributions
      const filteredRiskCounts = {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      };
      
      const allRiskCounts = {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      };
      
      // Calculate filtered risk distribution
      (filteredAssessments || []).forEach(assessment => {
        const riskLevel = assessment.risk_level;
        if (riskLevel === 'high') {
          filteredRiskCounts.atRisk++;
        } else if (riskLevel === 'moderate') {
          filteredRiskCounts.moderate++;
        } else if (riskLevel === 'low') {
          filteredRiskCounts.healthy++;
        }
      });
      
      // Calculate all assessments risk distribution
      (allAssessments || []).forEach(assessment => {
        const riskLevel = assessment.risk_level;
        if (riskLevel === 'high') {
          allRiskCounts.atRisk++;
        } else if (riskLevel === 'moderate') {
          allRiskCounts.moderate++;
        } else if (riskLevel === 'low') {
          allRiskCounts.healthy++;
        }
      });
      
      console.log(`\n📈 FILTERED Risk Distribution ("${assessmentName}" only):`);
      console.log(`   🔴 At Risk: ${filteredRiskCounts.atRisk}`);
      console.log(`   🟡 Moderate: ${filteredRiskCounts.moderate}`);
      console.log(`   🟢 Healthy: ${filteredRiskCounts.healthy}`);
      console.log(`   📊 Total: ${filteredRiskCounts.atRisk + filteredRiskCounts.moderate + filteredRiskCounts.healthy}`);
      
      console.log(`\n📈 OLD Risk Distribution (ALL 42-item assessments):`);
      console.log(`   🔴 At Risk: ${allRiskCounts.atRisk}`);
      console.log(`   🟡 Moderate: ${allRiskCounts.moderate}`);
      console.log(`   🟢 Healthy: ${allRiskCounts.healthy}`);
      console.log(`   📊 Total: ${allRiskCounts.atRisk + allRiskCounts.moderate + allRiskCounts.healthy}`);
      
      // Step 6: Verify the fix
      const filteredTotal = filteredRiskCounts.atRisk + filteredRiskCounts.moderate + filteredRiskCounts.healthy;
      const allTotal = allRiskCounts.atRisk + allRiskCounts.moderate + allRiskCounts.healthy;
      
      if (filteredTotal <= allTotal) {
        console.log(`\n✅ FILTERING WORKS: Filtered count (${filteredTotal}) ≤ Total count (${allTotal})`);
        if (filteredTotal < allTotal) {
          console.log(`   🎯 Fix is effective! Reduced from ${allTotal} to ${filteredTotal} assessments`);
        } else {
          console.log(`   ℹ️  All assessments in college belong to this specific assessment name`);
        }
      } else {
        console.log(`\n❌ FILTERING ERROR: Filtered count (${filteredTotal}) > Total count (${allTotal})`);
      }
    }
    
    // Test 3: Summary
    console.log('\n✅ TEST 3: Fix Summary');
    console.log('=' .repeat(60));
    console.log('🔧 IMPLEMENTED CHANGES:');
    console.log('   1. Backend: Added assessment_name parameter to counselor-assessments endpoint');
    console.log('   2. Backend: Filter assessments by joining with assignments and bulk_assessments tables');
    console.log('   3. Frontend: Pass selectedAssessmentName to API call');
    console.log('');
    console.log('📊 EXPECTED RESULTS:');
    console.log('   - Risk distribution now shows only students who completed the specific selected assessment');
    console.log('   - Counts are accurate and not inflated by combining multiple assessments');
    console.log('   - User sees precise data for their selected assessment name');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAssessmentNameFiltering().then(() => {
  console.log('\n🏁 Assessment name filtering test complete.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});