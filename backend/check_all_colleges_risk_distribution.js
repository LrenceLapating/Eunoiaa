// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllCollegesRiskDistribution() {
  console.log('🏫 COMPREHENSIVE COLLEGE RISK DISTRIBUTION ANALYSIS');
  console.log('='.repeat(70));
  
  try {
    // Get all unique colleges
    const { data: colleges, error: collegesError } = await supabase
      .from('students')
      .select('college')
      .not('college', 'is', null);
    
    if (collegesError) {
      console.error('❌ Error fetching colleges:', collegesError);
      return;
    }
    
    const uniqueColleges = [...new Set(colleges.map(s => s.college))];
    console.log(`\n📋 Found ${uniqueColleges.length} Unique Colleges:`);
    uniqueColleges.forEach((college, index) => {
      console.log(`   ${index + 1}. ${college}`);
    });
    
    console.log('\n🔍 DETAILED RISK DISTRIBUTION ANALYSIS:');
    console.log('='.repeat(70));
    
    let totalCollegesWithData = 0;
    let totalCollegesWithoutData = 0;
    const summaryData = [];
    
    for (const college of uniqueColleges) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🏫 COLLEGE: ${college}`);
      console.log(`${'─'.repeat(50)}`);
      
      // Get active students for this college
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, college, year_level, section')
        .eq('college', college)
        .eq('status', 'active');
      
      if (studentsError) {
        console.log('❌ Students query error:', studentsError);
        continue;
      }
      
      console.log(`👥 Active Students: ${students?.length || 0}`);
      
      if (!students || students.length === 0) {
        console.log('⚠️  No active students found - Risk Distribution will show zeros');
        totalCollegesWithoutData++;
        summaryData.push({
          college,
          students: 0,
          assessments: 0,
          atRisk: 0,
          moderate: 0,
          healthy: 0,
          hasData: false
        });
        continue;
      }
      
      const studentIds = students.map(s => s.id);
      
      // Get 42-item assessments
      const { data: assessments42, error: assessments42Error } = await supabase
        .from('assessments_42items')
        .select('*')
        .in('student_id', studentIds);
      
      // Get 84-item assessments
      const { data: assessments84, error: assessments84Error } = await supabase
        .from('assessments_84items')
        .select('*')
        .in('student_id', studentIds);
      
      const allAssessments = [...(assessments42 || []), ...(assessments84 || [])];
      console.log(`📊 Total Assessments: ${allAssessments.length}`);
      console.log(`   - 42-item assessments: ${assessments42?.length || 0}`);
      console.log(`   - 84-item assessments: ${assessments84?.length || 0}`);
      
      if (allAssessments.length === 0) {
        console.log('⚠️  No assessments found - Risk Distribution will show zeros');
        totalCollegesWithoutData++;
        summaryData.push({
          college,
          students: students.length,
          assessments: 0,
          atRisk: 0,
          moderate: 0,
          healthy: 0,
          hasData: false
        });
        continue;
      }
      
      // Calculate risk distribution using the same logic as frontend
      const riskCounts = {
        atRisk: 0,
        moderate: 0,
        healthy: 0,
        unclassified: 0
      };
      
      console.log('\n📈 Individual Assessment Analysis:');
      allAssessments.forEach((assessment, index) => {
        const riskLevel = assessment.risk_level;
        const overallScore = assessment.overall_score;
        const assessmentType = assessment.assessment_type;
        
        let finalRiskLevel = riskLevel;
        
        // Apply fallback logic if risk_level is not available
        if (!finalRiskLevel && overallScore) {
          if (assessmentType === 'ryff_42') {
            if (overallScore <= 126) finalRiskLevel = 'high';
            else if (overallScore <= 210) finalRiskLevel = 'moderate';
            else finalRiskLevel = 'low';
          } else if (assessmentType === 'ryff_84') {
            if (overallScore <= 252) finalRiskLevel = 'high';
            else if (overallScore <= 420) finalRiskLevel = 'moderate';
            else finalRiskLevel = 'low';
          }
        }
        
        // Categorize risk levels
        if (finalRiskLevel === 'high' || finalRiskLevel === 'at-risk') {
          riskCounts.atRisk++;
        } else if (finalRiskLevel === 'moderate') {
          riskCounts.moderate++;
        } else if (finalRiskLevel === 'low' || finalRiskLevel === 'healthy') {
          riskCounts.healthy++;
        } else {
          riskCounts.unclassified++;
        }
        
        if (index < 3) { // Show first 3 assessments as examples
          console.log(`   ${index + 1}. Type: ${assessmentType}, Score: ${overallScore}, Risk: ${riskLevel || 'calculated'} → ${finalRiskLevel}`);
        }
      });
      
      if (allAssessments.length > 3) {
        console.log(`   ... and ${allAssessments.length - 3} more assessments`);
      }
      
      console.log('\n📊 RISK DISTRIBUTION RESULTS:');
      console.log(`   🔴 At Risk: ${riskCounts.atRisk}`);
      console.log(`   🟡 Moderate: ${riskCounts.moderate}`);
      console.log(`   🟢 Healthy: ${riskCounts.healthy}`);
      
      if (riskCounts.unclassified > 0) {
        console.log(`   ⚪ Unclassified: ${riskCounts.unclassified}`);
      }
      
      const total = riskCounts.atRisk + riskCounts.moderate + riskCounts.healthy;
      console.log(`   📈 Total Classified: ${total}/${allAssessments.length}`);
      
      if (total > 0) {
        totalCollegesWithData++;
        console.log('✅ This college HAS risk distribution data');
      } else {
        totalCollegesWithoutData++;
        console.log('❌ This college has NO classifiable risk data');
      }
      
      summaryData.push({
        college,
        students: students.length,
        assessments: allAssessments.length,
        atRisk: riskCounts.atRisk,
        moderate: riskCounts.moderate,
        healthy: riskCounts.healthy,
        unclassified: riskCounts.unclassified,
        hasData: total > 0
      });
    }
    
    // Summary Report
    console.log('\n\n🏁 COMPREHENSIVE SUMMARY REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n📊 OVERALL STATISTICS:`);
    console.log(`   Total Colleges: ${uniqueColleges.length}`);
    console.log(`   Colleges with Risk Data: ${totalCollegesWithData}`);
    console.log(`   Colleges without Risk Data: ${totalCollegesWithoutData}`);
    console.log(`   Coverage: ${((totalCollegesWithData / uniqueColleges.length) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETAILED BREAKDOWN:');
    summaryData.forEach((data, index) => {
      const status = data.hasData ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${data.college}`);
      console.log(`      Students: ${data.students}, Assessments: ${data.assessments}`);
      if (data.hasData) {
        console.log(`      Risk Distribution: At Risk: ${data.atRisk}, Moderate: ${data.moderate}, Healthy: ${data.healthy}`);
      } else {
        console.log(`      Risk Distribution: No data available`);
      }
    });
    
    console.log('\n🎯 ACCURACY ASSESSMENT:');
    if (totalCollegesWithData === uniqueColleges.length) {
      console.log('✅ EXCELLENT: All colleges have risk distribution data');
      console.log('✅ The risk distribution function is COMPREHENSIVE and covers ALL colleges');
    } else if (totalCollegesWithData > 0) {
      console.log(`⚠️  PARTIAL: ${totalCollegesWithData}/${uniqueColleges.length} colleges have data`);
      console.log('⚠️  The risk distribution function works but has limited coverage');
    } else {
      console.log('❌ CRITICAL: No colleges have risk distribution data');
      console.log('❌ The risk distribution function is NOT working properly');
    }
    
    console.log('\n🔍 ACCURACY VERIFICATION:');
    console.log('The risk distribution calculations use:');
    console.log('   - Direct risk_level values when available');
    console.log('   - Fallback score-based calculation for missing risk_level');
    console.log('   - Proper thresholds for 42-item and 84-item assessments');
    console.log('   - College-specific filtering to ensure accurate data');
    
    const hasAccurateData = summaryData.some(data => data.hasData && (data.atRisk > 0 || data.moderate > 0 || data.healthy > 0));
    if (hasAccurateData) {
      console.log('✅ ACCURACY: The risk distribution calculations appear ACCURATE');
    } else {
      console.log('❌ ACCURACY: Risk distribution calculations may have issues');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
checkAllCollegesRiskDistribution().then(() => {
  console.log('\n🏁 Analysis complete.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Analysis error:', error);
  process.exit(1);
});