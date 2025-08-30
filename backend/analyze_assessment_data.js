const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeAssessmentData() {
  try {
    console.log('🔍 ANALYZING EXISTING ASSESSMENT DATA\n');
    
    // 1. Check bulk_assessments to understand available assessments
    console.log('📋 BULK ASSESSMENTS ANALYSIS:');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type, target_colleges, status')
      .order('created_at', { ascending: false });
    
    if (bulkError) {
      console.error('❌ Error fetching bulk assessments:', bulkError);
      return;
    }
    
    console.log(`✅ Found ${bulkAssessments.length} bulk assessments`);
    console.table(bulkAssessments);
    
    // 2. Analyze assessments_42items
    console.log('\n\n📝 ASSESSMENTS_42ITEMS ANALYSIS:');
    const { data: assessments42, error: error42 } = await supabase
      .from('assessments_42items')
      .select('id, student_id, assessment_type, scores, overall_score, risk_level, assignment_id')
      .limit(5);
    
    if (error42) {
      console.error('❌ Error fetching 42-item assessments:', error42);
    } else {
      console.log(`✅ Found assessments in assessments_42items table`);
      console.log('Sample data:');
      assessments42.forEach((assessment, index) => {
        console.log(`\nAssessment ${index + 1}:`);
        console.log('- ID:', assessment.id);
        console.log('- Student ID:', assessment.student_id);
        console.log('- Assessment Type:', assessment.assessment_type);
        console.log('- Overall Score:', assessment.overall_score);
        console.log('- Risk Level:', assessment.risk_level);
        console.log('- Assignment ID:', assessment.assignment_id);
        
        if (assessment.scores) {
          console.log('- Dimension Scores:');
          const scores = typeof assessment.scores === 'string' ? JSON.parse(assessment.scores) : assessment.scores;
          Object.entries(scores).forEach(([dimension, score]) => {
            console.log(`  * ${dimension}: ${score}`);
          });
        }
      });
      
      // Get total count
      const { count: count42 } = await supabase
        .from('assessments_42items')
        .select('*', { count: 'exact', head: true });
      console.log(`\n📊 Total 42-item assessments: ${count42}`);
    }
    
    // 3. Analyze assessments_84items
    console.log('\n\n📝 ASSESSMENTS_84ITEMS ANALYSIS:');
    const { data: assessments84, error: error84 } = await supabase
      .from('assessments_84items')
      .select('id, student_id, assessment_type, scores, overall_score, risk_level, assignment_id')
      .limit(5);
    
    if (error84) {
      console.error('❌ Error fetching 84-item assessments:', error84);
    } else {
      console.log(`✅ Found assessments in assessments_84items table`);
      console.log('Sample data:');
      assessments84.forEach((assessment, index) => {
        console.log(`\nAssessment ${index + 1}:`);
        console.log('- ID:', assessment.id);
        console.log('- Student ID:', assessment.student_id);
        console.log('- Assessment Type:', assessment.assessment_type);
        console.log('- Overall Score:', assessment.overall_score);
        console.log('- Risk Level:', assessment.risk_level);
        console.log('- Assignment ID:', assessment.assignment_id);
        
        if (assessment.scores) {
          console.log('- Dimension Scores:');
          const scores = typeof assessment.scores === 'string' ? JSON.parse(assessment.scores) : assessment.scores;
          Object.entries(scores).forEach(([dimension, score]) => {
            console.log(`  * ${dimension}: ${score}`);
          });
        }
      });
      
      // Get total count
      const { count: count84 } = await supabase
        .from('assessments_84items')
        .select('*', { count: 'exact', head: true });
      console.log(`\n📊 Total 84-item assessments: ${count84}`);
    }
    
    // 4. Analyze students to understand college distribution
    console.log('\n\n👥 STUDENTS COLLEGE DISTRIBUTION:');
    const { data: collegeStats, error: collegeError } = await supabase
      .from('students')
      .select('college')
      .not('college', 'is', null);
    
    if (!collegeError && collegeStats) {
      const collegeCounts = {};
      collegeStats.forEach(student => {
        collegeCounts[student.college] = (collegeCounts[student.college] || 0) + 1;
      });
      
      console.log('✅ College distribution:');
      Object.entries(collegeCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([college, count]) => {
          console.log(`- ${college}: ${count} students`);
        });
    }
    
    // 5. Analyze assessment assignments to understand relationships
    console.log('\n\n🔗 ASSESSMENT ASSIGNMENTS ANALYSIS:');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        status,
        bulk_assessment:bulk_assessments!inner(
          assessment_name,
          assessment_type
        )
      `)
      .eq('status', 'completed')
      .limit(10);
    
    if (!assignmentError && assignments) {
      console.log('✅ Sample completed assignments:');
      assignments.forEach((assignment, index) => {
        console.log(`\nAssignment ${index + 1}:`);
        console.log('- Assignment ID:', assignment.id);
        console.log('- Student ID:', assignment.student_id);
        console.log('- Assessment Name:', assignment.bulk_assessment.assessment_name);
        console.log('- Assessment Type:', assignment.bulk_assessment.assessment_type);
      });
      
      // Get total completed assignments count
      const { count: completedCount } = await supabase
        .from('assessment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      console.log(`\n📊 Total completed assignments: ${completedCount}`);
    }
    
    // 6. Summary and recommendations
    console.log('\n\n📋 ANALYSIS SUMMARY:');
    console.log('\n🎯 Data Population Strategy:');
    console.log('1. Use assessment_assignments to link assessments with bulk_assessments');
    console.log('2. Join with students table to get college information');
    console.log('3. Extract dimension scores from assessments_42items/84items.scores JSONB');
    console.log('4. Aggregate scores by college and dimension');
    console.log('5. Calculate risk levels based on score ranges');
    
    console.log('\n✅ Ready to create data population script!');
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

analyzeAssessmentData();