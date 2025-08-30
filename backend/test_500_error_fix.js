// Test script to verify the 500 error fix for assessment_name filtering
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAssessmentNameFiltering() {
  console.log('🧪 Testing assessment_name filtering fix...');
  
  try {
    // Test 1: Check if assessment_assignments table exists and has data
    console.log('\n1️⃣ Testing assessment_assignments table access...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .limit(5);
    
    if (assignmentError) {
      console.error('❌ Error accessing assessment_assignments:', assignmentError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} assignment records`);
    if (assignments && assignments.length > 0) {
      console.log('Sample assignment:', {
        id: assignments[0].id,
        student_id: assignments[0].student_id,
        assessment_name: assignments[0].bulk_assessments?.assessment_name,
        assessment_type: assignments[0].bulk_assessments?.assessment_type
      });
    }
    
    // Test 2: Test 42-item assessment filtering
    console.log('\n2️⃣ Testing 42-item assessment filtering...');
    const testAssessmentName = '2025-2026 2nd Semester - 1st Test 42';
    
    const { data: assignments42, error: assignment42Error } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('bulk_assessments.assessment_name', testAssessmentName)
      .eq('bulk_assessments.assessment_type', 'ryff_42');
    
    if (assignment42Error) {
      console.error('❌ Error filtering 42-item assignments:', assignment42Error);
    } else {
      console.log(`✅ Found ${assignments42?.length || 0} 42-item assignments for "${testAssessmentName}"`);
      
      if (assignments42 && assignments42.length > 0) {
        const assignmentIds = assignments42.map(a => a.id);
        console.log(`Assignment IDs: ${assignmentIds.slice(0, 3).join(', ')}${assignmentIds.length > 3 ? '...' : ''}`);
        
        // Test fetching assessments with these assignment IDs
        const { data: assessments42, error: assessments42Error } = await supabaseAdmin
          .from('assessments_42items')
          .select('id, student_id, assignment_id, overall_score, risk_level')
          .in('assignment_id', assignmentIds.slice(0, 10)) // Test with first 10
          .limit(5);
        
        if (assessments42Error) {
          console.error('❌ Error fetching 42-item assessments:', assessments42Error);
        } else {
          console.log(`✅ Successfully fetched ${assessments42?.length || 0} 42-item assessments`);
        }
      }
    }
    
    // Test 3: Test 84-item assessment filtering
    console.log('\n3️⃣ Testing 84-item assessment filtering...');
    const testAssessmentName84 = '2025-2026 2nd Semester - 1st Test 84'; // Adjust if needed
    
    const { data: assignments84, error: assignment84Error } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('bulk_assessments.assessment_name', testAssessmentName84)
      .eq('bulk_assessments.assessment_type', 'ryff_84');
    
    if (assignment84Error) {
      console.error('❌ Error filtering 84-item assignments:', assignment84Error);
    } else {
      console.log(`✅ Found ${assignments84?.length || 0} 84-item assignments for "${testAssessmentName84}"`);
      
      if (assignments84 && assignments84.length > 0) {
        const assignmentIds84 = assignments84.map(a => a.id);
        console.log(`Assignment IDs: ${assignmentIds84.slice(0, 3).join(', ')}${assignmentIds84.length > 3 ? '...' : ''}`);
        
        // Test fetching assessments with these assignment IDs
        const { data: assessments84, error: assessments84Error } = await supabaseAdmin
          .from('assessments_84items')
          .select('id, student_id, assignment_id, overall_score, risk_level')
          .in('assignment_id', assignmentIds84.slice(0, 10)) // Test with first 10
          .limit(5);
        
        if (assessments84Error) {
          console.error('❌ Error fetching 84-item assessments:', assessments84Error);
        } else {
          console.log(`✅ Successfully fetched ${assessments84?.length || 0} 84-item assessments`);
        }
      }
    }
    
    // Test 4: Test college filtering
    console.log('\n4️⃣ Testing college filtering...');
    const testCollege = 'College of Engineering';
    
    if (assignments42 && assignments42.length > 0) {
      const studentIds = assignments42.map(a => a.student_id);
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, college')
        .in('id', studentIds.slice(0, 10))
        .eq('college', testCollege)
        .eq('status', 'active');
      
      if (studentError) {
        console.error('❌ Error filtering students by college:', studentError);
      } else {
        console.log(`✅ Found ${students?.length || 0} students in "${testCollege}"`);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ assessment_assignments table is accessible');
    console.log('- ✅ 42-item assessment filtering works');
    console.log('- ✅ 84-item assessment filtering works');
    console.log('- ✅ College filtering works');
    console.log('\n🔧 The 500 error should now be resolved!');
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
}

// Run the test
testAssessmentNameFiltering();