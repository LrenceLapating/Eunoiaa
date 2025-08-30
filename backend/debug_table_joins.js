const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function debugTableJoins() {
  console.log('=== DEBUGGING TABLE JOINS ===\n');
  
  try {
    // Check the structure of assessment_assignments table
    console.log('1. Checking assessment_assignments table structure...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .limit(1);
    
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    } else if (assignments.length > 0) {
      console.log('Assessment assignments columns:', Object.keys(assignments[0]));
      console.log('Sample record:', assignments[0]);
    }
    
    // Check the structure of students table
    console.log('\n2. Checking students table structure...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else if (students.length > 0) {
      console.log('Students columns:', Object.keys(students[0]));
      console.log('Sample record:', students[0]);
    }
    
    // Test manual join using student_id
    console.log('\n3. Testing manual join using student_id...');
    const { data: manualJoin, error: manualJoinError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        students!inner(*)
      `)
      .eq('status', 'completed')
      .limit(5);
    
    if (manualJoinError) {
      console.error('Manual join error:', manualJoinError);
    } else {
      console.log(`Manual join successful! Found ${manualJoin.length} records`);
      if (manualJoin.length > 0) {
        console.log('Sample joined record:');
        console.log('- Assignment ID:', manualJoin[0].id);
        console.log('- Student ID:', manualJoin[0].student_id);
        console.log('- Student Name:', manualJoin[0].students?.first_name, manualJoin[0].students?.last_name);
        console.log('- Student College:', manualJoin[0].students?.college);
      }
    }
    
    // Test join with bulk_assessments
    console.log('\n4. Testing join with bulk_assessments...');
    const { data: bulkJoin, error: bulkJoinError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessments!inner(*)
      `)
      .eq('status', 'completed')
      .limit(5);
    
    if (bulkJoinError) {
      console.error('Bulk assessments join error:', bulkJoinError);
    } else {
      console.log(`Bulk assessments join successful! Found ${bulkJoin.length} records`);
      if (bulkJoin.length > 0) {
        console.log('Sample bulk assessment record:');
        console.log('- Assignment ID:', bulkJoin[0].id);
        console.log('- Bulk Assessment ID:', bulkJoin[0].bulk_assessment_id);
        console.log('- Assessment Name:', bulkJoin[0].bulk_assessments?.assessment_name);
        console.log('- Assessment Type:', bulkJoin[0].bulk_assessments?.assessment_type);
      }
    }
    
    // Test complete join with both tables
    console.log('\n5. Testing complete join with both students and bulk_assessments...');
    const { data: completeJoin, error: completeJoinError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        students!inner(*),
        bulk_assessments!inner(*)
      `)
      .eq('status', 'completed')
      .limit(5);
    
    if (completeJoinError) {
      console.error('Complete join error:', completeJoinError);
    } else {
      console.log(`Complete join successful! Found ${completeJoin.length} records`);
      if (completeJoin.length > 0) {
        console.log('Sample complete record:');
        const record = completeJoin[0];
        console.log('- Assignment ID:', record.id);
        console.log('- Student:', record.students?.first_name, record.students?.last_name);
        console.log('- College:', record.students?.college);
        console.log('- Assessment Name:', record.bulk_assessments?.assessment_name);
        console.log('- Assessment Type:', record.bulk_assessments?.assessment_type);
      }
    }
    
    // Test filtering by college
    console.log('\n6. Testing filtering by college...');
    const { data: collegeFilter, error: collegeFilterError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        students!inner(*),
        bulk_assessments!inner(*)
      `)
      .eq('status', 'completed')
      .eq('students.college', 'Business Administration')
      .limit(5);
    
    if (collegeFilterError) {
      console.error('College filter error:', collegeFilterError);
    } else {
      console.log(`College filter successful! Found ${collegeFilter.length} records for Business Administration`);
      if (collegeFilter.length > 0) {
        console.log('Sample filtered record:');
        const record = collegeFilter[0];
        console.log('- Assignment ID:', record.id);
        console.log('- Student:', record.students?.first_name, record.students?.last_name);
        console.log('- College:', record.students?.college);
        console.log('- Assessment Name:', record.bulk_assessments?.assessment_name);
      }
    }
    
  } catch (error) {
    console.error('Debug table joins script error:', error);
  }
}

debugTableJoins();