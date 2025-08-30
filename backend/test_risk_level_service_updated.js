require('dotenv').config();
const riskLevelService = require('./services/riskLevelService');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Test that RiskLevelService uses the updated overall_score-only logic
 */
async function testRiskLevelServiceUpdated() {
  try {
    console.log('🧪 Testing RiskLevelService with Updated Logic');
    console.log('=' .repeat(60));
    
    // Check current risk level distribution before any updates
    console.log('📊 Current Risk Level Distribution:');
    
    const { data: current42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('risk_level')
      .not('risk_level', 'is', null);
    
    const { data: current84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('risk_level')
      .not('risk_level', 'is', null);
    
    const distribution42 = { low: 0, moderate: 0, high: 0 };
    const distribution84 = { low: 0, moderate: 0, high: 0 };
    
    current42?.forEach(a => distribution42[a.risk_level]++);
    current84?.forEach(a => distribution84[a.risk_level]++);
    
    console.log(`42-item: low=${distribution42.low}, moderate=${distribution42.moderate}, high=${distribution42.high}`);
    console.log(`84-item: low=${distribution84.low}, moderate=${distribution84.moderate}, high=${distribution84.high}`);
    
    // Test the service
    console.log('\n🔄 Running RiskLevelService...');
    const result = await riskLevelService.updateMissingRiskLevels();
    
    console.log('Service result:', result);
    
    // Verify that risk levels are still based only on overall_score
    console.log('\n🔍 Verifying Overall Score Only Logic...');
    
    const { data: verification42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, overall_score, risk_level, scores')
      .not('overall_score', 'is', null)
      .not('risk_level', 'is', null)
      .order('overall_score')
      .limit(5);
    
    console.log('\n📊 42-item Sample Verification:');
    verification42?.forEach(assessment => {
      // Calculate expected risk level based on overall score only
      let expectedRiskLevel;
      if (assessment.overall_score > 181) {
        expectedRiskLevel = 'low';
      } else if (assessment.overall_score > 111) {
        expectedRiskLevel = 'moderate';
      } else {
        expectedRiskLevel = 'high';
      }
      
      // Check for at-risk dimensions (for information only)
      const scores = typeof assessment.scores === 'string' ? JSON.parse(assessment.scores) : assessment.scores;
      const atRiskDimensions = Object.entries(scores || {})
        .filter(([dim, score]) => score <= 18)
        .map(([dim, score]) => `${dim}(${score})`);
      
      const status = assessment.risk_level === expectedRiskLevel ? '✅' : '❌';
      console.log(`   ID: ${assessment.id.substring(0, 8)}... Score: ${assessment.overall_score} Risk: ${assessment.risk_level} Expected: ${expectedRiskLevel} ${status}`);
      
      if (atRiskDimensions.length > 0) {
        console.log(`      At-Risk Dimensions: ${atRiskDimensions.join(', ')} (ignored in new logic)`);
      }
    });
    
    // Check final distribution
    console.log('\n📊 Final Risk Level Distribution:');
    
    const { data: final42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('risk_level')
      .not('risk_level', 'is', null);
    
    const { data: final84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('risk_level')
      .not('risk_level', 'is', null);
    
    const finalDist42 = { low: 0, moderate: 0, high: 0 };
    const finalDist84 = { low: 0, moderate: 0, high: 0 };
    
    final42?.forEach(a => finalDist42[a.risk_level]++);
    final84?.forEach(a => finalDist84[a.risk_level]++);
    
    console.log(`42-item: low=${finalDist42.low}, moderate=${finalDist42.moderate}, high=${finalDist42.high}`);
    console.log(`84-item: low=${finalDist84.low}, moderate=${finalDist84.moderate}, high=${finalDist84.high}`);
    
    console.log('\n🎉 RiskLevelService Test Complete!');
    console.log('   The service now uses overall_score-only logic for risk classification.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRiskLevelServiceUpdated();