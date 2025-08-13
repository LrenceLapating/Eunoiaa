require('dotenv').config();
const fetch = require('node-fetch');
const { supabase } = require('./config/database');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRealAPIEndpoint() {
  try {
    console.log('Testing the real API endpoint with session authentication...');
    
    // We know this counselor has 84-item assessments
    const knownCounselorId = 'd84e3473-e7f0-4fbd-8db1-a59e27917ee7';
    
    console.log('\nStep 1: Get counselor details...');
    const { data: counselor, error: counselorError } = await supabaseAdmin
      .from('counselors')
      .select('*')
      .eq('id', knownCounselorId)
      .single();
    
    if (counselorError || !counselor) {
      console.log('❌ Counselor not found:', counselorError);
      return;
    }
    
    console.log('✅ Counselor found:');
    console.log(`  - ID: ${counselor.id}`);
    console.log(`  - Email: ${counselor.email}`);
    console.log(`  - Name: ${counselor.name}`);
    
    console.log('\nStep 2: Create a session for this counselor...');
    
    // Create a session token for this counselor
    const sessionData = {
      user: {
        id: counselor.id,
        email: counselor.email,
        role: 'counselor'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };
    
    // We'll need to make a request with proper session cookies
    // For now, let's test the endpoint directly by calling the route handler
    
    console.log('\nStep 3: Test API endpoint with different filters...');
    
    // Test 1: No filter (should return all assessments)
    console.log('\n--- Test 1: No assessment type filter ---');
    await testAPICall(knownCounselorId, null);
    
    // Test 2: Filter for ryff_84
    console.log('\n--- Test 2: Filter for ryff_84 ---');
    await testAPICall(knownCounselorId, 'ryff_84');
    
    // Test 3: Filter for ryff_42
    console.log('\n--- Test 3: Filter for ryff_42 ---');
    await testAPICall(knownCounselorId, 'ryff_42');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

async function testAPICall(counselorId, assessmentType) {
  try {
    let url = 'http://localhost:3000/api/counselor-assessments';
    const params = new URLSearchParams();
    
    if (assessmentType) {
      params.append('assessmentType', assessmentType);
    }
    params.append('page', '1');
    params.append('limit', '10');
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    console.log(`Making request to: ${url}`);
    
    // We can't easily test with session cookies, so let's simulate the API logic directly
    console.log('Simulating API logic directly...');
    
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);
    
    let assessments = [];
    
    if (!assessmentType || assessmentType === 'ryff_42') {
      console.log('Querying 42-item assessments...');
      
      // Step 1: Get assignments for counselor
      const { data: assignments, error: assignError } = await supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id, student_id, assigned_at, completed_at, bulk_assessment_id,
          bulk_assessments!inner(
            id, assessment_name, assessment_type, counselor_id, status
          )
        `)
        .eq('bulk_assessments.counselor_id', counselorId)
        .neq('bulk_assessments.status', 'archived');
      
      if (assignError) {
        console.log('❌ Error fetching 42-item assignments:', assignError);
        return;
      }
      
      console.log(`Found ${assignments?.length || 0} total assignments`);
      
      if (assignments && assignments.length > 0) {
        // Filter for 42-item if specific type requested
        let filteredAssignments = assignments;
        if (assessmentType === 'ryff_42') {
          filteredAssignments = assignments.filter(a => a.bulk_assessments.assessment_type === 'ryff_42');
        }
        
        console.log(`Found ${filteredAssignments.length} 42-item assignments`);
        
        if (filteredAssignments.length > 0) {
          const assignmentIds = filteredAssignments.map(a => a.id);
          
          const { data: assessmentData, error: assessmentError } = await supabaseAdmin
            .from('assessments_42items')
            .select('*')
            .in('assignment_id', assignmentIds)
            .limit(limitNum)
            .range(offset, offset + limitNum - 1);
          
          if (assessmentError) {
            console.log('❌ Error fetching 42-item assessments:', assessmentError);
          } else {
            console.log(`✅ Found ${assessmentData?.length || 0} 42-item assessments`);
            assessments = assessments.concat(assessmentData || []);
          }
        }
      }
    }
    
    if (!assessmentType || assessmentType === 'ryff_84') {
      console.log('Querying 84-item assessments...');
      
      // Step 1: Get assignments for counselor
      const { data: assignments, error: assignError } = await supabaseAdmin
        .from('assessment_assignments')
        .select(`
          id, student_id, assigned_at, completed_at, bulk_assessment_id,
          bulk_assessments!inner(
            id, assessment_name, assessment_type, counselor_id, status
          )
        `)
        .eq('bulk_assessments.counselor_id', counselorId)
        .neq('bulk_assessments.status', 'archived');
      
      if (assignError) {
        console.log('❌ Error fetching 84-item assignments:', assignError);
        return;
      }
      
      console.log(`Found ${assignments?.length || 0} total assignments`);
      
      if (assignments && assignments.length > 0) {
        // Filter for 84-item if specific type requested
        let filteredAssignments = assignments;
        if (assessmentType === 'ryff_84') {
          filteredAssignments = assignments.filter(a => a.bulk_assessments.assessment_type === 'ryff_84');
        }
        
        console.log(`Found ${filteredAssignments.length} 84-item assignments`);
        
        if (filteredAssignments.length > 0) {
          const assignmentIds = filteredAssignments.map(a => a.id);
          console.log('84-item assignment IDs:', assignmentIds);
          
          const { data: assessmentData, error: assessmentError } = await supabaseAdmin
            .from('assessments_84items')
            .select('*')
            .in('assignment_id', assignmentIds)
            .limit(limitNum)
            .range(offset, offset + limitNum - 1);
          
          if (assessmentError) {
            console.log('❌ Error fetching 84-item assessments:', assessmentError);
          } else {
            console.log(`✅ Found ${assessmentData?.length || 0} 84-item assessments`);
            if (assessmentData && assessmentData.length > 0) {
              console.log('84-item assessment IDs:', assessmentData.map(a => a.id));
            }
            assessments = assessments.concat(assessmentData || []);
          }
        }
      }
    }
    
    console.log(`\n🎯 TOTAL ASSESSMENTS FOUND: ${assessments.length}`);
    
  } catch (error) {
    console.error('Error in API call test:', error);
  }
}

testRealAPIEndpoint();