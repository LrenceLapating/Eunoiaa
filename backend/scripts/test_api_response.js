const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIResponse() {
  try {
    console.log('🔍 Testing backend API response for assessment types...');
    
    // Simulate the same query that the frontend makes to /api/counselor-assessments/history
    const { data: historyData, error: historyError } = await supabase
      .from('ryff_history')
      .select(`
        id,
        original_id,
        student_id,
        assessment_type,
        responses,
        scores,
        overall_score,
        risk_level,
        at_risk_dimensions,
        assignment_id,
        completed_at,
        created_at,
        updated_at,
        archived_at,
        completion_time
      `)
      .order('archived_at', { ascending: false })
      .order('completed_at', { ascending: false })
      .limit(10);
    
    if (historyError) {
      console.error('❌ Error fetching history data:', historyError.message);
      return;
    }
    
    console.log('\n📊 Raw API Response Data:');
    historyData.forEach((assessment, index) => {
      console.log(`\n${index + 1}. Assessment ID: ${assessment.id}`);
      console.log(`   assessment_type: '${assessment.assessment_type}'`);
      console.log(`   Response count: ${Object.keys(assessment.responses || {}).length}`);
      console.log(`   Completed at: ${assessment.completed_at}`);
    });
    
    // Test the frontend mapping logic
    console.log('\n🔄 Testing Frontend Mapping Logic:');
    
    const assessmentTypeMapping = {
      'ryff_42': '42-item',
      'ryff_84': '84-item'
    };
    
    historyData.forEach((assessment, index) => {
      const backendType = assessment.assessment_type;
      const mappedType = assessmentTypeMapping[backendType];
      const finalType = mappedType || '42-item'; // This is the problematic fallback
      
      console.log(`\n${index + 1}. Backend Type: '${backendType}'`);
      console.log(`   Mapped Type: '${mappedType}'`);
      console.log(`   Final Type: '${finalType}'`);
      console.log(`   Mapping Success: ${mappedType ? '✅' : '❌'}`);
      
      if (!mappedType) {
        console.log(`   ⚠️  ISSUE: Backend type '${backendType}' not found in mapping!`);
      }
    });
    
    // Check for any null or undefined assessment_type values
    console.log('\n🔍 Checking for null/undefined assessment_type values...');
    
    const { data: nullTypes, error: nullError } = await supabase
      .from('ryff_history')
      .select('id, assessment_type')
      .is('assessment_type', null)
      .limit(5);
    
    if (nullError) {
      console.error('❌ Error checking null types:', nullError.message);
    } else if (nullTypes && nullTypes.length > 0) {
      console.log('⚠️  Found records with null assessment_type:');
      console.table(nullTypes);
    } else {
      console.log('✅ No null assessment_type values found');
    }
    
    // Test the exact same transformation that the backend API does
    console.log('\n🔄 Testing Backend API Transformation:');
    
    const transformedData = historyData.map(assessment => {
      return {
        id: assessment.id,
        assessment_type: assessment.assessment_type,
        assignment: {
          bulk_assessment: {
            assessment_name: assessment.assessment_type === 'ryff_42' ? '42-Item Ryff Assessment' : '84-Item Ryff Assessment',
            assessment_type: assessment.assessment_type
          }
        }
      };
    });
    
    console.log('\n📋 Backend API Transformed Data:');
    transformedData.forEach((item, index) => {
      console.log(`\n${index + 1}. ID: ${item.id}`);
      console.log(`   assessment_type: '${item.assessment_type}'`);
      console.log(`   bulk_assessment.assessment_type: '${item.assignment.bulk_assessment.assessment_type}'`);
      console.log(`   assessment_name: '${item.assignment.bulk_assessment.assessment_name}'`);
    });
    
  } catch (error) {
    console.error('❌ Error testing API response:', error.message);
  }
}

testAPIResponse();