const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  try {
    console.log('=== Current College Scores (ryff_42) ===');
    
    const { data: scores42, error: error42 } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_type', 'ryff_42')
      .order('college_name, dimension_name');
    
    if (error42) {
      console.error('Error:', error42);
      return;
    }
    
    console.log('Total ryff_42 records:', scores42.length);
    
    // Show first 10 records
    console.log('\n=== Sample Records ===');
    scores42.slice(0, 10).forEach(score => {
      console.log(`${score.college_name} - ${score.dimension_name}: ${score.raw_score} (${score.student_count} students, ${score.risk_level})`);
    });
    
    // Show College of Computer Studies specifically
    console.log('\n=== College of Computer Studies Scores ===');
    const ccsScores = scores42.filter(s => s.college_name === 'College of Computer Studies');
    if (ccsScores.length > 0) {
      ccsScores.forEach(score => {
        console.log(`${score.dimension_name}: ${score.raw_score} (${score.risk_level})`);
      });
    } else {
      console.log('No College of Computer Studies scores found');
    }
    
    // Show all colleges
    console.log('\n=== All Colleges Summary ===');
    const colleges = [...new Set(scores42.map(s => s.college_name))];
    colleges.forEach(college => {
      const collegeScores = scores42.filter(s => s.college_name === college);
      if (collegeScores.length > 0) {
        console.log(`\n${college} (${collegeScores[0].student_count} students):`);
        collegeScores.forEach(score => {
          console.log(`  ${score.dimension_name}: ${score.raw_score} (${score.risk_level})`);
        });
      }
    });
    
  } catch (error) {
    console.error('Script error:', error);
  }
})();