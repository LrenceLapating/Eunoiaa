const riskLevelSyncService = require('./services/riskLevelSyncService');

async function runFinalVerification() {
  console.log('🔍 Running final verification of risk level synchronization...');
  
  try {
    // Run comprehensive verification
    const results = await riskLevelSyncService.verifyRiskLevelSync();
    
    console.log('\n📊 Verification Results:');
    console.log(`   42-item assessments: ${results.mismatches42.length} mismatches found`);
    console.log(`   84-item assessments: ${results.mismatches84.length} mismatches found`);
    
    if (results.mismatches42.length > 0) {
      console.log('\n❌ 42-item mismatches:');
      results.mismatches42.forEach(mismatch => {
        console.log(`   Assessment ID: ${mismatch.assessment_id}`);
        console.log(`   Assignment ID: ${mismatch.assignment_id}`);
        console.log(`   Assessment risk_level: ${mismatch.assessment_risk_level}`);
        console.log(`   Assignment risk_level: ${mismatch.assignment_risk_level}`);
        console.log(`   Expected: ${mismatch.expected_assignment_risk_level}`);
        console.log('   ---');
      });
    }
    
    if (results.mismatches84.length > 0) {
      console.log('\n❌ 84-item mismatches:');
      results.mismatches84.forEach(mismatch => {
        console.log(`   Assessment ID: ${mismatch.assessment_id}`);
        console.log(`   Assignment ID: ${mismatch.assignment_id}`);
        console.log(`   Assessment risk_level: ${mismatch.assessment_risk_level}`);
        console.log(`   Assignment risk_level: ${mismatch.assignment_risk_level}`);
        console.log(`   Expected: ${mismatch.expected_assignment_risk_level}`);
        console.log('   ---');
      });
    }
    
    if (results.mismatches42.length === 0 && results.mismatches84.length === 0) {
      console.log('\n✅ All risk levels are properly synchronized!');
    } else {
      console.log('\n⚠️  Some mismatches found. Consider running data migration scripts.');
    }
    
    console.log('\n🎉 Final verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

runFinalVerification();