require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecords() {
  try {
    console.log('🔍 Checking assessments_84items table records...');
    
    // Get all records in assessments_84items
    const { data: allRecords, error: allError } = await supabase
      .from('assessments_84items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error fetching records:', allError.message);
      return;
    }
    
    console.log(`\n📊 Total records in assessments_84items: ${allRecords?.length || 0}`);
    
    if (allRecords?.length > 0) {
      console.log('\n📋 Recent records:');
      allRecords.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}`);
        console.log(`   Student: ${record.student_id}`);
        console.log(`   Assignment: ${record.assignment_id}`);
        console.log(`   Type: ${record.assessment_type}`);
        console.log(`   Score: ${record.overall_score}`);
        console.log(`   Risk: ${record.risk_level}`);
        console.log(`   Created: ${record.created_at}`);
        console.log(`   Completed: ${record.completed_at}`);
        console.log('');
      });
      
      // Check for duplicates by assignment_id
      const assignmentCounts = {};
      allRecords.forEach(record => {
        const assignmentId = record.assignment_id;
        assignmentCounts[assignmentId] = (assignmentCounts[assignmentId] || 0) + 1;
      });
      
      const duplicates = Object.entries(assignmentCounts).filter(([id, count]) => count > 1);
      
      if (duplicates.length > 0) {
        console.log('⚠️ Found duplicate assignment_ids:');
        duplicates.forEach(([assignmentId, count]) => {
          console.log(`   Assignment ${assignmentId}: ${count} records`);
        });
      } else {
        console.log('✅ No duplicate assignment_ids found');
      }
      
      // Check for records with the specific assignment from our test
      const testAssignmentId = '7814dd48-8dfe-4a62-bf22-63d83f427dc2';
      const testRecords = allRecords.filter(r => r.assignment_id === testAssignmentId);
      
      if (testRecords.length > 0) {
        console.log(`\n🎯 Found ${testRecords.length} record(s) for test assignment ${testAssignmentId}:`);
        testRecords.forEach((record, index) => {
          console.log(`${index + 1}. Record ID: ${record.id}`);
          console.log(`   Created: ${record.created_at}`);
          console.log(`   Completed: ${record.completed_at}`);
        });
        
        // Clean up test records
        console.log('\n🧹 Cleaning up test records...');
        const { error: deleteError } = await supabaseAdmin
          .from('assessments_84items')
          .delete()
          .eq('assignment_id', testAssignmentId);
        
        if (deleteError) {
          console.error('❌ Cleanup error:', deleteError.message);
        } else {
          console.log('✅ Test records cleaned up');
        }
      }
    }
    
    // Now check if there are any real completed 84-item assessments
    console.log('\n🔍 Checking for real completed 84-item assessments...');
    
    // Get completed 84-item assignments
    const { data: completed84Assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        status,
        completed_at,
        bulk_assessments!inner(
          assessment_type,
          assessment_name
        )
      `)
      .eq('status', 'completed')
      .eq('bulk_assessments.assessment_type', 'ryff_84');
    
    if (assignmentError) {
      console.error('❌ Error fetching completed assignments:', assignmentError.message);
      return;
    }
    
    console.log(`Found ${completed84Assignments?.length || 0} completed 84-item assignments`);
    
    if (completed84Assignments?.length > 0) {
      console.log('\n📋 Completed 84-item assignments:');
      completed84Assignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`   Student: ${assignment.student_id}`);
        console.log(`   Assessment: ${assignment.bulk_assessments.assessment_name}`);
        console.log(`   Completed: ${assignment.completed_at}`);
        
        // Check if this assignment has a record in assessments_84items
        const hasRecord = allRecords?.some(r => r.assignment_id === assignment.id);
        console.log(`   Has record in assessments_84items: ${hasRecord ? '✅ Yes' : '❌ No'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRecords();