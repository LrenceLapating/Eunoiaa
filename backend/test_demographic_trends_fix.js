const { supabaseAdmin } = require('./config/database');

async function testDemographicTrendsFix() {
  console.log('=== TESTING DEMOGRAPHIC TRENDS FIX ===\n');
  
  // Simulate the exact same logic as the demographic trends endpoint
  const year = '2025';
  const assessmentType = '42-item';
  const college = 'all';
  
  // Define school year
  const yearNum = parseInt(year);
  const schoolYear = {
    label: `${yearNum}-${yearNum+1}`,
    startDate: `${yearNum}-08-01`,
    endDate: `${yearNum+1}-07-31`
  };
  
  console.log(`📅 Testing with parameters:`);
  console.log(`   Year: ${schoolYear.label}`);
  console.log(`   Assessment Type: ${assessmentType}`);
  console.log(`   College: ${college}`);
  
  // Step 1: Get active students
  const { data: students, error: studentsError } = await supabaseAdmin
    .from('students')
    .select('id, gender, college')
    .eq('status', 'active');
  
  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
    return;
  }
  
  console.log(`\n👥 Total active students: ${students.length}`);
  
  const studentIds = students.map(s => s.id);
  const targetStudentIds = [
    'fe953158-d178-430f-af26-6fc70b2c3b22', // Female (now fixed)
    '56d978c0-6e83-4715-9a21-7db501e12ec2', // Male 1
    'd04ff552-f21d-4b6b-b0fe-b3843305375e'  // Male 2
  ];
  
  // Step 2: Fetch assessments (same logic as demographicTrends.js)
  const { data: assessments42, error: error42 } = await supabaseAdmin
    .from('assessments_42items')
    .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score')
    .in('student_id', studentIds)
    .gte('completed_at', schoolYear.startDate)
    .lte('completed_at', schoolYear.endDate)
    .not('scores', 'is', null)
    .not('risk_level', 'is', null);
  
  if (error42) {
    console.error('❌ Error fetching assessments:', error42);
    return;
  }
  
  // Add assessment type
  const allAssessments = (assessments42 || []).map(a => ({ ...a, assessment_type: 'ryff_42' }));
  
  console.log(`\n📊 Total assessments found: ${allAssessments.length}`);
  
  // Step 3: Group assessments by student
  const studentAssessments = {};
  allAssessments.forEach(assessment => {
    const studentId = assessment.student_id;
    if (!studentAssessments[studentId]) {
      studentAssessments[studentId] = [];
    }
    studentAssessments[studentId].push(assessment);
  });
  
  // Step 4: Analyze each target student (same logic as demographicTrends.js)
  const RYFF_DIMENSIONS = [
    'autonomy', 'environmental_mastery', 'personal_growth',
    'positive_relations', 'purpose_in_life', 'self_acceptance'
  ];
  
  let totalAtRiskStudents = 0;
  
  console.log(`\n🔍 Analyzing target students:`);
  
  targetStudentIds.forEach(studentId => {
    const student = students.find(s => s.id === studentId);
    const assessments = studentAssessments[studentId] || [];
    
    console.log(`\n👤 Student ${studentId} (${student?.gender || 'Unknown'}):`);
    console.log(`   Assessments: ${assessments.length}`);
    
    if (assessments.length > 0) {
      let hasAtRiskAssessment = false;
      const atRiskDimensionsSet = new Set();
      
      assessments.forEach(assessment => {
        // Same logic as demographicTrends.js
        const isAtRiskByDimensions = assessment.at_risk_dimensions && assessment.at_risk_dimensions.length > 0;
        const isAtRiskByLevel = assessment.risk_level === 'high' || assessment.risk_level === 'at-risk';
        const assessmentType = assessment.assessment_type || 'ryff_42';
        const scoreThreshold = assessmentType === 'ryff_84' ? 223 : 111;
        const isAtRiskByScore = assessment.overall_score && assessment.overall_score <= scoreThreshold;
        
        console.log(`   Assessment ${assessment.id}:`);
        console.log(`     - Overall Score: ${assessment.overall_score}`);
        console.log(`     - Risk Level: ${assessment.risk_level}`);
        console.log(`     - At-Risk Dimensions: ${JSON.stringify(assessment.at_risk_dimensions)}`);
        console.log(`     - Is At-Risk by Dimensions: ${isAtRiskByDimensions}`);
        console.log(`     - Is At-Risk by Level: ${isAtRiskByLevel}`);
        console.log(`     - Is At-Risk by Score (≤${scoreThreshold}): ${isAtRiskByScore}`);
        
        if (isAtRiskByDimensions || isAtRiskByLevel || isAtRiskByScore) {
          hasAtRiskAssessment = true;
          
          if (assessment.at_risk_dimensions && assessment.at_risk_dimensions.length > 0) {
            assessment.at_risk_dimensions.forEach(dimension => {
              atRiskDimensionsSet.add(dimension);
            });
          } else {
            RYFF_DIMENSIONS.forEach(dimension => {
              atRiskDimensionsSet.add(dimension);
            });
          }
        }
      });
      
      console.log(`   📊 RESULT:`);
      console.log(`     - Has At-Risk Assessment: ${hasAtRiskAssessment ? '✅ YES' : '❌ NO'}`);
      console.log(`     - At-Risk Dimensions Count: ${atRiskDimensionsSet.size}`);
      console.log(`     - At-Risk Dimensions: ${Array.from(atRiskDimensionsSet).join(', ')}`);
      
      if (hasAtRiskAssessment) {
        totalAtRiskStudents++;
      }
    } else {
      console.log(`   ❌ No assessments found`);
    }
  });
  
  console.log(`\n🎯 FINAL RESULTS:`);
  console.log(`   Total students analyzed: ${targetStudentIds.length}`);
  console.log(`   Students detected as at-risk: ${totalAtRiskStudents}`);
  console.log(`   Expected at-risk students: 3`);
  
  if (totalAtRiskStudents === 3) {
    console.log(`\n✅ SUCCESS! All 3 students are now correctly detected as at-risk.`);
    console.log(`   The demographic trends endpoint should now show the correct count.`);
  } else {
    console.log(`\n❌ ISSUE: Only ${totalAtRiskStudents} out of 3 students detected as at-risk.`);
    console.log(`   Further investigation may be needed.`);
  }
  
  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}

// Run the test
testDemographicTrendsFix().catch(console.error);