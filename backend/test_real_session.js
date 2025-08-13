require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRealSession() {
  try {
    console.log('Testing real API endpoint with session authentication...');
    
    // First, let's check if there are any active sessions for our test counselor
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('\nStep 1: Check for existing sessions...');
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', counselorId)
      .eq('user_type', 'counselor')
      .gt('expires_at', new Date().toISOString());
    
    if (sessionError) {
      console.error('❌ Error checking sessions:', sessionError);
      return;
    }
    
    console.log(`Found ${sessions?.length || 0} active sessions for counselor`);
    
    let sessionToken = null;
    if (sessions && sessions.length > 0) {
      // Find the first active, non-expired session
      const activeSession = sessions.find(s => {
        const now = new Date();
        const expiresAt = new Date(s.expires_at);
        return s.is_active && now <= expiresAt;
      });
      
      if (activeSession) {
        sessionToken = activeSession.session_token;
        console.log('✅ Using active session token:', sessionToken.substring(0, 20) + '...');
      }
    }
    
    if (!sessionToken) {
      console.log('\nStep 2: No active session found, creating new session...');
      
      // Create a new session
      const newSessionToken = 'test_session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      const { data: newSession, error: createError } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          session_token: newSessionToken,
          user_id: counselorId,
          user_type: 'counselor',
          expires_at: expiresAt,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating session:', createError);
        return;
      }
      
      sessionToken = newSessionToken;
      console.log('✅ Created new session token:', sessionToken.substring(0, 20) + '...');
    }
    
    console.log('\nStep 3: Testing API endpoint with session...');
    
    // Test the API endpoint with different assessment type filters
    const testCases = [
      { name: 'No filter (all assessments)', params: {} },
      { name: '42-item assessments', params: { assessmentType: 'ryff_42' } },
      { name: '84-item assessments', params: { assessmentType: 'ryff_84' } }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- Testing: ${testCase.name} ---`);
      
      const params = new URLSearchParams({
        limit: '1000',
        ...testCase.params
      });
      
      const url = `http://localhost:3000/api/counselor-assessments/results?${params.toString()}`;
      console.log('Request URL:', url);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `sessionToken=${sessionToken}`
          }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Success!');
          console.log('  - Total assessments:', data.pagination?.total || 0);
          console.log('  - Returned assessments:', data.data?.length || 0);
          
          if (data.data && data.data.length > 0) {
            console.log('  - Assessment types found:');
            const types = [...new Set(data.data.map(a => a.assessment_type))];
            types.forEach(type => {
              const count = data.data.filter(a => a.assessment_type === type).length;
              console.log(`    * ${type}: ${count} assessments`);
            });
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
        }
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testRealSession();