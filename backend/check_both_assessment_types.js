const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  try {
    console.log('=== Checking College Scores for Both Assessment Types ===\n');
    
    // Check ryff_42
    console.log('🔍 Checking ryff_42 scores...');
    const { data: scores42, error: error42 } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_type', 'ryff_42')
      .order('college_name, dimension_name');
    
    if (error42) {
      console.error('Error fetching ryff_42:', error42);
    } else {
      console.log(`✅ Found ${scores42.length} ryff_42 records`);
      const colleges42 = [...new Set(scores42.map(s => s.college_name))];
      console.log(`   Colleges: ${colleges42.join(', ')}\n`);
    }
    
    // Check ryff_84
    console.log('🔍 Checking ryff_84 scores...');
    const { data: scores84, error: error84 } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessment_type', 'ryff_84')
      .order('college_name, dimension_name');
    
    if (error84) {
      console.error('Error fetching ryff_84:', error84);
    } else {
      console.log(`✅ Found ${scores84.length} ryff_84 records`);
      if (scores84.length > 0) {
        const colleges84 = [...new Set(scores84.map(s => s.college_name))];
        console.log(`   Colleges: ${colleges84.join(', ')}`);
        
        // Show sample ryff_84 data
        console.log('\n=== Sample ryff_84 Data ===');
        scores84.slice(0, 6).forEach(score => {
          console.log(`${score.college_name} - ${score.dimension_name}: ${score.raw_score} (${score.student_count} students, ${score.risk_level})`);
        });
      } else {
        console.log('   ❌ No ryff_84 data found!');
      }
    }
    
    // Check all assessment types in the table
    console.log('\n🔍 Checking all assessment types in college_scores table...');
    const { data: allScores, error: allError } = await supabase
      .from('college_scores')
      .select('assessment_type')
      .order('assessment_type');
    
    if (allError) {
      console.error('Error fetching all scores:', allError);
    } else {
      const uniqueTypes = [...new Set(allScores.map(s => s.assessment_type))];
      console.log(`📊 Assessment types in database: ${uniqueTypes.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
})();