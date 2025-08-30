// Test script to verify assessment type filtering implementation
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAssessmentTypeFiltering() {
  console.log('🧪 Testing Assessment Type Filtering Implementation\n');
  
  try {
    // Test 1: Check college_scores table structure
    console.log('📋 Step 1: Checking college_scores table structure...');
    const { data: sampleData, error: structureError } = await supabase
      .from('college_scores')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Error fetching college_scores structure:', structureError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('✅ College_scores table columns:', Object.keys(sampleData[0]));
      console.log('📝 Sample record:', sampleData[0]);
    }
    
    // Test 2: Check available colleges using correct column name
    console.log('\n📋 Step 2: Checking available colleges...');
    const { data: colleges, error: collegesError } = await supabase
      .from('college_scores')
      .select('college_name')
      .not('college_name', 'is', null);
    
    if (collegesError) {
      console.error('❌ Error fetching colleges:', collegesError);
      return;
    }
    
    const uniqueColleges = [...new Set(colleges.map(c => c.college_name))];
    console.log('✅ Available colleges:', uniqueColleges.slice(0, 3));
    
    if (uniqueColleges.length === 0) {
      console.log('❌ No colleges found in database');
      return;
    }
    
    const testCollege = uniqueColleges[0];
    console.log(`🎯 Using test college: ${testCollege}\n`);
    
    // Test 3: Test backend endpoint for 42-item assessments
    console.log('📋 Step 3: Testing 42-item assessment filtering...');
    const response42 = await fetch(`http://localhost:3000/api/accounts/colleges/assessment-names?college=${encodeURIComponent(testCollege)}&assessmentType=ryff_42`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response42.ok) {
      console.error('❌ Failed to fetch 42-item assessments:', response42.status, await response42.text());
      return;
    }
    
    const response42Data = await response42.json();
    const assessments42 = response42Data.assessmentNames || [];
    console.log('✅ 42-item assessments found:', assessments42.length);
    console.log('📝 Raw response:', response42Data);
    if (assessments42.length > 0) {
      console.log('📝 Sample 42-item assessments:', assessments42.slice(0, 3));
    }
    
    // Test 4: Test backend endpoint for 84-item assessments
    console.log('\n📋 Step 4: Testing 84-item assessment filtering...');
    const response84 = await fetch(`http://localhost:3000/api/accounts/colleges/assessment-names?college=${encodeURIComponent(testCollege)}&assessmentType=ryff_84`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response84.ok) {
      console.error('❌ Failed to fetch 84-item assessments:', response84.status, await response84.text());
      return;
    }
    
    const response84Data = await response84.json();
    const assessments84 = response84Data.assessmentNames || [];
    console.log('✅ 84-item assessments found:', assessments84.length);
    console.log('📝 Raw response:', response84Data);
    if (assessments84.length > 0) {
      console.log('📝 Sample 84-item assessments:', assessments84.slice(0, 3));
    }
    
    // Test 5: Test without assessment type filter (should return all)
    console.log('\n📋 Step 5: Testing without assessment type filter...');
    const responseAll = await fetch(`http://localhost:3000/api/accounts/colleges/assessment-names?college=${encodeURIComponent(testCollege)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!responseAll.ok) {
      console.error('❌ Failed to fetch all assessments:', responseAll.status, await responseAll.text());
      return;
    }
    
    const responseAllData = await responseAll.json();
    const assessmentsAll = responseAllData.assessmentNames || [];
    console.log('✅ All assessments found:', assessmentsAll.length);
    console.log('📝 Raw response:', responseAllData);
    
    // Test 6: Verify filtering logic
    console.log('\n📋 Step 6: Verifying filtering logic...');
    
    const total42and84 = assessments42.length + assessments84.length;
    console.log(`🔍 42-item: ${assessments42.length}, 84-item: ${assessments84.length}, Total filtered: ${total42and84}`);
    console.log(`🔍 All assessments: ${assessmentsAll.length}`);
    
    if (total42and84 <= assessmentsAll.length) {
      console.log('✅ Filtering logic appears correct - filtered results are subset of all results');
    } else {
      console.log('⚠️ Warning: Filtered results exceed total - check for duplicates or logic issues');
    }
    
    // Test 7: Check for assessment type consistency
    console.log('\n📋 Step 7: Checking assessment type consistency...');
    
    // Check if 42-item assessments actually have ryff_42 type
    if (assessments42.length > 0) {
      const sample42Assessment = assessments42[0];
      const { data: check42, error: error42 } = await supabase
        .from('college_scores')
        .select('assessment_type')
        .eq('college_name', testCollege)
        .eq('assessment_name', sample42Assessment)
        .limit(1);
      
      if (!error42 && check42.length > 0) {
        console.log(`✅ Sample 42-item assessment "${sample42Assessment}" has type: ${check42[0].assessment_type}`);
      }
    }
    
    // Check if 84-item assessments actually have ryff_84 type
    if (assessments84.length > 0) {
      const sample84Assessment = assessments84[0];
      const { data: check84, error: error84 } = await supabase
        .from('college_scores')
        .select('assessment_type')
        .eq('college_name', testCollege)
        .eq('assessment_name', sample84Assessment)
        .limit(1);
      
      if (!error84 && check84.length > 0) {
        console.log(`✅ Sample 84-item assessment "${sample84Assessment}" has type: ${check84[0].assessment_type}`);
      }
    }
    
    console.log('\n🎉 Assessment Type Filtering Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   • College tested: ${testCollege}`);
    console.log(`   • 42-item assessments: ${assessments42.length}`);
    console.log(`   • 84-item assessments: ${assessments84.length}`);
    console.log(`   • Total assessments: ${assessmentsAll.length}`);
    console.log(`   • Filtering working: ${total42and84 <= assessmentsAll.length ? '✅ YES' : '❌ NO'}`);
    
    // Test 8: Frontend simulation test
    console.log('\n📋 Step 8: Simulating frontend flow...');
    console.log('🔄 Simulating user selecting 42-item filter and navigating to college detail...');
    
    // This simulates what happens when user clicks on a college with 42-item filter
    const frontendAssessmentType = '42-item';
    const dbAssessmentType = frontendAssessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
    
    const frontendResponse = await fetch(`http://localhost:3000/api/accounts/colleges/assessment-names?college=${encodeURIComponent(testCollege)}&assessmentType=${dbAssessmentType}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (frontendResponse.ok) {
       const frontendResponseData = await frontendResponse.json();
       const frontendAssessments = frontendResponseData.assessmentNames || [];
       console.log(`✅ Frontend simulation: ${frontendAssessments.length} assessments returned for ${frontendAssessmentType} filter`);
       
       if (frontendAssessments.length === assessments42.length) {
          console.log('✅ Frontend simulation matches direct API test - filtering is working correctly!');
        } else {
          console.log('⚠️ Frontend simulation results differ from direct API test');
        }
     }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAssessmentTypeFiltering();