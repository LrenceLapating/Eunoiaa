require('dotenv').config();
const { computeAndStoreCollegeScores } = require('./utils/collegeScoring');
const { supabaseAdmin } = require('./config/database');

async function testJoinQuery() {
  console.log('🔧 Testing the join query syntax...');
  
  try {
    // Test the join query first
    console.log('\n1. Testing basic assignment query...');
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        bulk_assessments!inner(
          assessment_name,
          assessment_type
        )
      `)
      .eq('bulk_assessments.assessment_name', '2025-2026 1st Semester - test 1st year')
      .eq('bulk_assessments.assessment_type', 'ryff_42')
      .eq('status', 'completed')
      .limit(5);
    
    if (assignmentError) {
      console.error('❌ Assignment query error:', assignmentError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} completed assignments`);
    if (assignments && assignments.length > 0) {
      console.log('Sample assignment:', JSON.stringify(assignments[0], null, 2));
    }
    
    // Now test the full function
    console.log('\n2. Testing full computeAndStoreCollegeScores function...');
    const result = await computeAndStoreCollegeScores(null, 'ryff_42', '2025-2026 1st Semester - test 1st year');
    
    if (result.success) {
      console.log('✅ SUCCESS! College scores computed successfully!');
      console.log(`📈 Result:`, {
        message: result.message,
        collegeCount: result.collegeCount,
        scoreCount: result.scoreCount
      });
    } else {
      console.error('❌ FAILED! Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
  }
}

testJoinQuery()
  .then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });