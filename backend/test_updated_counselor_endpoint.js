const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testUpdatedCounselorEndpoint() {
  console.log('=== TESTING UPDATED COUNSELOR ASSESSMENTS ENDPOINT ===\n');
  
  try {
    // Test the actual API endpoint
    const testUrl = 'http://localhost:3000/api/counselor/assessments/results';
    const params = new URLSearchParams({
      college: 'College of Arts and Sciences',
      page: 1,
      limit: 10
    });
    
    console.log(`🎯 Testing endpoint: ${testUrl}?${params}`);
    
    const response = await fetch(`${testUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd need proper session cookies
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('📋 ENDPOINT RESPONSE:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Total assessments: ${result.data?.length || 0}`);
    console.log(`- Total count: ${result.pagination?.total || 0}`);
    
    if (result.data && result.data.length > 0) {
      console.log('\n📊 Sample assessment:');
      const sample = result.data[0];
      console.log(`- Overall Score: ${sample.overall_score}`);
      console.log(`- Risk Level: ${sample.risk_level}`);
      console.log(`- Student: ${sample.student?.name}`);
      console.log(`- College: ${sample.student?.college}`);
      console.log(`- Assessment: ${sample.assignment?.bulk_assessment?.assessment_name}`);
      
      console.log('\n🔍 Risk Distribution Analysis:');
      const riskCounts = {
        high: 0,
        moderate: 0,
        low: 0
      };
      
      result.data.forEach(assessment => {
        if (assessment.risk_level === 'high') riskCounts.high++;
        else if (assessment.risk_level === 'moderate') riskCounts.moderate++;
        else if (assessment.risk_level === 'low') riskCounts.low++;
      });
      
      console.log(`- At Risk (High): ${riskCounts.high}`);
      console.log(`- Moderate: ${riskCounts.moderate}`);
      console.log(`- Healthy (Low): ${riskCounts.low}`);
      
      // Verify all students are from the correct college
      const collegeCheck = result.data.every(assessment => 
        assessment.student?.college === 'College of Arts and Sciences'
      );
      console.log(`\n✅ All students from correct college: ${collegeCheck}`);
      
    } else {
      console.log('\n⚠️ No assessment data returned');
    }
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

// Also test the direct database approach
async function testDirectDatabaseQuery() {
  console.log('\n=== TESTING DIRECT DATABASE QUERY ===\n');
  
  try {
    // Get students from College of Arts and Sciences
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college')
      .eq('college', 'College of Arts and Sciences')
      .eq('status', 'active');
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    console.log(`🔍 Found ${students?.length || 0} students in College of Arts and Sciences`);
    
    if (students && students.length > 0) {
      const studentIds = students.map(s => s.id);
      
      // Get their assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments_42items')
        .select('*')
        .in('student_id', studentIds);
      
      if (assessmentsError) {
        console.error('Error fetching assessments:', assessmentsError);
        return;
      }
      
      console.log(`📊 Found ${assessments?.length || 0} assessments for these students`);
      
      if (assessments && assessments.length > 0) {
        console.log('\n🔍 Risk Distribution from Direct Query:');
        const riskCounts = {
          high: 0,
          moderate: 0,
          low: 0
        };
        
        assessments.forEach(assessment => {
          if (assessment.risk_level === 'high') riskCounts.high++;
          else if (assessment.risk_level === 'moderate') riskCounts.moderate++;
          else if (assessment.risk_level === 'low') riskCounts.low++;
        });
        
        console.log(`- At Risk (High): ${riskCounts.high}`);
        console.log(`- Moderate: ${riskCounts.moderate}`);
        console.log(`- Healthy (Low): ${riskCounts.low}`);
        
        console.log('\n📋 Sample assessment data:');
        const sample = assessments[0];
        console.log(`- Student ID: ${sample.student_id}`);
        console.log(`- Overall Score: ${sample.overall_score}`);
        console.log(`- Risk Level: ${sample.risk_level}`);
        console.log(`- Assessment Type: ${sample.assessment_type}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Direct query error:', error);
  }
}

// Run both tests
async function runAllTests() {
  await testDirectDatabaseQuery();
  await testUpdatedCounselorEndpoint();
}

runAllTests();