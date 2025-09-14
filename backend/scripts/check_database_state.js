const { supabaseAdmin } = require('../config/database');

// Check the current state of all assessment tables
async function checkDatabaseState() {
  console.log('🔍 Checking Database State...');
  
  try {
    // Check 42-item assessments
    const { data: count42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('id', { count: 'exact' });
    
    console.log(`📊 42-item assessments: ${count42?.length || 0} records`);
    
    // Check 84-item assessments
    const { data: count84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('id', { count: 'exact' });
    
    console.log(`📊 84-item assessments: ${count84?.length || 0} records`);
    
    // Check historical assessments
    const { data: countHistory, error: errorHistory } = await supabaseAdmin
      .from('ryff_history')
      .select('id', { count: 'exact' });
    
    console.log(`📊 Historical assessments: ${countHistory?.length || 0} records`);
    
    // Get sample data from each table
    if (count42?.length > 0) {
      const { data: sample42 } = await supabaseAdmin
        .from('assessments_42items')
        .select('id, student_id, responses')
        .limit(1)
        .single();
      
      if (sample42) {
        console.log(`\n✅ Sample 42-item assessment:`);
        console.log(`   ID: ${sample42.id}`);
        console.log(`   Student ID: ${sample42.student_id}`);
        console.log(`   Has Responses: ${sample42.responses ? 'Yes' : 'No'}`);
        if (sample42.responses) {
          console.log(`   Response Count: ${Object.keys(sample42.responses).length}`);
        }
      }
    }
    
    if (count84?.length > 0) {
      const { data: sample84 } = await supabaseAdmin
        .from('assessments_84items')
        .select('id, student_id, responses')
        .limit(1)
        .single();
      
      if (sample84) {
        console.log(`\n✅ Sample 84-item assessment:`);
        console.log(`   ID: ${sample84.id}`);
        console.log(`   Student ID: ${sample84.student_id}`);
        console.log(`   Has Responses: ${sample84.responses ? 'Yes' : 'No'}`);
        if (sample84.responses) {
          console.log(`   Response Count: ${Object.keys(sample84.responses).length}`);
        }
      }
    }
    
    if (countHistory?.length > 0) {
      const { data: sampleHistory } = await supabaseAdmin
        .from('ryff_history')
        .select('id, student_id, assessment_type, responses')
        .limit(1)
        .single();
      
      if (sampleHistory) {
        console.log(`\n✅ Sample historical assessment:`);
        console.log(`   ID: ${sampleHistory.id}`);
        console.log(`   Student ID: ${sampleHistory.student_id}`);
        console.log(`   Assessment Type: ${sampleHistory.assessment_type}`);
        console.log(`   Has Responses: ${sampleHistory.responses ? 'Yes' : 'No'}`);
        if (sampleHistory.responses) {
          console.log(`   Response Count: ${Object.keys(sampleHistory.responses).length}`);
        }
      }
    }
    
    // Test the endpoint logic flow
    console.log(`\n🔍 Testing Endpoint Logic Flow:`);
    
    if (countHistory?.length > 0) {
      const { data: testAssessment } = await supabaseAdmin
        .from('ryff_history')
        .select('id, student_id, assessment_type')
        .limit(1)
        .single();
      
      if (testAssessment) {
        console.log(`\n📋 Testing with assessment ID: ${testAssessment.id}`);
        console.log(`   Student ID: ${testAssessment.student_id}`);
        
        // Simulate the endpoint logic
        const studentId = testAssessment.student_id;
        const assessmentId = testAssessment.id;
        
        // Step 1: Try 42-item table
        const { data: check42 } = await supabaseAdmin
          .from('assessments_42items')
          .select('id')
          .eq('id', assessmentId)
          .eq('student_id', studentId)
          .single();
        
        console.log(`   ✓ Check 42-item table: ${check42 ? 'Found' : 'Not found'}`);
        
        // Step 2: Try 84-item table
        const { data: check84 } = await supabaseAdmin
          .from('assessments_84items')
          .select('id')
          .eq('id', assessmentId)
          .eq('student_id', studentId)
          .single();
        
        console.log(`   ✓ Check 84-item table: ${check84 ? 'Found' : 'Not found'}`);
        
        // Step 3: Try historical table (NEW LOGIC)
        const { data: checkHistory } = await supabaseAdmin
          .from('ryff_history')
          .select('id')
          .eq('id', assessmentId)
          .eq('student_id', studentId)
          .single();
        
        console.log(`   ✓ Check historical table: ${checkHistory ? 'Found' : 'Not found'}`);
        
        if (checkHistory) {
          console.log(`   ✅ SUCCESS: Historical assessment would be found by new logic!`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database state:', error.message);
  }
}

// Run the check
if (require.main === module) {
  checkDatabaseState().then(() => {
    console.log('\n🏁 Database state check completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkDatabaseState };