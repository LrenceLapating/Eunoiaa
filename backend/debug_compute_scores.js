const { createClient } = require('@supabase/supabase-js');
const { computeAndStoreCollegeScores, getCollegeScores } = require('./utils/collegeScoring');
require('dotenv').config();

(async () => {
  try {
    console.log('=== Debugging College Score Computation ===\n');
    
    // First, let's see what assessment data exists for each type
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('🔍 Checking assessment data by type...');
    
    // Check ryff_42 assessments
    const { data: assessments42, error: error42 } = await supabase
      .from('assessments_42items')
      .select(`
        id,
        scores,
        students!inner(
          college
        )
      `)
      .not('scores', 'is', null);
    
    if (error42) {
      console.error('Error fetching 42-item assessments:', error42);
    } else {
      const colleges42 = [...new Set(assessments42.map(a => a.students.college))];
      console.log(`✅ ryff_42: ${assessments42.length} assessments from colleges: ${colleges42.join(', ')}`);
    }
    
    // Check ryff_84 assessments
    const { data: assessments84, error: error84 } = await supabase
      .from('assessments_84items')
      .select(`
        id,
        scores,
        students!inner(
          college
        )
      `)
      .not('scores', 'is', null);
    
    if (error84) {
      console.error('Error fetching 84-item assessments:', error84);
    } else {
      const colleges84 = [...new Set(assessments84.map(a => a.students.college))];
      console.log(`✅ ryff_84: ${assessments84.length} assessments from colleges: ${colleges84.join(', ')}`);
    }
    
    console.log('\n🔄 Now computing scores for ryff_84...');
    
    // Compute scores for ryff_84
    const computeResult = await computeAndStoreCollegeScores(null, 'ryff_84');
    console.log('Compute result:', computeResult);
    
    console.log('\n📊 Fetching computed ryff_84 scores...');
    
    // Get the computed scores
    const scoresResult = await getCollegeScores(null, 'ryff_84');
    console.log(`Retrieved ${scoresResult.colleges?.length || 0} colleges:`);
    
    if (scoresResult.colleges) {
      scoresResult.colleges.forEach((college, index) => {
        console.log(`${index}: "${college.name}" (${college.studentCount} students, ${Object.keys(college.dimensions).length} dimensions)`);
        
        // Show sample dimension data
        const firstDim = Object.keys(college.dimensions)[0];
        if (firstDim) {
          const dimData = college.dimensions[firstDim];
          console.log(`   Sample dimension ${firstDim}: score=${dimData.score}, risk=${dimData.riskLevel}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
})();