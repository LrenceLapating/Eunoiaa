const { supabaseAdmin } = require('../config/database');

// Test the history API endpoint logic
async function testHistoryAPI() {
  console.log('🔍 Testing History API Logic...');
  
  try {
    // Get some sample data from ryff_history
    const { data: historyData, error } = await supabaseAdmin
      .from('ryff_history')
      .select('id, student_id, assessment_type, completed_at')
      .limit(5)
      .order('archived_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching history data:', error.message);
      return;
    }
    
    console.log(`✅ Found ${historyData?.length || 0} historical records`);
    
    // Simulate the exact transformation logic from the API
    const transformedData = historyData.map(assessment => {
      return {
        id: assessment.id,
        student_id: assessment.student_id,
        assessment_type: assessment.assessment_type,
        completed_at: assessment.completed_at,
        assignment: {
          bulk_assessment: {
            assessment_name: assessment.assessment_type === 'ryff_42' ? '42-Item Ryff Assessment' : '84-Item Ryff Assessment',
            assessment_type: assessment.assessment_type
          }
        }
      };
    });
    
    console.log('\n📊 Transformed Data:');
    transformedData.forEach((item, index) => {
      console.log(`${index + 1}. DB Type: '${item.assessment_type}' → Name: '${item.assignment.bulk_assessment.assessment_name}'`);
    });
    
    // Check for any 84-item assessments
    const ryff84Items = transformedData.filter(item => item.assessment_type === 'ryff_84');
    console.log(`\n🎯 Found ${ryff84Items.length} 84-item assessments`);
    
    if (ryff84Items.length > 0) {
      console.log('✅ 84-item assessments should show as "84-Item Ryff Assessment"');
      ryff84Items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.assignment.bulk_assessment.assessment_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testHistoryAPI();