require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  try {
    console.log('Checking table structures...');
    
    // Check assessments_42items structure
    console.log('\n--- Checking assessments_42items structure ---');
    const { data: sample42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .limit(1);
    
    if (error42) {
      console.error('❌ Error fetching 42-item sample:', error42);
    } else {
      console.log('✅ assessments_42items columns:');
      if (sample42 && sample42.length > 0) {
        Object.keys(sample42[0]).forEach(column => {
          console.log(`  - ${column}`);
        });
      } else {
        console.log('  No data in table to show columns');
      }
    }
    
    // Check assessments_84items structure
    console.log('\n--- Checking assessments_84items structure ---');
    const { data: sample84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(1);
    
    if (error84) {
      console.error('❌ Error fetching 84-item sample:', error84);
    } else {
      console.log('✅ assessments_84items columns:');
      if (sample84 && sample84.length > 0) {
        Object.keys(sample84[0]).forEach(column => {
          console.log(`  - ${column}`);
        });
      } else {
        console.log('  No data in table to show columns');
      }
    }
    
    // Check assessment_assignments structure
    console.log('\n--- Checking assessment_assignments structure ---');
    const { data: sampleAssignments, error: errorAssignments } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .limit(1);
    
    if (errorAssignments) {
      console.error('❌ Error fetching assignments sample:', errorAssignments);
    } else {
      console.log('✅ assessment_assignments columns:');
      if (sampleAssignments && sampleAssignments.length > 0) {
        Object.keys(sampleAssignments[0]).forEach(column => {
          console.log(`  - ${column}`);
        });
      } else {
        console.log('  No data in table to show columns');
      }
    }
    
    // Check if there are any 42-item assessments
    console.log('\n--- Checking 42-item assessments count ---');
    const { count: count42, error: countError42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('*', { count: 'exact', head: true });
    
    if (countError42) {
      console.error('❌ Error counting 42-item assessments:', countError42);
    } else {
      console.log(`✅ Total 42-item assessments: ${count42}`);
    }
    
    // Check if there are any 84-item assessments
    console.log('\n--- Checking 84-item assessments count ---');
    const { count: count84, error: countError84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('*', { count: 'exact', head: true });
    
    if (countError84) {
      console.error('❌ Error counting 84-item assessments:', countError84);
    } else {
      console.log(`✅ Total 84-item assessments: ${count84}`);
    }
    
    // Check the unified assessments view
    console.log('\n--- Checking unified assessments view ---');
    const { data: unifiedSample, error: unifiedError } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .limit(1);
    
    if (unifiedError) {
      console.error('❌ Error fetching unified view sample:', unifiedError);
    } else {
      console.log('✅ assessments (unified view) columns:');
      if (unifiedSample && unifiedSample.length > 0) {
        Object.keys(unifiedSample[0]).forEach(column => {
          console.log(`  - ${column}`);
        });
      } else {
        console.log('  No data in view to show columns');
      }
    }
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
  
  process.exit(0);
}

checkTableStructure();