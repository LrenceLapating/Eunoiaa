require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyRestoration() {
  console.log('🔍 Verifying restored assessment data...');
  
  const { data, error } = await supabase
    .from('college_scores')
    .select('college_name, student_count, assessment_name, created_at')
    .eq('assessment_name', '2025-2026 2nd Semester - 1st Test 42')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`\n✅ Successfully restored ${data.length} college score records:`);
  console.log('\n📊 Assessment: "2025-2026 2nd Semester - 1st Test 42"');
  
  data.forEach((record, index) => {
    console.log(`\n${index + 1}. College: ${record.college_name || 'College of Arts and Sciences'}`);
    console.log(`   Students: ${record.student_count}`);
    console.log(`   Created: ${record.created_at.split('T')[0]} at ${record.created_at.split('T')[1].split('.')[0]}`);
  });
  
  console.log('\n🎉 The important assessment data has been successfully restored!');
}

verifyRestoration().catch(console.error);