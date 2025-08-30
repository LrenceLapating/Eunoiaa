require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAssessmentNameFix() {
  console.log('🧪 Testing assessment name fix...');
  
  try {
    // 1. Verify current state - should have no "General Assessment" records
    console.log('\n📊 Step 1: Verifying current state...');
    const { data: currentRecords, error: currentError } = await supabase
      .from('college_scores')
      .select('assessment_name')
      .eq('assessment_name', 'General Assessment');
    
    if (currentError) {
      console.error('Error checking current state:', currentError);
      return;
    }
    
    console.log(`Current "General Assessment" records: ${currentRecords.length}`);
    if (currentRecords.length === 0) {
      console.log('✅ Good! No "General Assessment" records found.');
    } else {
      console.log('⚠️ Warning: Still have "General Assessment" records.');
    }
    
    // 2. Test the backend validation - should reject requests without assessmentName
    console.log('\n🔒 Step 2: Testing backend validation...');
    
    try {
      const response = await fetch('http://localhost:3000/api/accounts/colleges/compute-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          assessmentType: 'ryff_42'
          // Note: intentionally NOT including assessmentName
        })
      });
      
      const result = await response.json();
      
      if (response.status === 400 && !result.success) {
        console.log('✅ Backend validation working! Request rejected:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${result.error}`);
      } else {
        console.log('❌ Backend validation failed! Request was accepted:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Result:`, result);
      }
    } catch (error) {
      console.error('Error testing backend validation:', error.message);
    }
    
    // 3. Test with empty assessmentName - should also be rejected
    console.log('\n🔒 Step 3: Testing with empty assessmentName...');
    
    try {
      const response = await fetch('http://localhost:3000/api/accounts/colleges/compute-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          assessmentType: 'ryff_42',
          assessmentName: ''
        })
      });
      
      const result = await response.json();
      
      if (response.status === 400 && !result.success) {
        console.log('✅ Empty assessmentName validation working! Request rejected:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${result.error}`);
      } else {
        console.log('❌ Empty assessmentName validation failed! Request was accepted:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Result:`, result);
      }
    } catch (error) {
      console.error('Error testing empty assessmentName validation:', error.message);
    }
    
    // 4. Test with valid assessmentName - should work (but we won't actually run it to avoid creating test data)
    console.log('\n✅ Step 4: Valid assessmentName test...');
    console.log('Skipping actual execution to avoid creating test data.');
    console.log('A request with valid assessmentName should work normally.');
    
    // 5. Verify that existing legitimate assessments still have their scores
    console.log('\n📊 Step 5: Verifying legitimate assessment scores...');
    const { data: legitimateScores, error: legitError } = await supabase
      .from('college_scores')
      .select('assessment_name')
      .neq('assessment_name', 'General Assessment');
    
    if (legitError) {
      console.error('Error checking legitimate scores:', legitError);
    } else {
      const scoreCounts = {};
      legitimateScores.forEach(score => {
        scoreCounts[score.assessment_name] = (scoreCounts[score.assessment_name] || 0) + 1;
      });
      
      console.log('Legitimate assessment scores still present:');
      Object.keys(scoreCounts).forEach(assessmentName => {
        console.log(`   - ${assessmentName}: ${scoreCounts[assessmentName]} records`);
      });
    }
    
    // 6. Test the college scores API to ensure it still works
    console.log('\n🔍 Step 6: Testing college scores API...');
    
    try {
      const response = await fetch('http://localhost:3000/api/accounts/colleges/scores?assessmentType=ryff_42');
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ College scores API working!');
        console.log(`   Found ${result.colleges?.length || 0} colleges`);
        if (result.colleges && result.colleges.length > 0) {
          console.log(`   Sample college: ${result.colleges[0].name}`);
        }
      } else {
        console.log('❌ College scores API issue:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Result:`, result);
      }
    } catch (error) {
      console.error('Error testing college scores API:', error.message);
    }
    
    console.log('\n✅ Assessment name fix testing completed!');
    
  } catch (error) {
    console.error('❌ Error in testing process:', error);
  }
}

// Run the test
testAssessmentNameFix()
  .then(() => {
    console.log('\n🎉 Testing process finished!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Testing process failed:', error);
    process.exit(1);
  });