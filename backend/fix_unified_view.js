require('dotenv').config();
const { supabase } = require('./config/database');

async function fixUnifiedView() {
  try {
    console.log('Testing current unified view...');
    
    // Test the current unified view
    const { data: currentView, error: currentError } = await supabase
      .from('assessments')
      .select('*')
      .limit(3);
    
    if (currentError) {
      console.error('Current view error:', currentError);
    } else {
      console.log(`Current unified view has ${currentView.length} records`);
      if (currentView.length > 0) {
        console.log('Sample record:', currentView[0]);
      }
    }
    
    // Test joining with students table directly from assessments_42items
    console.log('\nTesting direct join with assessments_42items...');
    const { data: directJoin, error: directError } = await supabase
      .from('assessments_42items')
      .select(`
        *,
        student:students!inner(
          id, id_number, name, college, section, email
        )
      `)
      .eq('students.status', 'active')
      .limit(3);
    
    if (directError) {
      console.error('Direct join error:', directError);
    } else {
      console.log(`Direct join successful with ${directJoin.length} records`);
      if (directJoin.length > 0) {
        console.log('Sample joined record:', {
          id: directJoin[0].id,
          student_id: directJoin[0].student_id,
          student_name: directJoin[0].student.name,
          assessment_type: directJoin[0].assessment_type
        });
      }
    }
    
    // Test the counselor query logic manually
    console.log('\nTesting counselor query logic...');
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    // Get assignments for this counselor
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
    console.log('Student IDs with assignments:', studentIds);
    
    // Get completed assessments for these students
    const { data: completedAssessments, error: assessError } = await supabase
      .from('assessments_42items')
      .select(`
        *,
        student:students!inner(
          id, id_number, name, college, section, email
        )
      `)
      .in('student_id', studentIds)
      .eq('students.status', 'active');
    
    if (assessError) {
      console.error('Completed assessments query error:', assessError);
    } else {
      console.log(`Found ${completedAssessments.length} completed assessments for assigned students`);
      
      // Enrich with assignment data
      const enrichedData = [];
      for (const assessment of completedAssessments) {
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
          
          console.log(`- Assessment ${assessment.id}: Student ${assessment.student.name}`);
          console.log(`  Assignment: ${assignment.id}, Bulk: ${assignment.bulk_assessment.assessment_name}`);
        }
      }
      
      console.log(`\nFinal enriched results: ${enrichedData.length} assessments`);
      
      // This is what the API should return
      console.log('\nAPI Response Preview:');
      console.log({
        success: true,
        data: enrichedData.slice(0, 2), // Show first 2 for preview
        pagination: {
          total: enrichedData.length,
          page: 1,
          limit: 20,
          totalPages: Math.ceil(enrichedData.length / 20)
        }
      });
    }
    
  } catch (error) {
    console.error('Fix error:', error);
  }
  
  process.exit(0);
}

fixUnifiedView();