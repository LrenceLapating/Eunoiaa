require('dotenv').config();
const { supabase } = require('./config/database');

async function testAPIEndpoint() {
  try {
    console.log('Testing the assessment-filters API endpoint...');
    
    // Test parameters that the frontend would send
    const testParams = {
      collegeName: 'Nursing College',
      assessmentType: 'ryff_42', // This is what frontend sends for '42-item'
      assessmentName: '2025-2026 2nd Semester - 1st Test 42'
    };
    
    console.log('Test parameters:');
    console.log(`  College Name: ${testParams.collegeName}`);
    console.log(`  Assessment Type: ${testParams.assessmentType}`);
    console.log(`  Assessment Name: ${testParams.assessmentName}`);
    console.log('');
    
    // Simulate the backend logic
    let assessmentQuery = supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [testParams.collegeName])
      .neq('status', 'archived');
    
    // Filter by assessment type if specified
    if (testParams.assessmentType && testParams.assessmentType !== 'all') {
      assessmentQuery = assessmentQuery.eq('assessment_type', testParams.assessmentType);
    }
    
    // Filter by specific assessment name if specified
    if (testParams.assessmentName) {
      assessmentQuery = assessmentQuery.eq('assessment_name', testParams.assessmentName);
    }
    
    const { data: bulkAssessments, error: assessmentError } = await assessmentQuery;
    
    if (assessmentError) {
      console.error('Error:', assessmentError);
      return;
    }
    
    console.log(`Found ${bulkAssessments.length} matching assessments:`);
    bulkAssessments.forEach((assessment, i) => {
      console.log(`  ${i+1}. "${assessment.assessment_name}"`);
      console.log(`     Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
      console.log(`     Sections: ${JSON.stringify(assessment.target_sections)}`);
    });
    console.log('');
    
    // Extract unique year levels and sections
    const yearLevelsSet = new Set();
    const sectionsSet = new Set();
    
    bulkAssessments.forEach(assessment => {
      if (assessment.target_year_levels && Array.isArray(assessment.target_year_levels)) {
        assessment.target_year_levels.forEach(year => {
          if (year !== null && year !== undefined) {
            yearLevelsSet.add(year);
          }
        });
      }
      
      if (assessment.target_sections && Array.isArray(assessment.target_sections)) {
        assessment.target_sections.forEach(section => {
          if (section && section.trim() !== '') {
            sectionsSet.add(section);
          }
        });
      }
    });
    
    const availableYearLevels = Array.from(yearLevelsSet).sort((a, b) => a - b);
    const availableSections = Array.from(sectionsSet).sort();
    
    console.log('Final Results:');
    console.log(`  Year Levels: ${JSON.stringify(availableYearLevels)}`);
    console.log(`  Sections: ${JSON.stringify(availableSections)}`);
    console.log('');
    
    if (availableYearLevels.length === 0) {
      console.log('❌ ISSUE: No year levels found!');
      console.log('   This explains why the Students Year dropdown is empty.');
      
      // Let's check what assessment types exist
      const { data: allAssessments, error: allError } = await supabase
        .from('bulk_assessments')
        .select('assessment_type, assessment_name')
        .contains('target_colleges', [testParams.collegeName]);
        
      if (!allError) {
        console.log('');
        console.log('Available assessment types in database:');
        const types = [...new Set(allAssessments.map(a => a.assessment_type))];
        types.forEach(type => {
          console.log(`  - ${type}`);
        });
        
        console.log('');
        console.log('Available assessment names:');
        allAssessments.forEach(a => {
          console.log(`  - "${a.assessment_name}" (type: ${a.assessment_type})`);
        });
      }
    } else {
      console.log('✅ SUCCESS: Year levels found!');
    }
    
  } catch (error) {
    console.error('Error testing API endpoint:', error);
  }
}

testAPIEndpoint();