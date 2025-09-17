const { supabaseAdmin } = require('../config/database');

/**
 * Get historical college scores - works like getCollegeScores but for archived data
 * This function provides the same interface and logic as getCollegeScores but operates on college_scores_history
 * @param {string} collegeName - Optional: get scores for specific college
 * @param {string} assessmentType - Optional: filter by assessment type (ryff_42 or ryff_84)
 * @param {string} assessmentName - Optional: filter by specific assessment name
 * @param {string} yearLevel - Optional: filter by year level
 * @param {string} section - Optional: filter by section
 * @returns {Object} Historical college scores in the same format as getCollegeScores
 */
async function getHistoricalCollegeScores(collegeName = null, assessmentType = null, assessmentName = null, yearLevel = null, section = null) {
  try {
    console.log('🔍 Getting historical college scores with filters:', {
      collegeName,
      assessmentType,
      assessmentName,
      yearLevel,
      section
    });

    // College name mapping - convert full names to codes for database queries
    const collegeNameMapping = {
      'College of Computing and Information Sciences': 'CCS',
      'College of Architecture and Built Environment': 'CABE',
      'College of Engineering and Architecture': 'CEA',
      'College of Nursing': 'CN'
    };

    // Convert college name to code if it's a full name
    let collegeCode = collegeName;
    if (collegeName && collegeNameMapping[collegeName]) {
      collegeCode = collegeNameMapping[collegeName];
      console.log(`🔄 Mapped college name "${collegeName}" to code "${collegeCode}"`);
    }

    // Build the base query for historical data
    let query = supabaseAdmin
      .from('college_scores_history')
      .select(`
        id,
        college_name,
        dimension_name,
        raw_score,
        student_count,
        assessment_type,
        assessment_name,
        archived_at,
        risk_level,
        last_calculated,
        archive_reason,
        available_year_levels,
        available_sections
      `)
      .order('archived_at', { ascending: false })
      .order('college_name')
      .order('dimension_name');

    // Apply basic filters using the college code
    if (collegeCode) {
      query = query.eq('college_name', collegeCode);
    }
    
    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }
    
    if (assessmentName) {
      query = query.eq('assessment_name', assessmentName);
    }

    const { data: historicalScores, error } = await query;

    if (error) {
      console.error('Error fetching historical college scores:', error);
      throw error;
    }

    if (!historicalScores || historicalScores.length === 0) {
      return {
        success: true,
        colleges: [],
        history: []
      };
    }

    // Apply year level and section filtering if specified
    let filteredScores = historicalScores;
    
    if (yearLevel || section) {
      console.log('🔍 Applying year/section filters to historical data:', { yearLevel, section });
      
      filteredScores = historicalScores.filter(record => {
        let matchesYear = true;
        let matchesSection = true;
        
        // Check year level filter
        if (yearLevel) {
          const availableYears = record.available_year_levels || [];
          const requestedYear = parseInt(yearLevel);
          matchesYear = availableYears.includes(requestedYear);
        }
        
        // Check section filter
        if (section) {
          const availableSections = record.available_sections || [];
          matchesSection = availableSections.includes(section);
        }
        
        return matchesYear && matchesSection;
      });
      
      console.log(`🔍 Filtering result: ${historicalScores.length} -> ${filteredScores.length} records`);
    }

    // Group by assessment_name first, then by college within each assessment
    const assessmentGroups = {};
    
    filteredScores.forEach(score => {
      const assessmentKey = score.assessment_name || 'Unknown Assessment';
      
      if (!assessmentGroups[assessmentKey]) {
        assessmentGroups[assessmentKey] = {
          assessmentName: assessmentKey,
          assessmentType: score.assessment_type,
          archivedAt: score.archived_at,
          lastCalculated: score.last_calculated,
          archiveReason: score.archive_reason,
          colleges: {}
        };
      }
      
      if (!assessmentGroups[assessmentKey].colleges[score.college_name]) {
        assessmentGroups[assessmentKey].colleges[score.college_name] = {
          name: score.college_name,
          dimensions: {},
          studentCount: score.student_count || 0,
          lastCalculated: score.last_calculated,
          availableYearLevels: score.available_year_levels || [],
          availableSections: score.available_sections || []
        };
      }
      
      // Add dimension data
      assessmentGroups[assessmentKey].colleges[score.college_name].dimensions[score.dimension_name] = {
        score: score.raw_score,
        riskLevel: score.risk_level,
        studentCount: score.student_count || 0
      };
      
      // Update student count to the maximum across dimensions
      if (score.student_count > assessmentGroups[assessmentKey].colleges[score.college_name].studentCount) {
        assessmentGroups[assessmentKey].colleges[score.college_name].studentCount = score.student_count;
      }
    });

    // Calculate overall scores and risk distributions for each college in each assessment
    Object.values(assessmentGroups).forEach(assessment => {
      Object.values(assessment.colleges).forEach(college => {
        const dimensions = Object.values(college.dimensions);
        
        // Calculate overall score by summing all dimension scores
        let overallScore = 0;
        dimensions.forEach(dim => {
          overallScore += dim.score || 0;
        });
        college.overallScore = Math.round(overallScore * 100) / 100;
        
        // Calculate risk distribution similar to the original college scoring
        const riskDistribution = {
          healthy: 0,
          moderate: 0,
          at_risk: 0
        };
        
        const totalStudents = college.studentCount || 0;
        
        if (totalStudents > 0) {
          // Count dimensions by risk level
          const dimensionRiskCounts = {
            healthy: 0,
            moderate: 0,
            at_risk: 0
          };
          
          dimensions.forEach(dim => {
            if (dim.riskLevel) {
              const riskKey = dim.riskLevel.replace('-', '_'); // Convert 'at-risk' to 'at_risk'
              if (dimensionRiskCounts.hasOwnProperty(riskKey)) {
                dimensionRiskCounts[riskKey]++;
              }
            }
          });
          
          // Determine overall college risk based on dimension distribution
          const totalDimensions = Object.values(dimensionRiskCounts).reduce((sum, count) => sum + count, 0);
          
          if (totalDimensions > 0) {
            const healthyRatio = dimensionRiskCounts.healthy / totalDimensions;
            const atRiskRatio = dimensionRiskCounts.at_risk / totalDimensions;
            
            // Distribute students based on overall college health
            if (healthyRatio >= 0.6) {
              // Mostly healthy college
              riskDistribution.healthy = Math.round(totalStudents * 0.7);
              riskDistribution.moderate = Math.round(totalStudents * 0.25);
              riskDistribution.at_risk = totalStudents - riskDistribution.healthy - riskDistribution.moderate;
            } else if (atRiskRatio >= 0.4) {
              // High risk college
              riskDistribution.at_risk = Math.round(totalStudents * 0.5);
              riskDistribution.moderate = Math.round(totalStudents * 0.35);
              riskDistribution.healthy = totalStudents - riskDistribution.at_risk - riskDistribution.moderate;
            } else {
              // Moderate risk college
              riskDistribution.moderate = Math.round(totalStudents * 0.5);
              riskDistribution.healthy = Math.round(totalStudents * 0.3);
              riskDistribution.at_risk = totalStudents - riskDistribution.moderate - riskDistribution.healthy;
            }
          }
        }
        
        college.riskDistribution = riskDistribution;
      });
    });

    // Convert to the same format as getCollegeScores
    const history = Object.values(assessmentGroups).map(assessment => {
      const colleges = Object.values(assessment.colleges);
      // Calculate total students across all colleges in this assessment
      const totalStudents = colleges.reduce((sum, college) => sum + (college.studentCount || 0), 0);
      
      return {
        assessmentName: assessment.assessmentName,
        assessmentType: assessment.assessmentType,
        archivedAt: assessment.archivedAt,
        lastCalculated: assessment.lastCalculated,
        archiveReason: assessment.archiveReason,
        totalStudents: totalStudents, // Add totalStudents for frontend compatibility
        colleges: colleges
      };
    });

    console.log('📊 History data being returned:', {
      historyCount: history.length,
      historyItems: history.map(h => ({
        assessmentName: h.assessmentName,
        assessmentType: h.assessmentType,
        collegesCount: h.colleges.length,
        archivedAt: h.archivedAt
      }))
    });

    // For compatibility with the existing frontend, also provide a flattened colleges array
    // This contains all colleges from the most recent assessment
    const colleges = history.length > 0 ? history[0].colleges : [];

    // Get all available filtering options from the data
    const allYearLevels = new Set();
    const allSections = new Set();
    
    filteredScores.forEach(record => {
      if (record.available_year_levels) {
        record.available_year_levels.forEach(year => allYearLevels.add(year));
      }
      if (record.available_sections) {
        record.available_sections.forEach(section => allSections.add(section));
      }
    });

    return {
      success: true,
      colleges: colleges, // For compatibility with college summary format
      history: history,   // Historical data grouped by assessment
      filteringMetadata: {
        availableYearLevels: Array.from(allYearLevels).sort((a, b) => a - b),
        availableSections: Array.from(allSections).sort(),
        totalRecords: filteredScores.length,
        originalRecords: historicalScores.length,
        filtersApplied: {
          collegeName: collegeName || null,
          assessmentType: assessmentType || null,
          assessmentName: assessmentName || null,
          yearLevel: yearLevel || null,
          section: section || null
        }
      }
    };
    
  } catch (error) {
    console.error('Error in getHistoricalCollegeScores:', error);
    return {
      success: false,
      error: error.message,
      colleges: [],
      history: []
    };
  }
}

module.exports = {
  getHistoricalCollegeScores
};