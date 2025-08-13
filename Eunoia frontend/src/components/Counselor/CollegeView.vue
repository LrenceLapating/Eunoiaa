<template>
  <div class="college-view-container">
    <h2>College Summary</h2>
    <p>View and analyze assessment results by college.</p>
    
    <!-- Assessment Type Navigation -->
    <div class="assessment-type-nav">
      <button 
        class="nav-button" 
        :class="{ active: assessmentTypeFilter === '42-item' }"
        @click="setAssessmentType('42-item')"
      >
        42-item
      </button>
      <button 
        class="nav-button" 
        :class="{ active: assessmentTypeFilter === '84-item' }"
        @click="setAssessmentType('84-item')"
      >
        84-item
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
    </div>
    
    <div class="college-stats-grid">
      <div class="college-stat-card" v-for="(college, index) in colleges" :key="index" @click="navigateToCollegeDetail(college)" :class="{ 'clickable': true }">
        <div class="college-header">
          <h3>{{ college.name }}</h3>
          <span class="student-count">{{ college.students }} students</span>
        </div>
        <div class="college-metrics">
          <div class="metric">
            <span class="metric-label">Overall Score</span>
            <span class="metric-value">{{ college.avgScore.toFixed(2) }}</span>
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
              <div class="progress-fill" :style="{ width: `${(dim.score/maxScore)*100}%`, backgroundColor: getCollegeDimensionColor(dim.score, assessmentTypeFilter) }"></div>
          </div>
          <span class="dimension-score" style="color: black;">{{ dim.score.toFixed(2) }}/{{ maxScore }}</span>
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
  ryffDimensions,
  getCollegeDimensionColor,
  getCollegeDimensionRiskLevel
} from '../Shared/RyffScoringUtils';

export default {
  name: 'CollegeView',
  data() {
    return {
      error: null,
      collegesFromBackend: [], // Store colleges fetched from backend
      collegeScores: [], // Store computed college scores from backend
      assessmentTypeFilter: '42-item' // Default to 42-item
    };
  },
  async mounted() {
    await this.loadCollegesFromBackend();
    await this.loadCollegeScores();
  },
  watch: {
    // Watch for changes in collegeScores to ensure reactivity
    collegeScores: {
      handler(newScores, oldScores) {
        console.log(`👀 CollegeScores changed: ${oldScores?.length || 0} -> ${newScores?.length || 0}`);
        // Force re-computation of colleges computed property
        this.$forceUpdate();
      },
      deep: true
    },
    assessmentTypeFilter: {
      handler(newType, oldType) {
        console.log(`🔄 Assessment filter changed: ${oldType} -> ${newType}`);
      }
    }
  },
  computed: {
    maxScore() {
      return this.assessmentTypeFilter === '42-item' ? 42 : 84;
    },
    colleges() {
      try {
        console.log(`🔄 Computing colleges() - Assessment Type: ${this.assessmentTypeFilter}, CollegeScores: ${this.collegeScores.length}`);
        
        // Use colleges from backend - if not loaded, return empty array to show the error
        if (this.collegesFromBackend.length === 0) {
          console.error('No colleges loaded from backend');
          return [];
        }
        
        const collegeData = this.collegesFromBackend.map(college => ({
          name: college.name,
          code: this.generateCollegeCode(college.name),
          users: college.users
        }));

        // Filter and map only colleges that have score data for the selected assessment type
        return collegeData
          .map(college => {
            // Find matching college scores from backend
            const collegeScore = this.collegeScores.find(score => 
              score.name === college.name
            );
            
            console.log(`🏫 Processing ${college.name}: Found score data:`, !!collegeScore);
            
            if (collegeScore) {
              // Calculate overall average and at-risk count from dimensions
              const dimensions = collegeScore.dimensions;
              const dimensionScores = Object.values(dimensions).map(dim => dim.score);
              const avgScore = dimensionScores.length > 0 
                ? dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length 
                : 0;
              
              // Count at-risk dimensions
              const atRiskCount = Object.values(dimensions).filter(dim => 
                dim.riskLevel === 'At Risk'
              ).length;
              
              return {
                ...college,
                students: collegeScore.studentCount || 0,
                avgScore: avgScore,
                atRisk: atRiskCount,
                dimensions: this.formatDimensionsForDisplay(dimensions)
              };
            } else {
              // Return null for colleges without score data - will be filtered out
              return null;
            }
          })
          .filter(college => college !== null); // Remove colleges without score data
      } catch (err) {
        console.error('Error processing college data:', err);
        this.error = 'Error loading college statistics';
        return [];
      }
    }
  },
  methods: {
    async loadCollegesFromBackend() {
      try {
        const response = await fetch('http://localhost:3000/api/accounts/colleges');
        if (response.ok) {
          const data = await response.json();
          this.collegesFromBackend = data.colleges.map(college => ({
            name: college.name,
            users: college.totalUsers
          }));
        } else {
          console.error('Failed to load colleges from backend');
          this.error = 'Failed to load college data from server';
        }
      } catch (error) {
        console.error('Error loading colleges:', error);
        this.error = 'Network error. Please check if the backend server is running.';
      }
    },
    async loadCollegeScores() {
      try {
        // Convert frontend filter format to backend format
        const assessmentType = this.assessmentTypeFilter === '42-item' ? 'ryff_42' : 'ryff_84';
        console.log(`🔍 Loading college scores for assessment type: ${assessmentType}`);
        
        // First, trigger computation of college scores with assessment type filter
        console.log(`⚙️ Computing scores for ${assessmentType}...`);
        await fetch('http://localhost:3000/api/accounts/colleges/compute-scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ assessmentType })
        });
        
        // Then fetch the computed scores with assessment type filter
        console.log(`📥 Fetching computed scores for ${assessmentType}...`);
        const response = await fetch(`http://localhost:3000/api/accounts/colleges/scores?assessmentType=${assessmentType}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Received ${data.colleges?.length || 0} colleges for ${assessmentType}:`, data.colleges?.map(c => c.name));
          
          // Clear old data first to ensure reactivity
          this.collegeScores = [];
          this.$nextTick(() => {
            this.collegeScores = data.colleges || [];
            console.log(`📊 Updated collegeScores array:`, this.collegeScores.length, 'colleges');
          });
        } else {
          console.error('Failed to load college scores from backend');
          this.error = 'Failed to load college scores from server';
        }
      } catch (error) {
        console.error('Error loading college scores:', error);
        this.error = 'Network error while loading college scores.';
      }
    },
    generateCollegeCode(collegeName) {
      // Generate a code from college name for backward compatibility
      const words = collegeName.split(' ');
      if (words.length === 1) {
        return words[0].substring(0, 3).toUpperCase();
      }
      return words.map(word => word.charAt(0)).join('').toUpperCase();
    },
    formatDimName(name) {
      return formatDimensionName(name);
    },
    getDimensionColor(name) {
      return getDimensionColor(name);
    },
    getCollegeDimensionColor(rawScore) {
      return getCollegeDimensionColor(rawScore, this.assessmentTypeFilter);
    },
    getCollegeDimensionRiskLevel(rawScore) {
      return getCollegeDimensionRiskLevel(rawScore);
    },
    getDefaultDimensions() {
      return ryffDimensions.reduce((acc, dim) => {
        acc[dim] = { score: 0 };
        return acc;
      }, {});
    },
    formatDimensionsForDisplay(dimensions) {
      // Convert backend dimension format to frontend display format
      const formatted = {};
      Object.keys(dimensions).forEach(dimName => {
        const dim = dimensions[dimName];
        // Use the formatted dimension name as the key instead of the raw backend key
        const formattedName = formatDimensionName(dimName);
        formatted[formattedName] = {
          score: dim.score || 0,
          riskLevel: dim.riskLevel || 'Healthy'
        };
      });
      return formatted;
    },

    setAssessmentType(type) {
      console.log(`🔄 Switching assessment type from ${this.assessmentTypeFilter} to ${type}`);
      this.assessmentTypeFilter = type;
      console.log(`📊 Current collegeScores before reload:`, this.collegeScores.length, 'colleges');
      this.loadCollegeScores(); // Reload data with new filter
    },
    navigateToCollegeDetail(college) {
      // Emit event to parent component to handle navigation
      // Include assessment type information
      const collegeWithAssessmentType = {
        ...college,
        assessmentType: this.assessmentTypeFilter
      };
      this.$emit('navigate-to-college', collegeWithAssessmentType);
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

.college-stat-card.clickable {
  cursor: pointer;
}

.college-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.college-stat-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
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
  color: black;
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

/* Assessment Type Navigation Styles */
.assessment-type-nav {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
}

.nav-button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.nav-button:hover {
  background: #e9ecef;
  color: #495057;
}

.nav-button.active {
  background: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.nav-button.active:hover {
  background: #0056b3;
  color: white;
}
</style>