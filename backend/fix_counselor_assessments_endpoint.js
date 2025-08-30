const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fixed version of the counselor assessments endpoint
async function getAssessmentResults(req, res) {
  try {
    const { page = 1, limit = 20, riskLevel, assessmentType, college } = req.query;
    const offset = (page - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    console.log(`🎯 Fetching assessments with filters:`, { college, assessmentType, riskLevel });

    let assessments = [];
    
    // Step 1: Get students from the specified college (if college filter is provided)
    let studentIds = [];
    if (college) {
      console.log(`🔍 Getting students from college: ${college}`);
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, id_number, name, college, year_level, section, email')
        .eq('college', college)
        .eq('status', 'active');
      
      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch students'
        });
      }
      
      studentIds = students.map(s => s.id);
      console.log(`✅ Found ${studentIds.length} students in ${college}`);
      
      if (studentIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // Step 2: Fetch assessments based on assessment type
    let allAssessments = [];
    
    if (!assessmentType || assessmentType === 'ryff_42') {
      console.log('🔍 Fetching 42-item assessments...');
      let query = supabase.from('assessments_42items').select('*');
      
      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds);
      }
      
      const { data: assessments42, error: error42 } = await query;
      
      if (error42) {
        console.error('Error fetching 42-item assessments:', error42);
      } else {
        console.log(`✅ Found ${assessments42?.length || 0} 42-item assessments`);
        if (assessments42) {
          allAssessments = allAssessments.concat(assessments42.map(a => ({
            ...a,
            assessment_name: '42-Item Ryff Assessment'
          })));
        }
      }
    }
    
    if (!assessmentType || assessmentType === 'ryff_84') {
      console.log('🔍 Fetching 84-item assessments...');
      let query = supabaseAdmin.from('assessments_84items').select('*');
      
      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds);
      }
      
      const { data: assessments84, error: error84 } = await query;
      
      if (error84) {
        console.error('Error fetching 84-item assessments:', error84);
      } else {
        console.log(`✅ Found ${assessments84?.length || 0} 84-item assessments`);
        if (assessments84) {
          allAssessments = allAssessments.concat(assessments84.map(a => ({
            ...a,
            assessment_name: '84-Item Ryff Assessment'
          })));
        }
      }
    }
    
    console.log(`📊 Total assessments found: ${allAssessments.length}`);
    
    if (allAssessments.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // Step 3: Get student data for all assessments
    const allStudentIds = [...new Set(allAssessments.map(a => a.student_id))];
    console.log(`🔍 Getting student data for ${allStudentIds.length} unique students`);
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, id_number, name, college, year_level, section, email')
      .in('id', allStudentIds)
      .eq('status', 'active');
    
    if (studentsError) {
      console.error('Error fetching student details:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student details'
      });
    }
    
    // Step 4: Combine assessment and student data
    const enrichedAssessments = allAssessments.map(assessment => {
      const student = students.find(s => s.id === assessment.student_id);
      
      if (!student) {
        console.warn(`⚠️ Student not found for assessment ${assessment.id}`);
        return null;
      }
      
      return {
        ...assessment,
        student: student,
        assignment: {
          id: assessment.assignment_id || 'N/A',
          assigned_at: assessment.created_at,
          completed_at: assessment.completed_at,
          bulk_assessment_id: 'direct-fetch',
          bulk_assessment: {
            assessment_name: assessment.assessment_name,
            assessment_type: assessment.assessment_type
          }
        }
      };
    }).filter(Boolean); // Remove null entries
    
    console.log(`✅ Successfully enriched ${enrichedAssessments.length} assessments`);

    // Step 5: Apply additional filters
    let filteredAssessments = enrichedAssessments;
    
    if (riskLevel) {
      const beforeRiskFilter = filteredAssessments.length;
      filteredAssessments = filteredAssessments.filter(a => a.risk_level === riskLevel);
      console.log(`🔍 Risk level filter (${riskLevel}): ${beforeRiskFilter} → ${filteredAssessments.length}`);
    }
    
    // Step 6: Sort by completion date
    filteredAssessments.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    
    // Step 7: Apply pagination
    const totalCount = filteredAssessments.length;
    const paginatedAssessments = filteredAssessments.slice(offset, offset + limitNum);
    
    console.log(`📄 Pagination: ${paginatedAssessments.length} of ${totalCount} assessments (page ${page})`);

    return res.json({
      success: true,
      data: paginatedAssessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error in fixed assessment results:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Test the fixed function
async function testFixedEndpoint() {
  console.log('=== TESTING FIXED COUNSELOR ASSESSMENTS ENDPOINT ===\n');
  
  const mockReq = {
    query: {
      college: 'College of Arts and Sciences',
      page: 1,
      limit: 10
    }
  };
  
  const mockRes = {
    json: (data) => {
      console.log('📋 RESPONSE:');
      console.log(`- Success: ${data.success}`);
      console.log(`- Total assessments: ${data.data?.length || 0}`);
      console.log(`- Total count: ${data.pagination?.total || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log('\n📊 Sample assessment:');
        const sample = data.data[0];
        console.log(`- Overall Score: ${sample.overall_score}`);
        console.log(`- Risk Level: ${sample.risk_level}`);
        console.log(`- Student: ${sample.student?.name}`);
        console.log(`- College: ${sample.student?.college}`);
        console.log(`- Assessment: ${sample.assignment?.bulk_assessment?.assessment_name}`);
      }
      
      return data;
    },
    status: (code) => ({
      json: (data) => {
        console.log(`❌ ERROR ${code}:`, data);
        return data;
      }
    })
  };
  
  await getAssessmentResults(mockReq, mockRes);
}

testFixedEndpoint();