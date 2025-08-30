require('dotenv').config();
const { supabase } = require('./config/database');

async function populateTargetColumns() {
  try {
    console.log('Populating target_year_levels and target_sections columns with real data...');
    
    // First, get all bulk assessments
    const { data: bulkAssessments, error: assessmentError } = await supabase
      .from('bulk_assessments')
      .select('id, target_colleges, assessment_name, assessment_type');
    
    if (assessmentError) {
      console.error('Error fetching bulk assessments:', assessmentError);
      return;
    }
    
    console.log(`Found ${bulkAssessments.length} bulk assessments to update`);
    
    // For each bulk assessment, determine target year levels and sections based on actual students
    for (const assessment of bulkAssessments) {
      console.log(`\nProcessing assessment: ${assessment.assessment_name}`);
      console.log(`Target colleges: ${assessment.target_colleges}`);
      
      const allYearLevels = new Set();
      const allSections = new Set();
      
      // For each target college, get all students
      for (const college of assessment.target_colleges) {
        console.log(`  Checking students in college: ${college}`);
        
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('year_level, section')
          .eq('college', college)
          .eq('status', 'active')
          .not('year_level', 'is', null)
          .not('section', 'is', null);
        
        if (studentsError) {
          console.error(`Error fetching students for ${college}:`, studentsError);
          continue;
        }
        
        console.log(`    Found ${students.length} active students`);
        
        // Add year levels and sections to sets
        students.forEach(student => {
          if (student.year_level) {
            // Convert year level to number if it's a string like '1st', '2nd', etc.
            let yearNum = student.year_level;
            if (typeof yearNum === 'string') {
              yearNum = parseInt(yearNum.replace(/[^0-9]/g, ''));
            }
            if (!isNaN(yearNum) && yearNum >= 1 && yearNum <= 4) {
              allYearLevels.add(yearNum);
            }
          }
          if (student.section) {
            allSections.add(student.section);
          }
        });
      }
      
      // Convert sets to sorted arrays
      const targetYearLevels = Array.from(allYearLevels).sort((a, b) => a - b);
      const targetSections = Array.from(allSections).sort();
      
      console.log(`  Target year levels: [${targetYearLevels.join(', ')}]`);
      console.log(`  Target sections: [${targetSections.join(', ')}]`);
      
      // Update the bulk assessment with the target data
      const { error: updateError } = await supabase
        .from('bulk_assessments')
        .update({
          target_year_levels: targetYearLevels,
          target_sections: targetSections
        })
        .eq('id', assessment.id);
      
      if (updateError) {
        console.error(`Error updating assessment ${assessment.id}:`, updateError);
      } else {
        console.log(`  ✅ Successfully updated assessment ${assessment.id}`);
      }
    }
    
    console.log('\n🎉 Finished populating target columns!');
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const { data: updatedAssessments, error: verifyError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections')
      .limit(5);
    
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
    } else {
      console.log('\nSample updated assessments:');
      updatedAssessments.forEach((assessment, index) => {
        console.log(`${index + 1}. ${assessment.assessment_name}`);
        console.log(`   Year levels: [${assessment.target_year_levels?.join(', ') || 'none'}]`);
        console.log(`   Sections: [${assessment.target_sections?.join(', ') || 'none'}]`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

populateTargetColumns();