require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSession() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Debugging session validation...');
    
    // Get all sessions for the counselor
    const { data: sessions, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', counselorId)
      .eq('user_type', 'counselor')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching sessions:', error);
      return;
    }
    
    console.log(`\nFound ${sessions?.length || 0} total sessions for counselor`);
    
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        const now = new Date();
        const expiresAt = new Date(session.expires_at);
        const isExpired = now > expiresAt;
        
        console.log(`\n--- Session ${index + 1} ---`);
        console.log('Session Token:', session.session_token.substring(0, 20) + '...');
        console.log('Is Active:', session.is_active);
        console.log('Created At:', session.created_at);
        console.log('Expires At:', session.expires_at);
        console.log('Last Accessed:', session.last_accessed);
        console.log('Is Expired:', isExpired);
        console.log('Time until expiry:', isExpired ? 'EXPIRED' : Math.round((expiresAt - now) / (1000 * 60 * 60)) + ' hours');
      });
      
      // Test validation with the first active session
      const activeSession = sessions.find(s => s.is_active && new Date() <= new Date(s.expires_at));
      
      if (activeSession) {
        console.log('\n--- Testing Session Validation ---');
        console.log('Using session token:', activeSession.session_token.substring(0, 20) + '...');
        
        // Manual validation test
        const { data: validationResult, error: validationError } = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .eq('session_token', activeSession.session_token)
          .eq('is_active', true)
          .single();
        
        if (validationError) {
          console.log('❌ Validation query error:', validationError);
        } else if (validationResult) {
          console.log('✅ Session validation successful');
          console.log('Session data:', {
            user_id: validationResult.user_id,
            user_type: validationResult.user_type,
            is_active: validationResult.is_active,
            expires_at: validationResult.expires_at
          });
        } else {
          console.log('❌ No session found in validation');
        }
      } else {
        console.log('\n❌ No active, non-expired sessions found');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
  
  process.exit(0);
}

debugSession();