require('dotenv').config();
const express = require('express');
const { supabase } = require('./config/database');

// Simulate the endpoint logic
async function testAssessmentFiltersEndpoint() {
  console.log('Testing /api/accounts/colleges/:collegeName/assessment-filters endpoint...');
  
  const collegeName = 'CCS';
  const assessmentType = 'ryff_42';
  
  console.log(`\nTesting for college: ${collegeName}, assessment type: ${assessmentType}`);
  
  try {
    // First, check if there are any bulk assessments for this college and assessment type
    let assessmentQuery = supabase
      .from('bulk_assessments')
      .select('id, assessment_name')
      .contains('target_colleges', [collegeName])
      .neq('status', 'archived');
    
    // Filter by assessment type if specified
    if (assessmentType && assessmentType !== 'all') {
      assessmentQuery = assessmentQuery.eq('assessment_type', assessmentType);
    }
    
    const { data: bulkAssessments, error: assessmentError } = await assessmentQuery;
    
    if (assessmentError) throw assessmentError;
    
    console.log(`Found ${bulkAssessments.length} bulk assessments`);
    
    // If no assessments found, return empty arrays
    if (!bulkAssessments || bulkAssessments.length === 0) {
      const response = {
        success: true,
        data: {
          yearLevels: [],
          sections: [],
          totalAssessments: 0
        }
      };
      console.log('\n=== API RESPONSE (No assessments) ===');
      console.log(JSON.stringify(response, null, 2));
      return;
    }
    
    // Get all students from the target college to determine available year levels and sections
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('year_level, section')
      .eq('college', collegeName)
      .eq('status', 'active')
      .not('year_level', 'is', null)
      .not('section', 'is', null);
    
    if (studentsError) throw studentsError;
    
    console.log(`Found ${students.length} active students in ${collegeName}`);
    
    // Extract unique year levels and sections
    const yearLevelsSet = new Set();
    const sectionsSet = new Set();
    
    students.forEach(student => {
      if (student.year_level) {
        yearLevelsSet.add(student.year_level);
      }
      if (student.section) {
        sectionsSet.add(student.section);
      }
    });
    
    // Convert to sorted arrays
    const availableYearLevels = Array.from(yearLevelsSet).sort((a, b) => a - b);
    const availableSections = Array.from(sectionsSet).sort();
    
    const response = {
      success: true,
      data: {
        yearLevels: availableYearLevels,
        sections: availableSections,
        totalAssessments: bulkAssessments.length
      }
    };
    
    console.log('\n=== API RESPONSE ===');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n=== SAMPLE BULK ASSESSMENTS ===');
    bulkAssessments.slice(0, 3).forEach(assessment => {
      console.log(`- ${assessment.assessment_name}`);
    });
    
  } catch (error) {
    console.error('Error in endpoint:', error);
    const errorResponse = {
      success: false,
      error: 'Failed to fetch assessment filters'
    };
    console.log('\n=== ERROR RESPONSE ===');
    console.log(JSON.stringify(errorResponse, null, 2));
  }
}

testAssessmentFiltersEndpoint();