require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    console.log('Checking assessments_84items table schema...');
    
    // Try to get one record to see the schema
    const { data, error } = await supabase
      .from('assessments_84items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Available columns:', Object.keys(data[0]));
      console.log('Sample record:', data[0]);
    } else {
      console.log('No records found in assessments_84items table');
      
      // Get a real student_id and assignment_id for testing
      console.log('\nGetting real student and assignment IDs...');
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id')
        .limit(1);
      
      const { data: assignments } = await supabaseAdmin
        .from('assessment_assignments')
        .select('id')
        .limit(1);
      
      if (!students || students.length === 0) {
        console.log('No students found in database');
        return;
      }
      
      if (!assignments || assignments.length === 0) {
        console.log('No assignments found in database');
        return;
      }
      
      const studentId = students[0].id;
      const assignmentId = assignments[0].id;
      
      console.log(`Using student_id: ${studentId}`);
      console.log(`Using assignment_id: ${assignmentId}`);
      
      // Try to insert a test record using admin client to see what columns are expected
      console.log('\nTrying to insert test record to see schema...');
      const { error: insertError } = await supabaseAdmin
        .from('assessments_84items')
        .insert({
          student_id: studentId,
          assignment_id: assignmentId,
          assessment_type: 'ryff_84',
          responses: {},
          scores: {},
          overall_score: 0,
          risk_level: 'low',
          completed_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('Insert error (shows expected schema):', insertError.message);
        console.log('Full error details:', insertError);
      } else {
        console.log('✅ Test insert successful! assignment_id column exists and works.');
        console.log('Deleting test record...');
        await supabaseAdmin
          .from('assessments_84items')
          .delete()
          .eq('student_id', studentId)
          .eq('assignment_id', assignmentId);
        console.log('Test record deleted.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();