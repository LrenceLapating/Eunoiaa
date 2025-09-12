const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssessmentTypes() {
  try {
    console.log('🔍 Checking assessment_type values in ryff_history table...');
    
    // Get all unique assessment_type values
    const { data: uniqueTypes, error: typesError } = await supabase
      .from('ryff_history')
      .select('assessment_type')
      .not('assessment_type', 'is', null);
    
    if (typesError) {
      console.error('❌ Error fetching assessment types:', typesError.message);
      return;
    }
    
    const typeCount = {};
    uniqueTypes.forEach(record => {
      const type = record.assessment_type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    console.log('\n📊 Assessment Type Distribution:');
    console.table(typeCount);
    
    // Get sample records for each type
    console.log('\n📋 Sample records for each assessment type:');
    
    for (const type of Object.keys(typeCount)) {
      console.log(`\n🔍 Sample records for assessment_type: '${type}'`);
      
      const { data: samples, error: sampleError } = await supabase
        .from('ryff_history')
        .select('id, original_id, student_id, assessment_type, completed_at, archived_at')
        .eq('assessment_type', type)
        .limit(3);
      
      if (sampleError) {
        console.error(`❌ Error fetching samples for ${type}:`, sampleError.message);
        continue;
      }
      
      console.table(samples);
    }
    
    // Check if there are any records with unexpected assessment_type values
    console.log('\n🔍 Checking for unexpected assessment_type values...');
    
    const { data: unexpectedTypes, error: unexpectedError } = await supabase
      .from('ryff_history')
      .select('assessment_type, id, original_id')
      .not('assessment_type', 'in', '("ryff_42","ryff_84")')
      .limit(10);
    
    if (unexpectedError) {
      console.error('❌ Error checking unexpected types:', unexpectedError.message);
    } else if (unexpectedTypes && unexpectedTypes.length > 0) {
      console.log('⚠️  Found unexpected assessment_type values:');
      console.table(unexpectedTypes);
    } else {
      console.log('✅ All assessment_type values are as expected (ryff_42 or ryff_84)');
    }
    
    // Check responses count to verify assessment type accuracy
    console.log('\n🔍 Verifying assessment types by response count...');
    
    const { data: responseCheck, error: responseError } = await supabase
      .from('ryff_history')
      .select('id, assessment_type, responses')
      .limit(10);
    
    if (responseError) {
      console.error('❌ Error checking responses:', responseError.message);
    } else {
      console.log('\n📊 Response count verification:');
      responseCheck.forEach(record => {
        const responseCount = Object.keys(record.responses || {}).length;
        const expectedType = responseCount === 84 ? 'ryff_84' : 'ryff_42';
        const isCorrect = record.assessment_type === expectedType;
        
        console.log(`ID: ${record.id} | Type: ${record.assessment_type} | Responses: ${responseCount} | Expected: ${expectedType} | ${isCorrect ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking assessment types:', error.message);
  }
}

checkAssessmentTypes();