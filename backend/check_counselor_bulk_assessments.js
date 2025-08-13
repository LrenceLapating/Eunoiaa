const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkCounselorBulkAssessments() {
  try {
    const counselorId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    
    console.log('=== Checking Counselor Bulk Assessments ===\n');
    
    const { data: bulkAssessments, error } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`Total bulk assessments for counselor: ${bulkAssessments.length}\n`);
    
    if (bulkAssessments.length === 0) {
      console.log('❌ No bulk assessments found for this counselor!');
      return;
    }
    
    // Group by assessment type
    const ryff42 = bulkAssessments.filter(b => b.assessment_type === 'ryff_42');
    const ryff84 = bulkAssessments.filter(b => b.assessment_type === 'ryff_84');
    const other = bulkAssessments.filter(b => !['ryff_42', 'ryff_84'].includes(b.assessment_type));
    
    console.log(`📊 Assessment Type Breakdown:`);
    console.log(`- 42-item assessments: ${ryff42.length}`);
    console.log(`- 84-item assessments: ${ryff84.length}`);
    console.log(`- Other types: ${other.length}\n`);
    
    console.log('📋 All Bulk Assessments:');
    bulkAssessments.forEach((bulk, index) => {
      console.log(`${index + 1}. ${bulk.assessment_name}`);
      console.log(`   - Type: ${bulk.assessment_type}`);
      console.log(`   - Status: ${bulk.status}`);
      console.log(`   - Created: ${bulk.created_at}`);
      console.log(`   - Target: ${bulk.target_type} (${bulk.target_colleges || 'All'})`);
      console.log('');
    });
    
    if (ryff84.length === 0) {
      console.log('\n🎯 SOLUTION: The counselor needs to create 84-item bulk assessments!');
      console.log('This is why the 84-item filter shows no results in the frontend.');
      console.log('\nSteps to fix:');
      console.log('1. Go to the bulk assessment creation page');
      console.log('2. Create a new assessment with type "84-item"');
      console.log('3. Assign it to students');
      console.log('4. Wait for students to complete the assessments');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCounselorBulkAssessments();