require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimplified84API() {
  try {
    console.log('🧪 Testing simplified 84-item assessment API logic...');
    
    // Test the new simplified approach
    console.log('\n=== SIMPLIFIED APPROACH: Direct query to assessments_84items ===');
    
    const { data: assessmentData, error: assessmentError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(10);

    if (assessmentError) {
      console.error('❌ Error fetching 84-item assessments:', assessmentError);
      return;
    }
    
    console.log(`✅ Found ${assessmentData?.length || 0} 84-item assessments`);
    
    if (assessmentData && assessmentData.length > 0) {
      console.log('\n📋 Assessment Details:');
      assessmentData.forEach((assessment, index) => {
        console.log(`\n  ${index + 1}. Assessment ID: ${assessment.id}`);
        console.log(`     Student ID: ${assessment.student_id}`);
        console.log(`     Assignment ID: ${assessment.assignment_id}`);
        console.log(`     Assessment Type: ${assessment.assessment_type}`);
        console.log(`     Overall Score: ${assessment.overall_score}`);
        console.log(`     Risk Level: ${assessment.risk_level}`);
        console.log(`     Completed: ${assessment.completed_at}`);
        console.log(`     Created: ${assessment.created_at}`);
      });
      
      // Get student data for these assessments
      console.log('\n=== Getting Student Data ===');
      const studentIds = [...new Set(assessmentData.map(a => a.student_id))];
      console.log('Student IDs to fetch:', studentIds);
      
      const { data: students, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, id_number, name, college, section, email')
        .in('id', studentIds)
        .eq('status', 'active');
      
      if (studentError) {
        console.error('❌ Error fetching students:', studentError);
      } else {
        console.log(`✅ Found ${students?.length || 0} students`);
        
        // Show combined data structure
        console.log('\n=== FINAL COMBINED DATA STRUCTURE ===');
        const combinedData = assessmentData.map(assessment => {
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
        
        console.log(`\n🎉 FINAL RESULT: ${combinedData.length} assessments ready for frontend`);
        
        combinedData.forEach((item, index) => {
          console.log(`\n  ${index + 1}. ${item.student?.name || 'Unknown Student'}`);
          console.log(`     Student ID: ${item.student?.id_number || 'N/A'}`);
          console.log(`     College: ${item.student?.college || 'N/A'}`);
          console.log(`     Section: ${item.student?.section || 'N/A'}`);
          console.log(`     Score: ${item.overall_score}`);
          console.log(`     Risk: ${item.risk_level}`);
          console.log(`     Assessment Type: ${item.assignment.bulk_assessment.assessment_type}`);
        });
        
        console.log('\n🚀 SUCCESS! This data structure should work perfectly with the frontend!');
      }
    } else {
      console.log('\n❌ No 84-item assessments found in the database.');
      console.log('This could mean:');
      console.log('1. No students have completed 84-item assessments yet');
      console.log('2. The assessments_84items table is empty');
      console.log('3. There might be a database connection issue');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testSimplified84API();