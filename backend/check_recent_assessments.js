const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentAssessments() {
  console.log('🔍 Checking recent assessment submissions...');
  
  const { data: recentAssessments, error } = await supabase
    .from('assessment_assignments')
    .select(`
      id, 
      student_id, 
      status, 
      completed_at,
      bulk_assessment:bulk_assessments(
        assessment_name, 
        assessment_type
      )
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent completed assessments:');
  recentAssessments.forEach((a, i) => {
    console.log(`${i+1}. Assignment ${a.id} - ${a.bulk_assessment.assessment_name} (${a.bulk_assessment.assessment_type}) - Completed: ${a.completed_at}`);
  });
  
  // Also check college_scores table for recent entries
  console.log('\n🏫 Checking recent college_scores entries...');
  const { data: recentScores, error: scoresError } = await supabase
    .from('college_scores')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (scoresError) {
    console.error('Error fetching college scores:', scoresError);
  } else {
    console.log('Recent college scores:');
    recentScores.forEach((s, i) => {
      console.log(`${i+1}. College: ${s.college_name} - Assessment: ${s.assessment_name} (${s.assessment_type}) - Created: ${s.created_at}`);
    });
  }
}

checkRecentAssessments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });