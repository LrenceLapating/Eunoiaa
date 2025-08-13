require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check84Assessments() {
  try {
    console.log('Checking for 84-item assessments in the database...');
    
    // Check bulk_assessments table for 84-item assignments
    console.log('\n--- Checking bulk_assessments table ---');
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('assessment_type', 'ryff_84');
    
    if (bulkError) {
      console.error('❌ Error checking bulk_assessments:', bulkError);
    } else {
      console.log(`Found ${bulkAssessments?.length || 0} 84-item bulk assessments`);
      if (bulkAssessments && bulkAssessments.length > 0) {
        bulkAssessments.forEach((assessment, index) => {
          console.log(`  ${index + 1}. ID: ${assessment.id}, Counselor: ${assessment.counselor_id}, Status: ${assessment.status}`);
        });
      }
    }
    
    // Check assessments_84items table
    console.log('\n--- Checking assessments_84items table ---');
    const { data: assessments84, error: assessments84Error } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (assessments84Error) {
      console.error('❌ Error checking assessments_84items:', assessments84Error);
    } else {
      console.log(`Found ${assessments84?.length || 0} completed 84-item assessments`);
      if (assessments84 && assessments84.length > 0) {
        assessments84.forEach((assessment, index) => {
          console.log(`  ${index + 1}. ID: ${assessment.id}, Assignment: ${assessment.assignment_id}, Student: ${assessment.student_id}`);
        });
      }
    }
    
    // Check for our specific counselor
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    console.log(`\n--- Checking for counselor ${counselorId} ---`);
    
    const { data: counselorBulk, error: counselorBulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .eq('assessment_type', 'ryff_84');
    
    if (counselorBulkError) {
      console.error('❌ Error checking counselor bulk assessments:', counselorBulkError);
    } else {
      console.log(`Found ${counselorBulk?.length || 0} 84-item bulk assessments for this counselor`);
      if (counselorBulk && counselorBulk.length > 0) {
        for (const bulk of counselorBulk) {
          console.log(`  Bulk Assessment ID: ${bulk.id}, Status: ${bulk.status}`);
          
          // Check for completed assessments for this bulk assignment
          const { data: completed, error: completedError } = await supabaseAdmin
            .from('assessments_84items')
            .select('*')
            .eq('assignment_id', bulk.id);
          
          if (completedError) {
            console.error('    ❌ Error checking completed assessments:', completedError);
          } else {
            console.log(`    Found ${completed?.length || 0} completed assessments for this assignment`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
  
  process.exit(0);
}

check84Assessments();