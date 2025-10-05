const { supabaseAdmin } = require('./config/database');
const riskLevelService = require('./services/riskLevelService');

async function fixMissingDimensions() {
  console.log('=== FIXING MISSING AT-RISK DIMENSIONS ===\n');
  
  const femaleStudentId = 'fe953158-d178-430f-af26-6fc70b2c3b22';
  
  // Step 1: Get the current assessment data
  console.log('📊 Fetching current assessment data...');
  const { data: assessment, error } = await supabaseAdmin
    .from('assessments_42items')
    .select('*')
    .eq('student_id', femaleStudentId)
    .single();
  
  if (error) {
    console.error('❌ Error fetching assessment:', error);
    return;
  }
  
  console.log('👤 Current Assessment Data:');
  console.log(`   Student ID: ${assessment.student_id}`);
  console.log(`   Assessment ID: ${assessment.id}`);
  console.log(`   Overall Score: ${assessment.overall_score}`);
  console.log(`   Risk Level: ${assessment.risk_level}`);
  console.log(`   At-Risk Dimensions (before): ${JSON.stringify(assessment.at_risk_dimensions)}`);
  
  // Step 2: Calculate what the at-risk dimensions should be
  if (assessment.scores) {
    const scores = assessment.scores;
    const ryffDimensions = [
      'autonomy',
      'environmental_mastery', 
      'personal_growth',
      'positive_relations',
      'purpose_in_life',
      'self_acceptance'
    ];
    
    const atRiskThreshold = 18;
    const expectedAtRiskDimensions = [];
    
    console.log('\n📊 Individual Dimension Analysis:');
    ryffDimensions.forEach(dimension => {
      const score = scores[dimension];
      const isAtRisk = score <= atRiskThreshold;
      
      console.log(`   ${dimension}: ${score} ${isAtRisk ? '🔴 AT-RISK' : '✅ OK'}`);
      
      if (isAtRisk) {
        expectedAtRiskDimensions.push(dimension);
      }
    });
    
    console.log(`\n🎯 Expected at-risk dimensions: ${JSON.stringify(expectedAtRiskDimensions)}`);
  }
  
  // Step 3: Use the risk level service to recalculate and update
  console.log('\n🔧 Running risk level calculation service...');
  
  try {
    const result = await riskLevelService.calculateRiskLevelForAssessment(assessment.id);
    
    if (result.success) {
      console.log('✅ Risk level calculation completed successfully');
    } else {
      console.error('❌ Risk level calculation failed:', result.message);
      return;
    }
  } catch (error) {
    console.error('❌ Error running risk level service:', error);
    return;
  }
  
  // Step 4: Verify the fix by fetching updated data
  console.log('\n🔍 Verifying the fix...');
  const { data: updatedAssessment, error: verifyError } = await supabaseAdmin
    .from('assessments_42items')
    .select('*')
    .eq('student_id', femaleStudentId)
    .single();
  
  if (verifyError) {
    console.error('❌ Error fetching updated assessment:', verifyError);
    return;
  }
  
  console.log('👤 Updated Assessment Data:');
  console.log(`   Student ID: ${updatedAssessment.student_id}`);
  console.log(`   Assessment ID: ${updatedAssessment.id}`);
  console.log(`   Overall Score: ${updatedAssessment.overall_score}`);
  console.log(`   Risk Level: ${updatedAssessment.risk_level}`);
  console.log(`   At-Risk Dimensions (after): ${JSON.stringify(updatedAssessment.at_risk_dimensions)}`);
  
  // Step 5: Check if the fix worked
  const hasAtRiskDimensions = updatedAssessment.at_risk_dimensions && updatedAssessment.at_risk_dimensions.length > 0;
  
  if (hasAtRiskDimensions) {
    console.log('\n✅ SUCCESS! The at_risk_dimensions field has been populated.');
    console.log('   The female student should now be detected as at-risk in demographic trends.');
  } else {
    console.log('\n❌ ISSUE: The at_risk_dimensions field is still empty.');
    console.log('   Further investigation may be needed.');
  }
  
  console.log('\n=== FIX COMPLETE ===');
  process.exit(0);
}

// Run the fix
fixMissingDimensions().catch(console.error);