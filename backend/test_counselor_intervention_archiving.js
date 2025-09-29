require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { archiveCounselorInterventions } = require('./utils/archiveCounselorInterventions');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCounselorInterventionArchiving() {
  console.log('🧪 Testing Counselor Intervention Archiving Functionality');
  console.log('=' .repeat(60));
  
  try {
    // Check current state before archiving
    console.log('\n📊 Checking current state of counselor interventions...');
    
    const { data: currentInterventions, error: currentError } = await supabase
      .from('counselor_interventions')
      .select('*');
    
    if (currentError) {
      console.error('❌ Error fetching current interventions:', currentError);
      return;
    }
    
    console.log(`📋 Current active interventions: ${currentInterventions?.length || 0}`);
    
    if (currentInterventions && currentInterventions.length > 0) {
      console.log('📝 Sample intervention IDs:', currentInterventions.slice(0, 3).map(i => i.id));
    }
    
    // Check current history state
    const { data: currentHistory, error: historyError } = await supabase
      .from('counselor_intervention_history')
      .select('*');
    
    if (historyError) {
      console.error('❌ Error fetching current history:', historyError);
      return;
    }
    
    console.log(`📚 Current history records: ${currentHistory?.length || 0}`);
    
    // Test the archiving function
    console.log('\n🗂️ Testing counselor intervention archiving...');
    const result = await archiveCounselorInterventions();
    
    console.log('\n✅ Archiving Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Verify the results
    console.log('\n🔍 Verifying archiving results...');
    
    const { data: afterInterventions, error: afterError } = await supabase
      .from('counselor_interventions')
      .select('*');
    
    if (afterError) {
      console.error('❌ Error fetching interventions after archiving:', afterError);
      return;
    }
    
    const { data: afterHistory, error: afterHistoryError } = await supabase
      .from('counselor_intervention_history')
      .select('*');
    
    if (afterHistoryError) {
      console.error('❌ Error fetching history after archiving:', afterHistoryError);
      return;
    }
    
    console.log(`📋 Active interventions after archiving: ${afterInterventions?.length || 0}`);
    console.log(`📚 History records after archiving: ${afterHistory?.length || 0}`);
    
    // Calculate changes
    const archivedCount = (currentInterventions?.length || 0) - (afterInterventions?.length || 0);
    const historyIncrease = (afterHistory?.length || 0) - (currentHistory?.length || 0);
    
    console.log('\n📈 Summary:');
    console.log(`🔄 Interventions archived: ${archivedCount}`);
    console.log(`📚 History records added: ${historyIncrease}`);
    
    if (archivedCount === historyIncrease && archivedCount === result.archivedCount) {
      console.log('✅ Archiving completed successfully! All counts match.');
    } else {
      console.log('⚠️ Warning: Count mismatch detected');
      console.log(`Expected: ${result.archivedCount}, Archived: ${archivedCount}, History Added: ${historyIncrease}`);
    }
    
    // Show sample history records
    if (afterHistory && afterHistory.length > 0) {
      console.log('\n📝 Sample history record:');
      const sample = afterHistory[afterHistory.length - 1];
      console.log({
        id: sample.id,
        original_intervention_id: sample.original_intervention_id,
        student_id: sample.student_id,
        status: sample.status,
        deactivated_at: sample.deactivated_at,
        intervention_title: sample.intervention_title?.substring(0, 50) + '...'
      });
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCounselorInterventionArchiving()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });