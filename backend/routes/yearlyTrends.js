const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { cacheManager } = require('../config/redis');
const router = express.Router();

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  AT_RISK_DATA: 1800,      // 30 minutes
  IMPROVEMENT_DATA: 1800,   // 30 minutes
  AVAILABLE_YEARS: 3600     // 1 hour
};

// Cache key generators
const getCacheKey = {
  atRisk: (dimension, year) => `yearly_trends:at_risk:${dimension}:${year}`,
  improvement: (dimension, year) => `yearly_trends:improvement:${dimension}:${year}`,
  availableYears: () => 'yearly_trends:available_years'
};

// Ryff dimension mappings
const RYFF_DIMENSIONS = {
  autonomy: 'autonomy',
  environmental_mastery: 'environmentalMastery',
  personal_growth: 'personalGrowth',
  positive_relations: 'positiveRelations',
  purpose_in_life: 'purposeInLife',
  self_acceptance: 'selfAcceptance'
};

// Risk thresholds for each dimension (scores below these are considered at-risk)
const RISK_THRESHOLDS = {
  autonomy: 30,
  environmental_mastery: 30,
  personal_growth: 30,
  positive_relations: 30,
  purpose_in_life: 30,
  self_acceptance: 30
};

/**
 * Retry utility for Supabase queries with exponential backoff
 */
async function retrySupabaseQuery(queryFunction, description, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting ${description} (attempt ${attempt}/${maxRetries})`);
      const result = await queryFunction();
      
      if (result.error) {
        throw new Error(`Supabase error: ${result.error.message}`);
      }
      
      console.log(`✅ Successfully completed ${description}`);
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for ${description}:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`🚫 All ${maxRetries} attempts failed for ${description}`);
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

/**
 * GET /api/yearly-trends/at-risk
 * Get yearly at-risk trends by college and dimension
 */
router.get('/at-risk', async (req, res) => {
  try {
    const { dimension = 'overall', year } = req.query;
    
    console.log(`🔍 Fetching at-risk trends for dimension: ${dimension}, year: ${year || 'all years'}`);

    // Get current and historical assessment data
    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year) : currentYear;
    
    // Check cache first
    const cacheKey = getCacheKey.atRisk(dimension, targetYear);
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Cache hit for at-risk trends: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    console.log(`🔍 Cache miss for at-risk trends: ${cacheKey}`);
    
    // Proceed with database queries if not cached
    
    // Query historical data from ryff_history table as primary source (permanent data)
    const historicalData = await retrySupabaseQuery(
      () => supabaseAdmin
        .from('ryff_history')
        .select(`
          id,
          student_id,
          scores,
          at_risk_dimensions,
          completed_at,
          archived_at
        `)
        .gte('completed_at', `${targetYear}-01-01`)
        .lt('completed_at', `${targetYear + 1}-01-01`),
      'historical data from ryff_history'
    );

    // Query current assessments from assessments_42items and assessments_84items tables
    const current42Data = await retrySupabaseQuery(
      () => supabaseAdmin
        .from('assessments_42items')
        .select(`
          id,
          student_id,
          scores,
          at_risk_dimensions,
          completed_at
        `)
        .gte('completed_at', `${targetYear}-01-01`)
        .lt('completed_at', `${targetYear + 1}-01-01`),
      'current 42-item assessments'
    );

    const current84Data = await retrySupabaseQuery(
      () => supabaseAdmin
        .from('assessments_84items')
        .select(`
          id,
          student_id,
          scores,
          at_risk_dimensions,
          completed_at
        `)
        .gte('completed_at', `${targetYear}-01-01`)
        .lt('completed_at', `${targetYear + 1}-01-01`),
      'current 84-item assessments'
    );

    // Combine current data from both tables
    const currentData = {
      data: [
        ...(current42Data.data || []),
        ...(current84Data.data || [])
      ],
      error: current42Data.error || current84Data.error
    };

    if (currentData.error) {
      console.error('Error fetching current assessments:', currentData.error);
      return res.status(500).json({ success: false, message: 'Failed to fetch current assessments' });
    }

    if (historicalData.error) {
      console.error('Error fetching historical assessments:', historicalData.error);
      return res.status(500).json({ success: false, message: 'Failed to fetch historical assessments' });
    }

    // Get all unique student IDs from both sources
    const allStudentIds = [
      ...new Set([
        ...(historicalData.data || []).map(item => item.student_id),
        ...(currentData.data || []).map(item => item.student_id)
      ])
    ];

    // Get student data for all assessments
    const studentsData = allStudentIds.length > 0 ? await supabaseAdmin
      .from('students')
      .select('id, college')
      .in('id', allStudentIds) : { data: [] };

    // Create student lookup map
    const studentLookup = {};
    if (studentsData.data) {
      studentsData.data.forEach(student => {
        studentLookup[student.id] = student;
      });
    }

    // Prioritize historical data (permanent) over current data
    const allAssessments = [
      // Historical data first (permanent and can't be removed)
      ...(historicalData.data || []).map(item => ({
        ...item,
        college: studentLookup[item.student_id]?.college || 'Unknown',
        source: 'history'
      })),
      // Current data only if not already in historical data
      ...(currentData.data || []).filter(current => 
        !(historicalData.data || []).some(hist => 
          hist.student_id === current.student_id && 
          new Date(hist.completed_at).getTime() === new Date(current.completed_at).getTime()
        )
      ).map(item => ({
        ...item,
        college: studentLookup[item.student_id]?.college || 'Unknown',
        source: 'current'
      }))
    ];

    // College name normalization mapping
    const collegeMapping = {
      'College of Computer Studies': 'CCS',
      'College of Engineering': 'COE',
      'Business Administration': 'CBA',
      'Nursing College': 'CN'
    };
    
    // Function to normalize college names
    const normalizeCollege = (college) => {
      return collegeMapping[college] || college;
    };
    
    // Get all unique colleges from assessments and normalize them
    const allColleges = [...new Set(allAssessments.map(assessment => 
      normalizeCollege(assessment.college)
    ))].filter(college => college !== 'Unknown').sort();
    
    // Calculate at-risk counts by college
    const collegeStats = {};
    
    // Initialize college stats for all colleges found
    allColleges.forEach(college => {
      collegeStats[college] = {
        totalStudents: 0,
        atRiskCount: 0,
        atRiskPercentage: 0
      };
    });

    // Process each assessment
    allAssessments.forEach(assessment => {
      const college = normalizeCollege(assessment.college);
      if (!allColleges.includes(college)) return;

      collegeStats[college].totalStudents++;

      let isAtRisk = false;

      if (dimension === 'overall') {
        // Check if student has any at-risk dimensions
        const atRiskDimensions = assessment.at_risk_dimensions || [];
        isAtRisk = Array.isArray(atRiskDimensions) && atRiskDimensions.length > 0;
      } else {
        // Check specific dimension
        const scores = assessment.scores || {};
        const dimensionScore = scores[dimension];
        if (dimensionScore !== null && dimensionScore !== undefined) {
          isAtRisk = dimensionScore < RISK_THRESHOLDS[dimension];
        }
      }

      if (isAtRisk) {
        collegeStats[college].atRiskCount++;
      }
    });

    // Calculate percentages and sort by at-risk count
    const trendData = allColleges.map(college => {
      const stats = collegeStats[college];
      const percentage = stats.totalStudents > 0 
        ? (stats.atRiskCount / stats.totalStudents * 100).toFixed(1)
        : 0;
      
      return {
        college,
        totalStudents: stats.totalStudents,
        atRiskCount: stats.atRiskCount,
        atRiskPercentage: parseFloat(percentage)
      };
    }).sort((a, b) => b.atRiskCount - a.atRiskCount);

    console.log(`✅ At-risk trends calculated for ${dimension}:`, trendData);

    const responseData = {
      dimension,
      year: targetYear,
      trends: trendData,
      summary: {
        highestRiskCollege: trendData[0]?.college || 'N/A',
        highestRiskCount: trendData[0]?.atRiskCount || 0,
        totalAssessments: allAssessments.length
      }
    };
    
    // Cache the result
    await cacheManager.set(cacheKey, responseData, CACHE_TTL.AT_RISK_DATA);
    console.log(`💾 Cached at-risk trends: ${cacheKey}`);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error in at-risk trends endpoint:', error);
    
    // Check if it's a network/connection error
    const isNetworkError = error.message?.includes('fetch failed') || 
                          error.message?.includes('ECONNREFUSED') ||
                          error.message?.includes('ENOTFOUND') ||
                          error.code === 'ECONNREFUSED' ||
                          error.code === 'ENOTFOUND';
    
    if (isNetworkError) {
      console.warn('Network connectivity issue detected in at-risk trends');
      res.status(503).json({
        success: false,
        message: 'Database connection temporarily unavailable. Please try again later.',
        error: 'NETWORK_ERROR'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching at-risk trends',
        error: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * GET /api/yearly-trends/improvement
 * Get yearly improvement trends by college and dimension
 */
router.get('/improvement', async (req, res) => {
  try {
    const { dimension = 'overall', year } = req.query;
    
    console.log(`🔍 Fetching improvement trends for dimension: ${dimension}, year: ${year || 'current year'}`);

    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year) : currentYear;
    const previousYear = targetYear - 1;
    
    // Check cache first
    const cacheKey = getCacheKey.improvement(dimension, targetYear);
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Cache hit for improvement trends: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    console.log(`🔍 Cache miss for improvement trends: ${cacheKey}`);
    
    // Get assessments for both years from ryff_history (primary source) and assessments tables (current)
    const [currentYearHistoryData, previousYearHistoryData, currentYearCurrentData] = await Promise.all([
      // Current year from history table
      retrySupabaseQuery(
        () => supabaseAdmin
          .from('ryff_history')
          .select(`
            student_id,
            scores,
            overall_score,
            completed_at
          `)
          .gte('completed_at', `${targetYear}-01-01`)
          .lt('completed_at', `${targetYear + 1}-01-01`),
        'current year history data'
      ),
      
      // Previous year from history table
      retrySupabaseQuery(
        () => supabaseAdmin
          .from('ryff_history')
          .select(`
            student_id,
            scores,
            overall_score,
            completed_at
          `)
          .gte('completed_at', `${previousYear}-01-01`)
          .lt('completed_at', `${previousYear + 1}-01-01`),
        'previous year history data'
      ),
        
      // Current year from current tables (without join)
      Promise.all([
        retrySupabaseQuery(
          () => supabaseAdmin
            .from('assessments_42items')
            .select(`
              student_id,
              scores,
              overall_score,
              completed_at
            `)
            .gte('completed_at', `${targetYear}-01-01`)
            .lt('completed_at', `${targetYear + 1}-01-01`),
          'current year 42-item assessments'
        ),
        retrySupabaseQuery(
          () => supabaseAdmin
            .from('assessments_84items')
            .select(`
              student_id,
              scores,
              overall_score,
              completed_at
            `)
            .gte('completed_at', `${targetYear}-01-01`)
            .lt('completed_at', `${targetYear + 1}-01-01`),
          'current year 84-item assessments'
        )
      ]).then(([current42Data, current84Data]) => ({
        data: [...(current42Data.data || []), ...(current84Data.data || [])],
        error: current42Data.error || current84Data.error
      }))
    ]);

    if (currentYearHistoryData.error || previousYearHistoryData.error || currentYearCurrentData.error) {
      console.error('Error fetching assessment data:', 
        currentYearHistoryData.error || previousYearHistoryData.error || currentYearCurrentData.error);
      return res.status(500).json({ success: false, message: 'Failed to fetch assessment data' });
    }

    // Combine current year data (prioritize history over current)
    const currentYearData = [
      ...(currentYearHistoryData.data || []),
      ...(currentYearCurrentData.data || []).filter(current => 
        !(currentYearHistoryData.data || []).some(hist => 
          hist.student_id === current.student_id && 
          new Date(hist.completed_at).getTime() === new Date(current.completed_at).getTime()
        )
      )
    ];

    const previousYearData = previousYearHistoryData.data || [];

    // Get all unique student IDs from both years
    const allStudentIds = [
      ...new Set([
        ...currentYearData.map(item => item.student_id),
        ...previousYearData.map(item => item.student_id)
      ])
    ];

    // Get student data for all assessments
    const studentsData = allStudentIds.length > 0 ? await supabaseAdmin
      .from('students')
      .select('id, college')
      .in('id', allStudentIds) : { data: [] };

    // Create student lookup map
    const studentLookup = {};
    if (studentsData.data) {
      studentsData.data.forEach(student => {
        studentLookup[student.id] = student;
      });
    }

    // College name normalization mapping
    const collegeMapping = {
      'College of Computer Studies': 'CCS',
      'College of Engineering': 'COE',
      'Business Administration': 'CBA',
      'Nursing College': 'CN'
    };
    
    // Function to normalize college names
    const normalizeCollege = (college) => {
      return collegeMapping[college] || college;
    };
    
    // Get all unique colleges from both years and normalize them
    const allColleges = [...new Set([
      ...currentYearData.map(assessment => 
        normalizeCollege(studentLookup[assessment.student_id]?.college)
      ),
      ...previousYearData.map(assessment => 
        normalizeCollege(studentLookup[assessment.student_id]?.college)
      )
    ])].filter(college => college && college !== 'Unknown').sort();
    
    // Calculate average scores by college for both years
    const collegeAverages = {};
    
    allColleges.forEach(college => {
      collegeAverages[college] = {
        currentYear: { total: 0, count: 0, average: 0 },
        previousYear: { total: 0, count: 0, average: 0 },
        improvement: 0,
        improvementPercentage: 0
      };
    });

    // Process current year data
    currentYearData.forEach(assessment => {
      const college = normalizeCollege(studentLookup[assessment.student_id]?.college);
      if (!allColleges.includes(college)) return;

      let score = 0;
      if (dimension === 'overall') {
        score = assessment.overall_score || 0;
      } else {
        const scores = assessment.scores || {};
        score = scores[dimension] || 0;
      }

      collegeAverages[college].currentYear.total += score;
      collegeAverages[college].currentYear.count++;
    });

    // Process previous year data
    previousYearData.forEach(assessment => {
      const college = normalizeCollege(studentLookup[assessment.student_id]?.college);
      if (!allColleges.includes(college)) return;

      let score = 0;
      if (dimension === 'overall') {
        score = assessment.overall_score || 0;
      } else {
        const scores = assessment.scores || {};
        score = scores[dimension] || 0;
      }

      collegeAverages[college].previousYear.total += score;
      collegeAverages[college].previousYear.count++;
    });

    // Calculate averages and improvements
    const improvementData = allColleges.map(college => {
      const data = collegeAverages[college];
      
      // Calculate averages
      data.currentYear.average = data.currentYear.count > 0 
        ? data.currentYear.total / data.currentYear.count 
        : 0;
      data.previousYear.average = data.previousYear.count > 0 
        ? data.previousYear.total / data.previousYear.count 
        : 0;
      
      // Calculate improvement
      data.improvement = data.currentYear.average - data.previousYear.average;
      data.improvementPercentage = data.previousYear.average > 0 
        ? (data.improvement / data.previousYear.average * 100)
        : 0;
      
      return {
        college,
        currentYearAverage: parseFloat(data.currentYear.average.toFixed(2)),
        previousYearAverage: parseFloat(data.previousYear.average.toFixed(2)),
        improvement: parseFloat(data.improvement.toFixed(2)),
        improvementPercentage: parseFloat(data.improvementPercentage.toFixed(1)),
        currentYearCount: data.currentYear.count,
        previousYearCount: data.previousYear.count
      };
    }).sort((a, b) => b.improvement - a.improvement);

    console.log(`✅ Improvement trends calculated for ${dimension}:`, improvementData);

    const responseData = {
      dimension,
      currentYear: targetYear,
      previousYear,
      trends: improvementData,
      summary: {
        mostImprovedCollege: improvementData[0]?.college || 'N/A',
        highestImprovement: improvementData[0]?.improvement || 0,
        totalCurrentAssessments: currentYearData.length,
        totalPreviousAssessments: previousYearData.length
      }
    };
    
    // Cache the result
    await cacheManager.set(cacheKey, responseData, CACHE_TTL.IMPROVEMENT_DATA);
    console.log(`💾 Cached improvement trends: ${cacheKey}`);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error in improvement trends endpoint:', error);
    
    // Check if it's a network/connection error
    const isNetworkError = error.message?.includes('fetch failed') || 
                          error.message?.includes('ECONNREFUSED') ||
                          error.message?.includes('ENOTFOUND') ||
                          error.code === 'ECONNREFUSED' ||
                          error.code === 'ENOTFOUND';
    
    if (isNetworkError) {
      console.warn('Network connectivity issue detected in improvement trends');
      res.status(503).json({
        success: false,
        message: 'Database connection temporarily unavailable. Please try again later.',
        error: 'NETWORK_ERROR'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching improvement trends',
        error: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * GET /api/yearly-trends/available-years
 * Get list of available years for trend analysis
 */
router.get('/available-years', async (req, res) => {
  try {
    console.log('🔍 Fetching available years for trend analysis');

    // Check cache first
    const cacheKey = getCacheKey.availableYears();
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Cache hit for available years: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    console.log(`🔍 Cache miss for available years: ${cacheKey}`);

    // Get years from both current and historical data
    const [current42Years, current84Years, historicalYears] = await Promise.all([
      supabaseAdmin
        .from('assessments_42items')
        .select('completed_at')
        .not('completed_at', 'is', null),
      
      supabaseAdmin
        .from('assessments_84items')
        .select('completed_at')
        .not('completed_at', 'is', null),
      
      supabaseAdmin
        .from('ryff_history')
        .select('completed_at')
        .not('completed_at', 'is', null)
    ]);

    const allYears = new Set();
    
    // Extract years from current 42-item data
    if (current42Years.data) {
      current42Years.data.forEach(item => {
        if (item.completed_at) {
          const year = new Date(item.completed_at).getFullYear();
          allYears.add(year);
        }
      });
    }
    
    // Extract years from current 84-item data
    if (current84Years.data) {
      current84Years.data.forEach(item => {
        if (item.completed_at) {
          const year = new Date(item.completed_at).getFullYear();
          allYears.add(year);
        }
      });
    }
    
    // Extract years from historical data
    if (historicalYears.data) {
      historicalYears.data.forEach(item => {
        if (item.completed_at) {
          const year = new Date(item.completed_at).getFullYear();
          allYears.add(year);
        }
      });
    }

    const availableYears = Array.from(allYears).sort((a, b) => b - a);
    
    console.log('✅ Available years:', availableYears);

    const responseData = {
      years: availableYears,
      currentYear: new Date().getFullYear()
    };
    
    // Cache the result
    await cacheManager.set(cacheKey, responseData, CACHE_TTL.AVAILABLE_YEARS);
    console.log(`💾 Cached available years: ${cacheKey}`);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching available years:', error);
    
    // Check if it's a network/connection error
    const isNetworkError = error.message?.includes('fetch failed') || 
                          error.message?.includes('ECONNREFUSED') ||
                          error.message?.includes('ENOTFOUND') ||
                          error.code === 'ECONNREFUSED' ||
                          error.code === 'ENOTFOUND';
    
    if (isNetworkError) {
      console.warn('Network connectivity issue detected in available years');
      res.status(503).json({
        success: false,
        message: 'Database connection temporarily unavailable. Please try again later.',
        error: 'NETWORK_ERROR'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching available years',
        error: 'INTERNAL_ERROR'
      });
    }
  }
});

module.exports = router;