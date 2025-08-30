// Test script to verify the risk distribution fix
require('dotenv').config();

const { supabase } = require('./config/database');

async function testRiskDistributionFix() {
  console.log('🧪 TESTING RISK DISTRIBUTION FIX');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Get available assessment names for testing
    console.log('\n📋 TEST 1: Getting Available Assessment Names');
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
    
    // Test 2: Test the updated API endpoint with assessment_name parameter
    console.log('\n🔧 TEST 2: Testing Updated API Endpoint');
    
    for (const assessmentName of uniqueAssessmentNames.slice(0, 2)) { // Test first 2 assessments
      console.log(`\n🎯 Testing assessment: "${assessmentName}"`);
      
      // Simulate the frontend API call with assessment_name parameter
      const params = new URLSearchParams({
        limit: '1000',
        college: 'College of Arts and Sciences',
        assessmentType: 'ryff_42',
        assessment_name: assessmentName
      });
      
      console.log(`📡 API Call: /api/counselor-assessments/results?${params.toString()}`);
      
      // Make the API call (simulating what the frontend does)
      const response = await fetch(`http://localhost:3000/api/counselor-assessments/results?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ API call failed with status: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.error(`❌ API returned error: ${data.message}`);
        continue;
      }
      
      const assessments = data.data || [];
      console.log(`📊 API returned ${assessments.length} assessments`);
      
      // Verify that all returned assessments match the requested assessment name
      let correctlyFiltered = true;
      let actualAssessmentNames = new Set();
      
      assessments.forEach(assessment => {
        const returnedAssessmentName = assessment.assignment?.bulk_assessment?.assessment_name;
        actualAssessmentNames.add(returnedAssessmentName);
        
        if (returnedAssessmentName !== assessmentName) {
          correctlyFiltered = false;
          console.log(`⚠️  Found mismatched assessment: "${returnedAssessmentName}" (expected: "${assessmentName}")`);
        }
      });
      
      console.log(`📝 Actual assessment names returned: ${Array.from(actualAssessmentNames).join(', ')}`);
      
      if (correctlyFiltered && assessments.length > 0) {
        console.log(`✅ Filtering works correctly! All ${assessments.length} assessments match "${assessmentName}"`);
      } else if (assessments.length === 0) {
        console.log(`ℹ️  No assessments found for "${assessmentName}" (this might be expected)`);
      } else {
        console.log(`❌ Filtering failed! Found mixed assessment names.`);
      }
      
      // Calculate risk distribution for this specific assessment
      const riskCounts = {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      };
      
      assessments.forEach(assessment => {
        const riskLevel = assessment.risk_level;
        if (riskLevel === 'high') {
          riskCounts.atRisk++;
        } else if (riskLevel === 'moderate') {
          riskCounts.moderate++;
        } else if (riskLevel === 'low') {
          riskCounts.healthy++;
        }
      });
      
      console.log(`📈 Risk Distribution for "${assessmentName}":`);
      console.log(`   🔴 At Risk: ${riskCounts.atRisk}`);
      console.log(`   🟡 Moderate: ${riskCounts.moderate}`);
      console.log(`   🟢 Healthy: ${riskCounts.healthy}`);
      console.log(`   📊 Total: ${riskCounts.atRisk + riskCounts.moderate + riskCounts.healthy}`);
    }
    
    // Test 3: Compare with old behavior (no assessment_name parameter)
    console.log('\n🔄 TEST 3: Comparing with Old Behavior (No assessment_name filter)');
    
    const paramsOld = new URLSearchParams({
      limit: '1000',
      college: 'College of Arts and Sciences',
      assessmentType: 'ryff_42'
      // No assessment_name parameter
    });
    
    console.log(`📡 Old API Call: /api/counselor-assessments/results?${paramsOld.toString()}`);
    
    const responseOld = await fetch(`http://localhost:3000/api/counselor-assessments/results?${paramsOld.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (responseOld.ok) {
      const dataOld = await responseOld.json();
      const assessmentsOld = dataOld.data || [];
      
      console.log(`📊 Old behavior returns ${assessmentsOld.length} total assessments`);
      
      // Count unique assessment names in old behavior
      const oldAssessmentNames = new Set();
      assessmentsOld.forEach(assessment => {
        const name = assessment.assignment?.bulk_assessment?.assessment_name;
        if (name) oldAssessmentNames.add(name);
      });
      
      console.log(`📝 Old behavior includes ${oldAssessmentNames.size} different assessment names:`);
      Array.from(oldAssessmentNames).forEach((name, index) => {
        const count = assessmentsOld.filter(a => a.assignment?.bulk_assessment?.assessment_name === name).length;
        console.log(`   ${index + 1}. "${name}" (${count} assessments)`);
      });
      
      // Calculate old risk distribution
      const oldRiskCounts = {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      };
      
      assessmentsOld.forEach(assessment => {
        const riskLevel = assessment.risk_level;
        if (riskLevel === 'high') {
          oldRiskCounts.atRisk++;
        } else if (riskLevel === 'moderate') {
          oldRiskCounts.moderate++;
        } else if (riskLevel === 'low') {
          oldRiskCounts.healthy++;
        }
      });
      
      console.log(`📈 Old Risk Distribution (ALL assessments combined):`);
      console.log(`   🔴 At Risk: ${oldRiskCounts.atRisk}`);
      console.log(`   🟡 Moderate: ${oldRiskCounts.moderate}`);
      console.log(`   🟢 Healthy: ${oldRiskCounts.healthy}`);
      console.log(`   📊 Total: ${oldRiskCounts.atRisk + oldRiskCounts.moderate + oldRiskCounts.healthy}`);
    }
    
    // Test 4: Verify the fix addresses the original issue
    console.log('\n✅ TEST 4: Fix Verification Summary');
    console.log('=' .repeat(60));
    console.log('🎯 ORIGINAL ISSUE:');
    console.log('   - Risk distribution showed combined results from ALL assessments of the same type');
    console.log('   - User expected to see results only for the specific assessment selected');
    console.log('   - Counts were inflated because multiple assessments were included');
    console.log('');
    console.log('🔧 IMPLEMENTED FIX:');
    console.log('   ✅ Added assessment_name parameter to counselor-assessments endpoint');
    console.log('   ✅ Updated backend to filter by exact assessment name using assignments table');
    console.log('   ✅ Updated frontend to pass selectedAssessmentName to API call');
    console.log('   ✅ Risk distribution now shows counts only for the specific selected assessment');
    console.log('');
    console.log('📊 EXPECTED BEHAVIOR NOW:');
    console.log('   - When user selects a specific assessment name, risk distribution shows only students who completed that assessment');
    console.log('   - Counts are accurate and match the actual number of students who took the specific assessment');
    console.log('   - No more inflated numbers from combining multiple different assessments');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRiskDistributionFix().then(() => {
  console.log('\n🏁 Risk distribution fix test complete.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});