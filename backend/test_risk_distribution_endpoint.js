const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructures() {
  console.log('🧪 Checking Table Structures');
  console.log('=' .repeat(50));

  try {
    // Check bulk_assessments table structure
    console.log('\n📋 Checking bulk_assessments table...');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(3);
    
    if (bulkError) {
      console.error('❌ Error fetching bulk_assessments:', bulkError);
    } else {
      console.log(`✅ Found ${bulkAssessments?.length || 0} bulk assessments`);
      if (bulkAssessments && bulkAssessments.length > 0) {
        console.log('📄 Sample bulk assessment:', bulkAssessments[0]);
        console.log('📄 Available columns:', Object.keys(bulkAssessments[0]));
      }
    }
    
    // Check assessment_assignments table structure
    console.log('\n📋 Checking assessment_assignments table...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .limit(3);
    
    if (assignmentError) {
      console.error('❌ Error fetching assessment_assignments:', assignmentError);
    } else {
      console.log(`✅ Found ${assignments?.length || 0} assignments`);
      if (assignments && assignments.length > 0) {
        console.log('📄 Sample assignment:', assignments[0]);
        console.log('📄 Available columns:', Object.keys(assignments[0]));
      }
    }
    
    // Check students table structure
    console.log('\n📋 Checking students table...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .limit(3);
    
    if (studentError) {
      console.error('❌ Error fetching students:', studentError);
    } else {
      console.log(`✅ Found ${students?.length || 0} students`);
      if (students && students.length > 0) {
        console.log('📄 Sample student:', students[0]);
        console.log('📄 Available columns:', Object.keys(students[0]));
      }
    }
    
    // Test a simple query to get risk distribution data
    console.log('\n📊 Testing simple risk distribution query...');
    const { data: riskData, error: riskError } = await supabase
      .from('assessment_assignments')
      .select('id, student_id, bulk_assessment_id, status, risk_level')
      .eq('status', 'completed')
      .not('risk_level', 'is', null)
      .limit(10);
    
    if (riskError) {
      console.error('❌ Error fetching risk data:', riskError);
    } else {
      console.log(`✅ Found ${riskData?.length || 0} assignments with risk levels`);
      if (riskData && riskData.length > 0) {
        const riskLevelCounts = {};
        riskData.forEach(item => {
          const riskLevel = item.risk_level;
          riskLevelCounts[riskLevel] = (riskLevelCounts[riskLevel] || 0) + 1;
        });
        console.log('📊 Risk level distribution:', riskLevelCounts);
        console.log('📄 Sample risk data:', riskData.slice(0, 3));
      }
    }
    
    console.log('\n✅ Table Structure Analysis Completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
checkTableStructures();