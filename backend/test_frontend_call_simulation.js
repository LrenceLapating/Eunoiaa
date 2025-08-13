require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFrontendCallSimulation() {
  try {
    console.log('🎯 Simulating exact frontend API call...');
    
    // Step 1: Create a session for the counselor (simulate login)
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('\n=== Step 1: Verify counselor exists ===');
    const { data: counselor, error: counselorError } = await supabaseAdmin
      .from('counselors')
      .select('*')
      .eq('id', counselorId)
      .single();
    
    if (counselorError || !counselor) {
      console.error('❌ Counselor not found:', counselorError);
      return;
    }
    
    console.log(`✅ Counselor: ${counselor.name} (${counselor.email})`);
    
    // Step 2: Test the exact API call that frontend makes
    console.log('\n=== Step 2: Test API call for 84-item assessments ===');
    
    // This simulates the exact fetch call from RyffScoring.vue
    const params = new URLSearchParams({
      limit: '1000',
      assessmentType: 'ryff_84'
    });
    
    const apiUrl = `http://localhost:3000/api/counselor-assessments/results?${params.toString()}`;
    console.log(`Making request to: ${apiUrl}`);
    
    // Since we can't easily simulate session cookies, let's test the API logic directly
    // by calling the exact same logic that the API endpoint uses
    
    console.log('\n=== Step 3: Simulate API endpoint logic ===');
    
    const page = 1;
    const limit = 1000;
    const assessmentType = 'ryff_84';
    
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log(`Parameters: page=${page}, limit=${limitNum}, assessmentType=${assessmentType}`);
    console.log(`Calculated: offset=${offset}, limitNum=${limitNum}`);
    
    // Determine table name (this is from the API logic)
    let tableName = 'assessments'; // Default to unified view
    if (assessmentType === 'ryff_42') {
      tableName = 'assessments_42items';
    } else if (assessmentType === 'ryff_84') {
      tableName = 'assessments_84items';
    }
    
    console.log(`Using table: ${tableName}`);
    
    // Execute the exact query from the API
    console.log('\n=== Step 4: Execute API query ===');
    
    const { data: assessmentData, error: assessmentError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError);
      return;
    }
    
    console.log(`✅ Found ${assessmentData?.length || 0} assessments from ${tableName}`);
    
    if (!assessmentData || assessmentData.length === 0) {
      console.log('❌ No assessments returned from query');
      
      // Test without range to see if that's the issue
      console.log('\n=== Testing without range ===');
      const { data: noRangeData, error: noRangeError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(limitNum);
      
      if (noRangeError) {
        console.error('❌ Error without range:', noRangeError);
      } else {
        console.log(`✅ Without range: ${noRangeData?.length || 0} assessments`);
      }
      
      return;
    }
    
    // Get student data
    console.log('\n=== Step 5: Get student data ===');
    const studentIds = [...new Set(assessmentData.map(a => a.student_id))];
    
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, id_number, name, college, section, email')
      .in('id', studentIds)
      .eq('status', 'active');
    
    if (studentError) {
      console.error('❌ Error fetching students:', studentError);
      return;
    }
    
    console.log(`✅ Found ${students?.length || 0} active students`);
    
    // Combine data (exact API logic)
    const assessments = assessmentData.map(assessment => {
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
    }).filter(a => a.student); // Only include assessments with valid students
    
    console.log(`\n=== Step 6: Final API response simulation ===`);
    console.log(`Filtered assessments: ${assessments.length}`);
    
    // Apply any additional filters (risk level, college, etc.)
    let filteredAssessments = assessments;
    
    // Count total for pagination
    const total = filteredAssessments.length;
    
    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limitNum;
    const paginatedAssessments = filteredAssessments.slice(startIndex, endIndex);
    
    console.log(`Total assessments: ${total}`);
    console.log(`Paginated assessments: ${paginatedAssessments.length}`);
    
    // Simulate the exact API response
    const apiResponse = {
      success: true,
      data: paginatedAssessments,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
    console.log('\n🎉 SIMULATED API RESPONSE:');
    console.log(`Success: ${apiResponse.success}`);
    console.log(`Data count: ${apiResponse.data.length}`);
    console.log(`Total: ${apiResponse.pagination.total}`);
    console.log(`Page: ${apiResponse.pagination.page}`);
    console.log(`Limit: ${apiResponse.pagination.limit}`);
    
    if (apiResponse.data.length > 0) {
      console.log('\n✅ SUCCESS! 84-item assessments found:');
      apiResponse.data.forEach((assessment, index) => {
        console.log(`  ${index + 1}. ${assessment.student.name} (${assessment.student.id_number}) - Score: ${assessment.overall_score}`);
      });
    } else {
      console.log('\n❌ ISSUE: No assessments in final response');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testFrontendCallSimulation();