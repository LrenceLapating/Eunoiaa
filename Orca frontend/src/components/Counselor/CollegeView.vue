<template>
  <div class="college-view-container">
    <h2>College Summary</h2>
    <p>View and analyze assessment results by college.</p>
    
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>
    
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
import {
  formatDimensionName,
  getDimensionColor,
  calculateCollegeStats,
  ryffDimensions
} from '../Shared/RyffScoringUtils';

export default {
  name: 'CollegeView',
  props: {
    students: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      error: null
    };
  },
  computed: {
    colleges() {
      try {
        if (!this.students || !Array.isArray(this.students)) {
          console.warn('Invalid or missing students data');
          return this.getDefaultCollegeData();
        }

        const stats = calculateCollegeStats(this.students);
        const collegeData = [
          { name: 'College of Computer Studies', code: 'CCS' },
          { name: 'College of Nursing', code: 'CN' },
          { name: 'College of Engineering', code: 'COE' },
          { name: 'College of Business Administration', code: 'CBA' },
          { name: 'College of Arts and Sciences', code: 'CAS' }
        ];

        return collegeData.map(college => ({
          ...college,
          students: stats[college.code]?.students || 0,
          avgScore: stats[college.code]?.avgScore || 0,
          atRisk: stats[college.code]?.atRisk || 0,
          dimensions: stats[college.code]?.dimensions || this.getDefaultDimensions()
        })).filter(college => college.students > 0); // Remove colleges with no data
      } catch (err) {
        console.error('Error calculating college stats:', err);
        this.error = 'Error loading college statistics';
        return this.getDefaultCollegeData();
      }
    }
  },
  methods: {
    formatDimName(name) {
      return formatDimensionName(name);
    },
    getDimensionColor(name) {
      return getDimensionColor(name);
    },
    getDefaultDimensions() {
      return ryffDimensions.reduce((acc, dim) => {
        acc[dim] = { score: 0 };
        return acc;
      }, {});
    },
    getDefaultCollegeData() {
      const collegeData = [
        { name: 'College of Computer Studies', code: 'CCS' },
        { name: 'College of Nursing', code: 'CN' },
        { name: 'College of Engineering', code: 'COE' },
        { name: 'College of Business Administration', code: 'CBA' },
        { name: 'College of Arts and Sciences', code: 'CAS' }
      ];
      
      return collegeData.map(college => ({
        ...college,
        students: 0,
        avgScore: 0,
        atRisk: 0,
        dimensions: this.getDefaultDimensions()
      }));
    }
  }
};
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

.error-message {
  background-color: #fee;
  color: #c00;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-message i {
  font-size: 16px;
}
</style>