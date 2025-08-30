const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkStudentsTableStructure() {
  console.log('=== CHECKING STUDENTS TABLE STRUCTURE ===\n');
  
  try {
    // Get a sample student record to see the actual columns
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else if (students && students.length > 0) {
      console.log('Students table columns:', Object.keys(students[0]));
      console.log('\nSample student record:');
      console.log(JSON.stringify(students[0], null, 2));
    } else {
      console.log('No students found in the table');
    }
    
    // Also check a few more students to see the data pattern
    console.log('\n=== CHECKING MULTIPLE STUDENTS ===');
    const { data: moreStudents, error: moreError } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (moreError) {
      console.error('Error fetching more students:', moreError);
    } else {
      console.log(`Found ${moreStudents?.length || 0} students`);
      moreStudents?.forEach((student, index) => {
        console.log(`\nStudent ${index + 1}:`);
        console.log(`- ID: ${student.id}`);
        console.log(`- Name: ${student.name || 'N/A'}`);
        console.log(`- College: ${student.college || 'N/A'}`);
        console.log(`- Year Level: ${student.year_level || 'N/A'}`);
        console.log(`- Section: ${student.section || 'N/A'}`);
        console.log(`- Status: ${student.status || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Check students table script error:', error);
  }
}

checkStudentsTableStructure();