const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkSpecificCounselorId() {
  try {
    const targetId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    
    console.log(`🔍 Investigating counselor ID: ${targetId}`);
    console.log('\n--- Checking counselors table ---');
    
    // Check if this ID exists in counselors table
    const { data: counselor, error: counselorError } = await supabase
      .from('counselors')
      .select('*')
      .eq('id', targetId)
      .single();
    
    if (counselorError) {
      if (counselorError.code === 'PGRST116') {
        console.log('❌ This ID does NOT exist in the counselors table');
      } else {
        console.error('❌ Error querying counselors:', counselorError);
      }
    } else {
      console.log('✅ Found counselor in database:');
      console.log(`   Email: ${counselor.email}`);
      console.log(`   Name: ${counselor.first_name || 'N/A'} ${counselor.last_name || 'N/A'}`);
      console.log(`   Institution: ${counselor.institution || 'Not specified'}`);
      console.log(`   Created: ${new Date(counselor.created_at).toLocaleString()}`);
    }
    
    console.log('\n--- Checking students table ---');
    
    // Check if this ID exists in students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', targetId)
      .single();
    
    if (studentError) {
      if (studentError.code === 'PGRST116') {
        console.log('❌ This ID does NOT exist in the students table');
      } else {
        console.error('❌ Error querying students:', studentError);
      }
    } else {
      console.log('✅ Found student in database:');
      console.log(`   Name: ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   ID Number: ${student.id_number}`);
      console.log(`   College: ${student.college}`);
      console.log(`   Created: ${new Date(student.created_at).toLocaleString()}`);
    }
    
    console.log('\n--- Checking auth.users table ---');
    
    // Check if this ID exists in Supabase auth.users (using service role)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetId);
    
    if (authError) {
      console.log('❌ This ID does NOT exist in Supabase auth.users');
      console.log(`   Error: ${authError.message}`);
    } else {
      console.log('✅ Found user in Supabase auth:');
      console.log(`   Email: ${authUser.user.email}`);
      console.log(`   Created: ${new Date(authUser.user.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${authUser.user.last_sign_in_at ? new Date(authUser.user.last_sign_in_at).toLocaleString() : 'Never'}`);
    }
    
    console.log('\n--- Summary ---');
    
    if (!counselor && !student && authError) {
      console.log('🎯 CONCLUSION: This ID appears to be:');
      console.log('   ❌ NOT a real user in the database');
      console.log('   ❌ NOT in Supabase authentication');
      console.log('   🔍 Likely a placeholder/test ID stored in localStorage');
      console.log('\n💡 This explains the 401 Unauthorized errors!');
      console.log('   The frontend is using a fake/expired ID from localStorage.');
      console.log('\n🔧 Solution: Clear localStorage and log in properly with:');
      console.log('   Email: counselor@eunoia.edu');
      console.log('   Password: counselor123');
    } else {
      console.log('🎯 This ID exists in the system as:');
      if (counselor) console.log('   ✅ Counselor account');
      if (student) console.log('   ✅ Student account');
      if (!authError) console.log('   ✅ Supabase auth user');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSpecificCounselorId();