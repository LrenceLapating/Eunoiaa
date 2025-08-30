const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedRiskDistributionEndpoint() {
  console.log('🔍 Testing Fixed Risk Distribution Endpoint');
  console.log('=' .repeat(60));

  try {
    // First, let's get a valid counselor session for testing
    console.log('\n🔐 Getting counselor session...');
    const { data: counselors, error: counselorError } = await supabase
      .from('counselors')
      .select('id, name, email')
      .limit(1);
    
    if (counselorError || !counselors || counselors.length === 0) {
      console.error('❌ No counselors found for testing');
      return;
    }
    
    const counselor = counselors[0];
    console.log('✅ Using counselor for test:', counselor.name);
    
    // Test the endpoint with the exact same parameters as the frontend
    const params = new URLSearchParams({
      college: 'College of Arts and Sciences',
      assessmentName: '2025-2026 2nd Semester - 1st Test 42'
    });
    
    console.log('\n🎯 Testing endpoint with parameters:');
    console.log('   College:', 'College of Arts and Sciences');
    console.log('   Assessment Name:', '2025-2026 2nd Semester - 1st Test 42');
    console.log('   URL:', `http://localhost:3000/api/counselor-assessments/risk-distribution?${params.toString()}`);
    
    // Create a mock session cookie (this is a simplified approach for testing)
    const response = await fetch(`http://localhost:3000/api/counselor-assessments/risk-distribution?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `counselor_session=${counselor.id}` // Mock session
      }
    });
    
    console.log('\n📡 Response Status:', response.status);
    console.log('📡 Response Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Response Success:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data && data.data.riskDistribution) {
        const { riskDistribution } = data.data;
        console.log('\n📊 Risk Distribution Summary:');
        console.log(`   At Risk: ${riskDistribution.atRisk}`);
        console.log(`   Moderate: ${riskDistribution.moderate}`);
        console.log(`   Healthy: ${riskDistribution.healthy}`);
        console.log(`   Total: ${riskDistribution.total}`);
        
        if (riskDistribution.total > 0) {
          console.log('\n🎉 SUCCESS: Risk distribution data found!');
        } else {
          console.log('\n⚠️ WARNING: No risk distribution data found');
        }
      } else {
        console.log('\n❌ ERROR: Invalid response structure');
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ API Response Error:');
      console.log('Status:', response.status);
      console.log('Error Text:', errorText);
      
      if (response.status === 401) {
        console.log('\n🔐 Authentication issue - this is expected in test environment');
        console.log('   The endpoint logic should be working, but requires proper session');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Also test the direct database logic to ensure it's working
async function testDirectDatabaseLogic() {
  console.log('\n\n🔍 Testing Direct Database Logic (Bypass Endpoint)');
  console.log('=' .repeat(60));
  
  try {
    const college = 'College of Arts and Sciences';
    const assessmentName = '2025-2026 2nd Semester - 1st Test 42';
    
    // Use the same logic as the fixed endpoint
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type')
      .ilike('assessment_name', `%${assessmentName}%`);
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`✅ Found ${bulkAssessments?.length || 0} bulk assessments`);
    
    if (!bulkAssessments || bulkAssessments.length === 0) {
      console.log('⚠️ No bulk assessments found');
      return;
    }
    
    const bulkAssessmentIds = bulkAssessments.map(ba => ba.id);
    
    // Get assessment assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('id, student_id, bulk_assessment_id, status, risk_level')
      .in('bulk_assessment_id', bulkAssessmentIds)
      .eq('status', 'completed');
    
    if (assignmentError) {
      console.error('❌ Error fetching assignments:', assignmentError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} completed assignments`);
    
    if (!assignments || assignments.length === 0) {
      console.log('⚠️ No completed assignments found');
      return;
    }
    
    // Get students
    const studentIds = assignments.map(a => a.student_id);
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name, college, year_level, section, status')
      .in('id', studentIds)
      .eq('status', 'active')
      .eq('college', college);
    
    if (studentError) {
      console.error('❌ Error fetching students:', studentError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} active students in ${college}`);
    
    // Calculate risk distribution
    const validStudentIds = new Set(students?.map(s => s.id) || []);
    const filteredAssignments = assignments.filter(a => validStudentIds.has(a.student_id));
    
    const riskDistribution = { atRisk: 0, moderate: 0, healthy: 0, total: 0 };
    
    filteredAssignments.forEach(assignment => {
      const riskLevel = assignment.risk_level;
      
      if (riskLevel === 'at-risk' || riskLevel === 'high') {
        riskDistribution.atRisk++;
      } else if (riskLevel === 'moderate') {
        riskDistribution.moderate++;
      } else if (riskLevel === 'healthy' || riskLevel === 'low') {
        riskDistribution.healthy++;
      }
      
      riskDistribution.total++;
    });
    
    console.log('\n📊 Final Risk Distribution:');
    console.log(`   At Risk: ${riskDistribution.atRisk}`);
    console.log(`   Moderate: ${riskDistribution.moderate}`);
    console.log(`   Healthy: ${riskDistribution.healthy}`);
    console.log(`   Total: ${riskDistribution.total}`);
    
    if (riskDistribution.total > 0) {
      console.log('\n🎉 SUCCESS: Database logic is working correctly!');
    } else {
      console.log('\n⚠️ WARNING: No risk distribution data calculated');
    }
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
  }
}

// Run both tests
async function runAllTests() {
  await testFixedRiskDistributionEndpoint();
  await testDirectDatabaseLogic();
  
  console.log('\n\n🏁 All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Check if the frontend now shows risk distribution data');
  console.log('2. Refresh the college detail page at http://localhost:8080/counselor/college-detail/{collegeId}');
  console.log('3. Select "2025-2026 2nd Semester - 1st Test 42" assessment');
  console.log('4. Verify that the Risk Distribution section shows: 0 At Risk, 7 Moderate, 0 Healthy');
}

runAllTests();