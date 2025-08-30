require('dotenv').config();
const { supabase } = require('./config/database');

async function testCurrentEndpoint() {
  console.log('🔍 Testing Current Assessment Filters Endpoint');
  console.log('============================================================');
  
  try {
    // Test the exact same logic as the endpoint
    const collegeName = 'College of Computer Studies';
    const assessmentType = 'ryff_42';
    
    console.log(`📍 Testing for college: ${collegeName}`);
    console.log(`📊 Assessment type: ${assessmentType}`);
    console.log('');
    
    // Get bulk assessments for this college and assessment type with their target year levels and sections
    let assessmentQuery = supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .contains('target_colleges', [collegeName])
      .neq('status', 'archived');
    
    // Filter by assessment type if specified
    if (assessmentType && assessmentType !== 'all') {
      assessmentQuery = assessmentQuery.eq('assessment_type', assessmentType);
    }
    
    const { data: bulkAssessments, error: assessmentError } = await assessmentQuery;
    
    if (assessmentError) throw assessmentError;
    
    console.log(`📋 Found ${bulkAssessments.length} assessments:`);
    bulkAssessments.forEach((assessment, index) => {
      console.log(`   ${index + 1}. ${assessment.assessment_name}`);
      console.log(`      ID: ${assessment.id}`);
      console.log(`      Target Year Levels: ${JSON.stringify(assessment.target_year_levels)}`);
      console.log(`      Target Sections: ${JSON.stringify(assessment.target_sections)}`);
      console.log('');
    });
    
    // Extract unique year levels and sections from all bulk assessments
    const yearLevelsSet = new Set();
    const sectionsSet = new Set();
    
    bulkAssessments.forEach(assessment => {
      // Add target year levels from this assessment
      if (assessment.target_year_levels && Array.isArray(assessment.target_year_levels)) {
        assessment.target_year_levels.forEach(year => {
          if (year !== null && year !== undefined) {
            yearLevelsSet.add(year);
          }
        });
      }
      
      // Add target sections from this assessment
      if (assessment.target_sections && Array.isArray(assessment.target_sections)) {
        assessment.target_sections.forEach(section => {
          if (section && section.trim() !== '') {
            sectionsSet.add(section);
          }
        });
      }
    });
    
    // Convert to sorted arrays
    const availableYearLevels = Array.from(yearLevelsSet).sort((a, b) => a - b);
    const availableSections = Array.from(sectionsSet).sort();
    
    console.log('🎯 FINAL RESULTS:');
    console.log(`   Available Year Levels: ${JSON.stringify(availableYearLevels)}`);
    console.log(`   Available Sections: ${JSON.stringify(availableSections)}`);
    console.log(`   Total Assessments: ${bulkAssessments.length}`);
    console.log('');
    
    // Check if any assessments have empty target columns
    const emptyTargetAssessments = bulkAssessments.filter(assessment => 
      (!assessment.target_year_levels || assessment.target_year_levels.length === 0) &&
      (!assessment.target_sections || assessment.target_sections.length === 0)
    );
    
    if (emptyTargetAssessments.length > 0) {
      console.log('⚠️  WARNING: Found assessments with empty target columns:');
      emptyTargetAssessments.forEach(assessment => {
        console.log(`   - ${assessment.assessment_name} (ID: ${assessment.id})`);
      });
      console.log('');
      console.log('💡 This explains why sections dropdown might be empty!');
      console.log('   These assessments need their target columns populated.');
    } else {
      console.log('✅ All assessments have populated target columns!');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

testCurrentEndpoint();