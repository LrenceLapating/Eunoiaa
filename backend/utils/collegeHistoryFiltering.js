const { supabaseAdmin } = require('../config/database');

/**
 * Get filtered college history data - works like getCollegeScores but for archived data
 * @param {string} collegeName - College name to filter by
 * @param {string} assessmentType - Assessment type (ryff_42, ryff_84)
 * @param {string} assessmentName - Optional: specific assessment name
 * @param {string} yearLevel - Optional: filter by year level
 * @param {string} section - Optional: filter by section
 * @returns {Object} Filtered college history data
 */
async function getFilteredCollegeHistory(collegeName = null, assessmentType = null, assessmentName = null, yearLevel = null, section = null) {
  try {
    console.log('🔍 Getting filtered college history with filters:', {
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

    // Build the base query
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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching college history data:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        college: collegeName,
        assessmentType: assessmentType,
        history: [],
        filteringMetadata: {
          availableYearLevels: [],
          availableSections: [],
          totalRecords: 0
        }
      };
    }

    // Apply year level and section filtering
    let filteredData = data;
    
    if (yearLevel || section) {
      console.log('🔍 Applying year/section filters:', { yearLevel, section });
      
      filteredData = data.filter(record => {
        let matchesYear = true;
        let matchesSection = true;
        
        // Check year level filter
        if (yearLevel) {
          const availableYears = record.available_year_levels || [];
          // Convert yearLevel to number for comparison
          const requestedYear = parseInt(yearLevel);
          matchesYear = availableYears.includes(requestedYear);
          
          console.log(`🔍 Year filter check for record ${record.id}:`, {
            requestedYear,
            availableYears,
            matches: matchesYear
          });
        }
        
        // Check section filter
        if (section) {
          const availableSections = record.available_sections || [];
          matchesSection = availableSections.includes(section);
          
          console.log(`🔍 Section filter check for record ${record.id}:`, {
            requestedSection: section,
            availableSections,
            matches: matchesSection
          });
        }
        
        return matchesYear && matchesSection;
      });
      
      console.log(`🔍 Filtering result: ${data.length} -> ${filteredData.length} records`);
    }

    // Get all available filtering options from the data
    const allYearLevels = new Set();
    const allSections = new Set();
    
    data.forEach(record => {
      if (record.available_year_levels) {
        record.available_year_levels.forEach(year => allYearLevels.add(year));
      }
      if (record.available_sections) {
        record.available_sections.forEach(section => allSections.add(section));
      }
    });

    // Group the filtered data by assessment_name
    const historyByAssessment = {};
    
    filteredData.forEach(record => {
      const assessmentKey = record.assessment_name || 'Unknown Assessment';
      if (!historyByAssessment[assessmentKey]) {
        historyByAssessment[assessmentKey] = {
          assessmentName: assessmentKey,
          archivedAt: record.archived_at,
          lastCalculated: record.last_calculated,
          archiveReason: record.archive_reason,
          dimensions: {},
          totalStudents: 0,
          id: record.id,
          availableYearLevels: record.available_year_levels || [],
          availableSections: record.available_sections || [],
          filterContext: record.filter_context || {}
        };
      }
      
      // Add dimension data
      historyByAssessment[assessmentKey].dimensions[record.dimension_name] = {
        score: record.raw_score,
        riskLevel: record.risk_level,
        studentCount: record.student_count || 0
      };
      
      // Update total students (use the maximum student count across dimensions)
      if (record.student_count > historyByAssessment[assessmentKey].totalStudents) {
        historyByAssessment[assessmentKey].totalStudents = record.student_count;
      }
    });

    // Calculate risk distribution and overall score for each assessment
    Object.values(historyByAssessment).forEach(assessment => {
      const dimensions = Object.values(assessment.dimensions);
      
      // Calculate overall score by summing all dimension scores
      let overallScore = 0;
      dimensions.forEach(dim => {
        overallScore += dim.score || 0;
      });
      assessment.overallScore = Math.round(overallScore * 100) / 100;
      
      // Initialize risk distribution
      const riskDistribution = {
        healthy: 0,
        moderate: 0,
        at_risk: 0,
        low: 0,  // Keep for backward compatibility
        high: 0  // Keep for backward compatibility
      };
      
      const totalStudents = assessment.totalStudents || 0;
      
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
      
      assessment.riskDistribution = riskDistribution;
    });

    return {
      success: true,
      college: collegeName,
      assessmentType: assessmentType,
      assessmentName: assessmentName,
      yearLevel: yearLevel,
      section: section,
      history: Object.values(historyByAssessment),
      filteringMetadata: {
        availableYearLevels: Array.from(allYearLevels).sort((a, b) => a - b),
        availableSections: Array.from(allSections).sort(),
        totalRecords: filteredData.length,
        originalRecords: data.length,
        filtersApplied: {
          yearLevel: yearLevel || null,
          section: section || null
        }
      }
    };
    
  } catch (error) {
    console.error('Error in getFilteredCollegeHistory:', error);
    return {
      success: false,
      error: error.message,
      history: []
    };
  }
}

module.exports = {
  getFilteredCollegeHistory
};