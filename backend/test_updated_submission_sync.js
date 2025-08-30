const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');
const riskLevelSyncService = require('./services/riskLevelSyncService');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdatedSubmissionSync() {
  console.log('🧪 Testing Updated Submission Risk Level Sync');
  console.log('=' .repeat(60));

  try {
    // 1. Get a sample assessment from each table
    console.log('\n📋 Step 1: Getting sample assessments...');
    
    const { data: sample42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, assignment_id, risk_level, overall_score')
      .not('assignment_id', 'is', null)
      .limit(1)
      .single();

    const { data: sample84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, assignment_id, risk_level, overall_score')
      .not('assignment_id', 'is', null)
      .limit(1)
      .single();

    if (error42 || !sample42) {
      console.log('❌ No 42-item assessments found with assignment_id');
      return;
    }

    if (error84 || !sample84) {
      console.log('❌ No 84-item assessments found with assignment_id');
      return;
    }

    console.log(`✅ Found 42-item assessment: ${sample42.id.substring(0, 8)}... (risk: ${sample42.risk_level})`);
    console.log(`✅ Found 84-item assessment: ${sample84.id.substring(0, 8)}... (risk: ${sample84.risk_level})`);

    // 2. Test the centralized sync service
    console.log('\n🔄 Step 2: Testing centralized sync service...');
    
    // Test 42-item sync
    console.log('\n   Testing 42-item sync:');
    const sync42Result = await riskLevelSyncService.syncRiskLevelToAssignments(sample42.id, 'assessments_42items');
    console.log(`   ✅ 42-item sync result:`, sync42Result);

    // Test 84-item sync
    console.log('\n   Testing 84-item sync:');
    const sync84Result = await riskLevelSyncService.syncRiskLevelToAssignments(sample84.id, 'assessments_84items');
    console.log(`   ✅ 84-item sync result:`, sync84Result);

    // 3. Verify the synchronization worked
    console.log('\n✅ Step 3: Verifying synchronization...');
    
    // Check 42-item assignment
    const { data: assignment42, error: assignError42 } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, risk_level')
      .eq('id', sample42.assignment_id)
      .single();

    if (assignment42) {
      console.log(`   42-item assignment ${assignment42.id}: risk_level = '${assignment42.risk_level}'`);
    }

    // Check 84-item assignment
    const { data: assignment84, error: assignError84 } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, risk_level')
      .eq('id', sample84.assignment_id)
      .single();

    if (assignment84) {
      console.log(`   84-item assignment ${assignment84.id}: risk_level = '${assignment84.risk_level}'`);
    }

    // 4. Test the verification function
    console.log('\n🔍 Step 4: Running full verification...');
    const verificationResult = await riskLevelSyncService.verifyRiskLevelSync();
    console.log('   Verification result:', verificationResult);

    // 5. Show final risk level distribution
    console.log('\n📊 Step 5: Final risk level distribution in assessment_assignments:');
    const { data: allAssignments } = await supabaseAdmin
      .from('assessment_assignments')
      .select('risk_level')
      .not('risk_level', 'is', null);

    const distribution = {};
    allAssignments?.forEach(a => {
      distribution[a.risk_level] = (distribution[a.risk_level] || 0) + 1;
    });

    Object.entries(distribution).forEach(([level, count]) => {
      console.log(`   ${level}: ${count}`);
    });

    console.log('\n🎉 Updated submission sync test completed successfully!');

  } catch (error) {
    console.error('❌ Error in updated submission sync test:', error);
  }
}

// Run the test
testUpdatedSubmissionSync()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });