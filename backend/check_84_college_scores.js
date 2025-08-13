const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  try {
    console.log('=== Current College Scores (ryff_84) ===');
    
    const { data: scores84, error: error84 } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_type', 'ryff_84')
      .order('college_name, dimension_name');
    
    if (error84) {
      console.error('Error:', error84);
      return;
    }
    
    console.log('Total ryff_84 records:', scores84.length);
    
    if (scores84.length > 0) {
      // Show all colleges with 84-item data
      console.log('\n=== All Colleges with 84-item Assessments ===');
      const colleges = [...new Set(scores84.map(s => s.college_name))];
      colleges.forEach(college => {
        const collegeScores = scores84.filter(s => s.college_name === college);
        if (collegeScores.length > 0) {
          console.log(`\n${college} (${collegeScores[0].student_count} students):`);
          collegeScores.forEach(score => {
            console.log(`  ${score.dimension_name}: ${score.raw_score} (${score.risk_level})`);
          });
        }
      });
    } else {
      console.log('No ryff_84 records found');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
})();