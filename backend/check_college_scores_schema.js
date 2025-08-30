const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCollegeScoresSchema() {
  try {
    console.log('🔍 Checking college_scores table schema...');
    
    // Get table structure
    const { data: tableStructure, error: structureError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_name', 'college_scores')
      .order('ordinal_position');
    
    if (structureError) {
      console.error('Error getting table structure:', structureError);
      // Try alternative approach using RPC
      const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = 'college_scores' 
          ORDER BY ordinal_position;
        `
      });
      
      if (altError) {
        console.error('Alternative query also failed:', altError);
        return;
      }
      
      console.log('\n📊 College Scores Table Structure:');
      console.table(altData);
    } else {
      console.log('\n📊 College Scores Table Structure:');
      console.table(tableStructure);
    }
    
    // Check related tables - bulk_assessments
    console.log('\n🔍 Checking bulk_assessments table structure...');
    const { data: bulkAssessments, error: bulkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'bulk_assessments'
        AND column_name IN ('assessment_name', 'assessment_type', 'college')
        ORDER BY column_name;
      `
    });
    
    if (!bulkError && bulkAssessments) {
      console.log('\n📋 bulk_assessments relevant columns:');
      console.table(bulkAssessments);
    }
    
    // Check students table
    console.log('\n🔍 Checking students table structure...');
    const { data: students, error: studentsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'students'
        AND column_name IN ('college', 'id')
        ORDER BY column_name;
      `
    });
    
    if (!studentsError && students) {
      console.log('\n👥 students relevant columns:');
      console.table(students);
    }
    
    // Check assessments table
    console.log('\n🔍 Checking assessments table structure...');
    const { data: assessments, error: assessmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'assessments'
        AND column_name IN ('assessment_type', 'student_id')
        ORDER BY column_name;
      `
    });
    
    if (!assessmentsError && assessments) {
      console.log('\n📝 assessments relevant columns:');
      console.table(assessments);
    }
    
    // Check existing foreign key relationships
    console.log('\n🔍 Checking foreign key constraints...');
    const { data: foreignKeys, error: fkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'college_scores' OR ccu.table_name = 'college_scores');
      `
    });
    
    if (!fkError && foreignKeys) {
      console.log('\n🔑 Existing Foreign Key Relationships:');
      console.table(foreignKeys);
    } else {
      console.log('\n🔑 No foreign key relationships found for college_scores table');
    }
    
    // Sample data check
    console.log('\n🔍 Checking sample data from college_scores...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('college_scores')
      .select('*')
      .limit(5);
    
    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('\n📊 Sample college_scores data:');
      console.table(sampleData);
    } else {
      console.log('\n📊 No sample data found in college_scores table');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkCollegeScoresSchema();