require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRiskLevelFix() {
  try {
    console.log('🧪 Testing risk_level fix in assessment_assignments...');
    
    // 1. Check current state of assessment_assignments risk_level column
    console.log('\n📊 Checking current risk_level distribution in assessment_assignments...');
    
    const { data: currentAssignments, error: currentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, status, risk_level')
      .eq('status', 'completed');
    
    if (currentError) {
      console.error('❌ Error fetching current assignments:', currentError);
      return;
    }
    
    const totalCompleted = currentAssignments.length;
    const withRiskLevel = currentAssignments.filter(a => a.risk_level !== null).length;
    const withoutRiskLevel = totalCompleted - withRiskLevel;
    
    console.log(`   Total completed assignments: ${totalCompleted}`);
    console.log(`   With risk_level: ${withRiskLevel}`);
    console.log(`   Without risk_level: ${withoutRiskLevel}`);
    
    if (withRiskLevel > 0) {
      const riskDistribution = {};
      currentAssignments.forEach(a => {
        if (a.risk_level) {
          riskDistribution[a.risk_level] = (riskDistribution[a.risk_level] || 0) + 1;
        }
      });
      console.log('   Risk level distribution:', riskDistribution);
    }
    
    // 2. Find an assigned assessment to test with
    console.log('\n🔍 Looking for an assigned assessment to test...');
    
    const { data: assignedAssessments, error: assignedError } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        *,
        bulk_assessment:bulk_assessments(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('status', 'assigned')
      .limit(5);
    
    if (assignedError) {
      console.error('❌ Error fetching assigned assessments:', assignedError);
      return;
    }
    
    if (!assignedAssessments || assignedAssessments.length === 0) {
      console.log('❌ No assigned assessments found for testing');
      console.log('💡 The fix has been applied to the code. New submissions will now populate risk_level.');
      return;
    }
    
    console.log(`✅ Found ${assignedAssessments.length} assigned assessments`);
    
    // 3. Show details of available test assessments
    assignedAssessments.forEach((assignment, index) => {
      console.log(`\n   Assignment ${index + 1}:`);
      console.log(`   - ID: ${assignment.id}`);
      console.log(`   - Student ID: ${assignment.student_id}`);
      console.log(`   - Assessment: ${assignment.bulk_assessment.assessment_name}`);
      console.log(`   - Type: ${assignment.bulk_assessment.assessment_type}`);
      console.log(`   - Assigned: ${assignment.assigned_at}`);
      console.log(`   - Expires: ${assignment.expires_at}`);
    });
    
    // 4. Check if there are any recent submissions to verify the fix
    console.log('\n🕐 Checking for recent submissions (last 24 hours)...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentSubmissions, error: recentError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('id, status, risk_level, completed_at')
      .eq('status', 'completed')
      .gte('completed_at', yesterday.toISOString())
      .order('completed_at', { ascending: false });
    
    if (recentError) {
      console.error('❌ Error fetching recent submissions:', recentError);
    } else if (recentSubmissions && recentSubmissions.length > 0) {
      console.log(`✅ Found ${recentSubmissions.length} recent submissions:`);
      
      recentSubmissions.forEach((submission, index) => {
        console.log(`\n   Recent submission ${index + 1}:`);
        console.log(`   - Assignment ID: ${submission.id}`);
        console.log(`   - Risk Level: ${submission.risk_level || 'NULL'}`);
        console.log(`   - Completed: ${submission.completed_at}`);
      });
      
      const recentWithRisk = recentSubmissions.filter(s => s.risk_level !== null).length;
      console.log(`\n   Recent submissions with risk_level: ${recentWithRisk}/${recentSubmissions.length}`);
      
      if (recentWithRisk === recentSubmissions.length) {
        console.log('✅ All recent submissions have risk_level populated - fix is working!');
      } else if (recentWithRisk > 0) {
        console.log('⚠️  Some recent submissions have risk_level - fix may be partially working');
      } else {
        console.log('❌ No recent submissions have risk_level - fix may not be working yet');
      }
    } else {
      console.log('ℹ️  No recent submissions found');
    }
    
    // 5. Provide summary and recommendations
    console.log('\n📋 Summary:');
    console.log('   - The assessment submission endpoint has been updated to populate risk_level');
    console.log('   - New assessment submissions will now include risk_level in assessment_assignments');
    console.log('   - Existing completed assignments without risk_level will remain unchanged');
    
    if (withoutRiskLevel > 0) {
      console.log('\n💡 Recommendations:');
      console.log(`   - ${withoutRiskLevel} existing completed assignments lack risk_level`);
      console.log('   - Consider running a migration script to backfill risk_level for existing records');
      console.log('   - The migration would copy risk_level from assessments_42items/assessments_84items');
    }
    
    console.log('\n🎉 Risk level fix verification completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRiskLevelFix();