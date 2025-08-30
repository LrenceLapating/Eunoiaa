require('dotenv').config();
const { supabase } = require('./config/database');

async function testSpecificAssessmentFilter() {
  console.log('🎯 Testing Specific Assessment Name Filtering');
  console.log('============================================================');
  
  try {
    const collegeName = 'College of Computer Studies';
    const assessmentType = 'ryff_42';
    
    // First, get all assessments for this college to see what's available
    console.log('📋 Step 1: Getting all available assessments...');
    const { data: allAssessments, error: allError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .eq('assessment_type', assessmentType)
      .neq('status', 'archived');
    
    if (allError) throw allError;
    
    console.log(`Found ${allAssessments.length} assessments:`);
    allAssessments.forEach((assessment, index) => {
      console.log(`   ${index + 1}. "${assessment.assessment_name}"`);
      console.log(`      Target Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
      console.log(`      Target Sections: ${JSON.stringify(assessment.target_sections)}`);
      console.log('');
    });
    
    // Test filtering by specific assessment name
    if (allAssessments.length > 0) {
      const testAssessmentName = allAssessments[0].assessment_name;
      
      console.log(`🔍 Step 2: Testing filter for specific assessment: "${testAssessmentName}"`);
      
      const { data: filteredAssessments, error: filterError } = await supabase
        .from('bulk_assessments')
        .select('id, assessment_name, target_year_levels, target_sections')
        .contains('target_colleges', [collegeName])
        .eq('assessment_type', assessmentType)
        .eq('assessment_name', testAssessmentName)
        .neq('status', 'archived');
      
      if (filterError) throw filterError;
      
      console.log(`Found ${filteredAssessments.length} assessment(s) with specific name:`);
      filteredAssessments.forEach((assessment, index) => {
        console.log(`   ${index + 1}. "${assessment.assessment_name}"`);
        console.log(`      Target Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
        console.log(`      Target Sections: ${JSON.stringify(assessment.target_sections)}`);
        console.log('');
      });
      
      // Extract unique year levels and sections (same logic as endpoint)
      const yearLevelsSet = new Set();
      const sectionsSet = new Set();
      
      filteredAssessments.forEach(assessment => {
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
      
      console.log('🎯 FILTERED RESULTS (what frontend should receive):');
      console.log(`   Year Levels: ${JSON.stringify(availableYearLevels)}`);
      console.log(`   Sections: ${JSON.stringify(availableSections)}`);
      console.log(`   Total Assessments: ${filteredAssessments.length}`);
      console.log('');
      
      // Compare with unfiltered results
      const allYearLevelsSet = new Set();
      const allSectionsSet = new Set();
      
      allAssessments.forEach(assessment => {
        if (assessment.target_year_levels && Array.isArray(assessment.target_year_levels)) {
          assessment.target_year_levels.forEach(year => {
            if (year !== null && year !== undefined) {
              allYearLevelsSet.add(year);
            }
          });
        }
        
        if (assessment.target_sections && Array.isArray(assessment.target_sections)) {
          assessment.target_sections.forEach(section => {
            if (section && section.trim() !== '') {
              allSectionsSet.add(section);
            }
          });
        }
      });
      
      const allAvailableYearLevels = Array.from(allYearLevelsSet).sort((a, b) => a - b);
      const allAvailableSections = Array.from(allSectionsSet).sort();
      
      console.log('📊 COMPARISON - All Assessments vs Specific Assessment:');
      console.log(`   All Assessments Year Levels: ${JSON.stringify(allAvailableYearLevels)}`);
      console.log(`   Specific Assessment Year Levels: ${JSON.stringify(availableYearLevels)}`);
      console.log(`   All Assessments Sections: ${JSON.stringify(allAvailableSections)}`);
      console.log(`   Specific Assessment Sections: ${JSON.stringify(availableSections)}`);
      console.log('');
      
      // Check if filtering made a difference
      const yearLevelsChanged = JSON.stringify(allAvailableYearLevels) !== JSON.stringify(availableYearLevels);
      const sectionsChanged = JSON.stringify(allAvailableSections) !== JSON.stringify(availableSections);
      
      if (yearLevelsChanged || sectionsChanged) {
        console.log('✅ SUCCESS: Filtering by assessment name produces different results!');
        console.log('   This means the dropdown will now show only relevant options.');
      } else {
        console.log('ℹ️  INFO: Filtering produces same results as unfiltered.');
        console.log('   This could mean:');
        console.log('   - Only one assessment exists for this college/type');
        console.log('   - All assessments have the same target year levels and sections');
      }
      
    } else {
      console.log('❌ No assessments found for testing.');
    }
    
  } catch (error) {
    console.error('❌ Error testing specific assessment filter:', error);
  }
}

testSpecificAssessmentFilter();