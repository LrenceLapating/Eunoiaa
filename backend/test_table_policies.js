require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTablePolicies() {
  try {
    console.log('🔍 Checking assessments_84items table policies and constraints...');
    
    // Check RLS policies
    console.log('\n1. Checking Row Level Security policies...');
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'assessments_84items');
    
    if (policyError) {
      console.log('❌ Error fetching policies (might not have access):', policyError.message);
    } else if (policies?.length > 0) {
      console.log(`Found ${policies.length} RLS policies:`);
      policies.forEach((policy, index) => {
        console.log(`${index + 1}. Policy: ${policy.policyname}`);
        console.log(`   Command: ${policy.cmd}`);
        console.log(`   Permissive: ${policy.permissive}`);
        console.log(`   Roles: ${policy.roles}`);
        console.log(`   Qual: ${policy.qual}`);
        console.log('');
      });
    } else {
      console.log('✅ No RLS policies found');
    }
    
    // Check if RLS is enabled
    console.log('\n2. Checking if RLS is enabled...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('check_rls_status', {
      table_name: 'assessments_84items'
    }).single();
    
    if (rlsError) {
      console.log('❌ Could not check RLS status:', rlsError.message);
    } else {
      console.log(`RLS enabled: ${rlsStatus}`);
    }
    
    // Check triggers
    console.log('\n3. Checking triggers...');
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'assessments_84items');
    
    if (triggerError) {
      console.log('❌ Error fetching triggers:', triggerError.message);
    } else if (triggers?.length > 0) {
      console.log(`Found ${triggers.length} triggers:`);
      triggers.forEach((trigger, index) => {
        console.log(`${index + 1}. Trigger: ${trigger.trigger_name}`);
        console.log(`   Event: ${trigger.event_manipulation}`);
        console.log(`   Timing: ${trigger.action_timing}`);
        console.log(`   Function: ${trigger.action_statement}`);
        console.log('');
      });
    } else {
      console.log('✅ No triggers found');
    }
    
    // Check constraints
    console.log('\n4. Checking constraints...');
    const { data: constraints, error: constraintError } = await supabaseAdmin
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'assessments_84items');
    
    if (constraintError) {
      console.log('❌ Error fetching constraints:', constraintError.message);
    } else if (constraints?.length > 0) {
      console.log(`Found ${constraints.length} constraints:`);
      constraints.forEach((constraint, index) => {
        console.log(`${index + 1}. Constraint: ${constraint.constraint_name}`);
        console.log(`   Type: ${constraint.constraint_type}`);
        console.log('');
      });
    } else {
      console.log('✅ No constraints found');
    }
    
    // Test insertion with different approaches
    console.log('\n5. Testing insertion approaches...');
    
    // Test 1: Simple insert with admin client
    console.log('\nTest 1: Admin client insert...');
    const testData1 = {
      student_id: '223d466b-c792-4a73-987a-970d37d3abbb',
      assignment_id: '7814dd48-8dfe-4a62-bf22-63d83f427dc2',
      assessment_type: 'ryff_84',
      responses: { '1': 3, '2': 4 },
      scores: { autonomy: 50 },
      overall_score: 50,
      risk_level: 'low',
      completed_at: new Date().toISOString()
    };
    
    const { data: result1, error: error1 } = await supabaseAdmin
      .from('assessments_84items')
      .insert(testData1)
      .select();
    
    if (error1) {
      console.log('❌ Admin insert failed:', error1.message);
    } else {
      console.log('✅ Admin insert successful, record ID:', result1[0]?.id);
      
      // Immediately check if we can read it back
      const { data: readBack, error: readError } = await supabaseAdmin
        .from('assessments_84items')
        .select('*')
        .eq('id', result1[0].id);
      
      if (readError) {
        console.log('❌ Could not read back record:', readError.message);
      } else if (readBack?.length === 0) {
        console.log('⚠️ Record was inserted but cannot be read back (possibly deleted by trigger)');
      } else {
        console.log('✅ Record can be read back successfully');
        
        // Clean up
        await supabaseAdmin
          .from('assessments_84items')
          .delete()
          .eq('id', result1[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
    // Test 2: Regular client insert
    console.log('\nTest 2: Regular client insert...');
    const { data: result2, error: error2 } = await supabase
      .from('assessments_84items')
      .insert(testData1)
      .select();
    
    if (error2) {
      console.log('❌ Regular client insert failed:', error2.message);
    } else {
      console.log('✅ Regular client insert successful');
      
      // Clean up
      await supabaseAdmin
        .from('assessments_84items')
        .delete()
        .eq('id', result2[0].id);
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTablePolicies();