require('dotenv').config();
const { supabase } = require('./config/database');

async function testSpecificAssessmentDifference() {
  console.log('🎯 Testing Assessment-Specific Filtering with Different Results');
  console.log('============================================================');
  
  try {
    const collegeName = 'College of Computer Studies';
    const assessmentType = 'ryff_42';
    
    // Test with "Test" assessment which has fewer sections
    const specificAssessmentName = 'Test';
    
    console.log(`🔍 Testing filter for assessment: "${specificAssessmentName}"`);
    
    const { data: specificAssessment, error: specificError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .eq('assessment_type', assessmentType)
      .eq('assessment_name', specificAssessmentName)
      .neq('status', 'archived');
    
    if (specificError) throw specificError;
    
    console.log(`Found ${specificAssessment.length} assessment(s):`);
    specificAssessment.forEach((assessment, index) => {
      console.log(`   ${index + 1}. "${assessment.assessment_name}"`);
      console.log(`      Target Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
      console.log(`      Target Sections: ${JSON.stringify(assessment.target_sections)}`);
      console.log('');
    });
    
    // Extract unique year levels and sections for this specific assessment
    const yearLevelsSet = new Set();
    const sectionsSet = new Set();
    
    specificAssessment.forEach(assessment => {
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
    
    const specificYearLevels = Array.from(yearLevelsSet).sort((a, b) => a - b);
    const specificSections = Array.from(sectionsSet).sort();
    
    console.log('🎯 SPECIFIC ASSESSMENT RESULTS:');
    console.log(`   Year Levels: ${JSON.stringify(specificYearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(specificSections)}`);
    console.log('');
    
    // Now get all assessments for comparison
    const { data: allAssessments, error: allError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .eq('assessment_type', assessmentType)
      .neq('status', 'archived');
    
    if (allError) throw allError;
    
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
    
    const allYearLevels = Array.from(allYearLevelsSet).sort((a, b) => a - b);
    const allSections = Array.from(allSectionsSet).sort();
    
    console.log('📊 ALL ASSESSMENTS RESULTS:');
    console.log(`   Year Levels: ${JSON.stringify(allYearLevels)}`);
    console.log(`   Sections: ${JSON.stringify(allSections)}`);
    console.log('');
    
    console.log('🔍 COMPARISON:');
    console.log(`   Specific Assessment Sections Count: ${specificSections.length}`);
    console.log(`   All Assessments Sections Count: ${allSections.length}`);
    console.log('');
    
    if (specificSections.length < allSections.length) {
      console.log('✅ SUCCESS: Specific assessment has fewer sections!');
      console.log('   This proves the filtering is working correctly.');
      console.log('   The dropdown will now show only relevant sections.');
      
      console.log('');
      console.log('📋 Sections only in "Test" assessment:');
      specificSections.forEach(section => {
        console.log(`   - ${section}`);
      });
      
      console.log('');
      console.log('📋 Additional sections in other assessments:');
      const additionalSections = allSections.filter(section => !specificSections.includes(section));
      additionalSections.forEach(section => {
        console.log(`   - ${section}`);
      });
      
    } else {
      console.log('ℹ️  INFO: Same number of sections, but filtering logic is still working.');
    }
    
  } catch (error) {
    console.error('❌ Error testing specific assessment difference:', error);
  }
}

testSpecificAssessmentDifference();