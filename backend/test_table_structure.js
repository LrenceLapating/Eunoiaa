require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test table structure and insertion
async function testTableStructure() {
  try {
    console.log('🔍 Testing assessments_84items table structure...');
    
    // First, check if the table exists by trying to select from it
    console.log('\n1. Testing table existence:');
    const { data: existenceTest, error: existenceError } = await supabase
      .from('assessments_84items')
      .select('*')
      .limit(1);
    
    if (existenceError) {
      console.error('❌ Table existence error:', existenceError.message);
      return;
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
    // Test insertion with admin client (same as submission logic)
    console.log('\n2. Testing insertion with admin client:');
    const testData = {
      student_id: '223d466b-c792-4a73-987a-970d37d3abbb', // Use existing student
      assignment_id: '7814dd48-8dfe-4a62-bf22-63d83f427dc2', // Use existing assignment
      assessment_type: 'ryff_84',
      responses: { '1': 3, '2': 4, '3': 5 }, // Sample responses
      scores: {
        autonomy: 25.5,
        environmental_mastery: 30.2,
        personal_growth: 28.7,
        positive_relations: 32.1,
        purpose_in_life: 29.8,
        self_acceptance: 31.4
      },
      overall_score: 177.7,
      risk_level: 'moderate',
      completed_at: new Date().toISOString()
    };
    
    console.log('Attempting to insert test record...');
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('assessments_84items')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insertion error:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Test insertion successful!');
      console.log('Inserted record ID:', insertResult.id);
      
      // Clean up the test record
      console.log('\n3. Cleaning up test record...');
      const { error: deleteError } = await supabaseAdmin
        .from('assessments_84items')
        .delete()
        .eq('id', insertResult.id);
      
      if (deleteError) {
        console.error('❌ Cleanup error:', deleteError.message);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
    // Check table schema
    console.log('\n4. Checking table schema...');
    const { data: schemaData, error: schemaError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(0); // Get schema without data
    
    if (schemaError) {
      console.error('❌ Schema check error:', schemaError.message);
    } else {
      console.log('✅ Schema accessible');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTableStructure();