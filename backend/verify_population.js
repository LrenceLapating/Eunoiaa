require('dotenv').config();
const { supabase } = require('./config/database');

async function verifyPopulation() {
  try {
    console.log('Verifying target_year_levels and target_sections population...');
    
    // Get all bulk assessments with the new columns
    const { data: assessments, error } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_colleges, target_year_levels, target_sections')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching assessments:', error);
      return;
    }
    
    console.log(`\nTotal assessments: ${assessments.length}`);
    console.log('\n=== ASSESSMENT DETAILS ===\n');
    
    assessments.forEach((assessment, index) => {
      console.log(`${index + 1}. Assessment: ${assessment.assessment_name}`);
      console.log(`   ID: ${assessment.id}`);
      console.log(`   Target Colleges: [${assessment.target_colleges?.join(', ') || 'none'}]`);
      console.log(`   Target Year Levels: [${assessment.target_year_levels?.join(', ') || 'none'}]`);
      console.log(`   Target Sections: [${assessment.target_sections?.join(', ') || 'none'}]`);
      console.log('');
    });
    
    // Summary statistics
    const withYearLevels = assessments.filter(a => a.target_year_levels && a.target_year_levels.length > 0);
    const withSections = assessments.filter(a => a.target_sections && a.target_sections.length > 0);
    
    console.log('=== SUMMARY ===');
    console.log(`Assessments with year levels populated: ${withYearLevels.length}/${assessments.length}`);
    console.log(`Assessments with sections populated: ${withSections.length}/${assessments.length}`);
    
    if (withYearLevels.length === assessments.length && withSections.length === assessments.length) {
      console.log('\n✅ SUCCESS: All assessments have been populated with target data!');
    } else {
      console.log('\n⚠️  Some assessments may not have target data (possibly no active students in target colleges)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyPopulation();