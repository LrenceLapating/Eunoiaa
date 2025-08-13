require('dotenv').config();
const { supabase } = require('./config/database');

// Check if students have actually completed 84-item assessments
async function checkAssignmentCompletion() {
  try {
    console.log('🔍 Checking assignment completion status...');
    
    // Get all 84-item bulk assessments
    const { data: bulk84, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_type', 'ryff_84');
    
    console.log(`\n📊 Found ${bulk84?.length || 0} 84-item bulk assessments`);
    
    if (bulk84?.length > 0) {
      const bulkIds = bulk84.map(b => b.id);
      
      // Get all assignments for these bulk assessments
      const { data: assignments, error: assignError } = await supabase
        .from('assessment_assignments')
        .select('*')
        .in('bulk_assessment_id', bulkIds);
      
      console.log(`\n📋 Found ${assignments?.length || 0} total assignments for 84-item assessments`);
      
      // Filter completed assignments
      const completedAssignments = assignments?.filter(a => a.status === 'completed') || [];
      console.log(`✅ Found ${completedAssignments.length} completed assignments`);
      
      if (completedAssignments.length > 0) {
        console.log('\n🔍 Completed assignments details:');
        completedAssignments.forEach((assignment, index) => {
          console.log(`  ${index + 1}. Assignment ID: ${assignment.id}`);
          console.log(`     Student ID: ${assignment.student_id}`);
          console.log(`     Completed: ${assignment.completed_at}`);
          console.log(`     Bulk Assessment: ${assignment.bulk_assessment_id}`);
        });
        
        // Now check if there are actual assessment records for these completed assignments
        console.log('\n🔍 Checking for assessment records in assessments_84items...');
        const assignmentIds = completedAssignments.map(a => a.id);
        
        const { data: assessmentRecords, error: recordError } = await supabase
          .from('assessments_84items')
          .select('*')
          .in('assignment_id', assignmentIds);
        
        if (recordError) {
          console.error('❌ Error checking assessment records:', recordError);
        } else {
          console.log(`📊 Found ${assessmentRecords?.length || 0} assessment records in assessments_84items`);
          
          if (assessmentRecords?.length === 0) {
            console.log('\n❌ PROBLEM IDENTIFIED: Students completed assignments but no assessment records exist!');
            console.log('   This suggests the assessment submission process is not working correctly.');
            
            // Check if the records might be in the wrong table
            console.log('\n🔍 Checking if records are in assessments_42items by mistake...');
            const { data: wrongTableRecords, error: wrongTableError } = await supabase
              .from('assessments_42items')
              .select('*')
              .in('assignment_id', assignmentIds);
            
            if (wrongTableError) {
              console.error('❌ Error checking assessments_42items:', wrongTableError);
            } else {
              console.log(`📊 Found ${wrongTableRecords?.length || 0} records in assessments_42items (wrong table)`);
              if (wrongTableRecords?.length > 0) {
                console.log('\n🎯 FOUND THE ISSUE: 84-item assessment records are stored in assessments_42items!');
                wrongTableRecords.forEach((record, index) => {
                  console.log(`  ${index + 1}. ID: ${record.id}, Type: ${record.assessment_type}, Student: ${record.student_id}`);
                });
              }
            }
          } else {
            console.log('\n✅ Assessment records found in correct table');
            assessmentRecords.forEach((record, index) => {
              console.log(`  ${index + 1}. ID: ${record.id}, Type: ${record.assessment_type}, Student: ${record.student_id}`);
            });
          }
        }
      } else {
        console.log('\n⚠️ No completed 84-item assignments found. Students may not have finished any 84-item assessments yet.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAssignmentCompletion();