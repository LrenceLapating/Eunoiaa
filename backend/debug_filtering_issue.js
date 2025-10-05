const { supabaseAdmin } = require('./config/database');

async function debugFilteringIssue() {
  console.log('=== DEBUGGING FILTERING ISSUE ===\n');
  
  // Simulate the exact same query logic as demographicTrends.js
  const year = '2025'; // From the logs: year: 2025-2026
  const assessmentType = '42-item'; // From the logs
  
  // Define school year (same logic as demographicTrends.js)
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);
  const schoolYear = {
    label: `${yearNum}-${yearNum+1}`,
    startDate: `${yearNum}-08-01`,
    endDate: `${yearNum+1}-07-31`
  };
  
  console.log(`📅 School Year: ${schoolYear.label}`);
  console.log(`📅 Date Range: ${schoolYear.startDate} to ${schoolYear.endDate}`);
  
  // Step 1: Get all active students (same as demographicTrends.js)
  const { data: students, error: studentsError } = await supabaseAdmin
    .from('students')
    .select('id, gender, college')
    .eq('status', 'active');
  
  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
    return;
  }
  
  console.log(`👥 Total active students: ${students.length}`);
  
  const studentIds = students.map(s => s.id);
  const targetStudentIds = [
    'fe953158-d178-430f-af26-6fc70b2c3b22', // Female
    '56d978c0-6e83-4715-9a21-7db501e12ec2', // Male 1
    'd04ff552-f21d-4b6b-b0fe-b3843305375e'  // Male 2
  ];
  
  // Check if our target students are in the active students list
  targetStudentIds.forEach(id => {
    const student = students.find(s => s.id === id);
    if (student) {
      console.log(`✅ Student ${id} (${student.gender}) is active`);
    } else {
      console.log(`❌ Student ${id} is NOT in active students list`);
    }
  });
  
  // Step 2: Fetch assessments with the EXACT same logic as demographicTrends.js
  console.log('\n🔍 Fetching assessments with date filtering...');
  
  const { data: assessments42, error: error42 } = await supabaseAdmin
    .from('assessments_42items')
    .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score')
    .in('student_id', studentIds)
    .gte('completed_at', schoolYear.startDate)
    .lte('completed_at', schoolYear.endDate)
    .not('scores', 'is', null)
    .not('risk_level', 'is', null);
  
  if (error42) {
    console.error('❌ Error fetching 42-item assessments:', error42);
    return;
  }
  
  console.log(`📊 42-item assessments found: ${assessments42?.length || 0}`);
  
  // Check which of our target students have assessments
  targetStudentIds.forEach(id => {
    const studentAssessments = assessments42.filter(a => a.student_id === id);
    const student = students.find(s => s.id === id);
    
    console.log(`\n👤 Student ${id} (${student?.gender || 'Unknown'}):`);
    console.log(`   Assessments found: ${studentAssessments.length}`);
    
    studentAssessments.forEach((assessment, index) => {
      console.log(`   Assessment ${index + 1}:`);
      console.log(`     - Completed: ${assessment.completed_at}`);
      console.log(`     - Overall Score: ${assessment.overall_score}`);
      console.log(`     - Risk Level: ${assessment.risk_level}`);
      console.log(`     - At-Risk Dimensions: ${JSON.stringify(assessment.at_risk_dimensions)}`);
      
      // Check if it falls within the date range
      const completedDate = new Date(assessment.completed_at);
      const startDate = new Date(schoolYear.startDate);
      const endDate = new Date(schoolYear.endDate);
      
      const inRange = completedDate >= startDate && completedDate <= endDate;
      console.log(`     - In Date Range (${schoolYear.startDate} to ${schoolYear.endDate}): ${inRange}`);
      
      if (!inRange) {
        console.log(`     ⚠️  FILTERED OUT by date range!`);
      }
    });
  });
  
  // Step 3: Test without date filtering to see all assessments
  console.log('\n🔍 Fetching assessments WITHOUT date filtering...');
  
  const { data: allAssessments42, error: errorAll } = await supabaseAdmin
    .from('assessments_42items')
    .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score')
    .in('student_id', targetStudentIds)
    .not('scores', 'is', null)
    .not('risk_level', 'is', null);
  
  if (errorAll) {
    console.error('❌ Error fetching all assessments:', errorAll);
    return;
  }
  
  console.log(`📊 All assessments (no date filter): ${allAssessments42?.length || 0}`);
  
  targetStudentIds.forEach(id => {
    const studentAssessments = allAssessments42.filter(a => a.student_id === id);
    const student = students.find(s => s.id === id);
    
    console.log(`\n👤 Student ${id} (${student?.gender || 'Unknown'}) - ALL ASSESSMENTS:`);
    console.log(`   Total assessments: ${studentAssessments.length}`);
    
    studentAssessments.forEach((assessment, index) => {
      console.log(`   Assessment ${index + 1}:`);
      console.log(`     - Completed: ${assessment.completed_at}`);
      console.log(`     - Overall Score: ${assessment.overall_score}`);
      console.log(`     - Risk Level: ${assessment.risk_level}`);
      console.log(`     - At-Risk Dimensions: ${JSON.stringify(assessment.at_risk_dimensions)}`);
    });
  });
  
  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}

// Run the debug
debugFilteringIssue().catch(console.error);