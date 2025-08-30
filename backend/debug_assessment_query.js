const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { supabase } = require('./config/database');

async function debugAssessmentQuery() {
  console.log('🔍 Debugging assessment query issue...');
  
  try {
    const college = 'College of Engineering';
    const assessment_name = '2025-2026 2nd Semester - 1st Test 42';
    
    // Step 1: Get students from college
    console.log('\n1. Getting students from college...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college, year_level, section')
      .eq('college', college)
      .eq('status', 'active');
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} students`);
    const studentIds = students.map(s => s.id);
    console.log('Student IDs:', studentIds.slice(0, 5), '...');
    
    // Step 2: Get assignments for assessment name
    console.log('\n2. Getting assignments for assessment name...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('bulk_assessments.assessment_name', assessment_name)
      .eq('bulk_assessments.assessment_type', 'ryff_42');
    
    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} assignments`);
    if (assignments && assignments.length > 0) {
      console.log('Sample assignment:', assignments[0]);
      console.log('Assignment IDs:', assignments.map(a => a.id).slice(0, 5), '...');
      console.log('Assignment student IDs:', assignments.map(a => a.student_id).slice(0, 5), '...');
    }
    
    const assignmentIds = assignments.map(a => a.id);
    
    // Step 3: Check if any assignments match our students
    console.log('\n3. Checking assignment-student overlap...');
    const assignmentStudentIds = assignments.map(a => a.student_id);
    const overlap = studentIds.filter(id => assignmentStudentIds.includes(id));
    console.log(`Students in college: ${studentIds.length}`);
    console.log(`Students with assignments: ${assignmentStudentIds.length}`);
    console.log(`Overlap: ${overlap.length}`);
    console.log('Overlapping student IDs:', overlap);
    
    // Step 4: Try different assessment queries
    console.log('\n4. Testing different assessment queries...');
    
    // Query A: Just by student IDs
    console.log('\nQuery A: Just by student IDs');
    const { data: assessmentsA, error: errorA } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds)
      .limit(5);
    
    console.log(`Result A: ${assessmentsA?.length || 0} assessments`);
    if (assessmentsA && assessmentsA.length > 0) {
      console.log('Sample assessment A:', {
        id: assessmentsA[0].id,
        student_id: assessmentsA[0].student_id,
        assignment_id: assessmentsA[0].assignment_id,
        risk_level: assessmentsA[0].risk_level
      });
    }
    
    // Query B: Just by assignment IDs
    console.log('\nQuery B: Just by assignment IDs');
    const { data: assessmentsB, error: errorB } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('assignment_id', assignmentIds)
      .limit(5);
    
    console.log(`Result B: ${assessmentsB?.length || 0} assessments`);
    if (assessmentsB && assessmentsB.length > 0) {
      console.log('Sample assessment B:', {
        id: assessmentsB[0].id,
        student_id: assessmentsB[0].student_id,
        assignment_id: assessmentsB[0].assignment_id,
        risk_level: assessmentsB[0].risk_level
      });
    }
    
    // Query C: Both student IDs and assignment IDs (the problematic one)
    console.log('\nQuery C: Both student IDs and assignment IDs (problematic)');
    const { data: assessmentsC, error: errorC } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds)
      .in('assignment_id', assignmentIds)
      .limit(5);
    
    console.log(`Result C: ${assessmentsC?.length || 0} assessments`);
    if (assessmentsC && assessmentsC.length > 0) {
      console.log('Sample assessment C:', {
        id: assessmentsC[0].id,
        student_id: assessmentsC[0].student_id,
        assignment_id: assessmentsC[0].assignment_id,
        risk_level: assessmentsC[0].risk_level
      });
    }
    
    // Step 5: Check if there are any assessments with null assignment_id
    console.log('\n5. Checking assessments with null assignment_id...');
    const { data: nullAssignments, error: nullError } = await supabase
      .from('assessments_42items')
      .select('id, student_id, assignment_id')
      .in('student_id', studentIds)
      .is('assignment_id', null)
      .limit(5);
    
    console.log(`Assessments with null assignment_id: ${nullAssignments?.length || 0}`);
    
    // Step 6: Use admin client to bypass RLS
    console.log('\n6. Testing with admin client (bypass RLS)...');
    const { data: adminAssessments, error: adminError } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds)
      .in('assignment_id', assignmentIds)
      .limit(5);
    
    console.log(`Admin query result: ${adminAssessments?.length || 0} assessments`);
    if (adminAssessments && adminAssessments.length > 0) {
      console.log('Sample admin assessment:', {
        id: adminAssessments[0].id,
        student_id: adminAssessments[0].student_id,
        assignment_id: adminAssessments[0].assignment_id,
        risk_level: adminAssessments[0].risk_level
      });
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

debugAssessmentQuery();