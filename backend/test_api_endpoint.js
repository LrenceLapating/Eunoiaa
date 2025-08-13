require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testApiEndpoint() {
  try {
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('Testing API endpoint logic for 84-item assessments...');
    
    // Test the exact query from counselorAssessments.js for 84-item assessments
    console.log('\n--- Testing 84-item Assessment Query ---');
    
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select(`
        *,
        assessment_assignments!inner(
          id,
          student_id,
          assigned_at,
          completed_at,
          bulk_assessments!inner(
            id,
            assessment_name,
            counselor_id,
            assessment_type
          )
        )
      `)
      .eq('assessment_assignments.bulk_assessments.counselor_id', counselorId)
      .eq('assessment_assignments.bulk_assessments.assessment_type', 'ryff_84');
    
    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84);
    } else {
      console.log(`✅ Found ${assessments84?.length || 0} 84-item assessments`);
      
      assessments84?.forEach((assessment, index) => {
        console.log(`\n  Assessment ${index + 1}:`);
        console.log(`    ID: ${assessment.id}`);
        console.log(`    Student ID: ${assessment.student_id}`);
        console.log(`    Assignment ID: ${assessment.assignment_id}`);
        console.log(`    Assignment Details:`);
        console.log(`      - Assignment ID: ${assessment.assessment_assignments.id}`);
        console.log(`      - Student ID: ${assessment.assessment_assignments.student_id}`);
        console.log(`      - Assigned: ${assessment.assessment_assignments.assigned_at}`);
        console.log(`      - Completed: ${assessment.assessment_assignments.completed_at}`);
        console.log(`      - Bulk Assessment: ${assessment.assessment_assignments.bulk_assessments.assessment_name}`);
        console.log(`      - Counselor ID: ${assessment.assessment_assignments.bulk_assessments.counselor_id}`);
      });
    }
    
    // Test the 42-item query for comparison
    console.log('\n--- Testing 42-item Assessment Query (for comparison) ---');
    
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select(`
        *,
        assessment_assignments!inner(
          id,
          student_id,
          assigned_at,
          completed_at,
          bulk_assessments!inner(
            id,
            assessment_name,
            counselor_id,
            assessment_type
          )
        )
      `)
      .eq('assessment_assignments.bulk_assessments.counselor_id', counselorId)
      .eq('assessment_assignments.bulk_assessments.assessment_type', 'ryff_42');
    
    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42);
    } else {
      console.log(`✅ Found ${assessments42?.length || 0} 42-item assessments`);
    }
    
    // Test direct assignment query
    console.log('\n--- Testing Direct Assignment Query ---');
    
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessments!inner(
          id,
          assessment_name,
          counselor_id,
          assessment_type
        ),
        assessments_84items(*)
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('bulk_assessments.assessment_type', 'ryff_84');
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
    } else {
      console.log(`✅ Found ${assignments?.length || 0} assignments`);
      
      assignments?.forEach((assignment, index) => {
        console.log(`\n  Assignment ${index + 1}:`);
        console.log(`    Assignment ID: ${assignment.id}`);
        console.log(`    Student ID: ${assignment.student_id}`);
        console.log(`    Status: ${assignment.status}`);
        console.log(`    Bulk Assessment: ${assignment.bulk_assessments.assessment_name}`);
        console.log(`    Has 84-item assessment: ${assignment.assessments_84items?.length > 0 ? 'Yes' : 'No'}`);
        
        if (assignment.assessments_84items?.length > 0) {
          assignment.assessments_84items.forEach((assessment, aIndex) => {
            console.log(`      Assessment ${aIndex + 1}: ${assessment.id}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testApiEndpoint();