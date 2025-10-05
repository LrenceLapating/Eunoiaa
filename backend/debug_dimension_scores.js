const { supabaseAdmin } = require('./config/database');

async function debugDimensionScores() {
  console.log('=== DEBUGGING DIMENSION SCORES ===\n');
  
  const femaleStudentId = 'fe953158-d178-430f-af26-6fc70b2c3b22';
  
  // Fetch the female student's assessment with full scores
  const { data: assessment, error } = await supabaseAdmin
    .from('assessments_42items')
    .select('*')
    .eq('student_id', femaleStudentId)
    .single();
  
  if (error) {
    console.error('❌ Error fetching assessment:', error);
    return;
  }
  
  console.log('👤 Female Student Assessment Data:');
  console.log(`   Student ID: ${assessment.student_id}`);
  console.log(`   Overall Score: ${assessment.overall_score}`);
  console.log(`   Risk Level: ${assessment.risk_level}`);
  console.log(`   At-Risk Dimensions (stored): ${JSON.stringify(assessment.at_risk_dimensions)}`);
  console.log(`   Completed At: ${assessment.completed_at}`);
  
  if (assessment.scores) {
    console.log('\n📊 Individual Dimension Scores:');
    const scores = assessment.scores;
    
    // Define the 42-item Ryff dimensions and their at-risk threshold (<=18)
    const ryffDimensions = [
      'autonomy',
      'environmental_mastery', 
      'personal_growth',
      'positive_relations',
      'purpose_in_life',
      'self_acceptance'
    ];
    
    const atRiskThreshold = 18; // For 42-item assessment
    const actualAtRiskDimensions = [];
    
    ryffDimensions.forEach(dimension => {
      const score = scores[dimension];
      const isAtRisk = score <= atRiskThreshold;
      
      console.log(`   ${dimension}: ${score} ${isAtRisk ? '🔴 AT-RISK' : '✅ OK'}`);
      
      if (isAtRisk) {
        actualAtRiskDimensions.push(dimension);
      }
    });
    
    console.log(`\n🎯 ANALYSIS:`);
    console.log(`   Stored at_risk_dimensions: ${JSON.stringify(assessment.at_risk_dimensions)}`);
    console.log(`   Calculated at-risk dimensions: ${JSON.stringify(actualAtRiskDimensions)}`);
    console.log(`   Should be at-risk: ${actualAtRiskDimensions.length > 0 ? 'YES' : 'NO'}`);
    
    if (actualAtRiskDimensions.length > 0 && (!assessment.at_risk_dimensions || assessment.at_risk_dimensions.length === 0)) {
      console.log(`\n❌ MISMATCH DETECTED!`);
      console.log(`   The student has ${actualAtRiskDimensions.length} at-risk dimensions but the stored at_risk_dimensions field is empty.`);
      console.log(`   This explains why the demographic trends endpoint is not detecting this student as at-risk.`);
    }
  } else {
    console.log('❌ No scores data found in assessment');
  }
  
  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}

// Run the debug
debugDimensionScores().catch(console.error);