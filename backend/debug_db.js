const { supabaseAdmin } = require('./config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking the assessment submission issue...');
    
    // First, let's check the structure of assessment_assignments table
    console.log('\n📋 Checking assessment_assignments table structure and data...');
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (assignmentsError) {
      console.error('Error fetching assessment assignments:', assignmentsError);
    } else {
      console.log(`Found ${assignments.length} assignments:`);
      assignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Assignment:`, JSON.stringify(assignment, null, 2));
      });
    }
    
    // Check bulk_assessments table structure
    console.log('\n📊 Checking bulk_assessments table structure and data...');
    const { data: bulkAssessments, error: bulkError } = await supabaseAdmin
      .from('bulk_assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (bulkError) {
      console.error('Error fetching bulk assessments:', bulkError);
    } else {
      console.log(`Found ${bulkAssessments.length} bulk assessments:`);
      bulkAssessments.forEach((assessment, index) => {
        console.log(`${index + 1}. Bulk Assessment:`, JSON.stringify(assessment, null, 2));
      });
    }
    
    // Try to manually join the data
    if (assignments && assignments.length > 0 && bulkAssessments && bulkAssessments.length > 0) {
      console.log('\n🔗 Manually joining assignment and bulk assessment data...');
      
      const completedAssignments = assignments.filter(a => a.status === 'completed');
      console.log(`Found ${completedAssignments.length} completed assignments`);
      
      completedAssignments.forEach((assignment, index) => {
        const bulkAssessment = bulkAssessments.find(ba => ba.id === assignment.bulk_assessment_id);
        console.log(`${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`   Student ID: ${assignment.student_id}`);
        console.log(`   Bulk Assessment ID: ${assignment.bulk_assessment_id}`);
        if (bulkAssessment) {
          console.log(`   Assessment: ${bulkAssessment.assessment_name} (${bulkAssessment.assessment_type})`);
        } else {
          console.log(`   Assessment: NOT FOUND for bulk_assessment_id ${assignment.bulk_assessment_id}`);
        }
        console.log(`   Completed: ${assignment.completed_at}`);
        console.log('');
      });
      
      // Get assignment IDs for completed assignments
      const assignmentIds = completedAssignments.map(a => a.id);
      
      if (assignmentIds.length > 0) {
        console.log('🔍 Checking for assessment records with these assignment IDs...');
        
        // Check 42-item assessments
        const { data: assessments42, error: assessments42Error } = await supabaseAdmin
          .from('assessments_42items')
          .select('id, assignment_id, student_id, created_at')
          .in('assignment_id', assignmentIds);
        
        if (assessments42Error) {
          console.error('Error checking 42-item assessments:', assessments42Error);
        } else {
          console.log(`\n📝 42-item assessment records: ${assessments42.length} found`);
          assessments42.forEach((assessment, index) => {
            console.log(`${index + 1}. Assessment ID: ${assessment.id}, Assignment ID: ${assessment.assignment_id}`);
          });
        }
        
        // Check 84-item assessments
        const { data: assessments84, error: assessments84Error } = await supabaseAdmin
          .from('assessments_84items')
          .select('id, assignment_id, student_id, created_at')
          .in('assignment_id', assignmentIds);
        
        if (assessments84Error) {
          console.error('Error checking 84-item assessments:', assessments84Error);
        } else {
          console.log(`\n📝 84-item assessment records: ${assessments84.length} found`);
          assessments84.forEach((assessment, index) => {
            console.log(`${index + 1}. Assessment ID: ${assessment.id}, Assignment ID: ${assessment.assignment_id}`);
          });
        }
      }
    }
    
    // Check if there are any assessment records at all
    console.log('\n🔍 Checking for ANY assessment records in the tables...');
    
    const { data: allAssessments42, error: allAssessments42Error } = await supabaseAdmin
      .from('assessments_42items')
      .select('id, assignment_id, student_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allAssessments42Error) {
      console.error('Error checking all 42-item assessments:', allAssessments42Error);
    } else {
      console.log(`\n📝 All 42-item assessments in table: ${allAssessments42.length} found`);
      allAssessments42.forEach((assessment, index) => {
        console.log(`${index + 1}. Assessment ID: ${assessment.id}, Assignment ID: ${assessment.assignment_id}, Created: ${assessment.created_at}`);
      });
    }
    
    const { data: allAssessments84, error: allAssessments84Error } = await supabaseAdmin
      .from('assessments_84items')
      .select('id, assignment_id, student_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allAssessments84Error) {
      console.error('Error checking all 84-item assessments:', allAssessments84Error);
    } else {
      console.log(`\n📝 All 84-item assessments in table: ${allAssessments84.length} found`);
      allAssessments84.forEach((assessment, index) => {
        console.log(`${index + 1}. Assessment ID: ${assessment.id}, Assignment ID: ${assessment.assignment_id}, Created: ${assessment.created_at}`);
      });
    }
    
    // Check college_scores table
    console.log('\n🏫 Checking college_scores table...');
    const { data: collegeScores, error: scoresError } = await supabaseAdmin
      .from('college_scores')
      .select('*')
      .order('last_calculated', { ascending: false })
      .limit(10);
    
    if (scoresError) {
      console.error('Error fetching college scores:', scoresError);
    } else {
      console.log(`Found ${collegeScores.length} college scores:`);
      if (collegeScores.length === 0) {
        console.log('   No college scores found!');
      } else {
        collegeScores.forEach((score, index) => {
          console.log(`${index + 1}. College: ${score.college_name}, Assessment: ${score.assessment_name} (${score.assessment_type})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  }
  
  process.exit(0);
}

checkDatabase();