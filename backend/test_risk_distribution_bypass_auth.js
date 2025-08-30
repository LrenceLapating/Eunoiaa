const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test the exact logic from the endpoint without authentication
async function testRiskDistributionLogic() {
  console.log('🔍 Testing Risk Distribution Logic (Bypassing Auth)');
  console.log('=' .repeat(60));

  try {
    // Use the exact same parameters as the frontend
    const college = 'College of Arts and Sciences';
    const assessmentName = '2025-2026 2nd Semester - 1st Test 42';
    const yearLevel = undefined; // Not provided by frontend
    const section = undefined; // Not provided by frontend
    
    console.log('\n🎯 Testing with parameters:');
    console.log('   College:', college);
    console.log('   Assessment Name:', assessmentName);
    console.log('   Year Level:', yearLevel || 'All Years');
    console.log('   Section:', section || 'All Sections');
    
    if (!college || !assessmentName) {
      console.log('❌ College and assessment name are required');
      return;
    }
    
    // First, get bulk assessments that match the assessment name
    console.log('\n📋 Step 1: Fetching bulk assessments...');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type')
      .ilike('assessment_name', `%${assessmentName}%`);
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`✅ Found ${bulkAssessments?.length || 0} bulk assessments`);
    if (bulkAssessments && bulkAssessments.length > 0) {
      console.log('📄 Bulk assessments:', bulkAssessments.map(ba => ({
        id: ba.id,
        name: ba.assessment_name,
        type: ba.assessment_type
      })));
    }
    
    if (!bulkAssessments || bulkAssessments.length === 0) {
      console.log('⚠️ No bulk assessments found - returning empty result');
      const emptyResult = {
        success: true,
        data: {
          riskDistribution: { atRisk: 0, moderate: 0, healthy: 0, total: 0 },
          totalStudents: 0,
          filters: { college, assessmentName, yearLevel: yearLevel || 'All Years', section: section || 'All Sections' }
        }
      };
      console.log('📤 Would return:', JSON.stringify(emptyResult, null, 2));
      return;
    }
    
    const bulkAssessmentIds = bulkAssessments.map(ba => ba.id);
    
    // Get assessment assignments for these bulk assessments
    console.log('\n📋 Step 2: Fetching assessment assignments...');
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
    if (assignments && assignments.length > 0) {
      console.log('📄 Sample assignments:', assignments.slice(0, 3));
    }
    
    if (!assignments || assignments.length === 0) {
      console.log('⚠️ No completed assignments found - returning empty result');
      const emptyResult = {
        success: true,
        data: {
          riskDistribution: { atRisk: 0, moderate: 0, healthy: 0, total: 0 },
          totalStudents: 0,
          filters: { college, assessmentName, yearLevel: yearLevel || 'All Years', section: section || 'All Sections' }
        }
      };
      console.log('📤 Would return:', JSON.stringify(emptyResult, null, 2));
      return;
    }
    
    // Get student data for filtering
    console.log('\n📋 Step 3: Fetching student data...');
    const studentIds = assignments.map(a => a.student_id);
    let studentQuery = supabase
      .from('students')
      .select('id, name, college, year_level, section, status')
      .in('id', studentIds)
      .eq('status', 'active')
      .eq('college', college);
    
    // Apply additional filters if provided
    if (yearLevel && yearLevel !== 'All Years') {
      studentQuery = studentQuery.eq('year_level', yearLevel);
    }
    
    if (section && section !== 'All Sections') {
      studentQuery = studentQuery.eq('section', section);
    }
    
    const { data: students, error: studentError } = await studentQuery;
    
    if (studentError) {
      console.error('❌ Error fetching students:', studentError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} active students in ${college}`);
    if (students && students.length > 0) {
      console.log('📄 Sample students:', students.slice(0, 3).map(s => ({
        id: s.id,
        name: s.name,
        college: s.college,
        year_level: s.year_level,
        section: s.section
      })));
    }
    
    // Filter assignments to only include students that match our criteria
    const validStudentIds = new Set(students?.map(s => s.id) || []);
    const filteredAssignments = assignments.filter(a => validStudentIds.has(a.student_id));
    
    console.log(`\n📋 Step 4: Filtering assignments...`);
    console.log(`✅ Found ${filteredAssignments?.length || 0} completed assignments after filtering`);
    
    // Calculate risk distribution
    const riskDistribution = {
      atRisk: 0,
      moderate: 0,
      healthy: 0,
      total: 0
    };
    
    if (filteredAssignments && filteredAssignments.length > 0) {
      filteredAssignments.forEach(assignment => {
        const riskLevel = assignment.risk_level;
        const student = students?.find(s => s.id === assignment.student_id);
        const bulkAssessment = bulkAssessments?.find(ba => ba.id === assignment.bulk_assessment_id);
        
        console.log('🔍 Processing assignment:', {
          studentName: student?.name,
          riskLevel: riskLevel,
          assessmentName: bulkAssessment?.assessment_name
        });
        
        // Map risk levels to distribution categories
        if (riskLevel === 'at-risk' || riskLevel === 'high') {
          riskDistribution.atRisk++;
        } else if (riskLevel === 'moderate') {
          riskDistribution.moderate++;
        } else if (riskLevel === 'healthy' || riskLevel === 'low') {
          riskDistribution.healthy++;
        }
        
        riskDistribution.total++;
      });
    }
    
    console.log('\n📊 Risk distribution calculated:', riskDistribution);
    
    const finalResult = {
      success: true,
      data: {
        riskDistribution,
        totalStudents: riskDistribution.total,
        filters: {
          college,
          assessmentName,
          yearLevel: yearLevel || 'All Years',
          section: section || 'All Sections'
        }
      }
    };
    
    console.log('\n📤 Final API Response:');
    console.log(JSON.stringify(finalResult, null, 2));
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testRiskDistributionLogic();