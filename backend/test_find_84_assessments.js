require('dotenv').config();
const { supabase } = require('./config/database');

// Find where 84-item assessments are actually stored
async function findAssessments() {
  try {
    console.log('🔍 Searching for 84-item assessments in all possible tables...');
    
    // Check assessments_84items table
    console.log('\n1. Checking assessments_84items table:');
    const { data: table84, error: error84 } = await supabase
      .from('assessments_84items')
      .select('*')
      .limit(5);
    
    console.log(`   Found: ${table84?.length || 0} records`);
    if (table84?.length > 0) {
      console.log('   Sample:', table84[0]);
    }
    
    // Check assessments_42items table
    console.log('\n2. Checking assessments_42items table:');
    const { data: table42, error: error42 } = await supabase
      .from('assessments_42items')
      .select('*')
      .limit(5);
    
    console.log(`   Found: ${table42?.length || 0} records`);
    if (table42?.length > 0) {
      console.log('   Sample assessment_type:', table42[0].assessment_type);
    }
    
    // Check if there's a general assessments table
    console.log('\n3. Checking assessments table:');
    const { data: tableGeneral, error: errorGeneral } = await supabase
      .from('assessments')
      .select('*')
      .limit(5);
    
    if (errorGeneral) {
      console.log('   Table does not exist or error:', errorGeneral.message);
    } else {
      console.log(`   Found: ${tableGeneral?.length || 0} records`);
      if (tableGeneral?.length > 0) {
        console.log('   Sample:', tableGeneral[0]);
      }
    }
    
    // Check bulk_assessments table
    console.log('\n4. Checking bulk_assessments table:');
    const { data: tableBulk, error: errorBulk } = await supabase
      .from('bulk_assessments')
      .select('*')
      .limit(5);
    
    if (errorBulk) {
      console.log('   Table does not exist or error:', errorBulk.message);
    } else {
      console.log(`   Found: ${tableBulk?.length || 0} records`);
      if (tableBulk?.length > 0) {
        tableBulk.forEach((bulk, index) => {
          console.log(`   ${index + 1}. Type: ${bulk.assessment_type}, Name: ${bulk.assessment_name}`);
        });
      }
    }
    
    // Check assessment_assignments table
    console.log('\n5. Checking assessment_assignments table:');
    const { data: tableAssignments, error: errorAssignments } = await supabase
      .from('assessment_assignments')
      .select('*')
      .limit(5);
    
    if (errorAssignments) {
      console.log('   Table does not exist or error:', errorAssignments.message);
    } else {
      console.log(`   Found: ${tableAssignments?.length || 0} records`);
      if (tableAssignments?.length > 0) {
        console.log('   Sample:', tableAssignments[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findAssessments();