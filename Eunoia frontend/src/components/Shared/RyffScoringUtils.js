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
    autonomy: 'Autonomy',
    environmentalMastery: 'Environmental Mastery',
    personalGrowth: 'Personal Growth',
    positiveRelations: 'Positive Relations',
    purposeInLife: 'Purpose in Life',
    selfAcceptance: 'Self-Acceptance'
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
  if (!student || !student.subscales) return 0;
  const scores = Object.values(student.subscales);
  // Sum all dimension scores (each on 7-49 scale) for total score (42-294 range)
  const total = scores.reduce((sum, score) => sum + (score * 7), 0);
  return Math.round(total);
};

export const getDimensionRiskLevel = (score) => {
  // Score is already on 1-7 scale, convert to 7-49 scale for tertile calculation
  const scaledScore = score * 7; // Convert to 7-49 scale
  if (scaledScore <= 17) return 'At Risk';  // T1: ≤17
  if (scaledScore <= 38) return 'Moderate'; // T2: 18-38
  return 'Healthy';                         // T3: ≥39
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
  const overallScore = calculateOverallScore(student); // Already on 42-294 scale
  // Tertile method: (294-42)/3 = 84 interval, but using specified thresholds
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
    
    Object.entries(student.subscales).forEach(([dim, score]) => {
      stats.dimensions[dim].total += score * 7;
      stats.dimensions[dim].count++;
    });
  });
  
  // Calculate averages
  Object.values(collegeStats).forEach(stats => {
    stats.avgScore = Math.round(stats.totalScore / stats.students);
    Object.values(stats.dimensions).forEach(dim => {
      dim.score = Math.round(dim.total / dim.count); // Keep as whole numbers out of 7
    });
  });
  
  return collegeStats;
};