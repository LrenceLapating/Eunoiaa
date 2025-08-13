require('dotenv').config();
const { supabase } = require('./config/database');

async function checkAssessmentTypes() {
  try {
    console.log('Checking assessment types in assessments_42items...');
    const { data: data42, error: error42 } = await supabase
      .from('assessments_42items')
      .select('id, assessment_type, student_id, completed_at')
      .order('completed_at', { ascending: false });
    
    if (error42) {
      console.error('Error querying assessments_42items:', error42);
    } else {
      console.log('All assessments in assessments_42items:');
      data42.forEach(assessment => {
        console.log(`- ID: ${assessment.id}, Type: ${assessment.assessment_type}, Student: ${assessment.student_id}, Completed: ${assessment.completed_at}`);
      });
    }

    console.log('\nChecking if unified assessments view exists...');
    const { data: viewExists, error: viewError } = await supabase
      .rpc('check_view_exists', { view_name: 'assessments' })
      .single();
    
    if (viewError) {
      console.log('Cannot check view existence, trying direct query...');
      // Try to query the view directly
      const { data: viewData, error: directError } = await supabase
        .from('assessments')
        .select('count', { count: 'exact', head: true });
      
      if (directError) {
        console.log('Unified assessments view does NOT exist');
        console.log('Error:', directError.message);
      } else {
        console.log('Unified assessments view EXISTS');
      }
    }

    console.log('\nChecking counselor assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id, student_id, status, assigned_at, completed_at,
        bulk_assessment:bulk_assessments!inner(
          id, counselor_id, assessment_name, status
        )
      `)
      .eq('bulk_assessments.counselor_id', 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7');
    
    if (assignError) {
      console.error('Error querying assignments for counselor:', assignError);
    } else {
      console.log(`Found ${assignments.length} assignments for counselor d84e3473-e7f0-4fbd-8db1-a59e27917ee7:`);
      assignments.forEach(assignment => {
        console.log(`- Assignment ID: ${assignment.id}, Student: ${assignment.student_id}, Status: ${assignment.status}`);
      });
    }

  } catch (error) {
    console.error('Error checking assessment types:', error);
  }
  
  process.exit(0);
}

checkAssessmentTypes();