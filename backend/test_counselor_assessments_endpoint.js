const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testCounselorAssessmentsEndpoint() {
  console.log('=== TESTING COUNSELOR ASSESSMENTS ENDPOINT ===\n');
  
  try {
    // Get a college that has completed assessments
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('college')
      .not('college', 'is', null);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    const colleges = [...new Set(students.map(s => s.college))];
    console.log('Available colleges:', colleges);
    
    if (colleges.length === 0) {
      console.log('No colleges found');
      return;
    }
    
    const testCollege = colleges[0];
    console.log(`\nTesting with college: ${testCollege}`);
    
    // Test the exact query from counselorAssessments.js
    console.log('\n1. Testing the current counselor assessments query...');
    
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        student:students(*),
        assignment:bulk_assessments(*)
      `)
      .eq('students.college', testCollege)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    
    if (assessmentsError) {
      console.error('Error in assessments query:', assessmentsError);
    } else {
      console.log(`Found ${assessments.length} completed assignments for ${testCollege}`);
      
      if (assessments.length > 0) {
        console.log('\nSample assessment assignment:');
        console.log(JSON.stringify(assessments[0], null, 2));
        
        // Now check if we can find the actual assessment data for this assignment
        const assignmentId = assessments[0].id;
        console.log(`\nLooking for assessment data for assignment ID: ${assignmentId}`);
        
        const { data: assessment42, error: error42 } = await supabase
          .from('assessments_42items')
          .select('*')
          .eq('assignment_id', assignmentId)
          .single();
        
        const { data: assessment84, error: error84 } = await supabase
          .from('assessments_84items')
          .select('*')
          .eq('assignment_id', assignmentId)
          .single();
        
        if (assessment42) {
          console.log('\nFound 42-item assessment data:');
          console.log(`- Overall Score: ${assessment42.overall_score}`);
          console.log(`- Risk Level: ${assessment42.risk_level}`);
          console.log(`- Scores:`, assessment42.scores);
        } else if (error42.code !== 'PGRST116') {
          console.log('Error fetching 42-item assessment:', error42);
        } else {
          console.log('No 42-item assessment data found');
        }
        
        if (assessment84) {
          console.log('\nFound 84-item assessment data:');
          console.log(`- Overall Score: ${assessment84.overall_score}`);
          console.log(`- Risk Level: ${assessment84.risk_level}`);
          console.log(`- Scores:`, assessment84.scores);
        } else if (error84.code !== 'PGRST116') {
          console.log('Error fetching 84-item assessment:', error84);
        } else {
          console.log('No 84-item assessment data found');
        }
      }
    }
    
    // Test what the frontend is actually calling
    console.log('\n2. Testing what the frontend should receive...');
    
    // Simulate the enrichment process
    if (assessments && assessments.length > 0) {
      console.log('\nEnriching assessments with actual assessment data...');
      
      for (let i = 0; i < Math.min(3, assessments.length); i++) {
        const assessment = assessments[i];
        console.log(`\nProcessing assessment ${i + 1}:`);
        console.log(`- Assignment ID: ${assessment.id}`);
        console.log(`- Student: ${assessment.student?.first_name} ${assessment.student?.last_name}`);
        console.log(`- College: ${assessment.student?.college}`);
        console.log(`- Assessment Name: ${assessment.assignment?.assessment_name}`);
        
        // Try to get the actual assessment data
        const { data: assessment42 } = await supabase
          .from('assessments_42items')
          .select('*')
          .eq('assignment_id', assessment.id)
          .single();
        
        const { data: assessment84 } = await supabase
          .from('assessments_84items')
          .select('*')
          .eq('assignment_id', assessment.id)
          .single();
        
        const actualAssessment = assessment42 || assessment84;
        
        if (actualAssessment) {
          console.log(`- FOUND ASSESSMENT DATA:`);
          console.log(`  * Overall Score: ${actualAssessment.overall_score}`);
          console.log(`  * Risk Level: ${actualAssessment.risk_level}`);
          console.log(`  * Assessment Type: ${actualAssessment.assessment_type}`);
        } else {
          console.log(`- NO ASSESSMENT DATA FOUND`);
        }
      }
    }
    
    // Test the specific endpoint call
    console.log('\n3. Testing the actual API endpoint call...');
    
    const response = await fetch(`http://localhost:3000/api/counselor-assessments/results?college=${encodeURIComponent(testCollege)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:');
      console.log(`- Total assessments: ${data.assessments?.length || 0}`);
      
      if (data.assessments && data.assessments.length > 0) {
        console.log('\nFirst assessment from API:');
        const firstAssessment = data.assessments[0];
        console.log(`- Overall Score: ${firstAssessment.overall_score}`);
        console.log(`- Risk Level: ${firstAssessment.risk_level}`);
        console.log(`- Student College: ${firstAssessment.student?.college}`);
        console.log(`- Assessment Name: ${firstAssessment.assignment?.assessment_name}`);
      }
    } else {
      console.log('API call failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('Test script error:', error);
  }
}

testCounselorAssessmentsEndpoint();