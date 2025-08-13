const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkCurrentSession() {
  try {
    console.log('🔍 Checking current session and authentication...');
    
    // Check if there's a current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session found');
      console.log('\n💡 This explains why API calls return 401 Unauthorized!');
      console.log('\n🔧 To fix this, you need to:');
      console.log('   1. Log in through the frontend application');
      console.log('   2. Use the built-in counselor account:');
      console.log('      Email: counselor@eunoia.edu');
      console.log('      (Check if there\'s a default password in your setup)');
      return;
    }
    
    console.log('✅ Active session found!');
    console.log(`User ID: ${session.user.id}`);
    console.log(`Email: ${session.user.email}`);
    console.log(`Session expires: ${new Date(session.expires_at * 1000).toLocaleString()}`);
    
    // Check if this user is in the counselors table
    const { data: counselor, error: counselorError } = await supabase
      .from('counselors')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (counselorError) {
      console.log('❌ User is not registered as a counselor');
      console.log('Error:', counselorError.message);
      return;
    }
    
    console.log('\n✅ User is registered as counselor:');
    console.log(`Name: ${counselor.first_name} ${counselor.last_name}`);
    console.log(`Institution: ${counselor.institution || 'Not specified'}`);
    
    // Check bulk assessments for this counselor
    const { data: assessments, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('assessment_type')
      .eq('counselor_id', session.user.id);
    
    if (assessmentError) {
      console.error('❌ Error checking assessments:', assessmentError);
      return;
    }
    
    const counts = { ryff_42: 0, ryff_84: 0 };
    assessments.forEach(a => counts[a.assessment_type]++);
    
    console.log(`\n📊 This counselor has: ${counts.ryff_42} x 42-item, ${counts.ryff_84} x 84-item assessments`);
    
    if (counts.ryff_84 === 0) {
      console.log('\n🎯 This explains why no 84-item assessments appear!');
      console.log('\n💡 Solutions:');
      console.log('   1. Create 84-item bulk assessments for this counselor, OR');
      console.log('   2. Log in as counselor@eunoia.edu (the account with existing 84-item assessments)');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCurrentSession();