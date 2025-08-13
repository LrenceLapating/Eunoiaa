require('dotenv').config();
const { supabase } = require('./config/database');

async function checkBulkAssessments() {
  try {
    console.log('Checking bulk_assessments table structure...');
    
    // Get a sample record to see the actual columns
    const { data: sampleData, error: sampleError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample bulk_assessments:', sampleError);
    } else {
      console.log('Sample bulk_assessments record:');
      if (sampleData && sampleData.length > 0) {
        console.log('Columns:', Object.keys(sampleData[0]));
        console.log('Sample data:', sampleData[0]);
      } else {
        console.log('No bulk_assessments records found');
      }
    }
    
    // Check for counselor's bulk assessments
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    const { data: counselorAssessments, error: counselorError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('counselor_id', counselorId)
      .neq('status', 'archived');
    
    if (counselorError) {
      console.error('Error fetching counselor bulk_assessments:', counselorError);
    } else {
      console.log(`\nFound ${counselorAssessments.length} bulk assessments for counselor ${counselorId}:`);
      counselorAssessments.forEach(assessment => {
        console.log(`- ID: ${assessment.id}`);
        console.log(`  Name: ${assessment.assessment_name || assessment.title || 'N/A'}`);
        console.log(`  Type: ${assessment.assessment_type}`);
        console.log(`  Status: ${assessment.status}`);
        console.log(`  Created: ${assessment.created_at}`);
      });
    }
    
    // Check assessment_assignments for this counselor
    console.log('\nChecking assessment_assignments...');
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
    } else {
      console.log(`Found ${assignments.length} assignments for counselor`);
      assignments.forEach(assignment => {
        console.log(`- Assignment ${assignment.id}: Student ${assignment.student_id}`);
        console.log(`  Status: ${assignment.status}, Bulk Assessment: ${assignment.bulk_assessment.assessment_name}`);
      });
    }
    
  } catch (error) {
    console.error('Check error:', error);
  }
  
  process.exit(0);
}

checkBulkAssessments();