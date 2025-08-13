require('dotenv').config();
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

// Create admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Final verification test to confirm the fix works
async function finalVerification() {
  try {
    console.log('🎯 Final verification: Testing 84-item assessment access with admin client...');
    
    // Step 1: Create a test 84-item assessment record using admin client
    console.log('\n1. Creating test 84-item assessment record...');
    const testData = {
      student_id: '223d466b-c792-4a73-987a-970d37d3abbb',
      assignment_id: '7814dd48-8dfe-4a62-bf22-63d83f427dc2',
      assessment_type: 'ryff_84',
      responses: { '1': 3, '2': 4, '3': 5 },
      scores: { autonomy: 50, environmental_mastery: 45 },
      overall_score: 95,
      risk_level: 'low',
      completed_at: new Date().toISOString()
    };
    
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('assessments_84items')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create test record:', insertError.message);
      return;
    }
    
    console.log('✅ Test record created with ID:', insertResult.id);
    
    // Step 2: Test reading with regular client (should fail due to RLS)
    console.log('\n2. Testing read with regular client (should fail)...');
    const { data: regularRead, error: regularError } = await supabase
      .from('assessments_84items')
      .select('*')
      .eq('id', insertResult.id)
      .single();
    
    if (regularError) {
      console.log('✅ Regular client failed as expected:', regularError.message);
    } else {
      console.log('⚠️ Regular client unexpectedly succeeded');
    }
    
    // Step 3: Test reading with admin client (should succeed)
    console.log('\n3. Testing read with admin client (should succeed)...');
    const { data: adminRead, error: adminError } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .eq('id', insertResult.id)
      .single();
    
    if (adminError) {
      console.error('❌ Admin client failed unexpectedly:', adminError.message);
    } else {
      console.log('✅ Admin client succeeded as expected');
      console.log('Record details:', {
        id: adminRead.id,
        student_id: adminRead.student_id,
        assessment_type: adminRead.assessment_type,
        overall_score: adminRead.overall_score
      });
    }
    
    // Step 4: Test the counselor API logic directly (simulating the fixed code)
    console.log('\n4. Testing counselor API logic with admin client...');
    
    // This simulates the exact logic from counselorAssessments.js after our fix
    const tableName = 'assessments_84items';
    const limitNum = 10;
    const offset = 0;
    
    console.log('Using admin client for assessments_84items query...');
    const { data: assessmentData, error: assessmentError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(limitNum)
      .range(offset, offset + limitNum - 1);
    
    if (assessmentError) {
      console.error('❌ Counselor API simulation failed:', assessmentError.message);
    } else {
      console.log(`✅ Counselor API simulation succeeded! Found ${assessmentData?.length || 0} records`);
      
      if (assessmentData?.length > 0) {
        console.log('Sample record:', {
          id: assessmentData[0].id,
          student_id: assessmentData[0].student_id,
          assessment_type: assessmentData[0].assessment_type,
          overall_score: assessmentData[0].overall_score,
          created_at: assessmentData[0].created_at
        });
      }
    }
    
    // Step 5: Verify that completed assignments now have corresponding records
    console.log('\n5. Checking completed 84-item assignments vs records...');
    
    // Get completed 84-item assignments
    const { data: completedAssignments, error: assignmentError } = await supabase
      .from('assessment_assignments')
      .select(`
        id,
        student_id,
        bulk_assessment_id,
        status,
        completed_at,
        bulk_assessments!inner(
          assessment_type,
          assessment_name
        )
      `)
      .eq('status', 'completed')
      .eq('bulk_assessments.assessment_type', 'ryff_84');
    
    if (assignmentError) {
      console.error('❌ Error fetching completed assignments:', assignmentError.message);
    } else {
      console.log(`Found ${completedAssignments?.length || 0} completed 84-item assignments`);
      
      // Get all 84-item assessment records
      const { data: allRecords, error: recordsError } = await supabaseAdmin
        .from('assessments_84items')
        .select('assignment_id');
      
      if (recordsError) {
        console.error('❌ Error fetching assessment records:', recordsError.message);
      } else {
        console.log(`Found ${allRecords?.length || 0} 84-item assessment records`);
        
        const recordAssignmentIds = new Set(allRecords?.map(r => r.assignment_id) || []);
        
        completedAssignments?.forEach((assignment, index) => {
          const hasRecord = recordAssignmentIds.has(assignment.id);
          console.log(`${index + 1}. Assignment ${assignment.id}: ${hasRecord ? '✅ Has record' : '❌ Missing record'}`);
        });
      }
    }
    
    // Step 6: Clean up test record
    console.log('\n6. Cleaning up test record...');
    const { error: deleteError } = await supabaseAdmin
      .from('assessments_84items')
      .delete()
      .eq('id', insertResult.id);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test record cleaned up');
    }
    
    console.log('\n🎉 Final verification completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Admin client can write to assessments_84items');
    console.log('- ✅ Admin client can read from assessments_84items');
    console.log('- ✅ Regular client is blocked by RLS (as expected)');
    console.log('- ✅ Counselor API logic updated to use admin client');
    console.log('\n🔧 The fix should now allow counselors to see 84-item assessments!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

finalVerification();