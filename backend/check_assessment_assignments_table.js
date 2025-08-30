require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAssessmentAssignmentsTable() {
  console.log('🔍 Analyzing assessment_assignments table structure and data...');
  
  try {
    // 1. Check table structure
    console.log('\n1️⃣ Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing assessment_assignments table:', tableError);
      return;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Table columns found:');
      Object.keys(tableInfo[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof tableInfo[0][column]}`);
      });
    }
    
    // 2. Check if risk_level column exists and its values
    console.log('\n2️⃣ Checking risk_level column...');
    const { data: riskLevelData, error: riskError } = await supabase
      .from('assessment_assignments')
      .select('id, risk_level, status')
      .limit(10);
    
    if (riskError) {
      console.error('❌ Error checking risk_level column:', riskError);
    } else {
      console.log('✅ Risk level data sample:');
      riskLevelData.forEach(row => {
        console.log(`   ID: ${row.id}, risk_level: ${row.risk_level}, status: ${row.status}`);
      });
      
      // Count null/empty risk_level values
      const nullRiskCount = riskLevelData.filter(row => !row.risk_level || row.risk_level === null).length;
      console.log(`\n📊 Null/empty risk_level values: ${nullRiskCount}/${riskLevelData.length}`);
    }
    
    // 3. Check the actual query that's causing the 500 error
    console.log('\n3️⃣ Testing the problematic query...');
    const testParams = {
      college: 'College of Engineering',
      assessmentType: 'ryff_42',
      assessment_name: '2025-2026 2nd Semester - 1st Test 42'
    };
    
    console.log('Test parameters:', testParams);
    
    // Simulate the exact query from counselorAssessments.js
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('bulk_assessments.assessment_name', testParams.assessment_name)
      .eq('bulk_assessments.assessment_type', testParams.assessmentType);
    
    if (assignmentError) {
      console.error('❌ Error in assignment query:', assignmentError);
    } else {
      console.log(`✅ Found ${assignments.length} assignments`);
      if (assignments.length > 0) {
        console.log('Sample assignment:', assignments[0]);
      }
    }
    
    // 4. Check if the issue is in the students query
    console.log('\n4️⃣ Testing students query...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college')
      .eq('college', testParams.college)
      .eq('status', 'active')
      .limit(5);
    
    if (studentsError) {
      console.error('❌ Error in students query:', studentsError);
    } else {
      console.log(`✅ Found ${students.length} students in ${testParams.college}`);
    }
    
    // 5. Check assessments_42items table
    console.log('\n5️⃣ Testing assessments_42items query...');
    if (assignments && assignments.length > 0 && students && students.length > 0) {
      const assignmentIds = assignments.map(a => a.id);
      const studentIds = students.map(s => s.id);
      
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments_42items')
        .select('id, student_id, assignment_id, risk_level, overall_score')
        .in('assignment_id', assignmentIds)
        .in('student_id', studentIds)
        .limit(5);
      
      if (assessmentsError) {
        console.error('❌ Error in assessments_42items query:', assessmentsError);
        console.error('This might be the source of the 500 error!');
      } else {
        console.log(`✅ Found ${assessments.length} assessments in assessments_42items`);
        if (assessments.length > 0) {
          console.log('Sample assessment:', assessments[0]);
          
          // Check for null risk_level values
          const nullRiskAssessments = assessments.filter(a => !a.risk_level || a.risk_level === null);
          console.log(`📊 Assessments with null risk_level: ${nullRiskAssessments.length}/${assessments.length}`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAssessmentAssignmentsTable();