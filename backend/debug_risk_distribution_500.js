const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRiskDistribution() {
  console.log('🔍 Debugging Risk Distribution 500 Error');
  console.log('=' .repeat(50));

  try {
    // Test the exact same logic as the endpoint
    const college = 'College of Arts and Sciences';
    const assessmentName = '2025-2026 2nd Semester - 1st Test 42';
    
    console.log('\n🎯 Testing with parameters:');
    console.log('   College:', college);
    console.log('   Assessment Name:', assessmentName);
    
    // Step 1: Get bulk assessments that match the assessment name
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
      console.log('⚠️ No bulk assessments found - this would return empty result');
      return;
    }
    
    const bulkAssessmentIds = bulkAssessments.map(ba => ba.id);
    
    // Step 2: Get assessment assignments for these bulk assessments
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
      console.log('⚠️ No completed assignments found - this would return empty result');
      return;
    }
    
    // Step 3: Get student data for filtering
    console.log('\n📋 Step 3: Fetching student data...');
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
    if (students && students.length > 0) {
      console.log('📄 Sample students:', students.slice(0, 3).map(s => ({
        id: s.id,
        name: s.name,
        college: s.college,
        year_level: s.year_level,
        section: s.section
      })));
    }
    
    // Step 4: Filter assignments and calculate risk distribution
    console.log('\n📋 Step 4: Calculating risk distribution...');
    const validStudentIds = new Set(students?.map(s => s.id) || []);
    const filteredAssignments = assignments.filter(a => validStudentIds.has(a.student_id));
    
    console.log(`✅ Filtered to ${filteredAssignments?.length || 0} valid assignments`);
    
    // Calculate risk distribution
    const riskDistribution = {
      atRisk: 0,
      moderate: 0,
      healthy: 0,
      total: 0
    };
    
    const riskLevelCounts = {};
    
    if (filteredAssignments && filteredAssignments.length > 0) {
      filteredAssignments.forEach(assignment => {
        const riskLevel = assignment.risk_level;
        const student = students?.find(s => s.id === assignment.student_id);
        
        // Count risk levels
        riskLevelCounts[riskLevel] = (riskLevelCounts[riskLevel] || 0) + 1;
        
        console.log('🔍 Processing assignment:', {
          studentName: student?.name,
          riskLevel: riskLevel,
          studentId: assignment.student_id
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
    
    console.log('\n📊 Final Results:');
    console.log('   Risk Level Counts:', riskLevelCounts);
    console.log('   Risk Distribution:', riskDistribution);
    console.log('   Total Students:', students?.length || 0);
    
    console.log('\n✅ Debug completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
    console.error('Error stack:', error.stack);
  }
}

// Run the debug
debugRiskDistribution();