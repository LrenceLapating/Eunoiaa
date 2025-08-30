const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCompleteCollegeScoresSchema() {
  try {
    console.log('🔍 Comprehensive College Scores Schema Analysis\n');
    
    // 1. Get college_scores table structure
    console.log('📊 COLLEGE_SCORES TABLE STRUCTURE:');
    const { data: collegeScoresStructure, error: structureError } = await supabase
      .from('college_scores')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Error accessing college_scores table:', structureError.message);
      console.log('\n⚠️  The college_scores table may not exist yet.');
    } else {
      console.log('✅ college_scores table exists');
      
      // Get sample data to understand structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('college_scores')
        .select('*')
        .limit(3);
      
      if (sampleData && sampleData.length > 0) {
        console.log('\n📋 Sample data structure:');
        console.log('Columns found:', Object.keys(sampleData[0]));
        console.table(sampleData);
      } else {
        console.log('\n📋 Table exists but no data found');
      }
    }
    
    // 2. Check related tables that college_scores should reference
    console.log('\n\n🔗 RELATED TABLES ANALYSIS:');
    
    // Check bulk_assessments structure
    console.log('\n📋 bulk_assessments table:');
    const { data: bulkAssessments, error: bulkError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, assessment_type, target_colleges')
      .limit(2);
    
    if (!bulkError && bulkAssessments) {
      console.log('✅ bulk_assessments accessible');
      if (bulkAssessments.length > 0) {
        console.log('Sample data:', bulkAssessments[0]);
        console.log('Key columns: id (UUID), assessment_name (VARCHAR), assessment_type (VARCHAR)');
      }
    } else {
      console.log('❌ Error accessing bulk_assessments:', bulkError?.message);
    }
    
    // Check students structure
    console.log('\n👥 students table:');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, college, name')
      .limit(2);
    
    if (!studentsError && students) {
      console.log('✅ students accessible');
      if (students.length > 0) {
        console.log('Sample data:', students[0]);
        console.log('Key columns: id (UUID), college (VARCHAR)');
      }
    } else {
      console.log('❌ Error accessing students:', studentsError?.message);
    }
    
    // Check assessments tables
    console.log('\n📝 assessments_42items table:');
    const { data: assessments42, error: assessments42Error } = await supabase
      .from('assessments_42items')
      .select('id, student_id, assessment_type, assignment_id')
      .limit(2);
    
    if (!assessments42Error && assessments42) {
      console.log('✅ assessments_42items accessible');
      if (assessments42.length > 0) {
        console.log('Sample data:', assessments42[0]);
        console.log('Key columns: id (UUID), student_id (UUID), assessment_type (VARCHAR), assignment_id (UUID)');
      }
    } else {
      console.log('❌ Error accessing assessments_42items:', assessments42Error?.message);
    }
    
    console.log('\n📝 assessments_84items table:');
    const { data: assessments84, error: assessments84Error } = await supabase
      .from('assessments_84items')
      .select('id, student_id, assessment_type, assignment_id')
      .limit(2);
    
    if (!assessments84Error && assessments84) {
      console.log('✅ assessments_84items accessible');
      if (assessments84.length > 0) {
        console.log('Sample data:', assessments84[0]);
        console.log('Key columns: id (UUID), student_id (UUID), assessment_type (VARCHAR), assignment_id (UUID)');
      }
    } else {
      console.log('❌ Error accessing assessments_84items:', assessments84Error?.message);
    }
    
    // 3. Analysis and Recommendations
    console.log('\n\n📋 SCHEMA ANALYSIS & RECOMMENDATIONS:');
    console.log('\n🎯 Expected college_scores table structure:');
    console.log(`
    Expected columns:
    - id: UUID (Primary Key)
    - college_name: VARCHAR(255) (should match students.college)
    - dimension_name: VARCHAR(100) 
    - raw_score: NUMERIC(5,2)
    - student_count: INTEGER
    - risk_level: VARCHAR(20)
    - assessment_type: VARCHAR(50) (should match assessments.assessment_type)
    - assessment_name: VARCHAR(255) (should reference bulk_assessments.assessment_name)
    - last_calculated: TIMESTAMP WITH TIME ZONE
    - created_at: TIMESTAMP WITH TIME ZONE
    - updated_at: TIMESTAMP WITH TIME ZONE
    `);
    
    console.log('\n🔗 Required relationships:');
    console.log('1. college_name should match students.college (VARCHAR consistency)');
    console.log('2. assessment_type should match assessments_42items/84items.assessment_type');
    console.log('3. assessment_name should reference bulk_assessments.assessment_name');
    
    console.log('\n⚠️  Potential issues to check:');
    console.log('- Data type consistency between related columns');
    console.log('- Foreign key constraints for data integrity');
    console.log('- Indexes for performance on join columns');
    
  } catch (error) {
    console.error('❌ Comprehensive analysis error:', error);
  }
}

checkCompleteCollegeScoresSchema();