// Load environment variables
require('dotenv').config();

const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeRiskDistributionSystem() {
  console.log('🔍 ANALYZING RISK DISTRIBUTION SYSTEM');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check if backend server is accessible
    console.log('\n📡 TEST 1: Backend Server Status');
    try {
      const response = await fetch('http://localhost:3000/health');
      console.log(`✅ Server Status: ${response.status}`);
    } catch (error) {
      console.log('❌ Server appears to be down:', error.message);
      return;
    }
    
    // Test 2: Database connectivity and data availability
    console.log('\n🗄️ TEST 2: Database Data Availability');
    
    // Check students in College of Arts and Sciences
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college, year_level, section')
      .eq('college', 'College of Arts and Sciences')
      .eq('status', 'active');
    
    if (studentsError) {
      console.log('❌ Students query error:', studentsError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} students in 'College of Arts and Sciences'`);
    
    if (!students || students.length === 0) {
      console.log('❌ No students found - Risk Distribution will show zeros');
      return;
    }
    
    // Check 42-item assessments for these students
    const studentIds = students.map(s => s.id);
    const { data: assessments42, error: assessments42Error } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds);
    
    if (assessments42Error) {
      console.log('❌ 42-item assessments query error:', assessments42Error);
      return;
    }
    
    console.log(`✅ Found ${assessments42?.length || 0} 42-item assessments`);
    
    // Check 84-item assessments for these students
    const { data: assessments84, error: assessments84Error } = await supabase
      .from('assessments_84items')
      .select('*')
      .in('student_id', studentIds);
    
    if (assessments84Error) {
      console.log('❌ 84-item assessments query error:', assessments84Error);
      return;
    }
    
    console.log(`✅ Found ${assessments84?.length || 0} 84-item assessments`);
    
    // Test 3: Risk Level Analysis
    console.log('\n📊 TEST 3: Risk Level Distribution Analysis');
    
    const allAssessments = [...(assessments42 || []), ...(assessments84 || [])];
    console.log(`Total assessments to analyze: ${allAssessments.length}`);
    
    if (allAssessments.length === 0) {
      console.log('❌ No assessments found - Risk Distribution will show all zeros');
      return;
    }
    
    const riskDistribution = {
      high: 0,
      moderate: 0,
      low: 0,
      undefined: 0
    };
    
    console.log('\n📋 Individual Assessment Analysis:');
    allAssessments.forEach((assessment, index) => {
      const student = students.find(s => s.id === assessment.student_id);
      console.log(`   ${index + 1}. ${student?.name || 'Unknown'} (${assessment.assessment_type})`);
      console.log(`      Overall Score: ${assessment.overall_score}`);
      console.log(`      Risk Level: ${assessment.risk_level || 'undefined'}`);
      
      if (assessment.risk_level === 'high') {
        riskDistribution.high++;
      } else if (assessment.risk_level === 'moderate') {
        riskDistribution.moderate++;
      } else if (assessment.risk_level === 'low') {
        riskDistribution.low++;
      } else {
        riskDistribution.undefined++;
        console.log(`      ⚠️ Risk level is undefined - will be calculated from score`);
      }
    });
    
    console.log('\n🎯 RISK DISTRIBUTION RESULTS:');
    console.log(`   📈 High Risk (At Risk): ${riskDistribution.high}`);
    console.log(`   📊 Moderate Risk: ${riskDistribution.moderate}`);
    console.log(`   📉 Low Risk (Healthy): ${riskDistribution.low}`);
    console.log(`   ❓ Undefined Risk Level: ${riskDistribution.undefined}`);
    
    // Test 4: Frontend Data Structure Simulation
    console.log('\n🖥️ TEST 4: Frontend Data Structure Simulation');
    
    const frontendSimulatedData = allAssessments.map(assessment => {
      const student = students.find(s => s.id === assessment.student_id);
      return {
        overall_score: assessment.overall_score,
        risk_level: assessment.risk_level,
        assessment_type: assessment.assessment_type,
        student: student,
        assignment: {
          bulk_assessment: {
            assessment_name: assessment.assessment_type === 'ryff_84' ? '84-Item Ryff Assessment' : '42-Item Ryff Assessment',
            assessment_type: assessment.assessment_type
          }
        }
      };
    });
    
    console.log(`✅ Simulated ${frontendSimulatedData.length} frontend data objects`);
    
    // Test 5: Assessment Name Matching (Frontend Logic)
    console.log('\n🔍 TEST 5: Assessment Name Matching Logic');
    
    const testAssessmentNames = [
      '42-Item Ryff Assessment',
      '84-Item Ryff Assessment',
      '42-Item',
      '84-Item',
      'Ryff Assessment'
    ];
    
    testAssessmentNames.forEach(testName => {
      const matches = frontendSimulatedData.filter(item => {
        const assessmentName = item.assignment?.bulk_assessment?.assessment_name;
        return assessmentName && (
          assessmentName === testName ||
          assessmentName.includes(testName) ||
          testName.includes(assessmentName) ||
          (testName.includes('42') && assessmentName.includes('42')) ||
          (testName.includes('84') && assessmentName.includes('84'))
        );
      });
      console.log(`   "${testName}" matches: ${matches.length} assessments`);
    });
    
    // Test 6: Risk Calculation Logic (Frontend Fallback)
    console.log('\n🧮 TEST 6: Risk Calculation Logic (Frontend Fallback)');
    
    let calculatedRiskDistribution = {
      atRisk: 0,
      moderate: 0,
      healthy: 0
    };
    
    frontendSimulatedData.forEach(assessment => {
      let finalRiskLevel = assessment.risk_level;
      
      // Frontend fallback calculation if risk_level is undefined
      if (!finalRiskLevel && assessment.overall_score) {
        const assessmentType = assessment.assessment_type;
        if (assessmentType === 'ryff_42') {
          if (assessment.overall_score <= 111) {
            finalRiskLevel = 'high';
          } else if (assessment.overall_score >= 182) {
            finalRiskLevel = 'low';
          } else {
            finalRiskLevel = 'moderate';
          }
        } else if (assessmentType === 'ryff_84') {
          if (assessment.overall_score <= 223) {
            finalRiskLevel = 'high';
          } else if (assessment.overall_score >= 364) {
            finalRiskLevel = 'low';
          } else {
            finalRiskLevel = 'moderate';
          }
        }
      }
      
      // Categorize based on final risk level
      if (finalRiskLevel === 'high' || finalRiskLevel === 'High' || finalRiskLevel === 'at_risk' || finalRiskLevel === 'At Risk') {
        calculatedRiskDistribution.atRisk++;
      } else if (finalRiskLevel === 'moderate' || finalRiskLevel === 'Moderate' || finalRiskLevel === 'medium' || finalRiskLevel === 'Medium') {
        calculatedRiskDistribution.moderate++;
      } else if (finalRiskLevel === 'low' || finalRiskLevel === 'Low' || finalRiskLevel === 'healthy' || finalRiskLevel === 'Healthy') {
        calculatedRiskDistribution.healthy++;
      }
    });
    
    console.log('\n🎯 FINAL CALCULATED RISK DISTRIBUTION (Frontend Logic):');
    console.log(`   📈 At Risk: ${calculatedRiskDistribution.atRisk}`);
    console.log(`   📊 Moderate: ${calculatedRiskDistribution.moderate}`);
    console.log(`   📉 Healthy: ${calculatedRiskDistribution.healthy}`);
    
    // Test 7: System Health Summary
    console.log('\n🏥 TEST 7: System Health Summary');
    console.log('=' .repeat(60));
    
    const totalStudents = students.length;
    const totalAssessments = allAssessments.length;
    const hasRiskData = calculatedRiskDistribution.atRisk + calculatedRiskDistribution.moderate + calculatedRiskDistribution.healthy > 0;
    
    console.log(`📊 Students in College: ${totalStudents}`);
    console.log(`📊 Total Assessments: ${totalAssessments}`);
    console.log(`📊 Risk Data Available: ${hasRiskData ? '✅ YES' : '❌ NO'}`);
    
    if (hasRiskData) {
      console.log('\n✅ SYSTEM STATUS: HEALTHY');
      console.log('   The Risk Distribution should display correctly in the frontend.');
      console.log(`   Expected display: At Risk: ${calculatedRiskDistribution.atRisk}, Moderate: ${calculatedRiskDistribution.moderate}, Healthy: ${calculatedRiskDistribution.healthy}`);
    } else {
      console.log('\n❌ SYSTEM STATUS: ISSUE DETECTED');
      console.log('   The Risk Distribution will show all zeros.');
      console.log('   Possible causes:');
      console.log('   - No assessment data available');
      console.log('   - Risk levels not calculated properly');
      console.log('   - Assessment name matching issues');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
analyzeRiskDistributionSystem().then(() => {
  console.log('\n🏁 Analysis complete.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Analysis error:', error);
  process.exit(1);
});