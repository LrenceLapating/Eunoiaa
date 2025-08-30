// Check if there are actual assessment responses for the specific assessment
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const ASSESSMENT_ID = '873d2505-42a9-44e0-91aa-801f55743934';
const ASSESSMENT_NAME = '2025-2026 2nd Semester - 1st Test 42';

async function checkAssessmentResponses() {
  console.log('🔍 Checking assessment responses for:', ASSESSMENT_NAME);
  console.log('🆔 Assessment ID:', ASSESSMENT_ID);
  
  try {
    // Check completed assignments
    console.log('\n📋 1. Checking completed assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        status,
        completed_at,
        students!inner(
          id,
          student_id,
          college,
          year_level,
          section
        )
      `)
      .eq('bulk_assessment_id', ASSESSMENT_ID)
      .eq('status', 'completed');
    
    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`Found ${assignments.length} completed assignments`);
    if (assignments.length > 0) {
      console.log('Sample assignment with student data:', JSON.stringify(assignments[0], null, 2));
      
      // Group by college
      const collegeGroups = assignments.reduce((acc, assignment) => {
        const college = assignment.students.college;
        if (!acc[college]) acc[college] = [];
        acc[college].push(assignment);
        return acc;
      }, {});
      
      console.log('\nAssignments by college:');
      Object.entries(collegeGroups).forEach(([college, assignments]) => {
        console.log(`- ${college}: ${assignments.length} students`);
      });
    }
    
    // Check if there are actual assessment responses
    console.log('\n📋 2. Checking for assessment responses...');
    
    // Get student IDs from completed assignments
    const studentIds = assignments.map(a => a.student_id);
    console.log(`Looking for responses from ${studentIds.length} students`);
    
    if (studentIds.length > 0) {
      // Check assessments_42items table using student_id directly
      const { data: responses, error: responseError } = await supabase
        .from('assessments_42items')
        .select('*')
        .in('student_id', studentIds)
        .limit(5);
      
      if (responseError) {
        console.error('Error fetching 42-item responses:', responseError);
      } else {
        console.log(`Found ${responses.length} assessment responses in assessments_42items`);
        if (responses.length > 0) {
          console.log('Sample response:', JSON.stringify(responses[0], null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssessmentResponses().catch(console.error);