<template>
  <div class="college-view-container">
    <h2>College Summary</h2>
    <p>View and analyze assessment results by college.</p>
    
    <div class="college-stats-grid">
      <div class="college-stat-card" v-for="(college, index) in colleges" :key="index">
        <div class="college-header">
          <h3>{{ college.name }}</h3>
          <span class="student-count">{{ college.students }} students</span>
        </div>
        <div class="college-metrics">
          <div class="metric">
            <span class="metric-label">Average Score</span>
            <span class="metric-value">{{ college.avgScore }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">At Risk Students</span>
            <span class="metric-value">{{ college.atRisk }}</span>
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="dimension-bar" v-for="(dim, dimName) in college.dimensions" :key="dimName">
            <span class="dimension-name">{{ formatDimName(dimName) }}</span>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${dim.score}%`, backgroundColor: getDimensionColor(dimName) }"></div>
            </div>
            <span class="dimension-score">{{ dim.score }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollegeView',
  data() {
    return {
      colleges: [
        {
          name: 'College of Computer Studies',
          code: 'CCS',
          students: 5,
          avgScore: 132,
          atRisk: 3,
          dimensions: {
            autonomy: { score: 72 },
            environmentalMastery: { score: 84 },
            personalGrowth: { score: 79 },
            positiveRelations: { score: 76 },
            purposeInLife: { score: 81 },
            selfAcceptance: { score: 75 }
          }
        },
        {
          name: 'College of Nursing',
          code: 'CN',
          students: 1,
          avgScore: 118,
          atRisk: 1,
          dimensions: {
            autonomy: { score: 85 },
            environmentalMastery: { score: 68 },
            personalGrowth: { score: 83 },
            positiveRelations: { score: 71 },
            purposeInLife: { score: 87 },
            selfAcceptance: { score: 65 }
          }
        },
        {
          name: 'College of Engineering',
          code: 'COE',
          students: 2,
          avgScore: 126,
          atRisk: 1,
          dimensions: {
            autonomy: { score: 69 },
            environmentalMastery: { score: 82 },
            personalGrowth: { score: 83 },
            positiveRelations: { score: 80 },
            purposeInLife: { score: 70 },
            selfAcceptance: { score: 84 }
          }
        },
        {
          name: 'College of Business Administration',
          code: 'CBA',
          students: 2,
          avgScore: 129,
          atRisk: 1,
          dimensions: {
            autonomy: { score: 80 },
            environmentalMastery: { score: 70 },
            personalGrowth: { score: 82 },
            positiveRelations: { score: 85 },
            purposeInLife: { score: 79 },
            selfAcceptance: { score: 72 }
          }
        },
        {
          name: 'College of Arts and Sciences',
          code: 'CAS',
          students: 2,
          avgScore: 124,
          atRisk: 1,
          dimensions: {
            autonomy: { score: 68 },
            environmentalMastery: { score: 79 },
            personalGrowth: { score: 73 },
            positiveRelations: { score: 78 },
            purposeInLife: { score: 82 },
            selfAcceptance: { score: 84 }
          }
        }
      ]
    }
  },
  methods: {
    formatDimName(name) {
      switch(name) {
        case 'autonomy': return 'Autonomy';
        case 'environmentalMastery': return 'Env. Mastery';
        case 'personalGrowth': return 'Personal Growth';
        case 'positiveRelations': return 'Positive Relations';
        case 'purposeInLife': return 'Purpose in Life';
        case 'selfAcceptance': return 'Self-Acceptance';
        default: return name;
      }
    },
    getDimensionColor(name) {
      const colors = {
        autonomy: '#4caf50',
        environmentalMastery: '#2196f3',
        personalGrowth: '#9c27b0',
        positiveRelations: '#ff9800',
        purposeInLife: '#f44336',
        selfAcceptance: '#607d8b'
      };
      return colors[name] || '#00b3b0';
    }
  }
}
</script>

<style scoped>
.college-view-container {
  padding: 20px;
}

h2 {
  color: #1a2e35;
  margin-bottom: 8px;
  font-size: 24px;
}

p {
  color: #546e7a;
  margin-bottom: 24px;
}

.college-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
}

.college-stat-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.college-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.college-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.college-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0;
}

.student-count {
  font-size: 14px;
  color: #546e7a;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 20px;
}

.college-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 12px;
  color: #78909c;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a2e35;
}

.progress-bar-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dimension-name {
  width: 120px;
  font-size: 13px;
  color: #546e7a;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

.dimension-score {
  width: 40px;
  font-size: 13px;
  font-weight: 500;
  color: #1a2e35;
  text-align: right;
}
</style> 