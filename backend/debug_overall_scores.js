require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugOverallScores() {
  try {
    console.log('🔍 Debugging Overall Scores and Risk Levels...\n');

    // Query assessments_42items for sample data (without join)
    const { data: assessments42, error: error42 } = await supabase
      .from('assessments_42items')
      .select(`
        id,
        student_id,
        assessment_type,
        overall_score,
        risk_level,
        scores
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42);
    } else {
      console.log('📊 42-Item Assessments:');
      assessments42.forEach((assessment, index) => {
        console.log(`${index + 1}. Student ID: ${assessment.student_id}`);
        console.log(`   Overall Score: ${assessment.overall_score}`);
        console.log(`   Risk Level: ${assessment.risk_level}`);
        console.log(`   Assessment Type: ${assessment.assessment_type}`);
        console.log(`   Individual Scores:`, assessment.scores);
        console.log('   ---');
      });
    }

    // Query assessments_84items for sample data (without join)
    const { data: assessments84, error: error84 } = await supabase
      .from('assessments_84items')
      .select(`
        id,
        student_id,
        assessment_type,
        overall_score,
        risk_level,
        scores
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84);
    } else {
      console.log('\n📊 84-Item Assessments:');
      assessments84.forEach((assessment, index) => {
        console.log(`${index + 1}. Student ID: ${assessment.student_id}`);
        console.log(`   Overall Score: ${assessment.overall_score}`);
        console.log(`   Risk Level: ${assessment.risk_level}`);
        console.log(`   Assessment Type: ${assessment.assessment_type}`);
        console.log(`   Individual Scores:`, assessment.scores);
        console.log('   ---');
      });
    }

    // Calculate expected risk levels based on thresholds
    console.log('\n🧮 Risk Level Calculation Analysis:');
    console.log('For 42-item assessments (score range: 42-252):');
    console.log('- Low risk: >= 168 (top tertile)');
    console.log('- Moderate risk: 105-167 (middle tertile)');
    console.log('- High risk: <= 104 (bottom tertile)');
    
    console.log('\nFor 84-item assessments (score range: 84-504):');
    console.log('- Low risk: >= 336 (top tertile)');
    console.log('- Moderate risk: 210-335 (middle tertile)');
    console.log('- High risk: <= 209 (bottom tertile)');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugOverallScores();