const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function finalRiskDistributionTest() {
  console.log('=== FINAL RISK DISTRIBUTION TEST ===\n');
  
  try {
    // Test 1: Verify students in College of Arts and Sciences
    console.log('🎯 TEST 1: Students in College of Arts and Sciences');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college')
      .eq('college', 'College of Arts and Sciences')
      .eq('status', 'active');
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} students`);
    students?.slice(0, 3).forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.id})`);
    });
    
    if (!students || students.length === 0) {
      console.log('❌ No students found - cannot proceed with test');
      return;
    }
    
    const studentIds = students.map(s => s.id);
    
    // Test 2: Verify assessments for these students
    console.log('\n🎯 TEST 2: Assessments for these students');
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds);
    
    if (assessmentsError) {
      console.error('❌ Error fetching assessments:', assessmentsError);
      return;
    }
    
    console.log(`✅ Found ${assessments?.length || 0} assessments`);
    
    if (!assessments || assessments.length === 0) {
      console.log('❌ No assessments found - Risk Distribution will show all zeros');
      return;
    }
    
    // Test 3: Analyze risk distribution
    console.log('\n🎯 TEST 3: Risk Distribution Analysis');
    const riskDistribution = {
      atRisk: 0,    // high risk
      moderate: 0,  // moderate risk
      healthy: 0    // low risk
    };
    
    console.log('\n📊 Individual Assessment Analysis:');
    assessments.forEach((assessment, index) => {
      console.log(`   ${index + 1}. Student: ${assessment.student_id.substring(0, 8)}...`);
      console.log(`      Overall Score: ${assessment.overall_score}`);
      console.log(`      Risk Level: ${assessment.risk_level}`);
      
      if (assessment.risk_level === 'high') {
        riskDistribution.atRisk++;
      } else if (assessment.risk_level === 'moderate') {
        riskDistribution.moderate++;
      } else if (assessment.risk_level === 'low') {
        riskDistribution.healthy++;
      }
    });
    
    console.log('\n🎯 FINAL RISK DISTRIBUTION RESULTS:');
    console.log(`   📈 At Risk (High): ${riskDistribution.atRisk}`);
    console.log(`   📊 Moderate: ${riskDistribution.moderate}`);
    console.log(`   📉 Healthy (Low): ${riskDistribution.healthy}`);
    
    // Test 4: Simulate frontend data structure
    console.log('\n🎯 TEST 4: Frontend Data Structure Simulation');
    const frontendData = assessments.map(assessment => {
      const student = students.find(s => s.id === assessment.student_id);
      return {
        overall_score: assessment.overall_score,
        risk_level: assessment.risk_level,
        student: student,
        assignment: {
          bulk_assessment: {
            assessment_name: '42-Item Ryff Assessment'
          }
        }
      };
    });
    
    console.log(`✅ Created ${frontendData.length} frontend data objects`);
    
    // Test 5: Verify assessment name matching
    console.log('\n🎯 TEST 5: Assessment Name Matching Test');
    const assessmentNames = ['42-Item Ryff Assessment', '42-Item', 'Ryff Assessment'];
    
    assessmentNames.forEach(testName => {
      const matches = frontendData.filter(item => {
        const assessmentName = item.assignment?.bulk_assessment?.assessment_name;
        return assessmentName && (
          assessmentName === testName ||
          assessmentName.includes(testName) ||
          testName.includes('42-Item') && assessmentName.includes('42-Item')
        );
      });
      console.log(`   "${testName}" matches: ${matches.length} assessments`);
    });
    
    // Test 6: Expected frontend behavior
    console.log('\n🎯 TEST 6: Expected Frontend Behavior');
    console.log('When you select "College of Arts and Sciences" and "42-Item Ryff Assessment":');
    console.log(`   - fetchRiskDistribution should find ${frontendData.length} assessments`);
    console.log(`   - Risk distribution should show:`);
    console.log(`     * At Risk: ${riskDistribution.atRisk}`);
    console.log(`     * Moderate: ${riskDistribution.moderate}`);
    console.log(`     * Healthy: ${riskDistribution.healthy}`);
    
    if (riskDistribution.atRisk === 0 && riskDistribution.moderate === 0 && riskDistribution.healthy === 0) {
      console.log('\n❌ WARNING: All risk counts are zero - this indicates a data or logic issue');
    } else {
      console.log('\n✅ SUCCESS: Risk distribution data is available and should display correctly');
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

finalRiskDistributionTest();