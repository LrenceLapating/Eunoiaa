// Debug script for specific assessment: "2025-2026 2nd Semester - 1st Test 42"
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const TARGET_ASSESSMENT_NAME = '2025-2026 2nd Semester - 1st Test 42';
const TARGET_BULK_ID = '873d2505-42a9-44e0-91aa-801f55743934';

async function debugSpecificAssessment() {
  console.log('🔍 Debugging specific assessment:', TARGET_ASSESSMENT_NAME);
  console.log('🆔 Bulk Assessment ID:', TARGET_BULK_ID);
  
  try {
    // 1. Check bulk_assessments table for this specific assessment
    console.log('\n📋 1. Checking bulk_assessments table...');
    const { data: bulkData, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('*')
      .eq('id', TARGET_BULK_ID);
    
    if (bulkError) {
      console.error('Error fetching bulk assessment:', bulkError);
    } else {
      console.log('Bulk assessment data:', JSON.stringify(bulkData, null, 2));
    }
    
    // 2. Check assessment_assignments table structure
    console.log('\n📋 2. Checking assessment_assignments table structure...');
    const { data: assignmentStructure, error: assignmentStructureError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .limit(1);
    
    if (assignmentStructureError) {
      console.error('Error fetching assignment structure:', assignmentStructureError);
    } else if (assignmentStructure && assignmentStructure.length > 0) {
      console.log('Assignment table columns:', Object.keys(assignmentStructure[0]));
    }
    
    // 3. Check assessment_assignments for this bulk assessment
    console.log('\n📋 3. Checking assessment_assignments for this bulk assessment...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('bulk_assessment_id', TARGET_BULK_ID);
    
    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
    } else {
      console.log(`Found ${assignments.length} assignments for this bulk assessment`);
      if (assignments.length > 0) {
        console.log('Sample assignment:', JSON.stringify(assignments[0], null, 2));
        
        // Count completed assignments
        const completedAssignments = assignments.filter(a => a.status === 'completed');
        console.log(`Completed assignments: ${completedAssignments.length}`);
        
        if (completedAssignments.length > 0) {
          console.log('Sample completed assignment:', JSON.stringify(completedAssignments[0], null, 2));
        }
      }
    }
    
    // 4. Check actual assessment responses in assessment tables
    console.log('\n📋 4. Checking actual assessment responses...');
    
    // Check 42-item assessments
    const { data: assessments42, error: assess42Error } = await supabase
      .from('assessments_42items')
      .select(`
        id,
        student_id,
        assessment_type,
        assignment_id,
        completed_at,
        students!inner(
          college,
          year_level,
          section
        )
      `)
      .not('assignment_id', 'is', null);
    
    if (assess42Error) {
      console.error('Error fetching 42-item assessments:', assess42Error);
    } else {
      console.log(`Found ${assessments42.length} completed 42-item assessments with assignment_id`);
      
      // Filter by assignment IDs from our bulk assessment
      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        const matchingAssessments = assessments42.filter(a => assignmentIds.includes(a.assignment_id));
        console.log(`Matching assessments for our bulk assessment: ${matchingAssessments.length}`);
        
        if (matchingAssessments.length > 0) {
          console.log('Sample matching assessment:', JSON.stringify(matchingAssessments[0], null, 2));
          
          // Group by college, year, section
          const groupedData = {};
          matchingAssessments.forEach(assessment => {
            const college = assessment.students.college;
            const year = assessment.students.year_level;
            const section = assessment.students.section;
            const key = `${college}_${year}_${section}`;
            
            if (!groupedData[key]) {
              groupedData[key] = {
                college,
                year_level: year,
                section,
                count: 0
              };
            }
            groupedData[key].count++;
          });
          
          console.log('\n📊 Assessment distribution by college/year/section:');
          Object.values(groupedData).forEach(group => {
            console.log(`  - ${group.college}, Year ${group.year_level}, Section ${group.section}: ${group.count} assessments`);
          });
        }
      }
    }
    
    // 5. Check if there are any college_scores for this assessment
    console.log('\n📋 5. Checking college_scores table...');
    const { data: collegeScores, error: collegeScoresError } = await supabase
      .from('college_scores')
      .select('*')
      .eq('assessmentName', TARGET_ASSESSMENT_NAME);
    
    if (collegeScoresError) {
      console.error('Error fetching college scores:', collegeScoresError);
    } else {
      console.log(`Found ${collegeScores.length} college score records for this assessment`);
      if (collegeScores.length > 0) {
        console.log('Sample college score:', JSON.stringify(collegeScores[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSpecificAssessment().catch(console.error);