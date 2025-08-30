require('dotenv').config();
const { supabase } = require('./config/database');

async function testBulkAssessmentCreation() {
  console.log('🧪 Testing Bulk Assessment Creation with Target Data...');
  console.log('=' .repeat(60));
  
  try {
    // Simulate the payload that would come from the updated frontend
    const testPayload = {
      assessmentName: 'Test Assessment - Target Columns Population',
      assessmentType: 'ryff_42',
      targetType: 'college',
      targetColleges: ['CCS', 'KUPAL'],
      targetYearLevels: [3, 4], // Simulating year levels from frontend
      targetSections: ['BSIT-4A', 'BSCS-3B', 'BCSS-5A'], // Simulating sections from frontend
      customMessage: 'Test message for target columns population',
      scheduleOption: 'now'
    };
    
    console.log('📤 Test Payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('');
    
    // Simulate the bulk assessment creation logic from bulkAssessments.js
    const counselorId = 'b7216f8e-57a9-4e10-84aa-e584405fb1f4'; // Real counselor ID
    const finalScheduledDate = new Date().toISOString();
    
    console.log('🔄 Creating bulk assessment...');
    
    // Create bulk assessment record (simulating the backend logic)
    const { data: bulkAssessment, error: bulkError } = await supabase
      .from('bulk_assessments')
      .insert({
        counselor_id: counselorId,
        assessment_name: testPayload.assessmentName,
        assessment_type: testPayload.assessmentType,
        target_type: testPayload.targetType,
        target_colleges: testPayload.targetColleges || [],
        target_year_levels: testPayload.targetYearLevels || [], // This should now be populated!
        target_sections: testPayload.targetSections || [], // This should now be populated!
        custom_message: testPayload.customMessage,
        scheduled_date: finalScheduledDate,
        status: 'sent'
      })
      .select()
      .single();

    if (bulkError) {
      console.error('❌ Error creating bulk assessment:', bulkError);
      return;
    }

    console.log('✅ Bulk assessment created successfully!');
    console.log('📊 Created Assessment Details:');
    console.log(`   ID: ${bulkAssessment.id}`);
    console.log(`   Name: ${bulkAssessment.assessment_name}`);
    console.log(`   Type: ${bulkAssessment.assessment_type}`);
    console.log(`   Target Colleges: ${JSON.stringify(bulkAssessment.target_colleges)}`);
    console.log(`   Target Year Levels: ${JSON.stringify(bulkAssessment.target_year_levels)}`);
    console.log(`   Target Sections: ${JSON.stringify(bulkAssessment.target_sections)}`);
    console.log('');
    
    // Verify the data was stored correctly
    console.log('🔍 Verifying stored data...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('bulk_assessments')
      .select('id, assessment_name, target_year_levels, target_sections, target_colleges')
      .eq('id', bulkAssessment.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }
    
    console.log('✅ Verification Results:');
    console.log(`   Target Year Levels: ${JSON.stringify(verifyData.target_year_levels)}`);
    console.log(`   Target Sections: ${JSON.stringify(verifyData.target_sections)}`);
    console.log(`   Target Colleges: ${JSON.stringify(verifyData.target_colleges)}`);
    
    // Check if the columns are properly populated
    const yearLevelsPopulated = verifyData.target_year_levels && verifyData.target_year_levels.length > 0;
    const sectionsPopulated = verifyData.target_sections && verifyData.target_sections.length > 0;
    
    console.log('');
    console.log('📈 Population Status:');
    console.log(`   Year Levels: ${yearLevelsPopulated ? '✅ POPULATED' : '❌ EMPTY'}`);
    console.log(`   Sections: ${sectionsPopulated ? '✅ POPULATED' : '❌ EMPTY'}`);
    
    if (yearLevelsPopulated && sectionsPopulated) {
      console.log('');
      console.log('🎉 SUCCESS! Target columns are now being populated correctly!');
      console.log('   - target_year_levels: Contains actual year levels from frontend');
      console.log('   - target_sections: Contains actual sections from frontend');
      console.log('   - This will fix the dropdown filtering issue!');
    } else {
      console.log('');
      console.log('❌ ISSUE: Target columns are still empty');
      console.log('   - Check if frontend is sending targetYearLevels and targetSections');
      console.log('   - Verify backend is properly handling these fields');
    }
    
    // Test the assessment filters endpoint with this new data
    console.log('');
    console.log('🔍 Testing assessment filters endpoint with new data...');
    
    for (const college of testPayload.targetColleges) {
      console.log(`\n📍 Testing filters for college: ${college}`);
      
      const { data: filterData, error: filterError } = await supabase
        .from('bulk_assessments')
        .select('target_year_levels, target_sections')
        .contains('target_colleges', [college])
        .neq('status', 'archived');
        
      if (filterError) {
        console.error(`❌ Error fetching filters for ${college}:`, filterError);
        continue;
      }
      
      // Extract unique year levels and sections
      const yearLevels = new Set();
      const sections = new Set();
      
      filterData.forEach(assessment => {
        if (assessment.target_year_levels) {
          assessment.target_year_levels.forEach(year => yearLevels.add(year));
        }
        if (assessment.target_sections) {
          assessment.target_sections.forEach(section => sections.add(section));
        }
      });
      
      console.log(`   Available Year Levels: [${Array.from(yearLevels).sort((a, b) => a - b).join(', ')}]`);
      console.log(`   Available Sections: [${Array.from(sections).sort().join(', ')}]`);
    }
    
    // Clean up - delete the test assessment
    console.log('');
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('bulk_assessments')
      .delete()
      .eq('id', bulkAssessment.id);
      
    if (deleteError) {
      console.error('❌ Error deleting test assessment:', deleteError);
    } else {
      console.log('✅ Test assessment deleted successfully');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkAssessmentCreation();