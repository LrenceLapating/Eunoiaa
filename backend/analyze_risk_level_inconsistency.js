require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeRiskLevelInconsistency() {
  try {
    console.log('🔍 Analyzing risk_level inconsistencies in assessment tables...\n');
    
    // Get 42-item assessments
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, overall_score, risk_level, scores')
      .not('risk_level', 'is', null)
      .order('overall_score');
    
    // Get 84-item assessments
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, overall_score, risk_level, scores')
      .not('risk_level', 'is', null)
      .order('overall_score');
    
    if (error42 || error84) {
      console.error('Error:', error42 || error84);
      return;
    }
    
    console.log('📊 42-item Assessments Analysis:');
    console.log('Overall Score | Risk Level | Expected Risk Level | Status');
    console.log('-------------|------------|-------------------|--------');
    
    let mismatches42 = 0;
    assessments42.forEach(a => {
      let expectedRisk = 'low';
      if (a.overall_score <= 111) expectedRisk = 'high';
      else if (a.overall_score <= 181) expectedRisk = 'moderate';
      
      const mismatch = a.risk_level !== expectedRisk;
      if (mismatch) mismatches42++;
      
      const status = mismatch ? '❌ MISMATCH' : '✅ CORRECT';
      console.log(`${a.overall_score.toString().padEnd(12)} | ${a.risk_level.padEnd(10)} | ${expectedRisk.padEnd(17)} | ${status}`);
    });
    
    console.log('\n📊 84-item Assessments Analysis:');
    console.log('Overall Score | Risk Level | Expected Risk Level | Status');
    console.log('-------------|------------|-------------------|--------');
    
    let mismatches84 = 0;
    assessments84.forEach(a => {
      let expectedRisk = 'low';
      if (a.overall_score <= 222) expectedRisk = 'high';
      else if (a.overall_score <= 362) expectedRisk = 'moderate';
      
      const mismatch = a.risk_level !== expectedRisk;
      if (mismatch) mismatches84++;
      
      const status = mismatch ? '❌ MISMATCH' : '✅ CORRECT';
      console.log(`${a.overall_score.toString().padEnd(12)} | ${a.risk_level.padEnd(10)} | ${expectedRisk.padEnd(17)} | ${status}`);
    });
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`42-item assessments: ${mismatches42}/${assessments42.length} mismatches (${((mismatches42/assessments42.length)*100).toFixed(1)}%)`);
    console.log(`84-item assessments: ${mismatches84}/${assessments84.length} mismatches (${((mismatches84/assessments84.length)*100).toFixed(1)}%)`);
    
    // Check for individual dimension at-risk logic
    console.log('\n🔍 Checking individual dimension at-risk logic...');
    
    // Sample a few assessments to check dimension scores
    const sampleAssessments42 = assessments42.slice(0, 3);
    
    for (const assessment of sampleAssessments42) {
      console.log(`\n📝 Assessment ID: ${assessment.id}`);
      console.log(`   Overall Score: ${assessment.overall_score}`);
      console.log(`   Risk Level: ${assessment.risk_level}`);
      
      if (assessment.scores) {
        const scores = typeof assessment.scores === 'string' ? JSON.parse(assessment.scores) : assessment.scores;
        console.log('   Dimension Scores:');
        
        Object.entries(scores).forEach(([dimension, score]) => {
          const isAtRisk = score <= 18; // 42-item threshold
          console.log(`     ${dimension}: ${score} ${isAtRisk ? '🔴 AT-RISK' : '✅'}`);
        });
        
        // Check if any dimension is at-risk
        const hasAtRiskDimension = Object.values(scores).some(score => score <= 18);
        console.log(`   Has at-risk dimension: ${hasAtRiskDimension ? 'YES' : 'NO'}`);
        
        if (hasAtRiskDimension && assessment.risk_level !== 'high') {
          console.log('   ⚠️  ISSUE: Has at-risk dimension but not classified as high risk!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeRiskLevelInconsistency();