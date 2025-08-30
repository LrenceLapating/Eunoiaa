const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function debugRiskDistributionIssue() {
  console.log('=== DEBUGGING RISK DISTRIBUTION ISSUE ===\n');
  
  try {
    // 1. Check what's in assessment_assignments table
    console.log('1. Checking assessment_assignments table...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .limit(10);
    
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    } else {
      console.log(`Found ${assignments.length} assignment records`);
      console.log('Sample assignment:', JSON.stringify(assignments[0], null, 2));
    }
    
    // 2. Check what's in assessments_42items table
    console.log('\n2. Checking assessments_42items table...');
    const { data: assessments42, error: assessments42Error } = await supabase
      .from('assessments_42items')
      .select('*')
      .limit(10);
    
    if (assessments42Error) {
      console.error('Error fetching 42-item assessments:', assessments42Error);
    } else {
      console.log(`Found ${assessments42.length} 42-item assessment records`);
      if (assessments42.length > 0) {
        console.log('Sample 42-item assessment:', JSON.stringify(assessments42[0], null, 2));
      }
    }
    
    // 3. Check what's in assessments_84items table
    console.log('\n3. Checking assessments_84items table...');
    const { data: assessments84, error: assessments84Error } = await supabase
      .from('assessments_84items')
      .select('*')
      .limit(10);
    
    if (assessments84Error) {
      console.error('Error fetching 84-item assessments:', assessments84Error);
    } else {
      console.log(`Found ${assessments84.length} 84-item assessment records`);
      if (assessments84.length > 0) {
        console.log('Sample 84-item assessment:', JSON.stringify(assessments84[0], null, 2));
      }
    }
    
    // 4. Check bulk_assessments table
    console.log('\n4. Checking bulk_assessments table...');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(10);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
    } else {
      console.log(`Found ${bulkAssessments.length} bulk assessment records`);
      if (bulkAssessments.length > 0) {
        console.log('Sample bulk assessment:', JSON.stringify(bulkAssessments[0], null, 2));
      }
    }
    
    // 5. Check students table
    console.log('\n5. Checking students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    } else {
      console.log(`Found ${students.length} student records`);
      if (students.length > 0) {
        console.log('Sample student:', JSON.stringify(students[0], null, 2));
      }
    }
    
    // 6. Test the actual query that the frontend is trying to use
    console.log('\n6. Testing the actual counselor assessments query...');
    
    // First, let's see what colleges we have
    const { data: colleges, error: collegesError } = await supabase
      .from('students')
      .select('college')
      .not('college', 'is', null);
    
    if (collegesError) {
      console.error('Error fetching colleges:', collegesError);
    } else {
      const uniqueColleges = [...new Set(colleges.map(s => s.college))];
      console.log('Available colleges:', uniqueColleges);
      
      if (uniqueColleges.length > 0) {
        const testCollege = uniqueColleges[0];
        console.log(`\nTesting with college: ${testCollege}`);
        
        // Test the query similar to what counselorAssessments.js does
        const { data: testResults, error: testError } = await supabase
          .from('assessment_assignments')
          .select(`
            *,
            student:students(*),
            assignment:bulk_assessments(*)
          `)
          .eq('students.college', testCollege)
          .eq('status', 'completed')
          .limit(10);
        
        if (testError) {
          console.error('Error in test query:', testError);
        } else {
          console.log(`Found ${testResults.length} completed assignments for ${testCollege}`);
          if (testResults.length > 0) {
            console.log('Sample result:', JSON.stringify(testResults[0], null, 2));
          }
        }
      }
    }
    
    // 7. Check if there are any completed assignments with actual assessment data
    console.log('\n7. Checking for completed assignments with assessment data...');
    
    const { data: completedAssignments, error: completedError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'completed')
      .limit(10);
    
    if (completedError) {
      console.error('Error fetching completed assignments:', completedError);
    } else {
      console.log(`Found ${completedAssignments.length} completed assignments`);
      
      for (const assignment of completedAssignments) {
        console.log(`\nChecking assignment ${assignment.id}:`);
        console.log(`- Student ID: ${assignment.student_id}`);
        console.log(`- Bulk Assessment ID: ${assignment.bulk_assessment_id}`);
        
        // Check if this assignment has corresponding assessment data
        const { data: assessment42, error: error42 } = await supabase
          .from('assessments_42items')
          .select('*')
          .eq('assignment_id', assignment.id)
          .single();
        
        const { data: assessment84, error: error84 } = await supabase
          .from('assessments_84items')
          .select('*')
          .eq('assignment_id', assignment.id)
          .single();
        
        if (assessment42) {
          console.log(`- Has 42-item assessment data with overall_score: ${assessment42.overall_score}`);
        } else if (error42.code !== 'PGRST116') {
          console.log(`- Error checking 42-item: ${error42.message}`);
        } else {
          console.log('- No 42-item assessment data');
        }
        
        if (assessment84) {
          console.log(`- Has 84-item assessment data with overall_score: ${assessment84.overall_score}`);
        } else if (error84.code !== 'PGRST116') {
          console.log(`- Error checking 84-item: ${error84.message}`);
        } else {
          console.log('- No 84-item assessment data');
        }
      }
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
}

debugRiskDistributionIssue();