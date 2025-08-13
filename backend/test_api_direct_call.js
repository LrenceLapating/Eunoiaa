require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIDirectCall() {
  try {
    console.log('🧪 Testing API direct call for 84-item assessments...');
    
    // First, let's verify we have 84-item assessments in the database
    console.log('\n=== Step 1: Verify 84-item assessments exist ===');
    const { data: directAssessments, error: directError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (directError) {
      console.error('❌ Error fetching 84-item assessments directly:', directError);
      return;
    }
    
    console.log(`✅ Found ${directAssessments?.length || 0} 84-item assessments in database`);
    directAssessments?.forEach((assessment, index) => {
      console.log(`  ${index + 1}. ID: ${assessment.id} | Student: ${assessment.student_id} | Score: ${assessment.overall_score}`);
    });
    
    // Now let's test the API endpoint with session authentication
    console.log('\n=== Step 2: Test API endpoint with session ===');
    
    // First, we need to create a session for the counselor
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    // Get counselor details
    const { data: counselor, error: counselorError } = await supabaseAdmin
      .from('counselors')
      .select('*')
      .eq('id', counselorId)
      .single();
    
    if (counselorError || !counselor) {
      console.error('❌ Counselor not found:', counselorError);
      return;
    }
    
    console.log(`✅ Counselor found: ${counselor.name} (${counselor.email})`);
    
    // Test the API endpoint by simulating the exact logic
    console.log('\n=== Step 3: Simulate API logic for 84-item assessments ===');
    
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log(`Using pagination: page=${page}, limit=${limitNum}, offset=${offset}`);
    
    // Test the exact query from the API
    const { data: apiAssessments, error: apiError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (apiError) {
      console.error('❌ Error with API-style query:', apiError);
    } else {
      console.log(`✅ API-style query returned ${apiAssessments?.length || 0} assessments`);
      
      if (apiAssessments && apiAssessments.length > 0) {
        console.log('\n=== Step 4: Get student data for assessments ===');
        
        const studentIds = [...new Set(apiAssessments.map(a => a.student_id))];
        console.log(`Getting student data for ${studentIds.length} unique students`);
        
        const { data: students, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id, id_number, name, college, section, email')
          .in('id', studentIds)
          .eq('status', 'active');
        
        if (studentError) {
          console.error('❌ Error fetching students:', studentError);
        } else {
          console.log(`✅ Found ${students?.length || 0} active students`);
          
          // Combine assessment and student data
          const enrichedAssessments = apiAssessments.map(assessment => {
            const student = students.find(s => s.id === assessment.student_id);
            
            return {
              ...assessment,
              student: student,
              assignment: {
                id: assessment.assignment_id || 'N/A',
                assigned_at: assessment.created_at,
                completed_at: assessment.completed_at,
                bulk_assessment_id: 'direct-fetch',
                bulk_assessment: {
                  assessment_name: '84-Item Ryff Assessment',
                  assessment_type: 'ryff_84'
                }
              }
            };
          }).filter(a => a.student);
          
          console.log(`\n🎉 FINAL RESULT: ${enrichedAssessments.length} enriched 84-item assessments`);
          enrichedAssessments.forEach((assessment, index) => {
            console.log(`  ${index + 1}. ${assessment.student.name} (${assessment.student.id_number}) - Score: ${assessment.overall_score}`);
          });
          
          if (enrichedAssessments.length === 0) {
            console.log('\n❌ ISSUE: No assessments after filtering for active students');
            console.log('This means either:');
            console.log('1. Students are not marked as "active" in the database');
            console.log('2. Student IDs in assessments don\'t match student table');
            
            // Check student status
            console.log('\n=== Checking student status ===');
            for (const studentId of studentIds) {
              const { data: studentCheck, error: checkError } = await supabaseAdmin
                .from('students')
                .select('id, name, status')
                .eq('id', studentId)
                .single();
              
              if (checkError) {
                console.log(`❌ Student ${studentId}: Not found`);
              } else {
                console.log(`✅ Student ${studentId}: ${studentCheck.name} (status: ${studentCheck.status})`);
              }
            }
          }
        }
      } else {
        console.log('\n❌ ISSUE: API-style query returned 0 assessments');
        console.log('This suggests an issue with the pagination logic');
        
        // Test without pagination
        console.log('\n=== Testing without pagination ===');
        const { data: noPagination, error: noPaginationError } = await supabaseAdmin
          .from('assessments_84items')
          .select('*');
        
        if (noPaginationError) {
          console.error('❌ Error without pagination:', noPaginationError);
        } else {
          console.log(`✅ Without pagination: ${noPagination?.length || 0} assessments`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testAPIDirectCall();