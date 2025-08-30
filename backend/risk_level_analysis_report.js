require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Comprehensive analysis of risk level categorization logic
 * This script explains why risk_level values appear "inconsistent" with overall_score
 */
async function comprehensiveRiskAnalysis() {
  try {
    console.log('🔍 COMPREHENSIVE RISK LEVEL ANALYSIS REPORT');
    console.log('=' .repeat(60));
    console.log();
    
    console.log('📋 UNDERSTANDING THE TWO-TIER RISK CLASSIFICATION SYSTEM:');
    console.log('1. PRIMARY CHECK: Individual Dimension At-Risk Status');
    console.log('   - If ANY dimension score ≤ 18 (42-item) or ≤ 36 (84-item)');
    console.log('   - Immediately classified as "high" risk');
    console.log('   - This overrides overall score calculation');
    console.log();
    console.log('2. SECONDARY CHECK: Overall Score Thresholds (only if no at-risk dimensions)');
    console.log('   - 42-item: ≤111=high, 112-181=moderate, ≥182=low');
    console.log('   - 84-item: ≤222=high, 223-362=moderate, ≥363=low');
    console.log();
    
    // Get assessment data
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, overall_score, risk_level, scores')
      .not('risk_level', 'is', null)
      .order('overall_score');
    
    if (error42) {
      console.error('Error fetching 42-item assessments:', error42);
      return;
    }
    
    console.log('📊 DETAILED ANALYSIS OF 42-ITEM ASSESSMENTS:');
    console.log('=' .repeat(60));
    
    let correctClassifications = 0;
    let dimensionOverrides = 0;
    let actualErrors = 0;
    
    assessments42.forEach((assessment, index) => {
      console.log(`\n📝 Assessment ${index + 1}: ID ${assessment.id.substring(0, 8)}...`);
      console.log(`   Overall Score: ${assessment.overall_score}`);
      console.log(`   Stored Risk Level: ${assessment.risk_level}`);
      
      // Parse scores
      const scores = typeof assessment.scores === 'string' 
        ? JSON.parse(assessment.scores) 
        : assessment.scores;
      
      // Check for at-risk dimensions
      const atRiskDimensions = [];
      Object.entries(scores).forEach(([dimension, score]) => {
        if (score <= 18) {
          atRiskDimensions.push({ dimension, score });
        }
      });
      
      // Determine expected risk level using the actual logic
      let expectedRiskLevel;
      let reasoning;
      
      if (atRiskDimensions.length > 0) {
        expectedRiskLevel = 'high';
        reasoning = `Has ${atRiskDimensions.length} at-risk dimension(s): ${atRiskDimensions.map(d => `${d.dimension}(${d.score})`).join(', ')}`;
      } else {
        // Use overall score thresholds
        if (assessment.overall_score <= 111) {
          expectedRiskLevel = 'high';
          reasoning = 'Overall score ≤ 111 (at-risk threshold)';
        } else if (assessment.overall_score <= 181) {
          expectedRiskLevel = 'moderate';
          reasoning = 'Overall score 112-181 (moderate range)';
        } else {
          expectedRiskLevel = 'low';
          reasoning = 'Overall score ≥ 182 (healthy range)';
        }
      }
      
      // Compare with stored value
      const isCorrect = assessment.risk_level === expectedRiskLevel;
      
      if (isCorrect) {
        correctClassifications++;
        if (atRiskDimensions.length > 0) {
          dimensionOverrides++;
        }
        console.log(`   ✅ CORRECT: ${reasoning}`);
      } else {
        actualErrors++;
        console.log(`   ❌ ERROR: Expected '${expectedRiskLevel}' but got '${assessment.risk_level}'`);
        console.log(`   📍 Reason: ${reasoning}`);
      }
      
      // Show dimension details for at-risk cases
      if (atRiskDimensions.length > 0) {
        console.log(`   🔴 At-Risk Dimensions:`);
        atRiskDimensions.forEach(d => {
          console.log(`      - ${d.dimension}: ${d.score} (≤18 threshold)`);
        });
      }
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`Total Assessments Analyzed: ${assessments42.length}`);
    console.log(`Correctly Classified: ${correctClassifications} (${((correctClassifications/assessments42.length)*100).toFixed(1)}%)`);
    console.log(`Classifications Due to At-Risk Dimensions: ${dimensionOverrides}`);
    console.log(`Actual Classification Errors: ${actualErrors}`);
    
    if (actualErrors === 0) {
      console.log('\n🎉 CONCLUSION: The risk level classifications are CORRECT!');
      console.log('   The apparent "inconsistencies" are actually the intended behavior');
      console.log('   of the two-tier classification system that prioritizes individual');
      console.log('   dimension at-risk status over overall score thresholds.');
    } else {
      console.log('\n⚠️  CONCLUSION: Found actual classification errors that need investigation.');
    }
    
    console.log('\n📚 EXPLANATION FOR USERS:');
    console.log('The EUNOIA system uses a sophisticated two-tier approach:');
    console.log('1. Student safety is prioritized - if ANY dimension shows at-risk');
    console.log('   scores, the student is flagged as high-risk for intervention');
    console.log('2. Only students with no at-risk dimensions are classified by');
    console.log('   their overall well-being score');
    console.log('3. This ensures no at-risk students are missed due to averaging effects');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

comprehensiveRiskAnalysis();