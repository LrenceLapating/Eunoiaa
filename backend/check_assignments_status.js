require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssignmentsStatus() {
  try {
    // Get all assessment assignments with their status
    const { data: assignments, error } = await supabase
      .from('assessment_assignments')
      .select('id, bulk_assessment_id, student_id, status')
      .order('bulk_assessment_id');

    if (error) {
      console.error('Error fetching assignments:', error);
      return;
    }

    console.log('\n=== Assessment Assignments Status ===');
    console.log(`Total assignments: ${assignments.length}\n`);

    // Group by bulk_assessment_id
    const groupedByBulk = assignments.reduce((acc, assignment) => {
      if (!acc[assignment.bulk_assessment_id]) {
        acc[assignment.bulk_assessment_id] = [];
      }
      acc[assignment.bulk_assessment_id].push(assignment);
      return acc;
    }, {});

    // Get bulk assessment details
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_type, created_at')
      .order('id');

    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
      return;
    }

    // Display results grouped by bulk assessment
    for (const bulkAssessment of bulkAssessments) {
      const assignments = groupedByBulk[bulkAssessment.id] || [];
      const completedCount = assignments.filter(a => a.status === 'completed').length;
      const pendingCount = assignments.filter(a => a.status === 'pending').length;
      
      console.log(`Bulk Assessment ID: ${bulkAssessment.id}`);
      console.log(`  Type: ${bulkAssessment.assessment_type}`);
      console.log(`  Created: ${new Date(bulkAssessment.created_at).toLocaleDateString()}`);
      console.log(`  Total Assignments: ${assignments.length}`);
      console.log(`  Completed: ${completedCount}`);
      console.log(`  Pending: ${pendingCount}`);
      
      if (assignments.length > 0) {
        console.log('  Assignment Details:');
        assignments.forEach(assignment => {
          console.log(`    - ID: ${assignment.id}, Student: ${assignment.student_id}, Status: ${assignment.status}`);
        });
      }
      console.log('');
    }

    // Summary of completed assessments by type
    console.log('\n=== Summary by Assessment Type ===');
    const summary = {};
    for (const bulkAssessment of bulkAssessments) {
      const assignments = groupedByBulk[bulkAssessment.id] || [];
      const completed = assignments.filter(a => a.status === 'completed').length;
      
      if (!summary[bulkAssessment.assessment_type]) {
        summary[bulkAssessment.assessment_type] = { total: 0, completed: 0 };
      }
      summary[bulkAssessment.assessment_type].total += assignments.length;
      summary[bulkAssessment.assessment_type].completed += completed;
    }

    Object.keys(summary).forEach(type => {
      console.log(`${type}: ${summary[type].completed}/${summary[type].total} completed`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssignmentsStatus();