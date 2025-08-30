require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableRelationships() {
  try {
    console.log('🔍 Checking table relationships and structure...');
    
    // 1. Check assessment_assignments table structure
    console.log('\n📋 Assessment Assignments Table:');
    const { data: assignments, error: assignError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .limit(3);
    
    if (assignError) {
      console.error('❌ Error accessing assessment_assignments:', assignError);
    } else {
      console.log('✅ Sample records:', assignments.length);
      if (assignments.length > 0) {
        console.log('   Columns:', Object.keys(assignments[0]));
        console.log('   Sample record:', {
          id: assignments[0].id,
          student_id: assignments[0].student_id,
          bulk_assessment_id: assignments[0].bulk_assessment_id,
          status: assignments[0].status
        });
      }
    }
    
    // 2. Check students table structure
    console.log('\n👥 Students Table:');
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .limit(3);
    
    if (studentError) {
      console.error('❌ Error accessing students:', studentError);
    } else {
      console.log('✅ Sample records:', students.length);
      if (students.length > 0) {
        console.log('   Columns:', Object.keys(students[0]));
        console.log('   Sample record:', {
          id: students[0].id,
          name: students[0].name,
          email: students[0].email,
          college: students[0].college
        });
      }
    }
    
    // 3. Check bulk_assessments table structure
    console.log('\n📊 Bulk Assessments Table:');
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .limit(3);
    
    if (bulkError) {
      console.error('❌ Error accessing bulk_assessments:', bulkError);
    } else {
      console.log('✅ Sample records:', bulkAssessments.length);
      if (bulkAssessments.length > 0) {
        console.log('   Columns:', Object.keys(bulkAssessments[0]));
        console.log('   Sample record:', {
          id: bulkAssessments[0].id,
          assessment_name: bulkAssessments[0].assessment_name,
          assessment_type: bulkAssessments[0].assessment_type,
          status: bulkAssessments[0].status
        });
      }
    }
    
    // 4. Try simple queries without joins
    console.log('\n🔗 Testing simple queries without joins...');
    
    // Get assigned assessments without student join
    const { data: simpleAssignments, error: simpleError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'assigned')
      .limit(5);
    
    if (simpleError) {
      console.error('❌ Error with simple assignment query:', simpleError);
    } else {
      console.log(`✅ Found ${simpleAssignments.length} assigned assessments`);
      
      if (simpleAssignments.length > 0) {
        const assignment = simpleAssignments[0];
        console.log('   Sample assignment:', {
          id: assignment.id,
          student_id: assignment.student_id,
          bulk_assessment_id: assignment.bulk_assessment_id,
          status: assignment.status,
          expires_at: assignment.expires_at
        });
        
        // Try to get student info separately
        const { data: studentInfo, error: studentInfoError } = await supabaseAdmin
          .from('students')
          .select('*')
          .eq('id', assignment.student_id)
          .single();
        
        if (studentInfoError) {
          console.error('❌ Error getting student info:', studentInfoError);
        } else {
          console.log('✅ Student info found:', {
            id: studentInfo.id,
            name: studentInfo.name,
            college: studentInfo.college,
            section: studentInfo.section
          });
        }
        
        // Try to get bulk assessment info separately
        const { data: bulkInfo, error: bulkInfoError } = await supabaseAdmin
          .from('bulk_assessments')
          .select('*')
          .eq('id', assignment.bulk_assessment_id)
          .single();
        
        if (bulkInfoError) {
          console.error('❌ Error getting bulk assessment info:', bulkInfoError);
        } else {
          console.log('✅ Bulk assessment info found:', {
            id: bulkInfo.id,
            assessment_name: bulkInfo.assessment_name,
            assessment_type: bulkInfo.assessment_type,
            status: bulkInfo.status
          });
        }
      }
    }
    
    // 5. Check if there are any completed assignments with assessment records
    console.log('\n✅ Checking completed assignments...');
    
    const { data: completedAssignments, error: completedError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .eq('status', 'completed')
      .limit(5);
    
    if (completedError) {
      console.error('❌ Error getting completed assignments:', completedError);
    } else {
      console.log(`✅ Found ${completedAssignments.length} completed assignments`);
      
      if (completedAssignments.length > 0) {
        const completed = completedAssignments[0];
        console.log('   Sample completed assignment:', {
          id: completed.id,
          student_id: completed.student_id,
          status: completed.status,
          completed_at: completed.completed_at
        });
        
        // Check if this assignment has assessment records
        const { data: assessmentRecord42, error: record42Error } = await supabaseAdmin
          .from('assessments_42items')
          .select('*')
          .eq('assignment_id', completed.id)
          .limit(1);
        
        const { data: assessmentRecord84, error: record84Error } = await supabaseAdmin
          .from('assessments_84items')
          .select('*')
          .eq('assignment_id', completed.id)
          .limit(1);
        
        console.log('   Assessment records:');
        console.log(`     42-item: ${assessmentRecord42?.length || 0} records`);
        console.log(`     84-item: ${assessmentRecord84?.length || 0} records`);
        
        if (assessmentRecord42 && assessmentRecord42.length > 0) {
          console.log('     42-item record:', {
            id: assessmentRecord42[0].id,
            overall_score: assessmentRecord42[0].overall_score,
            risk_level: assessmentRecord42[0].risk_level
          });
        }
        
        if (assessmentRecord84 && assessmentRecord84.length > 0) {
          console.log('     84-item record:', {
            id: assessmentRecord84[0].id,
            overall_score: assessmentRecord84[0].overall_score,
            risk_level: assessmentRecord84[0].risk_level
          });
        }
      }
    }
    
    // 6. Check backend server status
    console.log('\n🌐 Checking backend server status...');
    
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:3000/health', {
        method: 'GET',
        timeout: 5000
      });
      
      console.log(`✅ Backend server responding: ${response.status}`);
      
      if (response.ok) {
        const healthData = await response.text();
        console.log('   Health check response:', healthData);
      }
      
    } catch (fetchError) {
      console.error('❌ Backend server not responding:', fetchError.message);
      console.log('\n💡 The backend server might not be running!');
      console.log('   To start the server, run: npm start');
    }
    
  } catch (error) {
    console.error('❌ Error in check:', error);
  }
}

// Run the check
checkTableRelationships().then(() => {
  console.log('\n🏁 Check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});