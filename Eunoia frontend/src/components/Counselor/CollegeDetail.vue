<template>
  <div class="college-detail-container">
    <!-- Header with back button -->
    <div class="header-section">
      <button class="back-button" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="header-content">
        <h1>Score Interpretation</h1>
        <div class="breadcrumb">
          <span>Counselor</span>
          <i class="fas fa-chevron-right"></i>
          <span>Guidance Feedback</span>
        </div>
      </div>
      <div class="header-controls">
        <div class="year-selector">
            <label for="studentYear">Select Student Year:</label>
            <select id="studentYear" v-model="selectedYear" class="year-dropdown">
              <option value="">All Year</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
        <button class="history-button" @click="showHistoryPanel = true">
          <i class="fas fa-history"></i>
          <span>History</span>
        </button>
      </div>
    </div>

    <!-- College Info Card -->
    <div class="college-info-card">
      <div class="college-icon">
        <i class="fas fa-graduation-cap"></i>
      </div>
      <div class="college-details">
        <h2>{{ selectedCollege.name }}</h2>
        <p>{{ selectedCollege.students }} Total students</p>
        <span class="risk-level medium-risk">Medium Risk</span>
        <div v-if="selectedHistoryData" class="history-indicator">
              <i class="fas fa-history"></i>
              <span>Viewing {{ selectedHistoryData.assessmentName }} data</span>
              <button @click="resetToCurrentData" class="reset-btn">
                <i class="fas fa-sync-alt"></i> Back to Current
              </button>
            </div>
        
        <!-- Additional college info to fill middle space -->
        <div class="college-metrics">
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Completion Rate</span>
              <span class="metric-value">{{ currentData.completionRate || '85%' }}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Assessment</span>
                <span class="metric-value">{{ currentData.assessmentName || 'Current Assessment' }}</span>
              </div>
          </div>
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Overall Score</span>
              <span class="metric-value">{{ currentData.overallScore || '150' }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">At Risk</span>
              <span class="metric-value">{{ currentData.atRiskCount || selectedCollege.atRisk || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <div class="risk-distribution">
        <h3>Risk Distribution</h3>
        <div class="risk-stats">
          <div class="risk-item high-risk">
            <span class="risk-count">12</span>
            <span class="risk-label">At Risk</span>
          </div>
          <div class="risk-item medium-risk">
            <span class="risk-count">34</span>
            <span class="risk-label">Moderate</span>
          </div>
          <div class="risk-item low-risk">
            <span class="risk-count">34</span>
            <span class="risk-label">Healthy</span>
          </div>
        </div>
      </div>
      <div class="risk-legend">
      <h4>Legend</h4>
      <div class="legend-item">
        <span class="legend-box" style="background-color: #ff4d4d;"></span>
        <span class="legend-label">At Risk</span>
      </div>
      <div class="legend-item">
        <span class="legend-box" style="background-color: #ffff66;"></span>
        <span class="legend-label">Moderate</span>
      </div>
      <div class="legend-item">
        <span class="legend-box" style="background-color: #66ff66;"></span>
        <span class="legend-label">Healthy</span>
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
              <span class="score-value" :style="{ color: getDimensionColor(dimension.dimensionKey) }">{{ dimension.averageScore }}</span>
            </div>
            <div class="score-interpretation">
              <h4>Score Interpretation</h4>
              <p>{{ dimension.interpretation }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    </div>

    <!-- History Panel Overlay -->
    <div class="history-overlay" v-if="showHistoryPanel" @click="closeHistoryPanel">
      <div class="history-panel" @click.stop>
        <div class="history-header">
          <h3>Assessment History</h3>
          <button class="close-btn" @click="showHistoryPanel = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="history-content">
          <div class="history-table-container">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Assessment Name</th>
                  <th>Completion Rate</th>
                  <th>Overall Score</th>
                  <th>At Risk Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(history, index) in assessmentHistory" :key="index">
                  <td>{{ formatDate(history.date) }}</td>
                  <td>{{ history.assessmentName }}</td>
                  <td>{{ getAggregatedCompletionRate(history) }}</td>
                  <td>{{ getAggregatedOverallScore(history) }}</td>
                  <td>{{ getAggregatedAtRiskCount(history) }}</td>
                  <td>
                    <button class="view-details-btn" @click="viewHistoryDetails(history)">
                      <i class="fas fa-eye"></i>
                      View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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
  data() {
    return {
      showHistoryPanel: false,
      selectedHistoryData: null,
      selectedYear: '',
      assessmentHistory: [
        {
          id: 1,
          date: '2024-06-15',
          period: 'June 2024',
          assessmentName: 'Mid-Year Wellness Assessment',
          yearData: {
            '1st': {
              completionRate: '92%',
              overallScore: 165,
              atRiskCount: 1,
              dimensions: {
                autonomy: { score: 32 },
                environmentalMastery: { score: 30 },
                personalGrowth: { score: 28 },
                positiveRelations: { score: 34 },
                purposeInLife: { score: 31 },
                selfAcceptance: { score: 25 }
              }
            },
            '2nd': {
              completionRate: '85%',
              overallScore: 150,
              atRiskCount: 2,
              dimensions: {
                autonomy: { score: 28 },
                environmentalMastery: { score: 25 },
                personalGrowth: { score: 22 },
                positiveRelations: { score: 30 },
                purposeInLife: { score: 26 },
                selfAcceptance: { score: 19 }
              }
            },
            '3rd': {
              completionRate: '78%',
              overallScore: 135,
              atRiskCount: 3,
              dimensions: {
                autonomy: { score: 25 },
                environmentalMastery: { score: 22 },
                personalGrowth: { score: 19 },
                positiveRelations: { score: 27 },
                purposeInLife: { score: 23 },
                selfAcceptance: { score: 16 }
              }
            },
            '4th': {
              completionRate: '73%',
              overallScore: 128,
              atRiskCount: 4,
              dimensions: {
                autonomy: { score: 22 },
                environmentalMastery: { score: 20 },
                personalGrowth: { score: 17 },
                positiveRelations: { score: 24 },
                purposeInLife: { score: 21 },
                selfAcceptance: { score: 14 }
              }
            }
          }
        },
        {
          id: 2,
          date: '2024-05-15',
          period: 'May 2024',
          assessmentName: 'Spring Semester Check-in',
          yearData: {
            '1st': {
              completionRate: '88%',
              overallScore: 158,
              atRiskCount: 2,
              dimensions: {
                autonomy: { score: 30 },
                environmentalMastery: { score: 28 },
                personalGrowth: { score: 26 },
                positiveRelations: { score: 32 },
                purposeInLife: { score: 29 },
                selfAcceptance: { score: 23 }
              }
            },
            '2nd': {
              completionRate: '78%',
              overallScore: 142,
              atRiskCount: 3,
              dimensions: {
                autonomy: { score: 26 },
                environmentalMastery: { score: 24 },
                personalGrowth: { score: 20 },
                positiveRelations: { score: 28 },
                purposeInLife: { score: 25 },
                selfAcceptance: { score: 19 }
              }
            },
            '3rd': {
              completionRate: '72%',
              overallScore: 130,
              atRiskCount: 4,
              dimensions: {
                autonomy: { score: 23 },
                environmentalMastery: { score: 21 },
                personalGrowth: { score: 18 },
                positiveRelations: { score: 25 },
                purposeInLife: { score: 22 },
                selfAcceptance: { score: 15 }
              }
            },
            '4th': {
              completionRate: '68%',
              overallScore: 122,
              atRiskCount: 5,
              dimensions: {
                autonomy: { score: 20 },
                environmentalMastery: { score: 18 },
                personalGrowth: { score: 16 },
                positiveRelations: { score: 22 },
                purposeInLife: { score: 19 },
                selfAcceptance: { score: 13 }
              }
            }
          }
        }
      ]
    };
  },
  computed: {
    currentData() {
      if (this.selectedHistoryData) {
        // If viewing historical data
        if (this.selectedYear && this.selectedHistoryData.yearData && this.selectedHistoryData.yearData[this.selectedYear]) {
          // Return year-specific historical data
          return {
            ...this.selectedHistoryData,
            ...this.selectedHistoryData.yearData[this.selectedYear],
            assessmentName: this.selectedHistoryData.assessmentName
          };
        } else if (this.selectedHistoryData.yearData) {
          // Return aggregated historical data from all years
          const years = Object.keys(this.selectedHistoryData.yearData);
          const totalStudents = years.length;
          let totalCompletion = 0;
          let totalScore = 0;
          let totalAtRisk = 0;
          
          years.forEach(year => {
            const yearData = this.selectedHistoryData.yearData[year];
            totalCompletion += parseInt(yearData.completionRate);
            totalScore += yearData.overallScore;
            totalAtRisk += yearData.atRiskCount;
          });
          
          return {
            ...this.selectedHistoryData,
            completionRate: Math.round(totalCompletion / totalStudents) + '%',
            overallScore: Math.round(totalScore / totalStudents),
            atRiskCount: totalAtRisk,
            dimensions: this.getAggregatedDimensions(this.selectedHistoryData.yearData),
            assessmentName: this.selectedHistoryData.assessmentName
          };
        } else {
          // Return base historical data
          return this.selectedHistoryData;
        }
      } else {
        // Return current college data (with year filtering if applicable)
        if (this.selectedYear && this.selectedCollege.yearData && this.selectedCollege.yearData[this.selectedYear]) {
          // Return year-specific current data
          return {
            ...this.selectedCollege,
            ...this.selectedCollege.yearData[this.selectedYear],
            assessmentName: 'Current Assessment'
          };
        } else if (this.selectedCollege.yearData) {
          // Return aggregated current data from all years
          const years = Object.keys(this.selectedCollege.yearData);
          const totalStudents = years.length;
          let totalCompletion = 0;
          let totalScore = 0;
          let totalAtRisk = 0;
          
          years.forEach(year => {
            const yearData = this.selectedCollege.yearData[year];
            totalCompletion += parseInt(yearData.completionRate);
            totalScore += yearData.overallScore;
            totalAtRisk += yearData.atRiskCount;
          });
          
          return {
            ...this.selectedCollege,
            completionRate: Math.round(totalCompletion / totalStudents) + '%',
            overallScore: Math.round(totalScore / totalStudents),
            atRiskCount: totalAtRisk,
            dimensions: this.getAggregatedDimensions(this.selectedCollege.yearData),
            assessmentName: 'Current Assessment'
          };
        } else {
          // Return base current college data
          return this.selectedCollege;
        }
      }
    },
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

      // Use actual scores from current data (either selected history or current college)
      return Object.entries(this.currentData.dimensions || {}).map(([key, dimData]) => ({
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
    },
    closeHistoryPanel() {
      this.showHistoryPanel = false;
    },
    viewHistoryDetails(historyData) {
      this.selectedHistoryData = historyData;
      this.showHistoryPanel = false;
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    resetToCurrentData() {
      this.selectedHistoryData = null;
    },
    getAggregatedDimensions(yearData) {
      const years = Object.keys(yearData);
      const aggregatedDimensions = {};
      
      // Get all dimension keys from the first year
      const dimensionKeys = Object.keys(yearData[years[0]].dimensions);
      
      dimensionKeys.forEach(dimKey => {
        let totalScore = 0;
        years.forEach(year => {
          totalScore += yearData[year].dimensions[dimKey].score;
        });
        aggregatedDimensions[dimKey] = {
          score: Math.round((totalScore / years.length) * 10) / 10
        };
      });
      
      return aggregatedDimensions;
    },
    calculateAverageCompletionRate(yearData, years) {
      let totalCompletion = 0;
      years.forEach(year => {
        totalCompletion += parseInt(yearData[year].completionRate);
      });
      return Math.round(totalCompletion / years.length) + '%';
    },
    calculateAverageOverallScore(yearData, years) {
      let totalScore = 0;
      years.forEach(year => {
        totalScore += yearData[year].overallScore;
      });
      return Math.round(totalScore / years.length);
    },
    calculateTotalAtRiskCount(yearData, years) {
       let totalAtRisk = 0;
       years.forEach(year => {
         totalAtRisk += yearData[year].atRiskCount;
       });
       return totalAtRisk;
     },
     getAggregatedCompletionRate(history) {
       if (!history.yearData) return 'N/A';
       const years = Object.keys(history.yearData);
       let totalCompletion = 0;
       years.forEach(year => {
         totalCompletion += parseInt(history.yearData[year].completionRate);
       });
       return Math.round(totalCompletion / years.length) + '%';
     },
     getAggregatedOverallScore(history) {
       if (!history.yearData) return 'N/A';
       const years = Object.keys(history.yearData);
       let totalScore = 0;
       years.forEach(year => {
         totalScore += history.yearData[year].overallScore;
       });
       return Math.round(totalScore / years.length);
     },
     getAggregatedAtRiskCount(history) {
       if (!history.yearData) return 'N/A';
       const years = Object.keys(history.yearData);
       let totalAtRisk = 0;
       years.forEach(year => {
         totalAtRisk += history.yearData[year].atRiskCount;
       });
       return totalAtRisk;
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

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.year-selector label {
  font-size: 14px;
  color: #546e7a;
  font-weight: 500;
}

.year-dropdown {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #1a2e35;
  cursor: pointer;
  transition: border-color 0.2s;
}

.year-dropdown:focus {
  outline: none;
  border-color: var(--primary);
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
  background-color: #ff667d;
  color: #000000;
  border-left: 4px solid #a50b00;
}

.risk-item.medium-risk {
  background-color: #ffff6c;
  color: #000000;
  border-left: 4px solid #d4c900;
}

.risk-item.low-risk {
  background-color: #74f487;
  color: #000000;
  border-left: 4px solid #03a503;
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
.risk-legend {
  margin-top: 32px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: inline-block;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.legend-box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #ccc;
}
.legend-label {
  font-size: 14px;
  color: #1a2e35;
  font-weight: 500;
}

.history-indicator {
  margin-top: 10px;
  padding: 8px 12px;
  background: #e3f2fd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #1976d2;
}

.reset-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background: #1565c0;
}

.history-button {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #546e7a;
  transition: all 0.2s;
  margin-left: auto;
}

.history-button:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.history-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.history-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 1000px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a2e35;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #546e7a;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #e0e0e0;
  color: #1a2e35;
}

.history-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.history-table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.history-table th,
.history-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.history-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #1a2e35;
  position: sticky;
  top: 0;
}

.history-table td {
  color: #546e7a;
}

.view-details-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.view-details-btn:hover {
  background: #00a8a5;
}
</style>