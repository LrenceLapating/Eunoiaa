require('dotenv').config();
const riskLevelSyncService = require('./services/riskLevelSyncService');
const { createClient } = require('@supabase/supabase-js');

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRiskLevelSyncService() {
  console.log('🧪 Testing Risk Level Sync Service');
  console.log('==================================\n');
  
  try {
    // 1. First, let's verify current state
    console.log('1️⃣ Verifying current risk_level synchronization...');
    const verificationResult = await riskLevelSyncService.verifyRiskLevelSync();
    
    if (verificationResult.success) {
      console.log(`   📊 Current sync status: ${verificationResult.isInSync ? '✅ In Sync' : '❌ Out of Sync'}`);
      console.log(`   📈 Total mismatches: ${verificationResult.totalMismatches}`);
      
      if (verificationResult.totalMismatches > 0) {
        console.log('   🔧 Found mismatches, running bulk sync...');
        
        // 2. Run bulk sync to fix any existing mismatches
        const syncResult = await riskLevelSyncService.syncAllExistingAssessments();
        
        if (syncResult.success) {
          console.log(`   ✅ Bulk sync completed: ${syncResult.totalSynced} synced, ${syncResult.totalErrors} errors`);
        } else {
          console.log(`   ❌ Bulk sync failed: ${syncResult.message}`);
        }
      }
    }
    
    // 3. Test individual sync functionality
    console.log('\n2️⃣ Testing individual sync functionality...');
    
    // Get a sample 42-item assessment
    const { data: sample42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, risk_level, assignment_id')
      .not('assignment_id', 'is', null)
      .limit(1)
      .single();
    
    if (sample42 && !error42) {
      console.log(`   📋 Testing with 42-item assessment: ${sample42.id}`);
      console.log(`   📊 Current risk_level: ${sample42.risk_level}`);
      
      // Test syncing the current risk level
      const syncResult42 = await riskLevelSyncService.sync42ItemRiskLevel(
        sample42.id, 
        sample42.risk_level
      );
      
      if (syncResult42.success) {
        console.log(`   ✅ 42-item sync test passed`);
        console.log(`   📈 Mapped '${syncResult42.originalRiskLevel}' to '${syncResult42.mappedRiskLevel}'`);
      } else {
        console.log(`   ❌ 42-item sync test failed: ${syncResult42.message}`);
      }
    } else {
      console.log('   ⚠️  No 42-item assessment found for testing');
    }
    
    // Get a sample 84-item assessment
    const { data: sample84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, risk_level, assignment_id')
      .not('assignment_id', 'is', null)
      .limit(1)
      .single();
    
    if (sample84 && !error84) {
      console.log(`\n   📋 Testing with 84-item assessment: ${sample84.id}`);
      console.log(`   📊 Current risk_level: ${sample84.risk_level}`);
      
      // Test syncing the current risk level
      const syncResult84 = await riskLevelSyncService.sync84ItemRiskLevel(
        sample84.id, 
        sample84.risk_level
      );
      
      if (syncResult84.success) {
        console.log(`   ✅ 84-item sync test passed`);
        console.log(`   📈 Mapped '${syncResult84.originalRiskLevel}' to '${syncResult84.mappedRiskLevel}'`);
      } else {
        console.log(`   ❌ 84-item sync test failed: ${syncResult84.message}`);
      }
    } else {
      console.log('   ⚠️  No 84-item assessment found for testing');
    }
    
    // 4. Test risk level mapping
    console.log('\n3️⃣ Testing risk level mapping...');
    const mappingTests = [
      { input: 'low', expected: 'healthy' },
      { input: 'moderate', expected: 'moderate' },
      { input: 'high', expected: 'at-risk' }
    ];
    
    mappingTests.forEach(test => {
      const result = riskLevelSyncService.mapRiskLevelForAssignments(test.input);
      const passed = result === test.expected;
      console.log(`   ${passed ? '✅' : '❌'} '${test.input}' → '${result}' (expected: '${test.expected}')`);
    });
    
    // 5. Final verification
    console.log('\n4️⃣ Final verification...');
    const finalVerification = await riskLevelSyncService.verifyRiskLevelSync();
    
    if (finalVerification.success) {
      console.log(`   📊 Final sync status: ${finalVerification.isInSync ? '✅ In Sync' : '❌ Out of Sync'}`);
      console.log(`   📈 Total mismatches: ${finalVerification.totalMismatches}`);
      
      if (finalVerification.isInSync) {
        console.log('   🎉 All assessments are properly synchronized!');
      }
    }
    
    // 6. Show current distribution
    console.log('\n5️⃣ Current risk level distribution...');
    
    const { data: assignmentDistribution } = await supabaseAdmin
      .from('assessment_assignments')
      .select('risk_level')
      .not('risk_level', 'is', null);
    
    if (assignmentDistribution) {
      const distribution = {};
      assignmentDistribution.forEach(a => {
        distribution[a.risk_level] = (distribution[a.risk_level] || 0) + 1;
      });
      console.log('   📊 assessment_assignments risk_level distribution:', distribution);
    }
    
    console.log('\n🎉 Risk Level Sync Service Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testRiskLevelSyncService()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testRiskLevelSyncService };