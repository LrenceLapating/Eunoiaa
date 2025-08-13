require('dotenv').config();
const express = require('express');
const app = express();

// Import the counselor assessments route
const counselorAssessmentsRoute = require('./routes/counselorAssessments');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mock middleware for testing
const mockCounselorSession = (req, res, next) => {
  req.user = {
    id: 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7',
    role: 'counselor'
  };
  next();
};

app.use(express.json());
app.use('/api/counselor/assessments', mockCounselorSession, counselorAssessmentsRoute);

async function testCounselorAPI() {
  try {
    console.log('Testing Counselor Assessment API...');
    
    const counselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    // Test 1: Check 42-item assessments manually
    console.log('\n--- Manual Test: 42-item Assessments ---');
    
    // Step 1: Get 42-item assignments for counselor
    const { data: assignments42, error: assignError42 } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, bulk_assessment_id,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('bulk_assessments.assessment_type', 'ryff_42')
      .neq('bulk_assessments.status', 'archived');
    
    if (assignError42) {
      console.error('❌ Error fetching 42-item assignments:', assignError42);
    } else {
      console.log(`✅ Found ${assignments42?.length || 0} 42-item assignments for counselor`);
      assignments42?.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`     Student ID: ${assignment.student_id}`);
        console.log(`     Bulk Assessment: ${assignment.bulk_assessments.assessment_name}`);
        console.log(`     Status: ${assignment.status}`);
      });
      
      if (assignments42 && assignments42.length > 0) {
        // Step 2: Get 42-item assessments for these assignments
        const assignmentIds42 = assignments42.map(a => a.id);
        
        const { data: assessments42, error: assessmentError42 } = await supabaseAdmin
          .from('assessments_42items')
          .select('*')
          .in('assignment_id', assignmentIds42);
        
        if (assessmentError42) {
          console.error('❌ Error fetching 42-item assessments:', assessmentError42);
        } else {
          console.log(`✅ Found ${assessments42?.length || 0} completed 42-item assessments`);
          assessments42?.forEach((assessment, index) => {
            console.log(`  ${index + 1}. Assessment ID: ${assessment.id}`);
            console.log(`     Student ID: ${assessment.student_id}`);
            console.log(`     Assignment ID: ${assessment.assignment_id}`);
            console.log(`     Risk Level: ${assessment.risk_level}`);
            console.log(`     Completed: ${assessment.completed_at}`);
          });
        }
      }
    }
    
    // Test 2: Check 84-item assessments manually
    console.log('\n--- Manual Test: 84-item Assessments ---');
    
    // Step 1: Get 84-item assignments for counselor
    const { data: assignments84, error: assignError84 } = await supabaseAdmin
      .from('assessment_assignments')
      .select(`
        id, student_id, assigned_at, completed_at, bulk_assessment_id,
        bulk_assessments!inner(
          id, assessment_name, assessment_type, counselor_id, status
        )
      `)
      .eq('bulk_assessments.counselor_id', counselorId)
      .eq('bulk_assessments.assessment_type', 'ryff_84')
      .neq('bulk_assessments.status', 'archived');
    
    if (assignError84) {
      console.error('❌ Error fetching 84-item assignments:', assignError84);
    } else {
      console.log(`✅ Found ${assignments84?.length || 0} 84-item assignments for counselor`);
      assignments84?.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`     Student ID: ${assignment.student_id}`);
        console.log(`     Bulk Assessment: ${assignment.bulk_assessments.assessment_name}`);
        console.log(`     Status: ${assignment.status}`);
      });
      
      if (assignments84 && assignments84.length > 0) {
        // Step 2: Get 84-item assessments for these assignments
        const assignmentIds84 = assignments84.map(a => a.id);
        
        const { data: assessments84, error: assessmentError84 } = await supabaseAdmin
          .from('assessments_84items')
          .select('*')
          .in('assignment_id', assignmentIds84);
        
        if (assessmentError84) {
          console.error('❌ Error fetching 84-item assessments:', assessmentError84);
        } else {
          console.log(`✅ Found ${assessments84?.length || 0} completed 84-item assessments`);
          assessments84?.forEach((assessment, index) => {
            console.log(`  ${index + 1}. Assessment ID: ${assessment.id}`);
            console.log(`     Student ID: ${assessment.student_id}`);
            console.log(`     Assignment ID: ${assessment.assignment_id}`);
            console.log(`     Risk Level: ${assessment.risk_level}`);
            console.log(`     Completed: ${assessment.completed_at}`);
          });
        }
      }
    }
    
    // Test 3: Check all assessments and their assignment relationships
    console.log('\n--- Checking All Assessment-Assignment Relationships ---');
    
    const { data: all42Assessments, error: all42Error } = await supabaseAdmin
      .from('assessments_42items')
      .select('*');
    
    if (all42Error) {
      console.error('❌ Error fetching all 42-item assessments:', all42Error);
    } else {
      console.log(`\nAll 42-item assessments (${all42Assessments?.length || 0}):`);
      for (const assessment of all42Assessments || []) {
        console.log(`  Assessment ${assessment.id}:`);
        console.log(`    Student ID: ${assessment.student_id}`);
        console.log(`    Assignment ID: ${assessment.assignment_id}`);
        
        // Check if this assignment exists and belongs to our counselor
        const { data: assignmentCheck, error: assignmentCheckError } = await supabaseAdmin
          .from('assessment_assignments')
          .select(`
            id, bulk_assessment_id,
            bulk_assessments(
              id, assessment_name, counselor_id, assessment_type
            )
          `)
          .eq('id', assessment.assignment_id)
          .single();
        
        if (assignmentCheckError) {
          console.log(`    ❌ Assignment not found or error: ${assignmentCheckError.message}`);
        } else if (assignmentCheck.bulk_assessments.counselor_id === counselorId) {
          console.log(`    ✅ Valid assignment for our counselor: ${assignmentCheck.bulk_assessments.assessment_name}`);
        } else {
          console.log(`    ❌ Assignment belongs to different counselor: ${assignmentCheck.bulk_assessments.counselor_id}`);
        }
      }
    }
    
    const { data: all84Assessments, error: all84Error } = await supabaseAdmin
      .from('assessments_84items')
      .select('*');
    
    if (all84Error) {
      console.error('❌ Error fetching all 84-item assessments:', all84Error);
    } else {
      console.log(`\nAll 84-item assessments (${all84Assessments?.length || 0}):`);
      for (const assessment of all84Assessments || []) {
        console.log(`  Assessment ${assessment.id}:`);
        console.log(`    Student ID: ${assessment.student_id}`);
        console.log(`    Assignment ID: ${assessment.assignment_id}`);
        
        // Check if this assignment exists and belongs to our counselor
        const { data: assignmentCheck, error: assignmentCheckError } = await supabaseAdmin
          .from('assessment_assignments')
          .select(`
            id, bulk_assessment_id,
            bulk_assessments(
              id, assessment_name, counselor_id, assessment_type
            )
          `)
          .eq('id', assessment.assignment_id)
          .single();
        
        if (assignmentCheckError) {
          console.log(`    ❌ Assignment not found or error: ${assignmentCheckError.message}`);
        } else if (assignmentCheck.bulk_assessments.counselor_id === counselorId) {
          console.log(`    ✅ Valid assignment for our counselor: ${assignmentCheck.bulk_assessments.assessment_name}`);
        } else {
          console.log(`    ❌ Assignment belongs to different counselor: ${assignmentCheck.bulk_assessments.counselor_id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  process.exit(0);
}

testCounselorAPI();