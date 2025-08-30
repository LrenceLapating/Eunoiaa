require('dotenv').config();
const { supabase } = require('./config/database');

async function testBypassAuth() {
  try {
    console.log('Testing assessment names API by directly querying database...');
    
    // Let's replicate what the /assessment-names endpoint does
    const college_id = 'CCS';
    const assessment_type = 'ryff_42';
    
    console.log(`\nQuerying bulk_assessments for college_id: ${college_id}, assessment_type: ${assessment_type}`);
    
    const { data: assessments, error } = await supabase
      .from('bulk_assessments')
      .select('assessment_name')
      .eq('college_id', college_id)
      .eq('assessment_type', assessment_type);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log('Raw assessments data:', assessments);
    
    // Get unique assessment names
    const uniqueNames = [...new Set(assessments.map(a => a.assessment_name))];
    
    console.log('\nUnique assessment names:');
    uniqueNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    // Now let's test what happens when we select one of these assessment names
    if (uniqueNames.length > 0) {
      const selectedAssessment = uniqueNames[0];
      console.log(`\nTesting with selected assessment: "${selectedAssessment}"`);
      
      // This is what the frontend should be doing after selecting an assessment
      console.log('\nQuerying for years and sections for this assessment...');
      
      const { data: filterData, error: filterError } = await supabase
        .from('bulk_assessments')
        .select('target_year_levels, target_sections')
        .eq('college_id', college_id)
        .eq('assessment_type', assessment_type)
        .eq('assessment_name', selectedAssessment);
      
      if (filterError) {
        console.error('Filter query error:', filterError);
        return;
      }
      
      console.log('Filter data for selected assessment:', filterData);
      
      // Extract unique years and sections
      const allYears = [];
      const allSections = [];
      
      filterData.forEach(item => {
        if (item.target_year_levels) {
          allYears.push(...item.target_year_levels);
        }
        if (item.target_sections) {
          allSections.push(...item.target_sections);
        }
      });
      
      const uniqueYears = [...new Set(allYears)].sort();
      const uniqueSections = [...new Set(allSections)].sort();
      
      console.log('\nAvailable years:', uniqueYears);
      console.log('Available sections:', uniqueSections);
      
      // This is the data that should populate the dropdowns
      const result = {
        yearLevels: uniqueYears,
        sections: uniqueSections,
        totalAssessments: filterData.length
      };
      
      console.log('\nFinal result that should populate dropdowns:');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testBypassAuth();