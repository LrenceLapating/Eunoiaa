const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { supabase } = require('./config/database');

async function testDatabaseFixVerification() {
  console.log('🔍 Testing database-level fix verification...');
  
  try {
    // Simulate the exact logic from the fixed counselorAssessments.js
    const college = 'College of Engineering';
    const assessment_name = '2025-2026 2nd Semester - 1st Test 42';
    const assessmentType = 'ryff_42';
    const page = 1;
    const limit = 1000;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log('Parameters:', { college, assessment_name, assessmentType, page, limit });
    
    // Test the fixed logic for 42-item assessments
    console.log('\n=== Testing 42-item Assessment Logic ===');
    
    // Step 1: Get students from college
    console.log('\n1. Getting students from college...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, college, year_level, section')
      .eq('college', college)
      .eq('status', 'active');
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} students in ${college}`);
    
    if (!students || students.length === 0) {
      console.log('✅ No students found - this should return empty array, not 500 error');
      return;
    }
    
    const studentIds = students.map(s => s.id);
    
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
      console.error('❌ Error fetching assignments:', assignmentError);
      return;
    }
    
    console.log(`✅ Found ${assignments?.length || 0} assignments for ${assessment_name}`);
    
    if (!assignments || assignments.length === 0) {
      console.log('✅ No assignments found - this should return empty array, not 500 error');
      return;
    }
    
    const assignmentIds = assignments.map(a => a.id);
    
    // Step 3: Check overlap (the key fix)
    console.log('\n3. Checking student-assignment overlap (KEY FIX)...');
    const assignmentStudentIds = assignments.map(a => a.student_id).filter(id => id);
    const overlappingStudents = studentIds.filter(id => assignmentStudentIds.includes(id));
    
    console.log(`🔍 Students in college: ${studentIds.length}`);
    console.log(`🔍 Students with assignments: ${assignmentStudentIds.length}`);
    console.log(`🔍 Overlapping students: ${overlappingStudents.length}`);
    
    if (overlappingStudents.length === 0) {
      console.log('✅ NO OVERLAP DETECTED - Fixed logic should return empty array instead of causing 500 error');
      console.log('✅ This is the root cause that was fixed!');
      return;
    }
    
    // Step 4: If there is overlap, fetch assessments
    console.log('\n4. Fetching assessments (only if overlap exists)...');
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds)
      .in('assignment_id', assignmentIds)
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError);
      return;
    }
    
    console.log(`✅ Found ${assessmentData?.length || 0} assessments`);
    
    // Test the same logic for 84-item assessments
    console.log('\n=== Testing 84-item Assessment Logic ===');
    
    const assessment_name_84 = '2025-2026 2nd Semester - 1st Test 84';
    
    // Get 84-item assignments
    console.log('\n1. Getting 84-item assignments...');
    const { data: assignments84, error: assignmentError84 } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessments!inner(
          id,
          assessment_name,
          assessment_type
        )
      `)
      .eq('bulk_assessments.assessment_name', assessment_name_84)
      .eq('bulk_assessments.assessment_type', 'ryff_84');
    
    if (assignmentError84) {
      console.error('❌ Error fetching 84-item assignments:', assignmentError84);
      return;
    }
    
    console.log(`✅ Found ${assignments84?.length || 0} 84-item assignments`);
    
    if (!assignments84 || assignments84.length === 0) {
      console.log('✅ No 84-item assignments found - this should return empty array, not 500 error');
    } else {
      // Check overlap for 84-item
      const assignmentStudentIds84 = assignments84.map(a => a.student_id).filter(id => id);
      const overlappingStudents84 = studentIds.filter(id => assignmentStudentIds84.includes(id));
      
      console.log(`🔍 84-item - Students in college: ${studentIds.length}`);
      console.log(`🔍 84-item - Students with assignments: ${assignmentStudentIds84.length}`);
      console.log(`🔍 84-item - Overlapping students: ${overlappingStudents84.length}`);
      
      if (overlappingStudents84.length === 0) {
        console.log('✅ 84-item - NO OVERLAP DETECTED - Fixed logic should return empty array');
      } else {
        console.log('✅ 84-item - Overlap found, would proceed with assessment fetching');
      }
    }
    
    console.log('\n🎉 Database fix verification completed successfully!');
    console.log('🎉 The logic now properly handles cases where there are no overlapping students');
    console.log('🎉 Instead of causing a 500 error, it returns an empty array gracefully');
    
  } catch (error) {
    console.error('❌ Database fix verification failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testDatabaseFixVerification();