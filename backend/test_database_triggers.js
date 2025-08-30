const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseTriggers() {
  console.log('🧪 Testing Database Triggers for Risk Level Sync');
  console.log('=' .repeat(60));

  try {
    // 1. Find assessments with assignment_id to test triggers
    console.log('\n📋 Step 1: Finding test assessments...');
    
    const { data: test42Assessment, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, assignment_id, risk_level, overall_score')
      .not('assignment_id', 'is', null)
      .limit(1)
      .single();

    const { data: test84Assessment, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, assignment_id, risk_level, overall_score')
      .not('assignment_id', 'is', null)
      .limit(1)
      .single();

    if (error42 || !test42Assessment) {
      console.log('❌ No 42-item assessments found with assignment_id');
      return;
    }

    if (error84 || !test84Assessment) {
      console.log('❌ No 84-item assessments found with assignment_id');
      return;
    }

    console.log(`✅ Found 42-item test assessment: ${test42Assessment.id.substring(0, 8)}...`);
    console.log(`   Assignment ID: ${test42Assessment.assignment_id}`);
    console.log(`   Current risk_level: ${test42Assessment.risk_level}`);
    
    console.log(`✅ Found 84-item test assessment: ${test84Assessment.id.substring(0, 8)}...`);
    console.log(`   Assignment ID: ${test84Assessment.assignment_id}`);
    console.log(`   Current risk_level: ${test84Assessment.risk_level}`);

    // 2. Get current state of assessment_assignments
    console.log('\n📊 Step 2: Getting current assignment states...');
    
    const { data: assignment42Before } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, risk_level')
      .eq('id', test42Assessment.assignment_id)
      .single();

    const { data: assignment84Before } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, risk_level')
      .eq('id', test84Assessment.assignment_id)
      .single();

    console.log(`   42-item assignment before: ${assignment42Before?.risk_level || 'NULL'}`);
    console.log(`   84-item assignment before: ${assignment84Before?.risk_level || 'NULL'}`);

    // 3. Test 42-item trigger by updating risk_level
    console.log('\n🔄 Step 3: Testing 42-item trigger...');
    
    // Determine a different risk level to test with
    const newRiskLevel42 = test42Assessment.risk_level === 'low' ? 'high' : 'low';
    console.log(`   Updating 42-item assessment risk_level from '${test42Assessment.risk_level}' to '${newRiskLevel42}'`);
    
    const { error: update42Error } = await supabaseAdmin
      .from('assessments_42items')
      .update({ risk_level: newRiskLevel42 })
      .eq('id', test42Assessment.id);

    if (update42Error) {
      console.error('❌ Error updating 42-item assessment:', update42Error);
    } else {
      console.log('   ✅ 42-item assessment updated successfully');
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if assignment was updated by trigger
      const { data: assignment42After } = await supabaseAdmin
        .from('assessment_assignments')
        .select('id, risk_level')
        .eq('id', test42Assessment.assignment_id)
        .single();
      
      const expectedMapped42 = newRiskLevel42 === 'low' ? 'healthy' : 'at-risk';
      console.log(`   📊 Assignment after trigger: ${assignment42After?.risk_level || 'NULL'}`);
      console.log(`   📋 Expected mapped value: ${expectedMapped42}`);
      
      if (assignment42After?.risk_level === expectedMapped42) {
        console.log('   ✅ 42-item trigger working correctly!');
      } else {
        console.log('   ❌ 42-item trigger may not be working');
      }
    }

    // 4. Test 84-item trigger by updating risk_level
    console.log('\n🔄 Step 4: Testing 84-item trigger...');
    
    const newRiskLevel84 = test84Assessment.risk_level === 'low' ? 'high' : 'low';
    console.log(`   Updating 84-item assessment risk_level from '${test84Assessment.risk_level}' to '${newRiskLevel84}'`);
    
    const { error: update84Error } = await supabaseAdmin
      .from('assessments_84items')
      .update({ risk_level: newRiskLevel84 })
      .eq('id', test84Assessment.id);

    if (update84Error) {
      console.error('❌ Error updating 84-item assessment:', update84Error);
    } else {
      console.log('   ✅ 84-item assessment updated successfully');
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if assignment was updated by trigger
      const { data: assignment84After } = await supabaseAdmin
        .from('assessment_assignments')
        .select('id, risk_level')
        .eq('id', test84Assessment.assignment_id)
        .single();
      
      const expectedMapped84 = newRiskLevel84 === 'low' ? 'healthy' : 'at-risk';
      console.log(`   📊 Assignment after trigger: ${assignment84After?.risk_level || 'NULL'}`);
      console.log(`   📋 Expected mapped value: ${expectedMapped84}`);
      
      if (assignment84After?.risk_level === expectedMapped84) {
        console.log('   ✅ 84-item trigger working correctly!');
      } else {
        console.log('   ❌ 84-item trigger may not be working');
      }
    }

    // 5. Restore original values
    console.log('\n🔄 Step 5: Restoring original values...');
    
    await supabaseAdmin
      .from('assessments_42items')
      .update({ risk_level: test42Assessment.risk_level })
      .eq('id', test42Assessment.id);
      
    await supabaseAdmin
      .from('assessments_84items')
      .update({ risk_level: test84Assessment.risk_level })
      .eq('id', test84Assessment.id);
      
    console.log('   ✅ Original values restored');

    // 6. Check trigger existence
    console.log('\n🔍 Step 6: Checking trigger existence...');
    
    try {
      // Query to check if triggers exist
      const { data: triggers, error: triggerError } = await supabaseAdmin
        .rpc('exec_sql', {
          query: `
            SELECT trigger_name, event_object_table, action_timing, event_manipulation
            FROM information_schema.triggers 
            WHERE trigger_name IN ('trigger_sync_risk_level_42items', 'trigger_sync_risk_level_84items')
            ORDER BY trigger_name;
          `
        });
      
      if (triggerError) {
        console.log('   ⚠️  Could not query triggers directly (RPC may not be available)');
        console.log('   💡 Triggers should be manually verified in Supabase dashboard');
      } else {
        console.log('   📋 Found triggers:', triggers);
      }
    } catch (rpcError) {
      console.log('   ⚠️  RPC not available for trigger verification');
      console.log('   💡 Please manually verify triggers in Supabase dashboard');
    }

    console.log('\n🎉 Database trigger test completed!');
    console.log('\n📝 Summary:');
    console.log('   - If triggers are working, risk_level changes in assessment tables');
    console.log('     should automatically update assessment_assignments.risk_level');
    console.log('   - Mapping: low → healthy, moderate → moderate, high → at-risk');
    console.log('   - If triggers are not working, manual SQL execution may be needed');

  } catch (error) {
    console.error('❌ Error in database trigger test:', error);
  }
}

// Run the test
testDatabaseTriggers()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });