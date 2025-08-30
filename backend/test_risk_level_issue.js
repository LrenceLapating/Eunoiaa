const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRiskLevelIssue() {
  console.log('🔍 Testing risk level issue...');
  
  try {
    // Test 1: Check if risk_level exists in assessments_42items
    console.log('\n1. Checking assessments_42items structure:');
    const { data: sample42, error: error42 } = await supabaseAdmin
      .from('assessments_42items')
      .select('*')
      .limit(1);
    
    if (error42) {
      console.error('Error fetching 42-item sample:', error42);
    } else if (sample42 && sample42.length > 0) {
      console.log('Sample 42-item assessment structure:');
      console.log('Keys:', Object.keys(sample42[0]));
      console.log('Has risk_level?', 'risk_level' in sample42[0]);
      console.log('risk_level value:', sample42[0].risk_level);
    }
    
    // Test 2: Check if risk_level exists in assessments_84items
    console.log('\n2. Checking assessments_84items structure:');
    const { data: sample84, error: error84 } = await supabaseAdmin
      .from('assessments_84items')
      .select('*')
      .limit(1);
    
    if (error84) {
      console.error('Error fetching 84-item sample:', error84);
    } else if (sample84 && sample84.length > 0) {
      console.log('Sample 84-item assessment structure:');
      console.log('Keys:', Object.keys(sample84[0]));
      console.log('Has risk_level?', 'risk_level' in sample84[0]);
      console.log('risk_level value:', sample84[0].risk_level);
    }
    
    // Test 3: Check assessment_assignments table
    console.log('\n3. Checking assessment_assignments structure:');
    const { data: sampleAssignment, error: errorAssignment } = await supabaseAdmin
      .from('assessment_assignments')
      .select('*')
      .limit(1);
    
    if (errorAssignment) {
      console.error('Error fetching assignment sample:', errorAssignment);
    } else if (sampleAssignment && sampleAssignment.length > 0) {
      console.log('Sample assignment structure:');
      console.log('Keys:', Object.keys(sampleAssignment[0]));
      console.log('Has risk_level?', 'risk_level' in sampleAssignment[0]);
      console.log('risk_level value:', sampleAssignment[0].risk_level);
    }
    
    // Test 4: Simulate the problematic filtering logic
    console.log('\n4. Simulating problematic filtering logic:');
    const mockAssessment = {
      id: 1,
      student_id: 1,
      scores: { autonomy: 20, environmental_mastery: 25 },
      completed_at: new Date().toISOString(),
      // Note: no risk_level property
    };
    
    console.log('Mock assessment:', mockAssessment);
    console.log('Accessing risk_level:', mockAssessment.risk_level); // This will be undefined
    
    // This is what's causing the issue in the filter
    const riskLevel = 'high';
    const wouldMatch = mockAssessment.risk_level === riskLevel;
    console.log(`Would match risk level '${riskLevel}':`, wouldMatch);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRiskLevelIssue();