const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyCounselorSession } = require('../middleware/sessionManager');
const { getAtRiskDimensions } = require('../utils/ryffScoring');
const { cacheManager } = require('../config/redis');

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Retry utility for Supabase queries with exponential backoff
 */
async function retrySupabaseQuery(queryFunction, description = 'query', maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFunction();
      
      if (result.error) {
        throw new Error(`Supabase error: ${result.error.message}`);
      }
      
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

// Cache TTL constants (in seconds) - Reduced for faster refresh
const CACHE_TTL = {
  DEMOGRAPHIC_DATA: 300,       // 5 minutes (was 30 minutes)
  COLLEGE_BREAKDOWN: 300       // 5 minutes (was 30 minutes)
};

// Cache key generators
const getCacheKey = {
  genderTrends: (gender) => `demographic_trends:gender_trends:${gender}`,
  collegeBreakdown: (schoolYear) => `demographic_trends:college_breakdown:${schoolYear}`
};

// Ryff dimensions for analysis
const RYFF_DIMENSIONS = [
  'autonomy',
  'environmental_mastery', 
  'personal_growth',
  'positive_relations',
  'purpose_in_life',
  'self_acceptance'
];

/**
 * Get demographic risk trends data for male/female students by school year
 * Analyzes risk levels and at-risk dimensions by gender
 */
router.get('/gender-trends', verifyCounselorSession, async (req, res) => {
  try {
    const { gender = 'all', assessmentType = 'all' } = req.query;
    
    console.log(`🎯 Fetching demographic risk trends for gender: ${gender}, assessmentType: ${assessmentType}`);

    // Check cache first - include assessmentType in cache key
    const cacheKey = getCacheKey.genderTrends(`${gender}_${assessmentType}`);
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Define school years to analyze (2 years for faster performance)
    const currentYear = new Date().getFullYear();
    const schoolYears = [
      { label: `${currentYear+1}-${currentYear+2}`, startDate: `${currentYear+1}-08-01`, endDate: `${currentYear+2}-07-31` },
      { label: `${currentYear+2}-${currentYear+3}`, startDate: `${currentYear+2}-08-01`, endDate: `${currentYear+3}-07-31` }
    ];

    // First, check if we have any data at all in the database
    const { data: allStudents, error: allStudentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, college, gender, created_at')
      .eq('status', 'active');
    
    const { data: allRyffHistory, error: allRyffError } = await supabaseAdmin
      .from('ryff_history')
      .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score, assessment_type')
      .not('scores', 'is', null)
      .not('risk_level', 'is', null);

    console.log(`📊 Database check - Students: ${allStudents?.length || 0}, Ryff History: ${allRyffHistory?.length || 0}`);
    
    // FIXED: Always use flexible data fetching to ensure we get existing data
    const hasDataButNoMatches = true; // Always use flexible fetching

    const demographicData = [];

    for (const schoolYear of schoolYears) {
      // Fetch all active students (we'll filter by assessment data later)
      const students = await retrySupabaseQuery(async () => {
        const { data, error } = await supabaseAdmin
          .from('students')
          .select('id, gender, college')
          .eq('status', 'active');
        
        if (error) throw error;
        return data || [];
      });

      if (!students.length) {
        demographicData.push({
          schoolYear: schoolYear.label,
          totalStudents: 0,
          assessmentsTaken: 0,
          riskAnalysis: {
            byGender: {
              Male: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 },
              Female: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 },
              Other: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 }
            },
            mostAtRiskGender: null,
            atRiskDimensions: {
              byGender: {
                Male: {},
                Female: {},
                Other: {}
              },
              overall: {}
            }
          }
        });
        continue;
      }

      const studentIds = students.map(s => s.id);

      // Fetch assessments with risk data from current and historical tables
      const [assessments42, assessments84, historicalAssessments] = await Promise.all([
        // From assessments_42items (current data) - get all data for these students
        supabaseAdmin
          .from('assessments_42items')
          .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score')
          .in('student_id', studentIds)
          .not('scores', 'is', null)
          .not('risk_level', 'is', null),
        
        // From assessments_84items (current data) - get all data for these students
        supabaseAdmin
          .from('assessments_84items')
          .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score')
          .in('student_id', studentIds)
          .not('scores', 'is', null)
          .not('risk_level', 'is', null),
        
        // From ryff_history (historical data) - get all data for these students
        supabaseAdmin
          .from('ryff_history')
          .select('id, student_id, scores, risk_level, at_risk_dimensions, completed_at, overall_score, assessment_type')
          .in('student_id', studentIds)
          .not('scores', 'is', null)
          .not('risk_level', 'is', null)
      ]);

      // Combine all assessments (current and historical)
      let allAssessments = [
        ...(assessments42.data || []).map(a => ({ ...a, assessment_type: 'ryff_42' })),
        ...(assessments84.data || []).map(a => ({ ...a, assessment_type: 'ryff_84' })),
        ...(historicalAssessments.data || []).map(a => ({ ...a, assessment_type: a.assessment_type }))
      ];

      // Filter by assessment type if specified
      if (assessmentType !== 'all') {
        const targetType = assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
        allAssessments = allAssessments.filter(assessment => assessment.assessment_type === targetType);
      }

      // Group assessments by student to analyze all their assessments in this period
      const studentAssessments = {};
      allAssessments.forEach(assessment => {
        const studentId = assessment.student_id;
        if (!studentAssessments[studentId]) {
          studentAssessments[studentId] = [];
        }
        studentAssessments[studentId].push(assessment);
      });

      // Step 3: Analyze risk by gender
      const riskAnalysis = {
        byGender: {
          Male: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 },
          Female: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 }
        },
        atRiskDimensions: {
          byGender: {
            Male: {},
            Female: {}
          },
          overall: {}
        }
      };

      // Initialize dimension counters
      RYFF_DIMENSIONS.forEach(dimension => {
        riskAnalysis.atRiskDimensions.byGender.Male[dimension] = 0;
        riskAnalysis.atRiskDimensions.byGender.Female[dimension] = 0;
        riskAnalysis.atRiskDimensions.overall[dimension] = 0;
      });

      // Analyze each student's risk level and dimensions
      students.forEach(student => {
        const studentGender = student.gender === 'Male' || student.gender === 'Female' ? student.gender : 'Female';
        const assessments = studentAssessments[student.id] || [];
        
        // Count total students by gender
        riskAnalysis.byGender[studentGender].total++;

        if (assessments.length > 0) {
          // Check if student has any at-risk assessments
          let hasAtRiskAssessment = false;
          const atRiskDimensionsSet = new Set();

          assessments.forEach(assessment => {
            // Check multiple conditions to determine if student is at-risk
            const isAtRiskByDimensions = assessment.at_risk_dimensions && assessment.at_risk_dimensions.length > 0;
            const isAtRiskByLevel = assessment.risk_level === 'high' || assessment.risk_level === 'at-risk';
            // Use correct thresholds: 111 for ryff_42, 223 for ryff_84
            const assessmentType = assessment.assessment_type || 'ryff_42';
            const scoreThreshold = assessmentType === 'ryff_84' ? 223 : 111;
            const isAtRiskByScore = assessment.overall_score && assessment.overall_score <= scoreThreshold;
            
            if (isAtRiskByDimensions || isAtRiskByLevel || isAtRiskByScore) {
              hasAtRiskAssessment = true;
              
              // Add at-risk dimensions if available
              if (assessment.at_risk_dimensions && assessment.at_risk_dimensions.length > 0) {
                assessment.at_risk_dimensions.forEach(dimension => {
                  atRiskDimensionsSet.add(dimension);
                });
              } else {
                // If no specific dimensions but student is at-risk, add all dimensions as potentially at-risk
                RYFF_DIMENSIONS.forEach(dimension => {
                  atRiskDimensionsSet.add(dimension);
                });
              }
            }
          });
          
          console.log(`📊 Student ${student.id} (${studentGender}) analysis:`, {
            assessmentCount: assessments.length,
            hasAtRiskAssessment,
            atRiskDimensionsCount: atRiskDimensionsSet.size,
            atRiskDimensions: Array.from(atRiskDimensionsSet)
          });

          if (hasAtRiskAssessment) {
            // Count this student as at-risk (only once, regardless of how many assessments)
            riskAnalysis.byGender[studentGender].atRisk++;
            
            // Count unique at-risk dimensions by gender
          atRiskDimensionsSet.forEach(dimension => {
            if (riskAnalysis.atRiskDimensions.byGender[studentGender][dimension] !== undefined) {
              riskAnalysis.atRiskDimensions.byGender[studentGender][dimension]++;
              riskAnalysis.atRiskDimensions.overall[dimension]++;
            }
          });
          } else {
            // Student has assessments but no at-risk dimensions
            riskAnalysis.byGender[studentGender].healthy++;
          }
        } else {
          // Student has no assessments - consider as healthy for now
          riskAnalysis.byGender[studentGender].healthy++;
        }
      });

      // Calculate risk percentages and find most at-risk gender
      let mostAtRiskGender = null;
      let highestRiskPercentage = 0;

      Object.keys(riskAnalysis.byGender).forEach(genderKey => {
        const genderData = riskAnalysis.byGender[genderKey];
        if (genderData.total > 0) {
          genderData.riskPercentage = ((genderData.atRisk / genderData.total) * 100).toFixed(1);
          
          if (parseFloat(genderData.riskPercentage) > highestRiskPercentage) {
            highestRiskPercentage = parseFloat(genderData.riskPercentage);
            mostAtRiskGender = genderKey;
          }
        }
      });

      riskAnalysis.mostAtRiskGender = mostAtRiskGender;

      demographicData.push({
        schoolYear: schoolYear.label,
        totalStudents: students.length,
        assessmentsTaken: allAssessments.length,
        riskAnalysis
      });
    }

    // Calculate overall summary
    const overallSummary = {
      totalStudents: 0,
      assessmentsTaken: 0,
      overallRiskAnalysis: {
        byGender: {
          Male: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 },
          Female: { total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0 }
        },
        mostAtRiskGender: null,
        topAtRiskDimensions: []
      }
    };

    // Aggregate data across all years
    demographicData.forEach(yearData => {
      overallSummary.totalStudents += yearData.totalStudents;
      overallSummary.assessmentsTaken += yearData.assessmentsTaken;
      
      Object.keys(yearData.riskAnalysis.byGender).forEach(genderKey => {
        const yearGenderData = yearData.riskAnalysis.byGender[genderKey];
        
        // Ensure the gender key exists in overallSummary (safety check)
        if (!overallSummary.overallRiskAnalysis.byGender[genderKey]) {
          overallSummary.overallRiskAnalysis.byGender[genderKey] = {
            total: 0, atRisk: 0, moderate: 0, healthy: 0, riskPercentage: 0
          };
        }
        
        const summaryGenderData = overallSummary.overallRiskAnalysis.byGender[genderKey];
        
        summaryGenderData.total += yearGenderData.total;
        summaryGenderData.atRisk += yearGenderData.atRisk;
        summaryGenderData.moderate += yearGenderData.moderate;
        summaryGenderData.healthy += yearGenderData.healthy;
      });
    });

    // Calculate overall risk percentages and find most at-risk gender
    let overallMostAtRiskGender = null;
    let overallHighestRiskPercentage = 0;

    Object.keys(overallSummary.overallRiskAnalysis.byGender).forEach(genderKey => {
      const genderData = overallSummary.overallRiskAnalysis.byGender[genderKey];
      if (genderData.total > 0) {
        genderData.riskPercentage = ((genderData.atRisk / genderData.total) * 100).toFixed(1);
        
        if (parseFloat(genderData.riskPercentage) > overallHighestRiskPercentage) {
          overallHighestRiskPercentage = parseFloat(genderData.riskPercentage);
          overallMostAtRiskGender = genderKey;
        }
      }
    });

    overallSummary.overallRiskAnalysis.mostAtRiskGender = overallMostAtRiskGender;

    // Calculate top at-risk dimensions across all data
    const dimensionTotals = {};
    RYFF_DIMENSIONS.forEach(dimension => {
      dimensionTotals[dimension] = 0;
    });

    demographicData.forEach(yearData => {
      Object.values(yearData.riskAnalysis.atRiskDimensions.overall).forEach((count, index) => {
        const dimension = RYFF_DIMENSIONS[index];
        if (dimension) {
          dimensionTotals[dimension] += count;
        }
      });
    });

    overallSummary.overallRiskAnalysis.topAtRiskDimensions = Object.entries(dimensionTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([dimension, count]) => ({ dimension, count }));

    // Prepare response data
    const responseData = {
      trends: demographicData,
      summary: overallSummary,
      metadata: {
        generatedAt: new Date().toISOString(),
        filterApplied: gender,
        schoolYearsAnalyzed: schoolYears.length,
        analysisType: 'risk-based'
      }
    };

    // Cache the result
    await cacheManager.set(cacheKey, responseData, CACHE_TTL.DEMOGRAPHIC_DATA);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching demographic risk trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demographic risk trends data',
      error: error.message
    });
  }
});

/**
 * Get detailed breakdown of assessments by gender and college
 */
router.get('/gender-college-breakdown', verifyCounselorSession, async (req, res) => {
  try {
    const { schoolYear, gender = 'all' } = req.query;
    
    if (!schoolYear) {
      return res.status(400).json({
        success: false,
        message: 'School year parameter is required'
      });
    }

    console.log(`🏫 Fetching college breakdown for ${schoolYear}, gender: ${gender}`);

    // Check cache first
    const cacheKey = getCacheKey.collegeBreakdown(`${schoolYear}_${gender}`);
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Cache hit for college breakdown: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    console.log(`🔍 Cache miss for college breakdown: ${cacheKey}`);

    // Parse school year (e.g., "2023-2024")
    const [startYear, endYear] = schoolYear.split('-').map(Number);
    const startDate = `${startYear}-08-01`;
    const endDate = `${endYear}-07-31`;

    // Get students with college and gender info
    let studentsQuery = supabaseAdmin
      .from('students')
      .select('id, name, college, gender, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'active');

    if (gender !== 'all') {
      studentsQuery = studentsQuery.eq('gender', gender);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      throw studentsError;
    }

    // Group by college and gender
    const collegeBreakdown = students.reduce((acc, student) => {
      const college = student.college || 'Unknown';
      const studentGender = student.gender || 'Other';
      
      if (!acc[college]) {
        acc[college] = { Male: 0, Female: 0, Other: 0, total: 0 };
      }
      
      acc[college][studentGender]++;
      acc[college].total++;
      
      return acc;
    }, {});

    // Prepare response data
    const responseData = {
      breakdown: collegeBreakdown,
      schoolYear,
      totalStudents: students.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        filterApplied: gender
      }
    };

    // Cache the result
    await cacheManager.set(cacheKey, responseData, CACHE_TTL.COLLEGE_BREAKDOWN);
    console.log(`💾 Cached college breakdown data: ${cacheKey}`);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching college breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch college breakdown data',
      error: error.message
    });
  }
});

module.exports = router;