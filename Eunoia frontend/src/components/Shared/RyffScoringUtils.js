// Shared utilities for Ryff scoring calculations and student data management

export const ryffDimensions = [
  'autonomy',
  'environmentalMastery',
  'personalGrowth',
  'positiveRelations',
  'purposeInLife',
  'selfAcceptance'
];

export const formatDimensionName = (name) => {
  const nameMap = {
    // camelCase format
    autonomy: 'Autonomy',
    environmentalMastery: 'Environmental Mastery',
    personalGrowth: 'Personal Growth',
    positiveRelations: 'Positive Relations with Others',
    purposeInLife: 'Purpose in Life',
    selfAcceptance: 'Self-Acceptance',
    // snake_case format (from backend)
    environmental_mastery: 'Environmental Mastery',
    personal_growth: 'Personal Growth',
    positive_relations: 'Positive Relations with Others',
    purpose_in_life: 'Purpose in Life',
    self_acceptance: 'Self-Acceptance'
  };
  return nameMap[name] || name;
};

export const getDimensionColor = (name) => {
  const colors = {
    autonomy: '#4caf50',
    environmentalMastery: '#2196f3',
    personalGrowth: '#9c27b0',
    positiveRelations: '#ff9800',
    purposeInLife: '#f44336',
    selfAcceptance: '#607d8b'
  };
  return colors[name] || '#00b3b0';
};

export const calculateOverallScore = (student) => {
  if (!student) return 0;
  // Return the overall_score directly from the database
  return student.overallScore || 0;
};

export const getDimensionRiskLevel = (score) => {
  // Score is raw total from database (7-42 range for Ryff-42)
  if (score <= 18) return 'At Risk';   // ≤18 = At-Risk
  if (score <= 30) return 'Moderate';  // 19-30 = Moderate
  return 'Healthy';                    // ≥31 = Healthy
};

// New college-level risk assessment using raw score tertiles
export const getCollegeDimensionRiskLevel = (rawScore, assessmentType = null) => {
  // Auto-detect assessment type if not provided based on score range
  let detectedType = assessmentType;
  if (!detectedType) {
    // 42-item: 7-42 range, 84-item: 14-84 range
    detectedType = rawScore > 42 ? 'ryff_84' : 'ryff_42';
  }
  
  if (detectedType === 'ryff_84') {
    // 84-item assessment: 14 items per dimension (14-84 range)
    if (rawScore <= 36) return 'At Risk';   // ≤36 = At-Risk
    if (rawScore <= 59) return 'Moderate';  // 37-59 = Moderate  
    return 'Healthy';                       // ≥60 = Healthy
  } else {
    // 42-item assessment: 7 items per dimension (7-42 range)
    if (rawScore <= 18) return 'At Risk';   // ≤18 = At-Risk
    if (rawScore <= 30) return 'Moderate';  // 19-30 = Moderate  
    return 'Healthy';                       // ≥31 = Healthy
  }
};

// Get color for college dimension based on risk level
export const getCollegeDimensionColor = (rawScore, assessmentType = null) => {
  const riskLevel = getCollegeDimensionRiskLevel(rawScore, assessmentType);
  switch (riskLevel) {
    case 'At Risk': return '#ff4d4d';   // Red - matches legend
    case 'Moderate': return '#ffff66';  // Yellow - matches legend
    case 'Healthy': return '#66ff66';   // Green - matches legend
    default: return '#6c757d';          // Gray for no data
  }
};

export const getAtRiskDimensions = (student) => {
  if (!student || !student.subscales) return [];
  return Object.entries(student.subscales)
    .filter(([_, score]) => getDimensionRiskLevel(score) === 'At Risk')
    .map(([dimension]) => dimension);
};

export const getAtRiskDimensionsCount = (student) => {
  return getAtRiskDimensions(student).length;
};

export const hasAnyRiskDimension = (student) => {
  return getAtRiskDimensionsCount(student) > 0;
};

export const getOverallRiskLevel = (student) => {
  const overallScore = calculateOverallScore(student); // Sum of all 6 dimensions (42-252 range)
  // Tertile thresholds for overall score
  // T1: ≤111 (At Risk), T2: 112-181 (Moderate), T3: ≥182 (Healthy)
  if (overallScore <= 111) return 'At Risk';
  if (overallScore <= 181) return 'Moderate';
  return 'Healthy';
};

export const calculateCollegeStats = (students) => {
  const collegeStats = {};
  
  if (!students || !Array.isArray(students)) {
    return {};
  }

  students.forEach(student => {
    if (!collegeStats[student.college]) {
      collegeStats[student.college] = {
        students: 0,
        atRisk: 0,
        totalScore: 0,
        dimensions: ryffDimensions.reduce((acc, dim) => {
          acc[dim] = { total: 0, count: 0 };
          return acc;
        }, {})
      };
    }
    
    const stats = collegeStats[student.college];
    stats.students++;
    if (hasAnyRiskDimension(student)) stats.atRisk++;
    
    const overallScore = calculateOverallScore(student);
    stats.totalScore += overallScore;
    
    // Only process subscales if they exist and are not null
    if (student.subscales && typeof student.subscales === 'object') {
      Object.entries(student.subscales).forEach(([dim, score]) => {
        // Score is already raw total from database (7-42 range)
        stats.dimensions[dim].total += score;
        stats.dimensions[dim].count++;
      });
    }
  });
  
  // Calculate averages (college mean raw scores)
  Object.values(collegeStats).forEach(stats => {
    stats.avgScore = Math.round(stats.totalScore / stats.students);
    Object.values(stats.dimensions).forEach(dim => {
      // College average raw score (7-42 range)
      dim.score = Math.round(dim.total / dim.count);
    });
  });
  
  return collegeStats;
};