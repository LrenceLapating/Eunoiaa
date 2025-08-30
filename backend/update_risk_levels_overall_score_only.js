require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Update risk_level values in assessment tables based ONLY on overall_score
 * This removes the dimension-based override logic
 */
async function updateRiskLevelsOverallScoreOnly() {
  try {
    console.log('🔄 Updating risk_level values based ONLY on overall_score...');
    console.log('=' .repeat(60));
    
    // Define thresholds
    const thresholds = {
      ryff_42: {
        atRisk: 111,    // ≤111: high
        moderate: 181   // 112-181: moderate, ≥182: low
      },
      ryff_84: {
        atRisk: 222,    // ≤222: high
        moderate: 362   // 223-362: moderate, ≥363: low
      }
    };
    
    // Function to determine risk level based only on overall score
    function determineRiskLevelByOverallScore(overallScore, assessmentType) {
      const threshold = thresholds[assessmentType];
      
      if (overallScore > threshold.moderate) {
        return 'low';
      } else if (overallScore > threshold.atRisk) {
        return 'moderate';
      } else {
        return 'high';
      }
    }
    
    // Update 42-item assessments
    console.log('📊 Processing 42-item assessments...');
    
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, overall_score, risk_level')
      .not('overall_score', 'is', null);
    
    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42);
      return;
    }
    
    let updated42 = 0;
    let unchanged42 = 0;
    
    for (const assessment of assessments42) {
      const newRiskLevel = determineRiskLevelByOverallScore(assessment.overall_score, 'ryff_42');
      
      if (assessment.risk_level !== newRiskLevel) {
        const { error: updateError } = await supabaseAdmin
          .from('assessments_42items')
          .update({ risk_level: newRiskLevel })
          .eq('id', assessment.id);
        
        if (updateError) {
          console.error(`❌ Error updating assessment ${assessment.id}:`, updateError);
        } else {
          console.log(`✅ Updated ${assessment.id.substring(0, 8)}...: ${assessment.overall_score} -> ${assessment.risk_level} to ${newRiskLevel}`);
          updated42++;
        }
      } else {
        unchanged42++;
      }
    }
    
    // Update 84-item assessments
    console.log('\n📊 Processing 84-item assessments...');
    
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, overall_score, risk_level')
      .not('overall_score', 'is', null);
    
    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84);
      return;
    }
    
    let updated84 = 0;
    let unchanged84 = 0;
    
    for (const assessment of assessments84) {
      const newRiskLevel = determineRiskLevelByOverallScore(assessment.overall_score, 'ryff_84');
      
      if (assessment.risk_level !== newRiskLevel) {
        const { error: updateError } = await supabaseAdmin
          .from('assessments_84items')
          .update({ risk_level: newRiskLevel })
          .eq('id', assessment.id);
        
        if (updateError) {
          console.error(`❌ Error updating assessment ${assessment.id}:`, updateError);
        } else {
          console.log(`✅ Updated ${assessment.id.substring(0, 8)}...: ${assessment.overall_score} -> ${assessment.risk_level} to ${newRiskLevel}`);
          updated84++;
        }
      } else {
        unchanged84++;
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📈 UPDATE SUMMARY:');
    console.log(`42-item assessments: ${updated42} updated, ${unchanged42} unchanged`);
    console.log(`84-item assessments: ${updated84} updated, ${unchanged84} unchanged`);
    console.log(`Total updates: ${updated42 + updated84}`);
    
    // Verification
    console.log('\n🔍 Verifying updates...');
    
    const { data: verification42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('overall_score, risk_level')
      .not('overall_score', 'is', null)
      .order('overall_score');
    
    const { data: verification84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('overall_score, risk_level')
      .not('overall_score', 'is', null)
      .order('overall_score');
    
    console.log('\n📊 42-item Verification (first 10):');
    verification42.slice(0, 10).forEach(a => {
      const expected = determineRiskLevelByOverallScore(a.overall_score, 'ryff_42');
      const status = a.risk_level === expected ? '✅' : '❌';
      console.log(`   Score: ${a.overall_score}, Risk: ${a.risk_level}, Expected: ${expected} ${status}`);
    });
    
    console.log('\n📊 84-item Verification (first 5):');
    verification84.slice(0, 5).forEach(a => {
      const expected = determineRiskLevelByOverallScore(a.overall_score, 'ryff_84');
      const status = a.risk_level === expected ? '✅' : '❌';
      console.log(`   Score: ${a.overall_score}, Risk: ${a.risk_level}, Expected: ${expected} ${status}`);
    });
    
    console.log('\n🎉 Risk level update completed successfully!');
    console.log('   All risk_level values now based ONLY on overall_score thresholds.');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateRiskLevelsOverallScoreOnly();