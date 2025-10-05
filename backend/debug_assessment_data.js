const { supabaseAdmin } = require('./config/database');

async function debugAssessmentData() {
  console.log('=== DEBUGGING ASSESSMENT DATA ===\n');
  
  // Student IDs from the logs
  const studentIds = [
    'fe953158-d178-430f-af26-6fc70b2c3b22', // Female - showing as NOT at-risk
    '56d978c0-6e83-4715-9a21-7db501e12ec2', // Male - showing as at-risk (purpose_in_life)
    'd04ff552-f21d-4b6b-b0fe-b3843305375e'  // Male - showing as at-risk (autonomy)
  ];
  
  for (const studentId of studentIds) {
    console.log(`\n🔍 Checking student: ${studentId}`);
    
    // Get student info
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, name, gender, college')
      .eq('id', studentId)
      .single();
    
    if (studentError) {
      console.error('❌ Error fetching student:', studentError);
      continue;
    }
    
    console.log(`👤 Student: ${student.name} (${student.gender}) - ${student.college}`);
    
    // Check 42-item assessments
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select(`
        id,
        assessment_type,
        overall_score,
        risk_level,
        at_risk_dimensions,
        scores,
        completed_at
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });
    
    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42);
    } else {
      console.log(`📊 42-item assessments: ${assessments42?.length || 0}`);
      
      if (assessments42 && assessments42.length > 0) {
        assessments42.forEach((assessment, index) => {
          console.log(`  Assessment ${index + 1}:`);
          console.log(`    - ID: ${assessment.id}`);
          console.log(`    - Overall Score: ${assessment.overall_score}`);
          console.log(`    - Risk Level: ${assessment.risk_level}`);
          console.log(`    - At-Risk Dimensions: ${JSON.stringify(assessment.at_risk_dimensions)}`);
          console.log(`    - Completed: ${assessment.completed_at}`);
          
          // Check individual dimension scores
          if (assessment.scores) {
            console.log(`    - Individual Scores:`);
            Object.entries(assessment.scores).forEach(([dimension, score]) => {
              const isAtRisk = score <= 18; // 42-item threshold
              console.log(`      ${dimension}: ${score} ${isAtRisk ? '(AT-RISK)' : '(OK)'}`);
            });
          }
          
          // Manual at-risk check
          const isAtRiskByDimensions = assessment.at_risk_dimensions && assessment.at_risk_dimensions.length > 0;
          const isAtRiskByLevel = assessment.risk_level === 'high' || assessment.risk_level === 'at-risk';
          const isAtRiskByScore = assessment.overall_score && assessment.overall_score <= 111;
          
          console.log(`    - Manual Check:`);
          console.log(`      By Dimensions: ${isAtRiskByDimensions}`);
          console.log(`      By Level: ${isAtRiskByLevel}`);
          console.log(`      By Score (≤111): ${isAtRiskByScore}`);
          console.log(`      SHOULD BE AT-RISK: ${isAtRiskByDimensions || isAtRiskByLevel || isAtRiskByScore}`);
        });
      }
    }
    
    // Check 84-item assessments
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select(`
        id,
        assessment_type,
        overall_score,
        risk_level,
        at_risk_dimensions,
        scores,
        completed_at
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });
    
    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84);
    } else {
      console.log(`📊 84-item assessments: ${assessments84?.length || 0}`);
      
      if (assessments84 && assessments84.length > 0) {
        assessments84.forEach((assessment, index) => {
          console.log(`  Assessment ${index + 1}:`);
          console.log(`    - ID: ${assessment.id}`);
          console.log(`    - Overall Score: ${assessment.overall_score}`);
          console.log(`    - Risk Level: ${assessment.risk_level}`);
          console.log(`    - At-Risk Dimensions: ${JSON.stringify(assessment.at_risk_dimensions)}`);
          console.log(`    - Completed: ${assessment.completed_at}`);
          
          // Manual at-risk check for 84-item
          const isAtRiskByDimensions = assessment.at_risk_dimensions && assessment.at_risk_dimensions.length > 0;
          const isAtRiskByLevel = assessment.risk_level === 'high' || assessment.risk_level === 'at-risk';
          const isAtRiskByScore = assessment.overall_score && assessment.overall_score <= 223;
          
          console.log(`    - Manual Check:`);
          console.log(`      By Dimensions: ${isAtRiskByDimensions}`);
          console.log(`      By Level: ${isAtRiskByLevel}`);
          console.log(`      By Score (≤223): ${isAtRiskByScore}`);
          console.log(`      SHOULD BE AT-RISK: ${isAtRiskByDimensions || isAtRiskByLevel || isAtRiskByScore}`);
        });
      }
    }
    
    console.log('─'.repeat(80));
  }
  
  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}

// Run the debug
debugAssessmentData().catch(console.error);