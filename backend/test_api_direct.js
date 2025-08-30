const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAssessmentFiltersAPI() {
  try {
    console.log('Testing assessment filters API...');
    
    // Test parameters
    const collegeName = 'CCS';
    const assessmentType = 'ryff_42';
    
    console.log(`\nTesting for college: ${collegeName}, assessment type: ${assessmentType}`);
    
    // Step 1: Check bulk_assessments table
    console.log('\n1. Checking bulk_assessments table...');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .contains('target_colleges', [collegeName])
      .eq('assessment_type', assessmentType);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`Found ${bulkAssessments?.length || 0} bulk assessments`);
    if (bulkAssessments && bulkAssessments.length > 0) {
      console.log('Sample bulk assessment:', JSON.stringify(bulkAssessments[0], null, 2));
    }
    
    // Step 2: Check students table
    console.log('\n2. Checking students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('college', collegeName)
      .eq('status', 'active');
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    console.log(`Found ${students?.length || 0} active students in ${collegeName}`);
    if (students && students.length > 0) {
      console.log('Sample student:', JSON.stringify(students[0], null, 2));
      
      // Extract unique year levels and sections
      const yearLevels = [...new Set(students.map(s => s.year_level).filter(y => y !== null && y !== undefined))];
      const sections = [...new Set(students.map(s => s.section).filter(s => s && s.trim() !== ''))];
      
      console.log('\n3. Extracted data:');
      console.log('Year levels:', yearLevels.sort((a, b) => a - b));
      console.log('Sections:', sections.sort());
      
      // Simulate API response
      const apiResponse = {
        success: true,
        data: {
          yearLevels: yearLevels.sort((a, b) => a - b),
          sections: sections.sort(),
          bulkAssessments: bulkAssessments || []
        }
      };
      
      console.log('\n4. Simulated API Response:');
      console.log(JSON.stringify(apiResponse, null, 2));
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testAssessmentFiltersAPI();