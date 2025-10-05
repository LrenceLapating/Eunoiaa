const { supabaseAdmin } = require('./config/database');
const { determineRiskLevel, getAtRiskDimensions } = require('./utils/ryffScoring');

async function fixMissingDimensionsDirect() {
  console.log('=== DIRECT FIX FOR MISSING AT-RISK DIMENSIONS ===\n');
  
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
  
  // Step 2: Calculate the correct risk level and at-risk dimensions
  console.log('\n🔧 Calculating correct risk level and dimensions...');
  
  if (!assessment.scores || !assessment.overall_score) {
    console.error('❌ Missing scores or overall_score data');
    return;
  }
  
  const assessmentType = 'ryff_42'; // This is a 42-item assessment
  
  // Calculate risk level using the utility function
  const correctRiskLevel = determineRiskLevel(assessment.scores, assessment.overall_score, assessmentType);
  
  // Get at-risk dimensions using the utility function
  const correctAtRiskDimensions = getAtRiskDimensions(assessment.scores, assessmentType);
  
  console.log(`   Calculated Risk Level: ${correctRiskLevel}`);
  console.log(`   Calculated At-Risk Dimensions: ${JSON.stringify(correctAtRiskDimensions)}`);
  
  // Step 3: Update the assessment with the correct values
  console.log('\n💾 Updating assessment with correct values...');
  
  const { error: updateError } = await supabaseAdmin
    .from('assessments_42items')
    .update({
      risk_level: correctRiskLevel,
      at_risk_dimensions: correctAtRiskDimensions,
      updated_at: new Date().toISOString()
    })
    .eq('id', assessment.id);
  
  if (updateError) {
    console.error('❌ Error updating assessment:', updateError);
    return;
  }
  
  console.log('✅ Assessment updated successfully');
  
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
    
    // Show the specific dimensions that are now marked as at-risk
    console.log(`   At-risk dimensions: ${updatedAssessment.at_risk_dimensions.join(', ')}`);
  } else {
    console.log('\n❌ ISSUE: The at_risk_dimensions field is still empty.');
    console.log('   Further investigation may be needed.');
  }
  
  console.log('\n=== DIRECT FIX COMPLETE ===');
  process.exit(0);
}

// Run the direct fix
fixMissingDimensionsDirect().catch(console.error);