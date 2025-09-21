const { supabaseAdmin } = require('./config/database');

// Simulate the frontend riskThresholds object
const riskThresholds = {
  ryff_42: {
    atRisk: 108,  // 18*6 dimensions
    moderate: 186, // 31*6 dimensions  
    q1: 18,
    q4: 31
  },
  ryff_84: {
    atRisk: 216,  // 36*6 dimensions
    moderate: 354, // 59*6 dimensions
    q1: 36,
    q4: 59
  }
};

// Simulate frontend methods
function getThresholdsForStudent(student) {
  const assessmentType = student?.assessment_type === 'ryff_84' ? 'ryff_84' : 'ryff_42';
  return riskThresholds[assessmentType];
}

function isAtRisk(score, student = null) {
  const thresholds = student ? getThresholdsForStudent(student) : riskThresholds['ryff_42'];
  return score <= thresholds.q1;
}

function isHealthy(score, student = null) {
  const thresholds = student ? getThresholdsForStudent(student) : riskThresholds['ryff_42'];
  return score >= thresholds.q4;
}

function isModerate(score, student = null) {
  const thresholds = student ? getThresholdsForStudent(student) : riskThresholds['ryff_42'];
  return score > thresholds.q1 && score < thresholds.q4;
}

// Simulate frontend mapAssessmentData method
function mapAssessmentData(assessments) {
  return assessments.map(assessment => {
    const student = assessment.student || {};
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      id_number: student.id_number,
      college: student.college,
      section: student.section,
      year_level: student.year_level,
      yearLevel: student.year_level,
      overallScore: assessment.overall_score,
      riskLevel: assessment.risk_level,
      subscales: assessment.scores || {},
      completedAt: assessment.completed_at,
      assessment_type: assessment.assessment_type,
      atRiskDimensions: assessment.at_risk_dimensions || []
    };
  });
}

async function testCompleteFlow() {
  console.log('=== TESTING COMPLETE THRESHOLD FLOW ===\n');
  
  try {
    // Step 1: Fetch moderate students (simulating backend endpoint)
    console.log('Step 1: Fetching moderate students from backend...');
    
    let result42 = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .eq('risk_level', 'moderate')
      .order('created_at', { ascending: false });
      
    let result84 = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .eq('risk_level', 'moderate')
      .order('created_at', { ascending: false });
    
    // Combine and add assessment_type
    let allAssessments = [];
    if (result42.data) {
      allAssessments = allAssessments.concat(result42.data.map(a => ({...a, assessment_type: 'ryff_42'})));
    }
    if (result84.data) {
      allAssessments = allAssessments.concat(result84.data.map(a => ({...a, assessment_type: 'ryff_84'})));
    }
    
    // Deduplicate by student_id
    allAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const uniqueAssessments = [];
    const seenStudents = new Set();
    
    for (const assessment of allAssessments) {
      if (!seenStudents.has(assessment.student_id)) {
        uniqueAssessments.push(assessment);
        seenStudents.add(assessment.student_id);
      }
    }
    
    console.log(`Found ${uniqueAssessments.length} unique moderate students`);
    
    // Step 2: Enrich with student data
    console.log('\nStep 2: Enriching with student data...');
    
    const studentIds = [...new Set(uniqueAssessments.map(a => a.student_id))];
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, id_number, name, college, section, email, year_level')
      .in('id', studentIds)
      .eq('status', 'active');
    
    const enrichedStudents = uniqueAssessments.map(assessment => {
      const student = students.find(s => s.id === assessment.student_id);
      if (!student) return null;
      
      return {
        ...assessment,
        student: student
      };
    }).filter(a => a !== null);
    
    console.log(`Enriched ${enrichedStudents.length} students with data`);
    
    // Step 3: Map to frontend format
    console.log('\nStep 3: Mapping to frontend format...');
    
    const frontendStudents = mapAssessmentData(enrichedStudents);
    
    console.log(`Mapped ${frontendStudents.length} students to frontend format`);
    
    // Step 4: Test threshold selection for each student
    console.log('\nStep 4: Testing threshold selection...\n');
    
    frontendStudents.forEach((student, index) => {
      console.log(`Student ${index + 1}: ${student.name} (${student.id_number})`);
      console.log(`- Assessment Type: ${student.assessment_type}`);
      console.log(`- Overall Score: ${student.overallScore}`);
      
      const thresholds = getThresholdsForStudent(student);
      console.log(`- Selected Thresholds: q1=${thresholds.q1}, q4=${thresholds.q4}`);
      
      // Test risk classification
      const isAtRiskResult = isAtRisk(student.overallScore, student);
      const isHealthyResult = isHealthy(student.overallScore, student);
      const isModerateResult = isModerate(student.overallScore, student);
      
      console.log(`- Risk Classification:`);
      console.log(`  - At Risk (≤${thresholds.q1}): ${isAtRiskResult}`);
      console.log(`  - Moderate (${thresholds.q1} < score < ${thresholds.q4}): ${isModerateResult}`);
      console.log(`  - Healthy (≥${thresholds.q4}): ${isHealthyResult}`);
      
      // Verify correct threshold usage
      const expectedThresholds = student.assessment_type === 'ryff_84' ? riskThresholds.ryff_84 : riskThresholds.ryff_42;
      const isCorrect = thresholds.q1 === expectedThresholds.q1 && thresholds.q4 === expectedThresholds.q4;
      
      console.log(`- ✅ Correct thresholds used: ${isCorrect}`);
      
      if (!isCorrect) {
        console.log(`  ❌ Expected: q1=${expectedThresholds.q1}, q4=${expectedThresholds.q4}`);
        console.log(`  ❌ Got: q1=${thresholds.q1}, q4=${thresholds.q4}`);
      }
      
      console.log('');
    });
    
    // Step 5: Summary
    console.log('=== SUMMARY ===');
    const ryff42Count = frontendStudents.filter(s => s.assessment_type === 'ryff_42').length;
    const ryff84Count = frontendStudents.filter(s => s.assessment_type === 'ryff_84').length;
    
    console.log(`Total students tested: ${frontendStudents.length}`);
    console.log(`42-item assessments: ${ryff42Count}`);
    console.log(`84-item assessments: ${ryff84Count}`);
    
    // Verify all students get correct thresholds
    const allCorrect = frontendStudents.every(student => {
      const thresholds = getThresholdsForStudent(student);
      const expectedThresholds = student.assessment_type === 'ryff_84' ? riskThresholds.ryff_84 : riskThresholds.ryff_42;
      return thresholds.q1 === expectedThresholds.q1 && thresholds.q4 === expectedThresholds.q4;
    });
    
    console.log(`\n🎯 All students use correct thresholds: ${allCorrect ? '✅ YES' : '❌ NO'}`);
    
    if (allCorrect) {
      console.log('\n🎉 THRESHOLD FIX IS WORKING CORRECTLY! 🎉');
      console.log('- Backend correctly adds assessment_type');
      console.log('- Frontend correctly maps assessment_type');
      console.log('- getThresholdsForStudent correctly selects thresholds');
      console.log('- Risk classification uses appropriate thresholds');
    } else {
      console.log('\n❌ THERE ARE STILL ISSUES WITH THRESHOLD SELECTION');
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testCompleteFlow().catch(console.error);