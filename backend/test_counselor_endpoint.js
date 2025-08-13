require('dotenv').config();
const { supabase } = require('./config/database');

async function testCounselorEndpoint() {
  try {
    console.log('Testing counselor assessments endpoint logic...');
    
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    console.log('Testing the fixed logic...');
    
    // Determine which table to query based on assessment type
    let tableName = 'assessments_42items'; // Test with 42-item assessments
    
    // Get assignments for this counselor first
    const { data: assignments, error: assignError } = await supabase
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, status, bulk_assessment_id,
        bulk_assessment:bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .neq('bulk_assessments.status', 'archived');
    
    if (assignError) {
      console.error('Assignment query error:', assignError);
      return;
    }
    
    console.log(`Found ${assignments.length} assignments for counselor`);
    
    // Get student IDs who have assignments
    const studentIds = assignments.map(a => a.student_id);
    
    if (studentIds.length === 0) {
      console.log('No students with assignments found');
      return;
    }
    
    console.log('Student IDs with assignments:', studentIds);
    
    // Get completed assessments for these students
    const result = await supabase
      .from(tableName)
      .select(`
        *,
        student:students!inner(
          id, id_number, name, college, section, email
        )
      `)
      .in('student_id', studentIds)
      .eq('students.status', 'active')
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (result.error) {
      console.error('Assessments query error:', result.error);
      return;
    }
    
    console.log(`Found ${result.data.length} completed assessments`);
    
    // Manually enrich with assignment data
    const enrichedData = [];
    for (const assessment of result.data) {
      // Find the assignment for this student
      const studentAssignments = assignments.filter(a => a.student_id === assessment.student_id);
      
      if (studentAssignments.length > 0) {
        const assignment = studentAssignments[0]; // Use the first one
        enrichedData.push({
          ...assessment,
          assignment: {
            id: assignment.id,
            assigned_at: assignment.assigned_at,
            completed_at: assignment.completed_at,
            bulk_assessment_id: assignment.bulk_assessment_id
          },
          bulk_assessment: assignment.bulk_assessment
        });
        
        console.log(`✓ Assessment ${assessment.id}: Student ${assessment.student.name}`);
        console.log(`  Type: ${assessment.assessment_type}, Score: ${assessment.overall_score}, Risk: ${assessment.risk_level}`);
        console.log(`  Assignment: ${assignment.id}, Bulk: ${assignment.bulk_assessment.assessment_name}`);
      }
    }
    
    console.log(`\n🎉 SUCCESS: Found ${enrichedData.length} assessments for counselor!`);
    
    // Simulate the API response
    const apiResponse = {
      success: true,
      data: enrichedData,
      pagination: {
        total: enrichedData.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(enrichedData.length / parseInt(limit))
      }
    };
    
    console.log('\nAPI Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  process.exit(0);
}

testCounselorEndpoint();