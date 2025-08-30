// Check assessment data without using foreign key joins
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const ASSESSMENT_ID = '873d2505-42a9-44e0-91aa-801f55743934';
const ASSESSMENT_NAME = '2025-2026 2nd Semester - 1st Test 42';

async function checkAssessmentDataFixed() {
  console.log('🔍 Checking assessment data for:', ASSESSMENT_NAME);
  console.log('🆔 Assessment ID:', ASSESSMENT_ID);
  
  try {
    // Step 1: Check completed assignments (without join)
    console.log('\n📋 1. Checking completed assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', ASSESSMENT_ID)
      .eq('status', 'completed');
    
    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`Found ${assignments.length} completed assignments`);
    if (assignments.length > 0) {
      console.log('Sample assignment:', JSON.stringify(assignments[0], null, 2));
      
      // Step 2: Get student data for these assignments
      const studentIds = assignments.map(a => a.student_id);
      console.log(`\n📋 2. Getting student data for ${studentIds.length} students...`);
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);
      
      if (studentError) {
        console.error('Error fetching students:', studentError);
      } else {
        console.log(`Found ${students.length} student records`);
        if (students.length > 0) {
          console.log('Sample student:', JSON.stringify(students[0], null, 2));
          
          // Group by college
          const collegeGroups = students.reduce((acc, student) => {
            const college = student.college;
            if (!acc[college]) acc[college] = [];
            acc[college].push(student);
            return acc;
          }, {});
          
          console.log('\nStudents by college:');
          Object.entries(collegeGroups).forEach(([college, students]) => {
            console.log(`- ${college}: ${students.length} students`);
          });
        }
      }
      
      // Step 3: Check for actual assessment responses
      console.log(`\n📋 3. Checking for assessment responses...`);
      
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
          console.log('Sample response columns:', Object.keys(responses[0]));
          console.log('Sample response:', JSON.stringify(responses[0], null, 2));
        }
      }
      
      // Step 4: Check if college scores exist for this assessment
      console.log(`\n📋 4. Checking existing college scores...`);
      
      const { data: collegeScores, error: scoresError } = await supabase
        .from('college_scores')
        .select('*')
        .eq('assessment_name', ASSESSMENT_NAME);
      
      if (scoresError) {
        console.error('Error fetching college scores:', scoresError);
      } else {
        console.log(`Found ${collegeScores.length} existing college score records for this assessment`);
        if (collegeScores.length > 0) {
          console.log('Sample college score:', JSON.stringify(collegeScores[0], null, 2));
        } else {
          console.log('❌ No college scores found for this assessment - this is the problem!');
          console.log('✅ Solution: Need to trigger college score calculation for this assessment');
        }
      }
      
    } else {
      console.log('❌ No completed assignments found for this assessment');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssessmentDataFixed().catch(console.error);