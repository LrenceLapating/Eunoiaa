const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkCounselorAccounts() {
  try {
    console.log('🔍 Checking all counselor accounts in the system...');
    
    // Query all counselors
    const { data: counselors, error } = await supabase
      .from('counselors')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error querying counselors:', error);
      return;
    }
    
    if (!counselors || counselors.length === 0) {
      console.log('❌ No counselor accounts found in the system');
      return;
    }
    
    console.log(`\n✅ Found ${counselors.length} counselor account(s):\n`);
    
    counselors.forEach((counselor, index) => {
      console.log(`--- Counselor ${index + 1} ---`);
      console.log(`ID: ${counselor.id}`);
      console.log(`Email: ${counselor.email}`);
      console.log(`Name: ${counselor.first_name} ${counselor.last_name}`);
      console.log(`Institution: ${counselor.institution || 'Not specified'}`);
      console.log(`Department: ${counselor.department || 'Not specified'}`);
      console.log(`Created: ${new Date(counselor.created_at).toLocaleString()}`);
      console.log(`Updated: ${new Date(counselor.updated_at).toLocaleString()}`);
      console.log('');
    });
    
    // Check which counselor has bulk assessments
    console.log('🔍 Checking which counselors have bulk assessments...');
    
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('counselor_id, assessment_type')
      .order('counselor_id');
    
    if (bulkError) {
      console.error('❌ Error querying bulk assessments:', bulkError);
      return;
    }
    
    // Group assessments by counselor
    const assessmentsByCounselor = {};
    bulkAssessments.forEach(assessment => {
      if (!assessmentsByCounselor[assessment.counselor_id]) {
        assessmentsByCounselor[assessment.counselor_id] = {
          ryff_42: 0,
          ryff_84: 0
        };
      }
      assessmentsByCounselor[assessment.counselor_id][assessment.assessment_type]++;
    });
    
    console.log('\n📊 Assessment counts by counselor:');
    counselors.forEach(counselor => {
      const assessments = assessmentsByCounselor[counselor.id] || { ryff_42: 0, ryff_84: 0 };
      console.log(`${counselor.email}: ${assessments.ryff_42} x 42-item, ${assessments.ryff_84} x 84-item`);
    });
    
    // Identify the counselor with 84-item assessments
    const counselorWith84Items = counselors.find(c => 
      assessmentsByCounselor[c.id] && assessmentsByCounselor[c.id].ryff_84 > 0
    );
    
    if (counselorWith84Items) {
      console.log(`\n🎯 The counselor with 84-item assessments is:`);
      console.log(`   Email: ${counselorWith84Items.email}`);
      console.log(`   Name: ${counselorWith84Items.first_name} ${counselorWith84Items.last_name}`);
      console.log(`   ID: ${counselorWith84Items.id}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCounselorAccounts();