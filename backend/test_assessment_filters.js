const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAssessmentFilters() {
  console.log('Testing assessment filters endpoint logic...');
  
  const collegeName = 'CCS';
  const assessmentType = 'ryff_42';
  
  console.log(`\nTesting for college: ${collegeName}, assessment type: ${assessmentType}`);
  
  try {
    // Step 1: Get bulk assessments for the college and assessment type
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_type', assessmentType)
      .contains('target_colleges', [collegeName]);
    
    if (bulkError) {
      console.error('Error querying bulk_assessments:', bulkError);
      return;
    }
    
    console.log(`Found ${bulkAssessments.length} bulk assessments`);
    
    if (bulkAssessments.length === 0) {
      console.log('No bulk assessments found for this college and assessment type');
      return;
    }
    
    // Step 2: Get all students from the target college to see available year levels and sections
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('year_level, section')
      .eq('college', collegeName);
    
    if (studentsError) {
      console.error('Error querying students:', studentsError);
      return;
    }
    
    console.log(`Found ${students.length} students in ${collegeName}`);
    
    // Extract unique year levels and sections
    const allYearLevels = new Set();
    const allSections = new Set();
    
    students.forEach(student => {
      if (student.year_level) {
        allYearLevels.add(student.year_level);
      }
      if (student.section) {
        allSections.add(student.section);
      }
    });
    
    const yearLevels = Array.from(allYearLevels).sort();
    const sections = Array.from(allSections).sort();
    
    console.log('\n=== RESULTS ===');
    console.log('Available Year Levels:', yearLevels);
    console.log('Available Sections:', sections);
    
    // This is what the API endpoint would return
    const result = {
      yearLevels,
      sections
    };
    
    console.log('\nAPI Response would be:', JSON.stringify(result, null, 2));
    
    // Show some sample students
    console.log('\nSample students:');
    students.slice(0, 5).forEach(student => {
      console.log(`- Year ${student.year_level}, Section: ${student.section}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAssessmentFilters();