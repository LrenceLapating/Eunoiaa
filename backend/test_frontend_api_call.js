require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFrontendAPICall() {
  try {
    console.log('Testing the exact API logic that frontend calls...');
    
    // Simulate the request that frontend makes
    const testReq = {
      session: {
        user_id: 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7' // The counselor ID we know has 84-item assessments
      },
      query: {
        assessmentType: 'ryff_84',
        limit: '1000'
      }
    };
    
    console.log('Simulating request with:');
    console.log('- Counselor ID:', testReq.session.user_id);
    console.log('- Assessment type filter:', testReq.query.assessmentType);
    console.log('- Limit:', testReq.query.limit);
    
    // Extract parameters exactly like the backend does
    const counselorId = testReq.session.user_id;
    const { page = 1, limit = 20, riskLevel, assessmentType, college } = testReq.query;
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log('\nProcessed parameters:');
    console.log('- Page:', page);
    console.log('- Limit:', limitNum);
    console.log('- Assessment Type:', assessmentType);
    
    // Determine which table to query based on assessment type
    let tableName = 'assessments'; // Default to unified view
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    console.log('- Using table:', tableName);
    
    // Execute the exact logic from counselorAssessments.js for assessments_84items
    if (tableName === 'assessments_84items') {
      console.log('\n=== Step 1: Get assignments for counselor ===');
      const { data: assignments, error: assignError } = await supabase
        .from('assessment_assignments')
        .select(`
          id, student_id, assigned_at, completed_at, bulk_assessment_id,
          bulk_assessments!inner(
            id, assessment_name, assessment_type, counselor_id, status
          )
        `)
        .eq('bulk_assessments.counselor_id', counselorId)
        .neq('bulk_assessments.status', 'archived');
      
      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        return;
      }
      
      console.log('Total assignments found:', assignments?.length || 0);
      
      if (!assignments || assignments.length === 0) {
        console.log('❌ No assignments found for counselor');
        return;
      }
      
      console.log('\n=== Step 2: Get assessments for assignment IDs ===');
      const assignmentIds = assignments.map(a => a.id);
      console.log('Assignment IDs to query:', assignmentIds);
      
      const { data: assessments, error: assessError } = await supabase
        .from(tableName)
        .select('*')
        .in('assignment_id', assignmentIds);
      
      if (assessError) {
        console.error('Error fetching assessments:', assessError);
        return;
      }
      
      console.log('Raw assessments found:', assessments?.length || 0);
      
      if (!assessments || assessments.length === 0) {
        console.log('❌ No assessments found in', tableName);
        console.log('This means students have assignments but haven\'t completed assessments yet');
        return;
      }
      
      console.log('\n=== Step 3: Get student data ===');
      const studentIds = [...new Set(assessments.map(a => a.student_id))];
      console.log('Student IDs to fetch:', studentIds);
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, id_number, college, section, year_level')
        .in('id', studentIds);
      
      if (studentError) {
        console.error('Error fetching students:', studentError);
        return;
      }
      
      console.log('Students found:', students?.length || 0);
      
      console.log('\n=== Step 4: Combine data ===');
      const enrichedAssessments = assessments.map(assessment => {
        const assignment = assignments.find(a => a.id === assessment.assignment_id);
        const student = students?.find(s => s.id === assessment.student_id);
        
        return {
          id: assessment.id,
          student_id: assessment.student_id,
          student_name: student?.name || 'Unknown Student',
          student_college: student?.college || 'Unknown College',
          student_section: student?.section || 'Unknown Section',
          student_email: student?.email || '',
          student_id_number: student?.id_number || '',
          student_year_level: student?.year_level || '',
          scores: assessment.scores,
          overall_score: assessment.overall_score,
          risk_level: assessment.risk_level,
          completed_at: assessment.completed_at,
          assessment_type: assessment.assessment_type,
          student: student,
          assignment: {
            id: assignment?.id,
            assigned_at: assignment?.assigned_at,
            completed_at: assignment?.completed_at,
            bulk_assessment_id: assignment?.bulk_assessment_id,
            bulk_assessment: assignment?.bulk_assessments
          }
        };
      }).filter(a => a.student); // Only include assessments with valid students
      
      console.log('Final enriched assessments:', enrichedAssessments.length);
      
      if (enrichedAssessments.length > 0) {
        console.log('\n✅ SUCCESS! Found assessments:');
        enrichedAssessments.forEach(assessment => {
          console.log(`- Student: ${assessment.student_name}`);
          console.log(`  College: ${assessment.student_college}`);
          console.log(`  Overall Score: ${assessment.overall_score}`);
          console.log(`  Risk Level: ${assessment.risk_level}`);
          console.log(`  Completed: ${assessment.completed_at}`);
          console.log('');
        });
        
        console.log('\n🎯 API Response would be:');
        console.log({
          success: true,
          data: enrichedAssessments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: enrichedAssessments.length,
            totalPages: Math.ceil(enrichedAssessments.length / parseInt(limit))
          }
        });
      } else {
        console.log('\n❌ No enriched assessments after filtering');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFrontendAPICall();