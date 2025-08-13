const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAllBulkAssessments() {
  try {
    console.log('=== Checking All Bulk Assessments in System ===\n');
    
    const { data: allBulk, error } = await supabase
      .from('bulk_assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`Total bulk assessments found: ${allBulk.length}\n`);
    
    if (allBulk.length === 0) {
      console.log('❌ No bulk assessments found in the entire system!');
      return;
    }
    
    console.log('📋 All Bulk Assessments:');
    allBulk.forEach((bulk, index) => {
      console.log(`${index + 1}. ${bulk.assessment_name || 'Unnamed'}`);
      console.log(`   - ID: ${bulk.id}`);
      console.log(`   - Counselor ID: ${bulk.counselor_id}`);
      console.log(`   - Type: ${bulk.assessment_type}`);
      console.log(`   - Status: ${bulk.status}`);
      console.log(`   - Created: ${bulk.created_at}`);
      console.log('');
    });
    
    // Check for 84-item assessments specifically
    const ryff84 = allBulk.filter(b => b.assessment_type === 'ryff_84');
    console.log(`\n🔍 84-item assessments in system: ${ryff84.length}`);
    
    if (ryff84.length > 0) {
      console.log('\n84-item assessments found:');
      ryff84.forEach((bulk, index) => {
        console.log(`${index + 1}. ${bulk.assessment_name} (Counselor: ${bulk.counselor_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllBulkAssessments();