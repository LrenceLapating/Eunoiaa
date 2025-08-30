require('dotenv').config();
const { supabase } = require('./config/database');

async function debugQueryParams() {
  console.log('🔍 Debugging Query Parameter Handling');
  console.log('============================================================');
  
  try {
    const collegeName = 'College of Computer Studies';
    const assessmentType = 'ryff_42';
    
    // Test 1: Query without assessment name
    console.log('📋 Test 1: Query WITHOUT assessment name');
    
    let assessmentQuery1 = supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .neq('status', 'archived');
    
    if (assessmentType && assessmentType !== 'all') {
      assessmentQuery1 = assessmentQuery1.eq('assessment_type', assessmentType);
    }
    
    // No assessment name filter here
    console.log('   Query: No assessment name filter applied');
    
    const { data: result1, error: error1 } = await assessmentQuery1;
    if (error1) throw error1;
    
    console.log(`   Found ${result1.length} assessments:`);
    result1.forEach((assessment, index) => {
      console.log(`     ${index + 1}. "${assessment.assessment_name}"`);
      console.log(`        Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
      console.log(`        Sections: ${JSON.stringify(assessment.target_sections)}`);
    });
    console.log('');
    
    // Test 2: Query with specific assessment name
    console.log('📋 Test 2: Query WITH specific assessment name');
    
    const specificAssessmentName = 'Test';
    
    let assessmentQuery2 = supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .neq('status', 'archived');
    
    if (assessmentType && assessmentType !== 'all') {
      assessmentQuery2 = assessmentQuery2.eq('assessment_type', assessmentType);
    }
    
    // Add assessment name filter
    assessmentQuery2 = assessmentQuery2.eq('assessment_name', specificAssessmentName);
    console.log(`   Query: Filtered by assessment name "${specificAssessmentName}"`);
    
    const { data: result2, error: error2 } = await assessmentQuery2;
    if (error2) throw error2;
    
    console.log(`   Found ${result2.length} assessments:`);
    result2.forEach((assessment, index) => {
      console.log(`     ${index + 1}. "${assessment.assessment_name}"`);
      console.log(`        Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
      console.log(`        Sections: ${JSON.stringify(assessment.target_sections)}`);
    });
    console.log('');
    
    // Process results like the endpoint does
    console.log('🔄 Processing results like the endpoint...');
    
    // Process result1 (no assessment name)
    const yearLevelsSet1 = new Set();
    const sectionsSet1 = new Set();
    
    result1.forEach(assessment => {
      if (assessment.target_year_levels && Array.isArray(assessment.target_year_levels)) {
        assessment.target_year_levels.forEach(year => {
          if (year !== null && year !== undefined) {
            yearLevelsSet1.add(year);
          }
        });
      }
      
      if (assessment.target_sections && Array.isArray(assessment.target_sections)) {
        assessment.target_sections.forEach(section => {
          if (section && section.trim() !== '') {
            sectionsSet1.add(section);
          }
        });
      }
    });
    
    const availableYearLevels1 = Array.from(yearLevelsSet1).sort((a, b) => a - b);
    const availableSections1 = Array.from(sectionsSet1).sort();
    
    console.log('   Result 1 (no assessment name):');
    console.log(`     Year Levels: ${JSON.stringify(availableYearLevels1)}`);
    console.log(`     Sections: ${JSON.stringify(availableSections1)}`);
    console.log(`     Sections Count: ${availableSections1.length}`);
    console.log('');
    
    // Process result2 (with assessment name)
    const yearLevelsSet2 = new Set();
    const sectionsSet2 = new Set();
    
    result2.forEach(assessment => {
      if (assessment.target_year_levels && Array.isArray(assessment.target_year_levels)) {
        assessment.target_year_levels.forEach(year => {
          if (year !== null && year !== undefined) {
            yearLevelsSet2.add(year);
          }
        });
      }
      
      if (assessment.target_sections && Array.isArray(assessment.target_sections)) {
        assessment.target_sections.forEach(section => {
          if (section && section.trim() !== '') {
            sectionsSet2.add(section);
          }
        });
      }
    });
    
    const availableYearLevels2 = Array.from(yearLevelsSet2).sort((a, b) => a - b);
    const availableSections2 = Array.from(sectionsSet2).sort();
    
    console.log('   Result 2 (with assessment name):');
    console.log(`     Year Levels: ${JSON.stringify(availableYearLevels2)}`);
    console.log(`     Sections: ${JSON.stringify(availableSections2)}`);
    console.log(`     Sections Count: ${availableSections2.length}`);
    console.log('');
    
    console.log('🎯 FINAL COMPARISON:');
    if (availableSections1.length > availableSections2.length) {
      console.log('✅ SUCCESS: Query without assessment name returns MORE sections!');
      console.log('   This means the filtering is working correctly.');
    } else if (availableSections1.length === availableSections2.length) {
      console.log('⚠️  WARNING: Both queries return the same number of sections.');
      console.log('   This might indicate an issue with the data or logic.');
    } else {
      console.log('❌ ERROR: Query without assessment name returns FEWER sections.');
      console.log('   This indicates a problem with the logic.');
    }
    
  } catch (error) {
    console.error('❌ Error debugging query params:', error);
  }
}

debugQueryParams();