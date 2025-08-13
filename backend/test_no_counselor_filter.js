require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNoCounselorFilter() {
  try {
    console.log('🧪 Testing API without counselor filtering...');
    
    // Test 42-item assessments
    console.log('\n=== Testing 42-item assessments ===');
    const { data: assessments42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .limit(10);

    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42);
    } else {
      console.log(`✅ Found ${assessments42?.length || 0} 42-item assessments`);
      assessments42?.forEach((assessment, index) => {
        console.log(`  ${index + 1}. ID: ${assessment.id} | Student: ${assessment.student_id} | Score: ${assessment.overall_score}`);
      });
    }
    
    // Test 84-item assessments
    console.log('\n=== Testing 84-item assessments ===');
    const { data: assessments84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(10);

    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84);
    } else {
      console.log(`✅ Found ${assessments84?.length || 0} 84-item assessments`);
      assessments84?.forEach((assessment, index) => {
        console.log(`  ${index + 1}. ID: ${assessment.id} | Student: ${assessment.student_id} | Score: ${assessment.overall_score}`);
      });
    }
    
    // Test combined (unified view simulation)
    console.log('\n=== Testing unified view (both tables) ===');
    const [result42, result84] = await Promise.all([
      supabaseAdmin.from('assessments_42items').select('*').limit(5),
      supabaseAdmin.from('assessments_84items').select('*').limit(5)
    ]);
    
    let allAssessments = [];
    if (result42.data) allAssessments = allAssessments.concat(result42.data);
    if (result84.data) allAssessments = allAssessments.concat(result84.data);
    
    console.log(`✅ Combined: ${allAssessments.length} total assessments (${result42.data?.length || 0} 42-item + ${result84.data?.length || 0} 84-item)`);
    
    // Get student data for combined results
    if (allAssessments.length > 0) {
      const studentIds = [...new Set(allAssessments.map(a => a.student_id))];
      console.log(`\n=== Getting student data for ${studentIds.length} unique students ===`);
      
      const { data: students, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, id_number, name, college, section, email')
        .in('id', studentIds)
        .eq('status', 'active');
      
      if (studentError) {
        console.error('❌ Error fetching students:', studentError);
      } else {
        console.log(`✅ Found ${students?.length || 0} active students`);
        
        // Show final combined structure
        console.log('\n=== FINAL API RESPONSE STRUCTURE ===');
        const finalData = allAssessments.map(assessment => {
          const student = students.find(s => s.id === assessment.student_id);
          
          return {
            id: assessment.id,
            student_id: assessment.student_id,
            assessment_type: assessment.assessment_type,
            overall_score: assessment.overall_score,
            risk_level: assessment.risk_level,
            student: student ? {
              name: student.name,
              id_number: student.id_number,
              college: student.college,
              section: student.section
            } : null,
            assignment: {
              id: assessment.assignment_id || 'N/A',
              assigned_at: assessment.created_at,
              completed_at: assessment.completed_at,
              bulk_assessment_id: 'direct-fetch',
              bulk_assessment: {
                assessment_name: `${assessment.assessment_type === 'ryff_84' ? '84' : '42'}-Item Ryff Assessment`,
                assessment_type: assessment.assessment_type
              }
            }
          };
        }).filter(a => a.student);
        
        console.log(`🎉 FINAL RESULT: ${finalData.length} assessments ready for frontend`);
        finalData.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.student.name} (${item.student.id_number}) - ${item.assessment_type} - Score: ${item.overall_score}`);
        });
        
        console.log('\n🚀 SUCCESS! No counselor filtering - all assessments are accessible!');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testNoCounselorFilter();