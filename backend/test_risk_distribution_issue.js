// Test script to demonstrate the risk distribution issue
require('dotenv').config();

const { supabase } = require('./config/database');

async function testRiskDistributionIssue() {
  console.log('🔍 TESTING RISK DISTRIBUTION ISSUE');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Get all assessment names for College of Arts and Sciences
    console.log('\n📋 TEST 1: Available Assessment Names');
    const { data: collegeScores, error: scoresError } = await supabase
      .from('college_scores')
      .select('assessment_name, assessment_type')
      .eq('college_name', 'College of Arts and Sciences')
      .eq('assessment_type', 'ryff_42');
    
    if (scoresError) {
      console.error('❌ Error fetching college scores:', scoresError);
      return;
    }
    
    const uniqueAssessmentNames = [...new Set(collegeScores.map(cs => cs.assessment_name))];
    console.log(`✅ Found ${uniqueAssessmentNames.length} unique 42-item assessment names:`);
    uniqueAssessmentNames.forEach((name, index) => {
      console.log(`   ${index + 1}. "${name}"`);
    });
    
    // Test 2: For each assessment name, count actual students who completed it
    console.log('\n📊 TEST 2: Actual Student Counts per Assessment');
    
    for (const assessmentName of uniqueAssessmentNames) {
      console.log(`\n🔍 Testing assessment: "${assessmentName}"`);
      
      // Get students from college
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, college')
        .eq('college', 'College of Arts and Sciences')
        .eq('status', 'active');
      
      if (studentsError) {
        console.error('❌ Error fetching students:', studentsError);
        continue;
      }
      
      const studentIds = students.map(s => s.id);
      
      // Get assessments for these students
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments_42items')
        .select('*')
        .in('student_id', studentIds);
      
      if (assessmentsError) {
        console.error('❌ Error fetching assessments:', assessmentsError);
        continue;
      }
      
      // Filter assessments that match this specific assessment name
      // This is the key issue - we need to match by actual assessment name, not just type
      const matchingAssessments = assessments.filter(assessment => {
        // For now, we can't directly match by assessment name because it's not stored in assessments table
        // This is part of the problem - we need to join with assignments/bulk_assessments
        return true; // This will include ALL 42-item assessments
      });
      
      console.log(`   📈 Students in college: ${students.length}`);
      console.log(`   📊 Total 42-item assessments: ${assessments.length}`);
      console.log(`   🎯 Assessments for "${assessmentName}": ${matchingAssessments.length}`);
      
      // Calculate risk distribution for this specific assessment
      const riskCounts = {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      };
      
      matchingAssessments.forEach(assessment => {
        const riskLevel = assessment.risk_level;
        if (riskLevel === 'high') {
          riskCounts.atRisk++;
        } else if (riskLevel === 'moderate') {
          riskCounts.moderate++;
        } else if (riskLevel === 'low') {
          riskCounts.healthy++;
        }
      });
      
      console.log(`   🔴 At Risk: ${riskCounts.atRisk}`);
      console.log(`   🟡 Moderate: ${riskCounts.moderate}`);
      console.log(`   🟢 Healthy: ${riskCounts.healthy}`);
      
      const total = riskCounts.atRisk + riskCounts.moderate + riskCounts.healthy;
      console.log(`   📊 Total Risk Distribution: ${total}`);
      
      if (total !== matchingAssessments.length) {
        console.log(`   ⚠️  WARNING: Risk distribution total (${total}) doesn't match assessment count (${matchingAssessments.length})`);
      }
    }
    
    // Test 3: Demonstrate the current frontend behavior
    console.log('\n🖥️ TEST 3: Current Frontend Behavior Simulation');
    console.log('This simulates what happens when user selects a specific assessment name...');
    
    const testAssessmentName = uniqueAssessmentNames[0]; // Use first assessment name
    console.log(`\n🎯 User selects: "${testAssessmentName}"`);
    
    // Simulate the current frontend logic
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, name, college')
      .eq('college', 'College of Arts and Sciences')
      .eq('status', 'active');
    
    const { data: allAssessments } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', allStudents.map(s => s.id));
    
    // Current frontend filtering logic (the problematic part)
    const frontendFilteredAssessments = allAssessments.filter(assessment => {
      // This is the current logic that causes the issue
      const backendAssessmentName = '42-Item Ryff Assessment'; // This is hardcoded in frontend
      const selectedName = testAssessmentName;
      
      // The problematic matching logic
      return backendAssessmentName === selectedName || 
             backendAssessmentName.includes(selectedName) || 
             selectedName.includes(backendAssessmentName) ||
             (backendAssessmentName.includes('42-Item') && selectedName.includes('42'));
    });
    
    console.log(`   📊 Frontend would show: ${frontendFilteredAssessments.length} assessments`);
    console.log(`   ❌ Problem: This includes ALL 42-item assessments, not just the specific one selected`);
    
    // Calculate what frontend would show
    const frontendRiskCounts = {
      atRisk: 0,
      moderate: 0,
      healthy: 0
    };
    
    frontendFilteredAssessments.forEach(assessment => {
      const riskLevel = assessment.risk_level;
      if (riskLevel === 'high') {
        frontendRiskCounts.atRisk++;
      } else if (riskLevel === 'moderate') {
        frontendRiskCounts.moderate++;
      } else if (riskLevel === 'low') {
        frontendRiskCounts.healthy++;
      }
    });
    
    console.log(`   🔴 Frontend shows At Risk: ${frontendRiskCounts.atRisk}`);
    console.log(`   🟡 Frontend shows Moderate: ${frontendRiskCounts.moderate}`);
    console.log(`   🟢 Frontend shows Healthy: ${frontendRiskCounts.healthy}`);
    
    // Test 4: Show the solution approach
    console.log('\n💡 TEST 4: Solution Approach');
    console.log('To fix this, we need to:');
    console.log('1. Add assessment_name parameter to counselor-assessments endpoint');
    console.log('2. Join with assignments/bulk_assessments to get actual assessment names');
    console.log('3. Filter by exact assessment name match');
    console.log('4. Update frontend to pass the selected assessment name to the API');
    
    console.log('\n🎯 SUMMARY OF THE ISSUE:');
    console.log('=' .repeat(60));
    console.log('❌ Current Problem:');
    console.log('   - Frontend fetches ALL assessments of the same type (42-item or 84-item)');
    console.log('   - Risk distribution shows combined results from multiple different assessments');
    console.log('   - User expects to see results only for the specific assessment they selected');
    console.log('\n✅ Required Solution:');
    console.log('   - Filter assessments by exact assessment name, not just assessment type');
    console.log('   - Update API to support assessment_name parameter');
    console.log('   - Ensure risk distribution reflects only students who completed the specific assessment');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRiskDistributionIssue().then(() => {
  console.log('\n🏁 Test complete.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});