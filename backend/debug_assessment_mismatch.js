require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAssessmentMismatch() {
  try {
    console.log('🔍 Debugging assessment name mismatch issue...');
    
    // 1. Find a specific assignment that should have college scores
    const targetAssessment = '2025-2026 1st Semester - Testing for Section Filtering';
    
    console.log(`\n📋 Analyzing assessment: "${targetAssessment}"`);
    
    // 2. Check bulk_assessments table
    const { data: bulkAssessment, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_name', targetAssessment)
      .single();
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessment:', bulkError);
      return;
    }
    
    if (!bulkAssessment) {
      console.log('❌ No bulk assessment found with this name');
      return;
    }
    
    console.log('✅ Bulk assessment found:');
    console.log(`   ID: ${bulkAssessment.id}`);
    console.log(`   Name: "${bulkAssessment.assessment_name}"`);
    console.log(`   Type: ${bulkAssessment.assessment_type}`);
    
    // 3. Check assessment_assignments
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', bulkAssessment.id)
      .eq('status', 'completed');
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`\n📝 Found ${assignments.length} completed assignments for this bulk assessment`);
    
    if (assignments.length === 0) {
      console.log('❌ No completed assignments - this explains why no college scores are generated');
      return;
    }
    
    // 4. Check actual assessment records in the assessment tables
    const tableName = bulkAssessment.assessment_type === 'ryff_84' ? 'assessments_84items' : 'assessments_42items';
    
    console.log(`\n🔍 Checking ${tableName} table...`);
    
    // Get student IDs from assignments
    const studentIds = assignments.map(a => a.student_id);
    
    const { data: assessmentRecords, error: assessmentError } = await supabaseAdmin
      .from(tableName)
      .select('id, student_id, scores')
      .in('student_id', studentIds)
      .not('scores', 'is', null);
    
    if (assessmentError) {
      console.error('❌ Error fetching assessment records:', assessmentError);
      return;
    }
    
    console.log(`✅ Found ${assessmentRecords.length} assessment records with scores`);
    
    if (assessmentRecords.length === 0) {
      console.log('❌ No assessment records with scores found - this explains the issue!');
      console.log('💡 The students completed the assignment but their assessment scores are missing');
      return;
    }
    
    // 5. Check if these assessment records are linked to the correct assignment
    console.log('\n🔗 Checking assessment-assignment linkage...');
    
    for (const record of assessmentRecords.slice(0, 3)) { // Check first 3
      const assignment = assignments.find(a => a.student_id === record.student_id);
      if (assignment) {
        console.log(`✅ Student ${record.student_id}: assessment record exists, assignment completed`);
        
        // Check if this specific record would be found by the college scoring query
        const { data: queryTest, error: queryError } = await supabaseAdmin
          .from('assessment_assignments')
          .select(`
            student_id,
            bulk_assessment:bulk_assessments!inner(
              assessment_name,
              assessment_type
            )
          `)
          .eq('student_id', record.student_id)
          .eq('status', 'completed')
          .eq('bulk_assessment.assessment_name', targetAssessment);
        
        if (queryError) {
          console.log(`   ❌ Query test failed: ${queryError.message}`);
        } else if (queryTest && queryTest.length > 0) {
          console.log(`   ✅ Query test passed: record would be found by college scoring`);
        } else {
          console.log(`   ❌ Query test failed: record would NOT be found by college scoring`);
        }
      } else {
        console.log(`❌ Student ${record.student_id}: assessment record exists but no completed assignment found`);
      }
    }
    
    // 6. Test the exact query used in computeAndStoreCollegeScores
    console.log('\n🧪 Testing the exact college scoring query...');
    
    const { data: exactQuery, error: exactError } = await supabaseAdmin
      .from(tableName)
      .select(`
        id,
        scores,
        assessment_type,
        student_id,
        assignment:assessment_assignments!inner(
          id,
          status,
          bulk_assessment:bulk_assessments!inner(
            assessment_name,
            assessment_type
          )
        )
      `)
      .eq('assignment.status', 'completed')
      .eq('assignment.bulk_assessment.assessment_name', targetAssessment)
      .not('scores', 'is', null);
    
    if (exactError) {
      console.error('❌ Exact query failed:', exactError);
    } else {
      console.log(`✅ Exact query found ${exactQuery.length} records`);
      if (exactQuery.length > 0) {
        console.log('   📊 Sample record:', {
          student_id: exactQuery[0].student_id,
          has_scores: !!exactQuery[0].scores,
          assessment_name: exactQuery[0].assignment.bulk_assessment.assessment_name
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugAssessmentMismatch().then(() => {
  console.log('\n🏁 Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});