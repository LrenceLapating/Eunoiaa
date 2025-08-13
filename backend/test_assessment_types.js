require('dotenv').config();
const { supabase } = require('./config/database');

// Test what assessment_type values are actually stored in the database
async function testAssessmentTypes() {
  try {
    console.log('🎯 Testing assessment types in database...');
    
    // Check 84-item assessments
    const { data: assessments84, error: error84 } = await supabase
      .from('assessments_84items')
      .select('id, student_id, assessment_type, created_at')
      .limit(10);
    
    if (error84) {
      console.error('Error fetching 84-item assessments:', error84);
      return;
    }
    
    console.log(`\n📊 Found ${assessments84?.length || 0} 84-item assessments:`);
    assessments84?.forEach((assessment, index) => {
      console.log(`  ${index + 1}. ID: ${assessment.id}, Type: "${assessment.assessment_type}", Student: ${assessment.student_id}`);
    });
    
    // Check 42-item assessments for comparison
    const { data: assessments42, error: error42 } = await supabase
      .from('assessments_42items')
      .select('id, student_id, assessment_type, created_at')
      .limit(5);
    
    if (error42) {
      console.error('Error fetching 42-item assessments:', error42);
      return;
    }
    
    console.log(`\n📊 Found ${assessments42?.length || 0} 42-item assessments:`);
    assessments42?.forEach((assessment, index) => {
      console.log(`  ${index + 1}. ID: ${assessment.id}, Type: "${assessment.assessment_type}", Student: ${assessment.student_id}`);
    });
    
    // Test the filtering logic
    console.log('\n🔍 Testing filter logic:');
    const targetType = 'ryff_84';
    const filtered84 = assessments84?.filter(a => a.assessment_type === targetType) || [];
    console.log(`  - Filtering 84-item assessments for type "${targetType}": ${filtered84.length} matches`);
    
    const targetType42 = 'ryff_42';
    const filtered42 = assessments42?.filter(a => a.assessment_type === targetType42) || [];
    console.log(`  - Filtering 42-item assessments for type "${targetType42}": ${filtered42.length} matches`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAssessmentTypes();