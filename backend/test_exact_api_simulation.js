const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { supabase } = require('./config/database');

async function simulateExactAPICall() {
  console.log('🔍 Simulating exact API call that causes 500 error...');
  
  try {
    // Simulate the exact parameters from the frontend
    const assessmentType = 'ryff_42';
    const college = 'College of Engineering';
    const assessment_name = '2025-2026 2nd Semester - 1st Test 42';
    const riskLevel = undefined; // This might be the issue
    const page = 1;
    const limit = 1000;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log('Parameters:', { assessmentType, college, assessment_name, riskLevel, page, limit });
    
    // Step 1: Get students from college (exactly like the API)
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
    
    console.log(`✅ Found ${students?.length || 0} students in ${college}`);
    
    if (!students || students.length === 0) {
      console.log('No students found, ending test.');
      return;
    }
    
    const studentIds = students.map(s => s.id);
    
    // Step 2: Get assignments for assessment name (exactly like the API)
    console.log('\n2. Getting assignments for assessment name...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
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
    
    console.log(`✅ Found ${assignments?.length || 0} assignments for ${assessment_name}`);
    
    if (!assignments || assignments.length === 0) {
      console.log('No assignments found, ending test.');
      return;
    }
    
    const assignmentIds = assignments.map(a => a.id);
    
    // Step 3: Get assessments (exactly like the API)
    console.log('\n3. Getting assessments...');
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments_42items')
      .select('*')
      .in('student_id', studentIds)
      .in('assignment_id', assignmentIds)
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
      return;
    }
    
    console.log(`✅ Found ${assessmentData?.length || 0} assessments`);
    
    if (!assessmentData || assessmentData.length === 0) {
      console.log('No assessments found, ending test.');
      return;
    }
    
    // Step 4: Create student map
    console.log('\n4. Creating student map...');
    const studentMap = {};
    students.forEach(student => {
      studentMap[student.id] = student;
    });
    
    // Step 5: Get assignment details
    console.log('\n5. Getting assignment details...');
    const assignmentIds2 = [...new Set(assessmentData.map(a => a.assignment_id).filter(id => id))];
    
    let assignmentMap = {};
    if (assignmentIds2.length > 0) {
      const { data: assignmentDetails, error: assignmentDetailsError } = await supabase
        .from('assessment_assignments')
        .select(`
          id,
          bulk_assessment_id,
          bulk_assessments(
            id,
            assessment_name,
            assessment_type
          )
        `)
        .in('id', assignmentIds2);
      
      if (!assignmentDetailsError && assignmentDetails) {
        assignmentDetails.forEach(assignment => {
          assignmentMap[assignment.id] = assignment;
        });
      }
    }
    
    // Step 6: Combine data (exactly like the API)
    console.log('\n6. Combining assessment and student data...');
    const assessments = assessmentData.map(assessment => {
      const student = studentMap[assessment.student_id];
      const assignmentDetail = assignmentMap[assessment.assignment_id];
      
      const actualAssessmentName = assignmentDetail?.bulk_assessments?.assessment_name || assessment_name || '42-Item Ryff Assessment';
      
      const combined = {
        ...assessment,
        student: student,
        assignment: {
          id: assessment.assignment_id || 'N/A',
          assigned_at: assessment.created_at,
          completed_at: assessment.completed_at,
          bulk_assessment_id: assignmentDetail?.bulk_assessment_id || 'direct-fetch',
          bulk_assessment: {
            assessment_name: actualAssessmentName,
            assessment_type: 'ryff_42'
          }
        }
      };
      
      console.log('Sample combined assessment:');
      console.log('- Has risk_level?', 'risk_level' in combined);
      console.log('- risk_level value:', combined.risk_level);
      console.log('- Keys:', Object.keys(combined));
      
      return combined;
    }).filter(a => a.student);
    
    console.log(`✅ Combined ${assessments.length} assessments with student data`);
    
    // Step 7: Apply risk level filter (this is where the issue might be)
    console.log('\n7. Testing risk level filtering...');
    console.log('riskLevel parameter:', riskLevel);
    
    if (riskLevel) {
      console.log('Applying risk level filter...');
      const beforeFilter = assessments.length;
      const filteredAssessments = assessments.filter(a => {
        console.log(`Assessment ${a.id}: risk_level = '${a.risk_level}', matches '${riskLevel}': ${a.risk_level === riskLevel}`);
        return a.risk_level === riskLevel;
      });
      console.log(`After risk level filter: ${filteredAssessments.length} assessments (was ${beforeFilter})`);
    } else {
      console.log('No risk level filter applied (riskLevel is undefined/null)');
    }
    
    console.log('\n✅ API simulation completed successfully!');
    
  } catch (error) {
    console.error('❌ API simulation failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

simulateExactAPICall();