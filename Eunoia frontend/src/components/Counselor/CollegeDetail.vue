<template>
  <div class="college-detail-container">
    <!-- Header with back button -->
    <div class="header-section">
      <button class="back-button" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="header-content">
        <h1>AI Feedback Review</h1>
        <div class="breadcrumb">
          <span>Counselor</span>
          <i class="fas fa-chevron-right"></i>
          <span>Guidance Feedback</span>
        </div>
      </div>
    </div>

    <!-- College Info Card -->
    <div class="college-info-card">
      <div class="college-icon">
        <i class="fas fa-graduation-cap"></i>
      </div>
      <div class="college-details">
        <h2>{{ selectedCollege.name }}</h2>
        <p>{{ selectedCollege.students }} students</p>
        <span class="risk-level medium-risk">Medium Risk</span>
        
        <!-- Additional college info to fill middle space -->
        <div class="college-metrics">
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Overall Score</span>
              <span class="metric-value">{{ selectedCollege.avgScore || 0 }}/7</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">At Risk</span>
              <span class="metric-value">{{ selectedCollege.atRisk || 0 }}</span>
            </div>
          </div>
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Completion Rate</span>
              <span class="metric-value">85%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Assessment</span>
              <span class="metric-value">June 2024</span>
            </div>
          </div>
        </div>
      </div>
      <div class="assessment-overview">
        <h3>Assessment Overview</h3>
        <div class="overview-stats">
          <div class="stat-item">
            <span class="stat-label">Assessment Period</span>
            <span class="stat-value">June 2024</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completion Rate</span>
            <span class="stat-value">85%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Students</span>
            <span class="stat-value">{{ selectedCollege.students }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Overall Score</span>
            <span class="stat-value">{{ selectedCollege.avgScore || 0 }}/7</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">At Risk Students</span>
            <span class="stat-value">{{ selectedCollege.atRisk || 0 }}</span>
          </div>
        </div>
      </div>
      <div class="risk-distribution">
        <h3>Risk Distribution</h3>
        <div class="risk-stats">
          <div class="risk-item high-risk">
            <span class="risk-count">12</span>
            <span class="risk-label">High Risk</span>
          </div>
          <div class="risk-item medium-risk">
            <span class="risk-count">34</span>
            <span class="risk-label">Medium Risk</span>
          </div>
          <div class="risk-item low-risk">
            <span class="risk-count">34</span>
            <span class="risk-label">Low Risk</span>
          </div>
          <div class="risk-item no-risk">
            <span class="risk-count">34</span>
            <span class="risk-label">No Risk</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dimension Analysis Section -->
    <div class="dimension-analysis-section">
      <h2>Dimension Analysis</h2>
      
      <div class="dimensions-grid">
        <div class="dimension-card" v-for="(dimension, index) in dimensions" :key="index">
          <div class="dimension-header" :style="{ borderLeft: `4px solid ${getDimensionColor(dimension.dimensionKey)}` }">
            <div class="dimension-title-section">
              <div class="dimension-color-indicator" :style="{ backgroundColor: getDimensionColor(dimension.dimensionKey) }"></div>
              <h3>{{ dimension.name }}</h3>
            </div>
            <button class="expand-btn">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <div class="dimension-content">
            <div class="dimension-score-section">
              <div class="score-display" :style="{ borderLeft: `4px solid ${getDimensionColor(dimension.dimensionKey)}` }">
                <span class="score-label">Dimension Score:</span>
                <span class="score-value" :style="{ color: getDimensionColor(dimension.dimensionKey) }">{{ dimension.averageScore }}/7</span>
              </div>
              <div class="score-interpretation">
                <h4>Score Interpretation</h4>
                <p>{{ dimension.interpretation }}</p>
              </div>
            </div>
            
            <div class="ai-recommendation">
              <div class="recommendation-icon">
                <i class="fas fa-lightbulb"></i>
              </div>
              <div class="recommendation-content">
                <h4>AI Recommendation</h4>
                <p>{{ dimension.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getDimensionColor } from '../Shared/RyffScoringUtils';

export default {
  name: 'CollegeDetail',
  props: {
    selectedCollege: {
      type: Object,
      required: true
    }
  },
  computed: {
    dimensions() {
      const dimensionData = {
        autonomy: {
          name: 'Autonomy',
          interpretation: 'Moderate autonomy levels indicate students have some independence in decision-making but may benefit from additional support in developing self-reliance and confidence in their choices.',
          recommendation: 'IT students show moderate autonomy scores. Consider offering more opportunities for independent project work to strengthen decision-making confidence and reduce over-reliance on peer pressure.'
        },
        environmentalMastery: {
          name: 'Environmental Mastery',
          interpretation: 'Below-average environmental mastery suggests students may struggle with managing their surroundings and daily responsibilities effectively.',
          recommendation: 'Environmental Mastery scores suggest students may benefit from better time management strategies and workload distribution techniques, especially for complex technical projects.'
        },
        personalGrowth: {
          name: 'Personal Growth',
          interpretation: 'Lower personal growth scores indicate students may feel stagnant or lack a sense of continuous development and improvement in their personal lives.',
          recommendation: 'The lower Personal Growth scores indicate students may benefit from clearly defined skill progression paths and recognition of incremental learning achievements in technology areas.'
        },
        positiveRelations: {
          name: 'Positive Relations',
          interpretation: 'Moderate positive relations scores suggest students have satisfactory social connections but could benefit from stronger interpersonal relationships and support networks.',
          recommendation: 'While showing moderate scores, Positive Relations could be enhanced through more collaborative coding projects and peer programming activities to build communication skills.'
        },
        purposeInLife: {
          name: 'Purpose in Life',
          interpretation: 'Moderate purpose in life scores indicate students have some sense of direction and meaning but may benefit from clearer goal-setting and career guidance.',
          recommendation: 'Students would benefit from career connections between coursework and industry applications, and clarity applications. All peer guidance updates and embrace initiatives can be learning opportunities.'
        },
        selfAcceptance: {
          name: 'Self-Acceptance',
          interpretation: 'Below-average self-acceptance scores suggest students may struggle with self-worth and accepting their personal qualities, both positive and negative.',
          recommendation: 'The notably lower Self-Acceptance scores suggest implementing programming workshops that emphasize the debugging process and embrace mistakes as learning opportunities.'
        }
      };

      // Use actual scores from selectedCollege dimensions
      return Object.entries(this.selectedCollege.dimensions || {}).map(([key, dimData]) => ({
        name: dimensionData[key]?.name || key,
        averageScore: dimData.score || 0,
        dimensionKey: key,
        interpretation: dimensionData[key]?.interpretation || 'No interpretation available.',
        recommendation: dimensionData[key]?.recommendation || 'No recommendation available.'
      }));
    }
  },
  methods: {
    goBack() {
      this.$emit('go-back');
    },
    getDimensionColor(dimensionKey) {
      return getDimensionColor(dimensionKey);
    }
  }
};
</script>

<style scoped>
.college-detail-container {
  background-color: var(--gray);
  min-height: 100vh;
  padding: 20px;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.back-button {
  background: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.back-button:hover {
  background-color: #f5f5f5;
  transform: translateX(-2px);
}

.header-content h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #546e7a;
  margin-top: 4px;
}

.college-info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: grid;
  grid-template-columns: auto 1fr 300px 250px;
  gap: 32px;
  align-items: start;
  min-height: 180px;
}

.college-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary), #00a8a5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.college-details {
  min-width: 300px;
}

.college-details h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 4px 0;
}

.college-details p {
  color: #546e7a;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.risk-level {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
  display: inline-block;
}

.medium-risk {
  background-color: #fff3cd;
  color: #856404;
}

.college-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.metric-row {
  display: flex;
  gap: 16px;
}

.metric-item {
  flex: 1;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid var(--primary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #546e7a;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}

.assessment-overview h3,
.risk-distribution h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 16px 0;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
}

.overview-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #2196f3;
}

.stat-label {
  font-size: 14px;
  color: #1a2e35;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #2196f3;
}

.risk-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.risk-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.risk-item.high-risk {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
}

.risk-item.medium-risk {
  background-color: #fff3e0;
  color: #ef6c00;
  border-left: 4px solid #ff9800;
}

.risk-item.low-risk {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border-left: 4px solid #9c27b0;
}

.risk-item.no-risk {
  background-color: #e8f5e8;
  color: #2e7d32;
  border-left: 4px solid #4caf50;
}

.risk-count {
  font-weight: 700;
  min-width: 20px;
  font-size: 16px;
}

.risk-label {
  font-weight: 600;
}

.dimension-analysis-section {
  margin-top: 24px;
}

.dimension-analysis-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1a2e35;
  margin-bottom: 20px;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.dimension-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.5) 100%);
}

.dimension-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dimension-color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dimension-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0;
}

.expand-btn {
  background: none;
  border: none;
  color: #546e7a;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background-color: #f5f5f5;
  color: var(--primary);
}

.dimension-content {
  padding: 20px;
}

.dimension-score-section {
  margin-bottom: 20px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.score-display .score-label {
  font-size: 14px;
  color: #546e7a;
  font-weight: 500;
}

.score-display .score-value {
  font-size: 18px;
  font-weight: 600;
}

.score-interpretation {
  padding: 12px;
  background-color: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #e3f2fd;
}

.score-interpretation h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 8px 0;
}

.score-interpretation p {
  font-size: 13px;
  color: #546e7a;
  line-height: 1.5;
  margin: 0;
}

.ai-recommendation {
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--primary);
}

.recommendation-icon {
  color: var(--primary);
  font-size: 16px;
  margin-top: 2px;
}

.recommendation-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 8px 0;
}

.recommendation-content p {
  font-size: 13px;
  color: #546e7a;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 768px) {
  .college-info-card {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .dimensions-grid {
    grid-template-columns: 1fr;
  }
}
</style>