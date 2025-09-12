// Test what the frontend actually receives from the history API
const express = require('express');
const { supabaseAdmin } = require('../config/database');

async function testFrontendAPI() {
  console.log('🔍 Testing Frontend API Call to /history endpoint...');
  
  try {
    // Simulate the exact API call the frontend makes
    const { data: historyData, error } = await supabaseAdmin
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
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching history data:', error.message);
      return;
    }
    
    console.log(`✅ Found ${historyData?.length || 0} historical records`);
    
    // Simulate the exact transformation the backend does
    const transformedData = historyData.map(assessment => {
      return {
        ...assessment,
        student: {
          id: assessment.student_id,
          name: 'Test Student',
          college: 'Test College',
          section: 'Test Section'
        },
        assignment: {
          id: assessment.assignment_id || 'N/A',
          assigned_at: assessment.created_at,
          completed_at: assessment.completed_at,
          bulk_assessment_id: 'historical-data',
          bulk_assessment: {
            assessment_name: assessment.assessment_type === 'ryff_42' ? '42-Item Ryff Assessment' : '84-Item Ryff Assessment',
            assessment_type: assessment.assessment_type
          }
        }
      };
    });
    
    console.log('\n📊 API Response Structure:');
    transformedData.forEach((item, index) => {
      console.log(`\n${index + 1}. Assessment ID: ${item.id}`);
      console.log(`   assessment_type: '${item.assessment_type}'`);
      console.log(`   assignment.bulk_assessment.assessment_name: '${item.assignment.bulk_assessment.assessment_name}'`);
      console.log(`   assignment.bulk_assessment.assessment_type: '${item.assignment.bulk_assessment.assessment_type}'`);
    });
    
    // Check specifically for 84-item assessments
    const ryff84Items = transformedData.filter(item => item.assessment_type === 'ryff_84');
    console.log(`\n🎯 84-item assessments in response: ${ryff84Items.length}`);
    
    if (ryff84Items.length > 0) {
      console.log('\n✅ 84-item assessment details:');
      ryff84Items.forEach((item, index) => {
        console.log(`   ${index + 1}. Name: '${item.assignment.bulk_assessment.assessment_name}'`);
        console.log(`      Type: '${item.assignment.bulk_assessment.assessment_type}'`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testFrontendAPI();