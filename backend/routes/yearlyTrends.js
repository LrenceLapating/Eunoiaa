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
// Risk thresholds by assessment type - scores at or below these values are considered "at risk"
const RISK_THRESHOLDS = {
  ryff_42: {
    autonomy: 18,
    environmental_mastery: 18,
    personal_growth: 18,
    positive_relations: 18,
    purpose_in_life: 18,
    self_acceptance: 18
  },
  ryff_84: {
    autonomy: 36,
    environmental_mastery: 36,
    personal_growth: 36,
    positive_relations: 36,
    purpose_in_life: 36,
    self_acceptance: 36
  }
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
    const { dimension = 'autonomy', year, assessmentType = '42-item' } = req.query;
    
    console.log(`🔍 Fetching at-risk trends for dimension: ${dimension}, year: ${year || 'all years'}, assessmentType: ${assessmentType}`);

    // Get current and historical assessment data
    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(year) : currentYear;
    
    // Check cache first - include assessmentType in cache key
    const cacheKey = `${getCacheKey.atRisk(dimension, targetYear)}_${assessmentType}`;
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
          archived_at,
          assessment_type
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

    // Combine current data from both tables with proper assessment type marking
    const currentData = {
      data: [
        ...(current42Data.data || []).map(item => ({ ...item, assessment_type: '42-item' })),
        ...(current84Data.data || []).map(item => ({ ...item, assessment_type: '84-item' }))
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
    let allAssessments = [
      // Historical data first (permanent and can't be removed)
      ...(historicalData.data || []).map(item => ({
        ...item,
        college: studentLookup[item.student_id]?.college || 'Unknown',
        source: 'history',
        assessment_type: item.assessment_type // Keep original assessment_type from ryff_history
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
        source: 'current',
        assessment_type: item.assessment_type
      }))
    ];

    console.log(`🔍 Total assessments collected: ${allAssessments.length}`);
    console.log(`🔍 Historical data count: ${(historicalData.data || []).length}`);
    console.log(`🔍 Current data count: ${(currentData.data || []).length}`);
    console.log(`🔍 Raw historical data sample:`, (historicalData.data || []).slice(0, 3));
    console.log(`🔍 Assessment types in collection:`, allAssessments.map(a => ({ type: a.assessment_type, source: a.source, student: a.student_id })));

    // Filter by assessment type if specified
    if (assessmentType && assessmentType !== 'all') {
      console.log(`🔍 Before filtering: ${allAssessments.length} assessments`);
      console.log(`🔍 Assessment types before filtering:`, allAssessments.map(a => a.assessment_type));
      
      allAssessments = allAssessments.filter(assessment => {
        if (assessmentType === '42-item') {
          return assessment.assessment_type === '42-item' || assessment.assessment_type === 'historical' || assessment.assessment_type === 'ryff_42';
        } else if (assessmentType === '84-item') {
          return assessment.assessment_type === '84-item' || assessment.assessment_type === 'ryff_84';
        }
        return true;
      });
      console.log(`📊 Filtered assessments by type ${assessmentType}: ${allAssessments.length} assessments`);
      console.log(`🔍 Assessment types after filtering:`, allAssessments.map(a => a.assessment_type));
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
          // Get the appropriate risk threshold based on assessment type
          const assessmentTypeKey = (assessment.assessment_type === '84-item' || assessment.assessment_type === 'ryff_84') ? 'ryff_84' : 'ryff_42';
          const riskThreshold = RISK_THRESHOLDS[assessmentTypeKey][dimension];
          isAtRisk = dimensionScore <= riskThreshold;
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
    const { dimension = 'autonomy', year } = req.query;
    
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
/**
 * Get overall risk count by years
 */
router.get('/overall-risk', async (req, res) => {
  try {
    const { college, assessmentType = '42-item' } = req.query;
    console.log('🔍 Fetching overall risk count by years', { college, assessmentType });

    // Check cache first - include assessmentType in cache key
    const cacheKey = `overall_risk_${college || 'all'}_${assessmentType}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Cache hit for overall risk: ${cacheKey}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    console.log(`🔍 Cache miss for overall risk: ${cacheKey}`);

    // Build query for overall risk data - use manual joins since foreign keys don't exist
    let query42 = supabaseAdmin
      .from('assessments_42items')
      .select(`
        completed_at, 
        overall_score,
        student_id
      `)
      .not('completed_at', 'is', null)
      .not('overall_score', 'is', null)
      .not('student_id', 'is', null);

    let query84 = supabaseAdmin
      .from('assessments_84items')
      .select(`
        completed_at, 
        overall_score,
        student_id
      `)
      .not('completed_at', 'is', null)
      .not('overall_score', 'is', null)
      .not('student_id', 'is', null);

    // For ryff_history, get student_id and risk_level to join manually
    let queryHistory = supabaseAdmin
      .from('ryff_history')
      .select(`
        completed_at, 
        overall_score,
        risk_level,
        student_id
      `)
      .not('completed_at', 'is', null)
      .not('student_id', 'is', null);

    const [data42, data84, dataHistory] = await Promise.all([
      retrySupabaseQuery(() => query42, 'assessments_42items overall risk'),
      retrySupabaseQuery(() => query84, 'assessments_84items overall risk'),
      retrySupabaseQuery(() => queryHistory, 'ryff_history overall risk')
    ]);

    // Get all unique student IDs
    const allStudentIds = new Set();
    [...(data42.data || []), ...(data84.data || []), ...(dataHistory.data || [])].forEach(item => {
      if (item.student_id) allStudentIds.add(item.student_id);
    });

    // Fetch student data for college information
    let studentsQuery = supabaseAdmin
      .from('students')
      .select('id, college')
      .in('id', Array.from(allStudentIds))
      .not('college', 'is', null);

    // Apply college filter if specified
    if (college && college !== 'all') {
      studentsQuery = studentsQuery.eq('college', college);
    }

    const studentsData = await retrySupabaseQuery(() => studentsQuery, 'students data for overall risk');
    
    // Create a map of student_id to college
    const studentCollegeMap = {};
    (studentsData.data || []).forEach(student => {
      studentCollegeMap[student.id] = student.college;
    });

    // Combine all data with manual college mapping and assessment type
    let allData = [
      // Transform assessments_42items data to include college from manual join
      ...(data42.data || []).map(item => ({
        completed_at: item.completed_at,
        overall_score: item.overall_score,
        college: studentCollegeMap[item.student_id],
        assessment_type: '42-item'
      })).filter(item => item.college), // Only include items with valid college
      // Transform assessments_84items data to include college from manual join
      ...(data84.data || []).map(item => ({
        completed_at: item.completed_at,
        overall_score: item.overall_score,
        college: studentCollegeMap[item.student_id],
        assessment_type: '84-item'
      })).filter(item => item.college), // Only include items with valid college
      // Transform ryff_history data to include college from manual join
      ...(dataHistory.data || []).map(item => ({
        completed_at: item.completed_at,
        overall_score: item.overall_score,
        risk_level: item.risk_level,
        college: studentCollegeMap[item.student_id],
        assessment_type: item.assessment_type || 'historical'
      })).filter(item => item.college) // Only include items with valid college
    ];

    // Filter by assessment type if specified
    if (assessmentType && assessmentType !== 'all') {
      allData = allData.filter(item => {
        if (assessmentType === '42-item') {
          return item.assessment_type === '42-item' || item.assessment_type === 'historical' || item.assessment_type === 'ryff_42';
        } else if (assessmentType === '84-item') {
          return item.assessment_type === '84-item' || item.assessment_type === 'ryff_84';
        }
        return true;
      });
      console.log(`📊 Filtered overall risk data by type ${assessmentType}: ${allData.length} items`);
    }

    // Group by year and count at-risk students
    const yearlyRiskCounts = {};
    
    allData.forEach(item => {
      if (item.completed_at) {
        const year = new Date(item.completed_at).getFullYear();
        
        if (!yearlyRiskCounts[year]) {
          yearlyRiskCounts[year] = { year, atRiskCount: 0, totalCount: 0 };
        }
        
        yearlyRiskCounts[year].totalCount++;
        
        // For ryff_history data, use risk_level column ('high' means at-risk)
        // For assessments_42items and assessments_84items, use proper overall_score thresholds
        if (item.risk_level) {
          // This is from ryff_history - 'high' means at-risk
          if (item.risk_level === 'high') {
            yearlyRiskCounts[year].atRiskCount++;
          }
        } else if (item.overall_score !== null) {
          // This is from assessments tables - use proper overall score thresholds based on assessment type
          // Overall score thresholds: ryff_42: ≤111 (at-risk), ryff_84: ≤223 (at-risk)
          let overallScoreThreshold = 111; // Default for 42-item
          if (item.assessment_type === '84-item') {
            overallScoreThreshold = 223; // Correct threshold for 84-item
          }
          
          if (item.overall_score <= overallScoreThreshold) {
            yearlyRiskCounts[year].atRiskCount++;
          }
        }
      }
    });

    // Convert to array and sort by year
    const result = Object.values(yearlyRiskCounts)
      .sort((a, b) => a.year - b.year);
    
    console.log('✅ Overall risk data by years:', result);

    // Cache the result
    await cacheManager.set(cacheKey, result, CACHE_TTL.AT_RISK_DATA);
    console.log(`💾 Cached overall risk data: ${cacheKey}`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching overall risk data:', error);
    
    // Check if it's a network/connection error
    const isNetworkError = error.message?.includes('fetch failed') || 
                          error.message?.includes('ECONNREFUSED') ||
                          error.message?.includes('ENOTFOUND') ||
                          error.code === 'ECONNREFUSED' ||
                          error.code === 'ENOTFOUND';
    
    if (isNetworkError) {
      console.warn('Network connectivity issue detected in overall risk');
      res.status(503).json({
        success: false,
        message: 'Database connection temporarily unavailable. Please try again later.',
        error: 'NETWORK_ERROR'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching overall risk data',
        error: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
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

// GET /api/yearly-trends/colleges-with-assessments - Get colleges that have assessment records
router.get('/colleges-with-assessments', async (req, res) => {
  try {
    console.log('🔍 Fetching colleges with assessment records');

    // Check cache first
    const cacheKey = 'colleges_with_assessments';
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Cache hit for colleges with assessments: ${cacheKey}`);
      return res.json({
        success: true,
        colleges: cachedData,
        cached: true
      });
    }
    
    console.log(`🔍 Cache miss for colleges with assessments: ${cacheKey}`);

    // Get colleges from all assessment tables using manual joins
    const [colleges42, colleges84, collegesHistory] = await Promise.all([
      retrySupabaseQuery(() => 
        supabaseAdmin
          .from('assessments_42items')
          .select('student_id')
          .not('completed_at', 'is', null)
          .not('student_id', 'is', null), 
        'assessments_42items colleges'
      ),
      retrySupabaseQuery(() => 
        supabaseAdmin
          .from('assessments_84items')
          .select('student_id')
          .not('completed_at', 'is', null)
          .not('student_id', 'is', null), 
        'assessments_84items colleges'
      ),
      retrySupabaseQuery(() => 
        supabaseAdmin
          .from('ryff_history')
          .select('student_id')
          .not('completed_at', 'is', null)
          .not('student_id', 'is', null), 
        'ryff_history colleges'
      )
    ]);

    // Get all unique student IDs from assessments
    const assessmentStudentIds = new Set();
    
    // Add student IDs from 42-item assessments
    (colleges42.data || []).forEach(item => {
      if (item.student_id) assessmentStudentIds.add(item.student_id);
    });
    
    // Add student IDs from 84-item assessments
    (colleges84.data || []).forEach(item => {
      if (item.student_id) assessmentStudentIds.add(item.student_id);
    });
    
    // Add student IDs from ryff_history
    (collegesHistory.data || []).forEach(item => {
      if (item.student_id) assessmentStudentIds.add(item.student_id);
    });

    // Fetch students with colleges for these student IDs
    const studentsWithColleges = await retrySupabaseQuery(() => 
      supabaseAdmin
        .from('students')
        .select('id, college')
        .in('id', Array.from(assessmentStudentIds))
        .not('college', 'is', null), 
      'students with colleges'
    );

    // Combine and deduplicate colleges
    const allColleges = new Set();
    
    // Add colleges from students who have assessments
    (studentsWithColleges.data || []).forEach(student => {
      if (student.college) allColleges.add(student.college);
    });

    // College code to full name mapping
    const collegeMapping = {
      'CCS': 'College of Computing and Information Sciences',
      'CABE': 'College of Architecture and Built Environment',
      'CEA': 'College of Engineering and Architecture',
      'CN': 'College of Nursing',
      'CAH': 'College of Arts and Humanities',
      'CPC': 'College of Public Communication',
      'CMBS': 'College of Management and Business Studies'
    };

    // Convert to array and format
    const result = [
      { name: 'all', code: 'all', fullName: 'All Colleges', totalUsers: 0 },
      ...Array.from(allColleges).map(code => ({
        name: code,
        code: code,
        fullName: collegeMapping[code] || code,
        totalUsers: 1 // Placeholder since we know they have assessments
      }))
    ];
    
    console.log('✅ Colleges with assessments:', result);

    // Cache the result
    await cacheManager.set(cacheKey, result, CACHE_TTL.AVAILABLE_YEARS);
    console.log(`💾 Cached colleges with assessments: ${cacheKey}`);

    res.json({
      success: true,
      colleges: result
    });

  } catch (error) {
    console.error('Error fetching colleges with assessments:', error);
    
    // Check if it's a network/connection error
    const isNetworkError = error.message?.includes('fetch failed') || 
                          error.message?.includes('ECONNREFUSED') ||
                          error.message?.includes('ENOTFOUND') ||
                          error.code === 'ECONNREFUSED' ||
                          error.code === 'ENOTFOUND';
    
    if (isNetworkError) {
      console.warn('Network connectivity issue detected in colleges with assessments');
      res.status(503).json({
        success: false,
        message: 'Database connection temporarily unavailable. Please try again later.',
        error: 'NETWORK_ERROR'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching colleges with assessments',
        error: 'INTERNAL_ERROR'
      });
    }
  }
});

module.exports = router;