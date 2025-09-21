<template>
  <div class="college-detail-container" v-if="selectedCollege">
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
      <button class="history-button" @click="openHistoryPanel" :disabled="loadingHistory">
        <i class="fas fa-history" v-if="!loadingHistory"></i>
        <i class="fas fa-spinner fa-spin" v-if="loadingHistory"></i>
        <span>{{ loadingHistory ? 'Loading...' : 'History' }}</span>
      </button>
      <div class="header-controls">
        <div class="assessment-selector">
            <label for="assessmentName">Select Assessment Name:</label>
            <select id="assessmentName" v-model="selectedAssessmentName" class="assessment-dropdown" :disabled="loadingAssessmentNames">
              <option value="">Select Assessment</option>
              <option v-for="assessmentName in assessmentNames" :key="assessmentName" :value="assessmentName">
                {{ assessmentName }}
              </option>
            </select>
          </div>
      </div>
    </div>

    <!-- Empty State when no assessment is selected -->
    <div class="empty-state" v-if="!selectedAssessmentName">
      <div class="empty-state-content">
        <i class="fas fa-clipboard-list"></i>
        <h3>Please Select Assessment Name</h3>
        <p>Choose an assessment from the dropdown above to view the college data and analytics.</p>
      </div>
    </div>

    <!-- Main content when assessment is selected -->
    <div v-else>

    <!-- College Info Card -->
    <div class="college-info-card">
      <div class="college-icon">
        <i class="fas fa-graduation-cap"></i>
      </div>
      <div class="college-details">
        <h2>{{ selectedCollege?.name || 'Loading...' }}</h2>
        <p>{{ selectedCollege?.students || 0 }} Total students</p>
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
              <span class="metric-value">{{ completionRateDisplay }}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Course</span>
                <div class="dropdown-container">
                  <select v-model="selectedCourse" class="metric-dropdown" :disabled="!selectedAssessmentName || loadingCourses">
                    <option value="">{{ loadingCourses ? 'Loading courses...' : (selectedAssessmentName ? 'All Courses' : 'Select Assessment First') }}</option>
                    <option v-for="course in availableCourses" :key="course" :value="course">{{ course }}</option>
                  </select>
                </div>
              </div>
              <!-- Hidden debug element to trigger computed property -->
              <div style="display: none;">{{ debugCourses }}</div>
          </div>
          <div class="metric-row">
            <div class="metric-item">
                <span class="metric-label">Students Year</span>
                <div class="dropdown-container">
                  <select v-model="selectedYear" class="metric-dropdown" :disabled="!selectedAssessmentName || loadingYears">
                    <option value="">{{ loadingYears ? 'Loading years...' : (selectedAssessmentName ? 'All Years' : 'Select Assessment First') }}</option>
                    <option v-for="year in availableYears" :key="year" :value="year">{{ getYearDisplayName(year) }}</option>
                  </select>
                </div>
              </div>
            <div class="metric-item" v-show="selectedYear && selectedAssessmentName">
              <span class="metric-label">Sections</span>
              <div class="dropdown-container">
                <select v-model="selectedSection" class="metric-dropdown" :disabled="!selectedAssessmentName || loadingSections || !selectedYear">
                  <option value="">{{ loadingSections ? 'Loading sections...' : 'All Sections' }}</option>
                  <option v-for="section in filteredSections" :key="section" :value="section">{{ section }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Overall Score</span>
              <span class="metric-value">{{ dynamicOverallScore || '0' }}</span>
            </div>
          </div>
        </div>
      </div>
  
      <div class="risk-distribution">
        <h3>Risk Distribution (Overall Score of Student)</h3>
        <div class="risk-stats" v-if="!loadingRiskDistribution">
          <div class="risk-item high-risk">
            <span class="risk-count">{{ riskDistribution.atRisk }}</span>
            <span class="risk-label">At Risk</span>
          </div>
          <div class="risk-item medium-risk">
            <span class="risk-count">{{ riskDistribution.moderate }}</span>
            <span class="risk-label">Moderate</span>
          </div>
          <div class="risk-item low-risk">
            <span class="risk-count">{{ riskDistribution.healthy }}</span>
            <span class="risk-label">Healthy</span>
          </div>
        </div>
        <div class="loading-risk" v-else>
          <p>Loading risk distribution...</p>
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
      
      <!-- No Data Message -->
      <div v-if="dimensions.length === 0" class="no-data-text">
        <i class="fas fa-info-circle"></i>
        <p>{{ noDataMessage }}</p>
      </div>
      
    <div class="dimensions-grid" v-else>
      <div class="dimension-card" v-for="(dimension, index) in dimensions" :key="index">
        <div class="dimension-header" :style="{ borderLeft: `4px solid ${getDimensionColor(dimension)}` }">
          <div class="dimension-title-section">
            <div class="dimension-color-indicator" :style="{ backgroundColor: getDimensionColor(dimension) }"></div>
            <h3>{{ dimension.name }}</h3>
          </div>
          <button class="expand-btn">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        
        <div class="dimension-content">
          <div class="dimension-score-section">
            <div class="score-display" :style="{ borderLeft: `4px solid ${getDimensionColor(dimension)}` }">
              <span class="score-label">Dimension Score:</span>
              <span class="score-value" style="color: black;">{{ getDisplayScore(dimension) }}</span>
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
    </div> <!-- End of main content when assessment is selected -->

    <!-- History Panel Overlay - Moved outside conditional section -->
    <div class="history-overlay" v-if="showHistoryPanel" @click="closeHistoryPanel">
      <div class="history-panel" @click.stop>
        <div class="history-header">
          <h3>Assessment History</h3>
          <button class="close-btn" @click="showHistoryPanel = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="history-content">
          <div v-if="loadingHistory" class="loading-history">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading history data...</p>
          </div>
          <div v-else-if="assessmentHistory.length === 0" class="no-history">
            <i class="fas fa-clock"></i>
            <p>No assessment history available</p>
            <small>History will appear after students are deactivated</small>
          </div>
          <div v-else class="history-table-container">
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
  
  <!-- Loading state when college data is not available -->
  <div class="loading-container" v-else>
    <div class="loading-content">
      <h3>Loading college details...</h3>
      <p>Please wait while we fetch the data.</p>
    </div>
  </div>


</template>

<script>
import { getDimensionColor, getCollegeDimensionColor, formatDimensionName, getCollegeDimensionRiskLevel } from '../Shared/RyffScoringUtils';
import { apiUrl } from '../../utils/apiUtils';

export default {
  name: 'CollegeDetail',
  props: {
    selectedCollege: {
      type: Object,
      required: true
    },
    assessmentType: {
      type: String,
      default: '42-item'
    }
  },
  data() {
    return {
      showHistoryPanel: false,
      selectedHistoryData: null,
      selectedAssessmentName: '',
      assessmentNames: [],
      loadingAssessmentNames: false,
      selectedCourse: '',
      selectedYear: '',
      selectedSection: '',
      availableCourses: [],
      loadingCourses: false,
      availableSections: [],
      loadingSections: false,
      availableYears: [],
      loadingYears: false,
      // Reactive property to trigger computed updates
      completionDataUpdateTrigger: 0,
      // Risk distribution data
      riskDistribution: {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      },
      loadingRiskDistribution: false,
      assessmentHistory: [],
      loadingHistory: false,
      
    };
  },
  watch: {
    selectedCollege: {
      handler(newVal, oldVal) {
        console.log('🏫 selectedCollege watcher triggered');
        console.log('🏫 oldVal completionData:', oldVal?.completionData);
        console.log('🏫 newVal completionData:', newVal?.completionData);
        
        if (newVal) {
          // Reset any selected history data when college changes
          this.selectedHistoryData = null;
          this.selectedAssessmentName = '';
          // Refetch assessment names for the new college
          this.fetchAssessmentNames();
          // Fetch courses immediately so course dropdown is populated
          this.fetchCoursesForAssessment();
          // Fetch college scores and risk distribution immediately
          this.fetchCollegeScores();
          this.fetchRiskDistribution();
        }
      },
      immediate: true,
      deep: true
    },
    assessmentType: {
      handler() {
        // Refetch assessment names when assessment type changes
        if (this.selectedCollege) {
          this.selectedAssessmentName = '';
          this.fetchAssessmentNames();
        }
      }
    },
    selectedAssessmentName: {
      handler(newVal, oldVal) {
        console.log('selectedAssessmentName changed from', oldVal, 'to', newVal);
        // Reset all filters when assessment changes
        this.selectedCourse = '';
        this.selectedSection = '';
        this.selectedYear = '';
        if (newVal) {
          this.fetchCoursesForAssessment();
          this.fetchYearsForAssessment();
          // Also fetch college scores for the selected assessment
          this.fetchCollegeScores();
        } else {
          this.availableCourses = [];
          this.availableSections = [];
          this.availableYears = [];
        }
      }
    },
    selectedCourse: {
      handler(newVal, oldVal) {
        console.log('selectedCourse changed from', oldVal, 'to', newVal);
        // Reset year and section when course changes
        this.selectedYear = '';
        this.selectedSection = '';
        // Always fetch college scores when course changes, even without specific assessment
        this.fetchCollegeScores();
        // Fetch years available for the selected course if no assessment is selected
        // (if assessment is selected, the selectedCourse watcher below will handle updates)
        if (!this.selectedAssessmentName) {
          this.fetchYearsForAssessment();
        }
      }
    },
    selectedYear: {
      handler(newVal, oldVal) {
        console.log('selectedYear changed from', oldVal, 'to', newVal);
        // Reset section selection when year changes
        this.selectedSection = '';
        // Always fetch updated college scores when year filter changes
        this.fetchCollegeScores();
      }
    },
    selectedSection: {
      handler(newVal, oldVal) {
        console.log('selectedSection changed from', oldVal, 'to', newVal);
        // Always fetch updated college scores when section filter changes
        this.fetchCollegeScores();
      }
    }
  },
  computed: {
    currentData() {
      // Add null checks to prevent runtime errors
      if (!this.selectedCollege) {
        return {
          name: 'Loading...',
          completionRate: '0%',
          overallScore: 0,
          atRiskCount: 0,
          dimensions: {},
          assessmentName: 'No Data'
        };
      }
      
      if (this.selectedHistoryData) {
        // If viewing historical data
        if (this.selectedAssessmentName && this.selectedHistoryData.yearData && this.selectedHistoryData.yearData[this.selectedAssessmentName]) {
          // Return assessment-specific historical data
          return {
            ...this.selectedHistoryData,
            ...this.selectedHistoryData.yearData[this.selectedAssessmentName],
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
            // Use original historical dimensions instead of averaging synthetic year data
            dimensions: this.selectedHistoryData.dimensions || {},
            assessmentName: this.selectedHistoryData.assessmentName
          };
        } else {
          // Return base historical data
          return this.selectedHistoryData;
        }
      } else {
        // Return current college data (with year filtering if applicable)
        if (this.selectedAssessmentName && this.selectedCollege.yearData && this.selectedCollege.yearData[this.selectedAssessmentName]) {
          // Return assessment-specific current data
          return {
            ...this.selectedCollege,
            ...this.selectedCollege.yearData[this.selectedAssessmentName],
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
            // Use original college dimensions instead of averaging synthetic year data
            dimensions: this.selectedCollege.dimensions,
            assessmentName: 'Current Assessment'
          };
        } else {
          // Return base current college data
          return this.selectedCollege;
        }
      }
    },
    dimensions() {
      // Add null checks to prevent runtime errors
      if (!this.currentData || !this.currentData.dimensions) {
        return [];
      }
      
      // Dynamic interpretations based on risk levels
      const getInterpretation = (dimensionKey, riskLevel) => {
        console.log('=== INTERPRETATION DEBUG ===');
        console.log('Dimension key received:', JSON.stringify(dimensionKey));
        console.log('Risk level received:', JSON.stringify(riskLevel));
        console.log('Dimension type:', typeof dimensionKey);
        console.log('Risk level type:', typeof riskLevel);
        
        const interpretations = {
          // Use original dimension keys (snake_case and camelCase) as they come from backend
          'autonomy': {
            'Healthy': 'Most students in this college demonstrate a strong sense of independence and self-direction. They are generally able to resist social pressures and make decisions based on their own values and standards. On average, their behavior is regulated from within, and they rely less on external judgments.',
            'Moderate': 'Students in this college show a balanced level of autonomy. While they are often capable of making independent decisions, they may still be influenced by social expectations or others\’ opinions. On average, they strive to maintain personal standards but sometimes seek validation or adjust their behavior based on external input.',
            'At Risk': 'Most students in this college appear to be highly influenced by the expectations and evaluations of others. They tend to rely more on external judgments when making important decisions and are likely to conform to social norms and pressures. On average, their behavior is shaped more by external approval than internal convictions.'
          },
          'environmental_mastery': {
            'Healthy': 'Most students in this college show competence in managing life\’s demands and shaping their environment. They handle responsibilities effectively and can identify opportunities that align with their goals and values. On average, they demonstrate adaptability and initiative in creating supportive contexts for themselves.',
            'Moderate': 'Students in this college show a reasonable ability to manage their environment. They generally cope with everyday tasks, though they may occasionally feel uncertain or passive in more complex situations. On average, they demonstrate some control but may still benefit from additional support in navigating external demands.',
            'At Risk': 'Most students in this college experience difficulty managing their environment and daily responsibilities. They may feel powerless to influence their circumstances and often fail to act on available opportunities. On average, they show a sense of disconnection or lack of control in relation to the external world.'
          },
          'environmentalMastery': {
            'Healthy': 'Most students in this college show competence in managing life\’s demands and shaping their environment. They handle responsibilities effectively and can identify opportunities that align with their goals and values. On average, they demonstrate adaptability and initiative in creating supportive contexts for themselves.',
            'Moderate': 'Students in this college show a reasonable ability to manage their environment. They generally cope with everyday tasks, though they may occasionally feel uncertain or passive in more complex situations. On average, they demonstrate some control but may still benefit from additional support in navigating external demands.',
            'At Risk': 'Most students in this college experience difficulty managing their environment and daily responsibilities. They may feel powerless to influence their circumstances and often fail to act on available opportunities. On average, they show a sense of disconnection or lack of control in relation to the external world.'
          },
          'personal_growth': {
            'Healthy': 'Most students in this college perceive themselves as growing and developing over time. They are generally open to new experiences and aware of their evolving potential. On average, they reflect continuous learning, adaptability, and meaningful positive change.',
            'Moderate': 'Students in this college show some signs of personal growth but may not consistently feel a strong sense of progress. While they occasionally engage in self-reflection and development, they sometimes struggle with direction or motivation. On average, growth is present but may be slow or uneven.',
            'At Risk': 'Most students in this college report feeling stagnant and disconnected from a sense of personal development. They may lack interest in new experiences and find it difficult to adopt new perspectives. On average, their sense of growth and self-improvement is limited or diminished.'
          },
          'personalGrowth': {
            'Healthy': 'Most students in this college perceive themselves as growing and developing over time. They are generally open to new experiences and aware of their evolving potential. On average, they reflect continuous learning, adaptability, and meaningful positive change.',
            'Moderate': 'Students in this college show some signs of personal growth but may not consistently feel a strong sense of progress. While they occasionally engage in self-reflection and development, they sometimes struggle with direction or motivation. On average, growth is present but may be slow or uneven.',
            'At Risk': 'Most students in this college report feeling stagnant and disconnected from a sense of personal development. They may lack interest in new experiences and find it difficult to adopt new perspectives. On average, their sense of growth and self-improvement is limited or diminished.'
          },
          'positive_relations': {
            'Healthy': 'Most students in this college demonstrate the capacity to form deep, trusting, and emotionally fulfilling relationships. They show concern for others\’ well-being and display empathy, affection, and cooperation. On average, students value emotional closeness and meaningful connections.',
            'Moderate': 'Students in this college show some ability to maintain positive relationships but may find it challenging to engage in deeper emotional connections. While they value social interaction, they may sometimes hold back emotionally or avoid vulnerability. On average, relationships are present but not always consistent in depth or satisfaction.',
            'At Risk': 'Most students in this college have difficulty building or sustaining trusting and meaningful relationships. They may feel emotionally disconnected or isolated in their interactions. On average, they show lower levels of warmth, openness, or willingness to compromise, which can hinder lasting social bonds.'
          },
          'positiveRelations': {
            'Healthy': 'Most students in this college demonstrate the capacity to form deep, trusting, and emotionally fulfilling relationships. They show concern for others\’ well-being and display empathy, affection, and cooperation. On average, students value emotional closeness and meaningful connections.',
            'Moderate': 'Students in this college show some ability to maintain positive relationships but may find it challenging to engage in deeper emotional connections. While they value social interaction, they may sometimes hold back emotionally or avoid vulnerability. On average, relationships are present but not always consistent in depth or satisfaction.',
            'At Risk': 'Most students in this college have difficulty building or sustaining trusting and meaningful relationships. They may feel emotionally disconnected or isolated in their interactions. On average, they show lower levels of warmth, openness, or willingness to compromise, which can hinder lasting social bonds.'
          },
          'Positive Relations with Others': {
            'Healthy': 'Most students in this college demonstrate the capacity to form deep, trusting, and emotionally fulfilling relationships. They show concern for others\’ well-being and display empathy, affection, and cooperation. On average, students value emotional closeness and meaningful connections.',
            'Moderate': 'Students in this college show some ability to maintain positive relationships but may find it challenging to engage in deeper emotional connections. While they value social interaction, they may sometimes hold back emotionally or avoid vulnerability. On average, relationships are present but not always consistent in depth or satisfaction.',
            'At Risk': 'Most students in this college have difficulty building or sustaining trusting and meaningful relationships. They may feel emotionally disconnected or isolated in their interactions. On average, they show lower levels of warmth, openness, or willingness to compromise, which can hinder lasting social bonds.'
          },
          'purpose_in_life': {
             'Healthy': 'Most students in this college demonstrate a strong sense of purpose and direction in life. They have clear goals and derive meaning from their past and present experiences. On average, their beliefs and values provide guidance, giving their lives a coherent and motivating structure.',
             'Moderate': 'Students in this college show some awareness of purpose and direction, but may also experience periods of uncertainty or lack of clarity. They often set short-term goals but may struggle to connect them with a deeper sense of meaning. On average, their sense of purpose is present but not fully established.',
             'At Risk': 'Most students in this college appear to lack clear goals or a strong sense of meaning in life. They may feel disconnected from both their past experiences and future aspirations. On average, the group shows lower motivation and direction, which can contribute to a sense of aimlessness.'
           },
           'purposeInLife': {
             'Healthy': 'Most students in this college demonstrate a strong sense of purpose and direction in life. They have clear goals and derive meaning from their past and present experiences. On average, their beliefs and values provide guidance, giving their lives a coherent and motivating structure.',
             'Moderate': 'Students in this college show some awareness of purpose and direction, but may also experience periods of uncertainty or lack of clarity. They often set short-term goals but may struggle to connect them with a deeper sense of meaning. On average, their sense of purpose is present but not fully established.',
             'At Risk': 'Most students in this college appear to lack clear goals or a strong sense of meaning in life. They may feel disconnected from both their past experiences and future aspirations. On average, the group shows lower motivation and direction, which can contribute to a sense of aimlessness.'
           },
           'self_acceptance': {
              'Healthy': 'Most students in this college demonstrate a positive and accepting attitude toward themselves. They are aware of both strengths and shortcomings and reflect on their life experiences with appreciation and self-respect. On average, they show psychological maturity and inner peace.',
              'Moderate': 'Students in this college show partial self-acceptance. While they acknowledge certain strengths, they may also experience recurring doubts or dissatisfaction with aspects of themselves or their past. On average, they are working toward greater self-understanding but have not fully resolved internal conflicts.',
              'At Risk': 'Most students in this college express dissatisfaction with themselves and their life experiences. They may feel regretful about past events or critical of personal traits. On average, there is a stronger desire to be different, reflecting challenges with self-worth and acceptance.'
            },
            'selfAcceptance': {
              'Healthy': 'Most students in this college demonstrate a positive and accepting attitude toward themselves. They are aware of both strengths and shortcomings and reflect on their life experiences with appreciation and self-respect. On average, they show psychological maturity and inner peace.',
              'Moderate': 'Students in this college show partial self-acceptance. While they acknowledge certain strengths, they may also experience recurring doubts or dissatisfaction with aspects of themselves or their past. On average, they are working toward greater self-understanding but have not fully resolved internal conflicts.',
              'At Risk': 'Most students in this college express dissatisfaction with themselves and their life experiences. They may feel regretful about past events or critical of personal traits. On average, there is a stronger desire to be different, reflecting challenges with self-worth and acceptance.'
            }
        };
        
        console.log('Available interpretation keys:', Object.keys(interpretations));
        console.log('Looking for key:', dimensionKey, 'in interpretations');
        console.log('Found dimension object:', interpretations[dimensionKey]);
        
        // Fix case sensitivity issue - handle risk level formatting
        // Convert 'at-risk' to 'At Risk' and capitalize other risk levels
        let capitalizedRiskLevel;
        if (riskLevel === 'at-risk') {
          capitalizedRiskLevel = 'At Risk';
        } else {
          capitalizedRiskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase();
        }
        console.log('Original risk level:', riskLevel, '-> Capitalized:', capitalizedRiskLevel);
        
        const result = interpretations[dimensionKey]?.[capitalizedRiskLevel] || 'No interpretation available.';
        console.log('Final interpretation result:', result);
        
        return result;
      };

      // Use actual scores from current data (either selected history or current college)
      const dimensionsData = this.currentData.dimensions || {};
      console.log('🔍 Raw dimensionsData:', dimensionsData);
      
      // Create a Set to track unique dimension keys to prevent duplicates
      const uniqueDimensions = new Map();
      
      Object.entries(dimensionsData).forEach(([key, dimData]) => {
        // Handle both structures: {score: X, riskLevel: Y} from CollegeView and {score: X} from yearData
        let score = dimData.score || dimData.averageScore || dimData || 0;
        
        // Ensure score is a valid number
        if (typeof score !== 'number' || isNaN(score)) {
          // Try to parse as number if it's a string
          if (typeof score === 'string') {
            const parsed = parseFloat(score);
            score = isNaN(parsed) ? 0 : parsed;
          } else {
            score = 0;
          }
        }
        
        const riskLevel = dimData.riskLevel || this.getRiskLevelFromScore(score);
        
        // Debug logging to see actual dimension keys and lookup results
        console.log('🔍 Dimension key:', key, 'Risk level:', riskLevel);
        const interpretation = getInterpretation(key, riskLevel);
        console.log('📝 Interpretation result:', interpretation);
        
        // Use formatted dimension name as key to prevent duplicates
        const formattedName = formatDimensionName(key);
        
        // Only add if not already present (prevents duplicates)
        if (!uniqueDimensions.has(formattedName)) {
          uniqueDimensions.set(formattedName, {
            name: formattedName,
            averageScore: score, // Keep for backward compatibility
            score: score, // Add for new API format
            dimensionKey: key,
            interpretation: interpretation,
            recommendation: 'No recommendation available.' // Keep existing recommendations for now
          });
        }
      });
      
      return Array.from(uniqueDimensions.values());
    },
    filteredSections() {
      // If no year is selected or "All Years" is selected, return empty array
      if (!this.selectedYear || this.selectedYear === '') {
        return [];
      }
      
      // Filter sections based on selected year
      return this.availableSections.filter(section => {
        // Extract year number from section name (e.g., "BSIT 2A" -> "2")
        const yearMatch = section.match(/\b(\d+)[A-Z]?\b/);
        if (yearMatch) {
          const sectionYear = parseInt(yearMatch[1]);
          const selectedYearNum = parseInt(this.selectedYear);
          return sectionYear === selectedYearNum;
        }
        return false;
      });
    },
    dynamicOverallScore() {
      // Calculate overall score by summing all dimension scores
      if (!this.selectedCollege || !this.selectedCollege.dimensions) {
        return 0;
      }
      
      // Use the raw college data directly from API, not the processed currentData
      const dimensionsData = this.selectedCollege.dimensions || {};
      let totalScore = 0;
      
      Object.entries(dimensionsData).forEach(([key, dimData]) => {
        // Handle both structures: {score: X} from API and {averageScore: X} from historical
        const score = dimData.score || dimData.averageScore || 0;
        if (score > 0) {
          totalScore += score;
        }
      });
      
      // Return the sum of all dimension scores (not average)
      return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
    },
    completionRateDisplay() {
      // Use reactive trigger to ensure updates
      this.completionDataUpdateTrigger; // Access to make it reactive
      
      // Use real completion data from the API
      console.log('🔍 completionRateDisplay computed called');
      console.log('🔍 selectedCollege exists:', !!this.selectedCollege);
      console.log('🔍 selectedAssessmentName:', this.selectedAssessmentName);
      console.log('🔍 selectedYear:', this.selectedYear);
      console.log('🔍 selectedSection:', this.selectedSection);
      
      // If no assessment is selected yet, show a placeholder
      if (!this.selectedAssessmentName) {
        console.log('ℹ️ No assessment selected yet, showing placeholder');
        return 'Select Assessment';
      }
      
      if (this.selectedCollege) {
        // If a specific assessment is selected, use data for that assessment
        if (this.selectedAssessmentName && this.selectedCollege.completionDataByAssessment) {
          const assessmentData = this.selectedCollege.completionDataByAssessment[this.selectedAssessmentName];
          if (assessmentData) {
            console.log('✅ Using assessment-specific completion data:', assessmentData);
            return `${assessmentData.completed || 0}/${assessmentData.total || 0}`;
          }
        }
        
        // Fallback to aggregated completion data if available
        if (this.selectedCollege.completionData) {
          const { completed, total } = this.selectedCollege.completionData;
          console.log('✅ Using aggregated completion data:', { completed, total });
          return `${completed || 0}/${total || 0}`;
        }
      }
      
      // If assessment is selected but no completion data is available, check if it's still loading or failed
      console.log('⏳ Assessment selected but completion data not loaded yet');
      
      // If completion data is explicitly null, it means the API call failed
      if (this.selectedCollege && this.selectedCollege.completionData === null) {
        console.log('❌ Completion data failed to load');
        return 'No Data';
      }
      
      return 'Loading...';
    },
    noDataMessage() {
      // Get the selected filters from the component data
      const selectedCourse = this.selectedCourse;
      const selectedYear = this.selectedYear;
      const selectedSection = this.selectedSection;
      
      // Build filter description parts
      let filterParts = [];
      
      if (selectedCourse && selectedCourse !== '' && selectedCourse !== 'All Courses') {
        filterParts.push(`${selectedCourse}`);
      }
      
      if (selectedYear && selectedYear !== '' && selectedYear !== 'All Years') {
        const yearText = selectedYear == 1 ? '1st year' : 
                        selectedYear == 2 ? '2nd year' : 
                        selectedYear == 3 ? '3rd year' : 
                        selectedYear == 4 ? '4th year' : 
                        `${selectedYear} year`;
        filterParts.push(yearText);
      }
      
      if (selectedSection && selectedSection !== '' && selectedSection !== 'All Sections') {
        filterParts.push(`from ${selectedSection}`);
      }
      
      // Construct the message based on applied filters
      if (filterParts.length > 0) {
        const filterText = filterParts.join(' ');
        return `There are no ${filterText} students who have answered the assessment yet.`;
      } else {
        // No specific filters, general message
        return 'There are no students who have answered the assessment yet.';
      }
    },
    // Debug computed property to track courses
    debugCourses() {
      console.log('🔍 COMPUTED debugCourses triggered');
      console.log('🔍 availableCourses:', this.availableCourses);
      console.log('🔍 availableCourses length:', this.availableCourses ? this.availableCourses.length : 'undefined');
      console.log('🔍 availableCourses type:', typeof this.availableCourses);
      console.log('🔍 selectedAssessmentName:', this.selectedAssessmentName);
      console.log('🔍 loadingCourses:', this.loadingCourses);
      return this.availableCourses;
    }
  },
  methods: {
    goBack() {
      // Emit the event for parent component to handle
      this.$emit('go-back');
      
      // Also handle router navigation as fallback
      // Navigate back to college summary if parent doesn't handle the event
      setTimeout(() => {
        if (this.$route.name === 'CollegeDetail') {
          this.$router.push('/counselor/college-summary');
        }
      }, 100);
    },
    getRiskLevelFromScore(score) {
      // Convert assessment type format to match RyffScoringUtils expectations
      const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
      return getCollegeDimensionRiskLevel(score, dbAssessmentType);
    },
    getDisplayScore(dimension) {
      // Handle both score formats: averageScore (historical) and score (API)
      let score = dimension.score || dimension.averageScore || 0;
      
      // Ensure score is a valid number
      if (typeof score !== 'number' || isNaN(score)) {
        // Try to parse as number if it's a string
        if (typeof score === 'string') {
          const parsed = parseFloat(score);
          score = isNaN(parsed) ? 0 : parsed;
        } else {
          score = 0;
        }
      }
      
      // Format score to show appropriate decimal places
      if (score === 0) {
        return '0';
      }
      
      // If it's a whole number, show without decimals
      if (score % 1 === 0) {
        return score.toString();
      }
      
      // Otherwise, show with up to 2 decimal places
      return parseFloat(score.toFixed(2)).toString();
    },
    getDimensionColor(dimensionOrKey) {
      // Handle both dimension object and dimension key
      let dimension;
      if (typeof dimensionOrKey === 'object') {
        // If passed a dimension object, use it directly
        dimension = dimensionOrKey;
      } else {
        // If passed a dimension key, find the dimension
        dimension = this.dimensions.find(d => d.dimensionKey === dimensionOrKey);
      }
      
      // Use the same logic as getDisplayScore to get the actual score
      const actualScore = dimension ? (dimension.score || dimension.averageScore || 0) : 0;
      
      if (actualScore > 0) {
        return getCollegeDimensionColor(actualScore, this.assessmentType);
      }
      return '#6c757d'; // Gray for no data
    },
    async openHistoryPanel() {
      console.log('🔍 openHistoryPanel called');
      console.log('🔍 selectedCollege:', this.selectedCollege);
      console.log('🔍 assessmentType:', this.assessmentType);
      this.showHistoryPanel = true;
      console.log('🔍 showHistoryPanel set to:', this.showHistoryPanel);
      await this.fetchCollegeHistory();
    },
    closeHistoryPanel() {
      this.showHistoryPanel = false;
    },
    async fetchCollegeHistory(filters = {}) {
      console.log('🔍 fetchCollegeHistory called with filters:', filters);
      if (!this.selectedCollege) {
        console.log('❌ No selectedCollege, returning early');
        return;
      }
      
      this.loadingHistory = true;
      console.log('🔍 loadingHistory set to true');
      try {
        // Convert assessment type to backend format
        const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
        
        // Build query parameters
        const params = new URLSearchParams({
          college: this.selectedCollege.name,
          assessmentType: dbAssessmentType
        });
        
        // Add filter parameters if provided
        if (filters.yearLevel) {
          params.append('yearLevel', filters.yearLevel);
        }
        if (filters.section) {
          params.append('section', filters.section);
        }
        if (this.selectedAssessmentName) {
          params.append('assessmentName', this.selectedAssessmentName);
        }
        
        const url = apiUrl(`accounts/colleges/history?${params.toString()}`);
        console.log('🔍 Fetching college history for:', {
          college: this.selectedCollege.name,
          assessmentType: dbAssessmentType,
          url: url
        });
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 College history response:', data);
          
          if (data.success && data.history) {
            console.log('✅ History data found, transforming...');
            // Transform the history data to match the expected format
            this.assessmentHistory = data.history.map((historyItem, index) => ({
              id: index + 1,
              date: historyItem.archivedAt,
              period: this.formatDate(historyItem.archivedAt),
              assessmentName: historyItem.assessmentName,
              dimensions: historyItem.dimensions,
              totalStudents: historyItem.totalStudents,
              // Calculate completion rate and overall score from dimensions
              completionRate: '100%', // Default since archived data represents completed assessments
              overallScore: this.calculateOverallScoreFromDimensions(historyItem.dimensions),
              atRiskCount: this.calculateAtRiskFromDimensions(historyItem.dimensions),
              // Add filtering metadata for year level and section filtering
              filteringMetadata: data.filteringMetadata || {}
            }));
            console.log('✅ assessmentHistory set to:', this.assessmentHistory);
            console.log('🔍 First history item filteringMetadata:', this.assessmentHistory[0]?.filteringMetadata);
          } else {
            console.log('ℹ️ No history data available in response');
            this.assessmentHistory = [];
          }
        } else {
          console.error('❌ Failed to fetch college history:', response.status);
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          this.assessmentHistory = [];
        }
      } catch (error) {
        console.error('❌ Error fetching college history:', error);
        this.assessmentHistory = [];
      } finally {
        this.loadingHistory = false;
        console.log('🔍 loadingHistory set to false');
        console.log('🔍 Final assessmentHistory length:', this.assessmentHistory.length);
        console.log('🔍 Final showHistoryPanel:', this.showHistoryPanel);
      }
    },
    calculateOverallScoreFromDimensions(dimensions) {
      if (!dimensions || Object.keys(dimensions).length === 0) {
        return 0;
      }
      
      let totalScore = 0;
      Object.values(dimensions).forEach(dimension => {
        totalScore += dimension.score || 0;
      });
      
      return Math.round(totalScore);
    },
    calculateAtRiskFromDimensions(dimensions) {
      if (!dimensions || Object.keys(dimensions).length === 0) {
        return 0;
      }
      
      let atRiskCount = 0;
      Object.values(dimensions).forEach(dimension => {
        if (dimension.riskLevel === 'at_risk') {
          atRiskCount++;
        }
      });
      
      return atRiskCount;
     },
     async applyHistoryFilters(filters) {
       console.log('🔍 applyHistoryFilters called with:', filters);
       
       // Refetch college history with the applied filters
       await this.fetchCollegeHistory(filters);
       

     },
     formatDate(dateString) {
       if (!dateString) return 'N/A';
       
       try {
         const date = new Date(dateString);
         return date.toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'short',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         });
       } catch (error) {
         console.error('Error formatting date:', error);
         return 'Invalid Date';
       }
     },
    viewHistoryDetails(historyData) {
      // Navigate to the dedicated history detail page
      const collegeId = encodeURIComponent(this.selectedCollege.name);
      const assessmentName = encodeURIComponent(historyData.assessmentName);
      
      this.$router.push({
        name: 'CollegeHistoryDetail',
        params: { 
          collegeId,
          assessmentName
        },
        query: { 
          assessmentType: this.assessmentType 
        }
      });
      
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
        
        // If only one year, return the exact score as integer to avoid unnecessary decimals
        // If multiple years, format to 2 decimal places for proper averaging
        const averageScore = totalScore / years.length;
        aggregatedDimensions[dimKey] = {
          score: years.length === 1 ? Math.round(averageScore) : parseFloat(averageScore.toFixed(2))
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
     async fetchCollegeScores() {
       if (!this.selectedCollege) {
         return;
       }
       
       try {
         // Convert assessment type to backend format
         const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
         
         // Build query parameters for college scores
         const params = new URLSearchParams();
         params.append('college', this.selectedCollege.name);
         params.append('assessmentType', dbAssessmentType);
         
         // Only add assessment name if one is selected
         if (this.selectedAssessmentName) {
           params.append('assessmentName', this.selectedAssessmentName);
         }
         
         // Add course filter if selected
         if (this.selectedCourse && this.selectedCourse !== '' && this.selectedCourse !== 'All Courses') {
           params.append('course', this.selectedCourse);
         }
         
         // Add year and section filters if selected
         if (this.selectedYear && this.selectedYear !== '' && this.selectedYear !== 'All Years') {
           params.append('yearLevel', this.selectedYear);
         }
         
         if (this.selectedSection && this.selectedSection !== '' && this.selectedSection !== 'All Sections') {
           params.append('section', this.selectedSection);
         }
         
         console.log('🔍 Fetching college scores with filters:', {
           college: this.selectedCollege.name,
           assessmentType: dbAssessmentType,
           assessmentName: this.selectedAssessmentName || 'All Assessments',
           course: this.selectedCourse,
           yearLevel: this.selectedYear,
           section: this.selectedSection
         });
         
         const response = await fetch(apiUrl(`accounts/colleges/scores?${params.toString()}`), {
           method: 'GET',
           credentials: 'include',
           headers: {
             'Content-Type': 'application/json'
           }
         });
         
         if (response.ok) {
           const data = await response.json();
           console.log('🔍 College scores API response:', data);
           if (data.success && data.colleges && data.colleges.length > 0) {
             // Find the college data for this specific college
             const collegeData = data.colleges.find(c => c.name === this.selectedCollege.name);
             console.log('🔍 Found collegeData for', this.selectedCollege.name, ':', collegeData);
             if (collegeData) {
               // Update dimensions if available
               if (collegeData.dimensions) {
                 console.log('📊 Updating dimensions:', collegeData.dimensions);
                 // Update the selected college's dimensions with the filtered data
                 this.$emit('update-college-dimensions', {
                   collegeName: this.selectedCollege.name,
                   dimensions: collegeData.dimensions
                 });
                 
                 // Replace local college data for immediate display (don't merge to avoid accumulation)
                 this.selectedCollege.dimensions = collegeData.dimensions;
               } else {
                 // Clear dimensions if no data available for this filter
                 console.log('❌ No dimensions found, clearing existing dimensions');
                 this.selectedCollege.dimensions = {};
                 this.$emit('update-college-dimensions', {
                   collegeName: this.selectedCollege.name,
                   dimensions: {}
                 });
               }
               
               // Check for completion data in different possible locations
               console.log('🔍 Checking for completion data...');
               console.log('🔍 collegeData.completionData:', collegeData.completionData);
               console.log('🔍 collegeData.completion:', collegeData.completion);
               console.log('🔍 collegeData keys:', Object.keys(collegeData));
               
               // Update completion data if available (check multiple possible property names)
                if (collegeData.completionData) {
                  console.log('📊 Updating completion data from completionData:', collegeData.completionData);
                  // Direct assignment for Vue 3 reactivity
                  this.selectedCollege.completionData = collegeData.completionData;
                  console.log('✅ After assignment, selectedCollege.completionData:', this.selectedCollege.completionData);
                  // Trigger reactive update
                  this.completionDataUpdateTrigger++;
                } else if (collegeData.completion) {
                  console.log('📊 Updating completion data from completion:', collegeData.completion);
                  // Direct assignment for Vue 3 reactivity
                  this.selectedCollege.completionData = collegeData.completion;
                  console.log('✅ After assignment, selectedCollege.completionData:', this.selectedCollege.completionData);
                  // Trigger reactive update
                  this.completionDataUpdateTrigger++;
                } else {
                  console.log('❌ No completion data found in API response');
                  console.log('❌ Setting completionData to null');
                  // Direct assignment for Vue 3 reactivity
                  this.selectedCollege.completionData = null;
                  // Trigger reactive update
                  this.completionDataUpdateTrigger++;
                }
                
                // Also handle the new completionDataByAssessment field
                if (collegeData.completionDataByAssessment) {
                  console.log('📊 Updating completionDataByAssessment:', collegeData.completionDataByAssessment);
                  this.selectedCollege.completionDataByAssessment = collegeData.completionDataByAssessment;
                  // Trigger reactive update
                  this.completionDataUpdateTrigger++;
                }
                
                // Fetch risk distribution after college scores are updated
                this.fetchRiskDistribution();
             } else {
               console.log('❌ No college data found for:', this.selectedCollege.name);
               // Clear all data when no college data is found for the selected filters
               console.log('🧹 Clearing dimensions and completion data due to no data for filters');
               this.selectedCollege.dimensions = {};
               this.selectedCollege.completionData = null;
               this.selectedCollege.completionDataByAssessment = {};
               this.completionDataUpdateTrigger++;
               
               // Clear risk distribution as well
               this.riskDistribution = {
                 atRisk: 0,
                 moderate: 0,
                 healthy: 0
               };
               
               this.$emit('update-college-dimensions', {
                 collegeName: this.selectedCollege.name,
                 dimensions: {}
               });
             }
           } else {
             console.log('❌ API response structure invalid or no colleges data:', { success: data.success, colleges: data.colleges });
             // Clear all data when API returns no colleges or invalid structure
             console.log('🧹 Clearing all data due to invalid API response or no colleges');
             this.selectedCollege.dimensions = {};
             this.selectedCollege.completionData = null;
             this.selectedCollege.completionDataByAssessment = {};
             this.completionDataUpdateTrigger++;
             
             // Clear risk distribution as well
             this.riskDistribution = {
               atRisk: 0,
               moderate: 0,
               healthy: 0
             };
             
             this.$emit('update-college-dimensions', {
               collegeName: this.selectedCollege.name,
               dimensions: {}
             });
           }
         } else {
           console.error('❌ API response not ok:', response.status, response.statusText);
           if (response.status === 401) {
             console.error('❌ Authentication required - user may need to log in');
           }
         }
       } catch (error) {
         console.error('Error fetching college scores for assessment:', error);
         // Set completion data to null on error to stop loading state
         this.selectedCollege.completionData = null;
         this.completionDataUpdateTrigger++;
       }
     },
     getAggregatedCompletionRate(history) {
       // Return the completion rate directly from the history item
       // Since archived data represents completed assessments, it should be 100%
       return history.completionRate || '100%';
     },
     getAggregatedOverallScore(history) {
       // Return the overall score directly from the history item
       return history.overallScore || 'N/A';
     },
     getAggregatedAtRiskCount(history) {
       // Return the at-risk count directly from the history item
       return history.atRiskCount || 0;
     },
     async fetchAssessmentNames() {
        this.loadingAssessmentNames = true;
        try {
          // Build query parameters
          const params = new URLSearchParams();
          
          // Add college name if available (use college_scores table filtering)
          if (this.selectedCollege && this.selectedCollege.name) {
            params.append('college', this.selectedCollege.name);
          }
          
          // Add assessment type filter to match the selected filter from college summary
          if (this.assessmentType) {
            const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
            params.append('assessmentType', dbAssessmentType);
          }
          
          // Use the new endpoint that fetches from college_scores table
          const url = apiUrl(`accounts/colleges/assessment-names${params.toString() ? '?' + params.toString() : ''}`);
          
          console.log('🔍 Fetching assessment names with assessmentType filter:', this.assessmentType);
          
          const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.success) {
            this.assessmentNames = data.assessmentNames || [];
          } else {
            console.error('Failed to fetch assessment names:', data.message);
            this.assessmentNames = [];
          }
        } catch (error) {
          console.error('Error fetching assessment names:', error);
          this.assessmentNames = [];
        } finally {
          this.loadingAssessmentNames = false;
        }
      },
      async fetchCoursesForAssessment() {
        console.log('🔍 fetchCoursesForAssessment called');
        console.log('  selectedAssessmentName:', this.selectedAssessmentName);
        console.log('  selectedCollege:', this.selectedCollege);
        
        if (!this.selectedCollege) {
          console.log('  ❌ Missing college, clearing courses');
          this.availableCourses = [];
          return;
        }

        console.log('  ⏳ Starting to fetch courses...');
        this.loadingCourses = true;
        try {
          // Build query parameters
          const params = new URLSearchParams();
          
          // Add assessment type
          if (this.assessmentType) {
            const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
            params.append('assessmentType', dbAssessmentType);
          }
          
          // Add specific assessment name
          if (this.selectedAssessmentName) {
            params.append('assessmentName', this.selectedAssessmentName);
          }

          const url = apiUrl(`accounts/colleges/${encodeURIComponent(this.selectedCollege.name)}/assessment-filters?${params.toString()}`);
          console.log('  🌐 API URL:', url);
          console.log('  📋 Query params:', params.toString());
          console.log('  🏢 College name:', this.selectedCollege.name);
          console.log('  📝 Assessment name:', this.selectedAssessmentName);
          console.log('  🎯 Assessment type:', this.assessmentType);
          
          const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('  📡 Response status:', response.status);
          console.log('  📡 Response ok:', response.ok);

          if (!response.ok) {
            console.error('  ❌ HTTP error! status:', response.status);
            const errorText = await response.text();
            console.error('  ❌ Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('🔍 FULL API Response:', JSON.stringify(data, null, 2));
          console.log('🔍 data.success:', data.success);
          console.log('🔍 data.data:', data.data);
          console.log('🔍 data.data?.courses:', data.data?.courses);
          console.log('🔍 data.courses (direct):', data.courses);
          console.log('🔍 Response structure keys:', Object.keys(data));
          
          // Check multiple possible response structures
          let courses = [];
          if (data.success && data.data && data.data.courses) {
            courses = data.data.courses;
            console.log('✅ Found courses in data.data.courses:', courses);
          } else if (data.success && data.courses) {
            courses = data.courses;
            console.log('✅ Found courses in data.courses:', courses);
          } else if (data.courses) {
            courses = data.courses;
            console.log('✅ Found courses directly:', courses);
          } else {
            console.error('❌ No courses found in response structure');
            console.error('❌ Available keys:', Object.keys(data));
          }
          
          console.log('🔍 Before assignment - this.availableCourses:', this.availableCourses);
          this.availableCourses = courses;
          console.log('🔍 After assignment - this.availableCourses:', this.availableCourses);
          console.log('🔍 availableCourses length:', this.availableCourses.length);
          
          // Force Vue reactivity
          this.$nextTick(() => {
            console.log('🔄 Next tick - availableCourses:', this.availableCourses);
          });
        } catch (error) {
          console.error('Error fetching courses for assessment:', error);
          this.availableCourses = [];
        } finally {
          this.loadingCourses = false;
        }
      },
      async fetchSectionsForAssessment() {
        // This method is now handled by fetchYearsForAssessment since both come from the same endpoint
        // Keep this method for backward compatibility but delegate to fetchYearsForAssessment
        await this.fetchYearsForAssessment();
      },
      async fetchYearsForAssessment() {
         if (!this.selectedCollege) {
           this.availableYears = [];
           this.availableSections = [];
           return;
         }
 
         this.loadingYears = true;
         this.loadingSections = true;
         try {
          // Build query parameters
          const params = new URLSearchParams();
          params.append('collegeName', this.selectedCollege.name);
          
          // Add assessment type
          if (this.assessmentType) {
            const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
            params.append('assessmentType', dbAssessmentType);
          }
          
          // Add specific assessment name
          if (this.selectedAssessmentName) {
            params.append('assessmentName', this.selectedAssessmentName);
          }
          
          // Add course filter for cascading behavior
          if (this.selectedCourse && this.selectedCourse !== '' && this.selectedCourse !== 'All Courses') {
            params.append('course', this.selectedCourse);
          }

          const url = apiUrl(`accounts/colleges/${encodeURIComponent(this.selectedCollege.name)}/assessment-filters?${params.toString()}`);
          
          const response = await fetch(url, {
             method: 'GET',
             credentials: 'include',
             headers: {
               'Content-Type': 'application/json'
             }
           });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('API Response for assessment filters:', data);
          if (data.success) {
            this.availableYears = data.data.yearLevels || [];
            // Also update sections from the same endpoint
            this.availableSections = data.data.sections || [];
            console.log('Updated availableYears:', this.availableYears);
            console.log('Updated availableSections:', this.availableSections);
          } else {
            console.error('Failed to fetch assessment filters:', data.message);
            this.availableYears = [];
          }
        } catch (error) {
          console.error('Error fetching years for assessment:', error);
          this.availableYears = [];
        } finally {
           this.loadingYears = false;
           this.loadingSections = false;
         }
         
         // Note: fetchCollegeScores will be called by watchers when filters change
         // No need to call it here to avoid duplicate API calls
      },
      getYearDisplayName(year) {
        // Convert numeric year level to display format
        const yearMap = {
          1: '1st Year',
          2: '2nd Year', 
          3: '3rd Year',
          4: '4th Year'
        };
        return yearMap[year] || `${year} Year`;
      },
      
      // Fetch risk distribution using the new optimized endpoint
      async fetchRiskDistribution() {
        if (!this.selectedCollege) {
          return;
        }
        
        this.loadingRiskDistribution = true;
        
        try {
          // Build query parameters for the new risk distribution endpoint
          const params = new URLSearchParams({
            college: this.selectedCollege.name
          });
          
          // Add assessment name only if selected
          if (this.selectedAssessmentName) {
            params.append('assessmentName', this.selectedAssessmentName);
          }
          
          // Add optional filters if selected
          if (this.selectedCourse && this.selectedCourse !== '' && this.selectedCourse !== 'All Courses') {
            params.append('course', this.selectedCourse);
          }
          
          if (this.selectedYear && this.selectedYear !== 'All Years') {
            params.append('yearLevel', this.selectedYear);
          }
          
          if (this.selectedSection && this.selectedSection !== 'All Sections') {
            params.append('section', this.selectedSection);
          }
          
          console.log('🔍 Fetching risk distribution from assessment_assignments:', {
            college: this.selectedCollege.name,
            assessmentName: this.selectedAssessmentName || 'All Assessments',
            course: this.selectedCourse,
            yearLevel: this.selectedYear,
            section: this.selectedSection
          });
          
          const response = await fetch(apiUrl(`counselor-assessments/risk-distribution?${params.toString()}`), {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🔍 Risk distribution API response:', data);
            
            if (data.success && data.data) {
              // Use the pre-calculated risk distribution from the new endpoint
              const riskDistribution = data.data.riskDistribution;
              
              console.log('📊 Risk distribution from assessment_assignments:', {
                atRisk: riskDistribution.atRisk,
                moderate: riskDistribution.moderate,
                healthy: riskDistribution.healthy,
                total: riskDistribution.total,
                filters: data.data.filters
              });
              
              // Update risk distribution data
              this.riskDistribution = {
                atRisk: riskDistribution.atRisk,
                moderate: riskDistribution.moderate,
                healthy: riskDistribution.healthy
              };
            } else {
              console.log('❌ No risk distribution data found in API response');
              this.riskDistribution = { atRisk: 0, moderate: 0, healthy: 0 };
            }
          } else {
            console.error('❌ Failed to fetch risk distribution:', response.status);
            this.riskDistribution = { atRisk: 0, moderate: 0, healthy: 0 };
          }
        } catch (error) {
          console.error('❌ Error fetching risk distribution:', error);
          this.riskDistribution = { atRisk: 0, moderate: 0, healthy: 0 };
        } finally {
          this.loadingRiskDistribution = false;
        }
      }
  },
  watch: {
    selectedAssessmentName(newValue, oldValue) {
      console.log('🔍 selectedAssessmentName watcher triggered:', { newValue, oldValue });
      if (newValue && newValue !== oldValue) {
        console.log('🔍 Fetching data for new assessment:', newValue);
        // Fetch courses for the selected assessment
        this.fetchCoursesForAssessment();
        // Fetch years and sections for the selected assessment
        this.fetchYearsForAssessment();
        // Fetch college scores for the new assessment to update dimension analysis
        this.fetchCollegeScores();
        // Fetch risk distribution for the new assessment
        this.fetchRiskDistribution();
      }
    },
    
    // Watch for course, year and section changes to update both risk distribution and dimension scores
    selectedCourse() {
      if (this.selectedAssessmentName) {
        this.fetchCollegeScores(); // Update dimension analysis scores
        this.fetchRiskDistribution(); // Update risk distribution
      }
    },
    
    selectedYear() {
      if (this.selectedAssessmentName) {
        this.fetchCollegeScores(); // Update dimension analysis scores
        this.fetchRiskDistribution(); // Update risk distribution
      }
    },
    
    selectedSection() {
      if (this.selectedAssessmentName) {
        this.fetchCollegeScores(); // Update dimension analysis scores
        this.fetchRiskDistribution(); // Update risk distribution
      }
    }
  },
  mounted() {
    console.log('🔄 CollegeDetail mounted');
    console.log('📍 Selected college:', this.selectedCollege);
    console.log('🎯 Assessment type:', this.assessmentType);
    console.log('🌐 Route query params:', this.$route.query);
    console.log('🌐 Route params:', this.$route.params);
    console.log('📋 Initial assessment names:', this.assessmentNames);
    console.log('📋 Initial selected assessment:', this.selectedAssessmentName);
    
    // Fetch assessment names when component is mounted
    this.fetchAssessmentNames();
    // Fetch courses and risk distribution if college and assessment are already selected
    if (this.selectedCollege && this.selectedAssessmentName) {
      console.log('🚀 Auto-fetching courses and risk distribution');
      this.fetchCoursesForAssessment();
      this.fetchRiskDistribution();
    } else {
      console.log('⏸️ Not auto-fetching - college:', !!this.selectedCollege, 'assessment:', !!this.selectedAssessmentName);
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
}

.assessment-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assessment-selector label {
  font-size: 14px;
  color: #546e7a;
  font-weight: 500;
}

.assessment-dropdown {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #1a2e35;
  cursor: pointer;
  transition: border-color 0.2s;
}

.assessment-dropdown:focus {
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

.dropdown-container {
  width: 100%;
}

.metric-dropdown {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  transition: border-color 0.2s;
}

.metric-dropdown:focus {
  outline: none;
  border-color: var(--primary);
}

.metric-dropdown:hover {
  border-color: var(--primary);
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

.no-data-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  margin: 20px 0;
}

.no-data-text i {
  color: #6c757d;
  font-size: 18px;
}

.no-data-text p {
  margin: 0;
  color: #6c757d;
  font-style: italic;
  font-size: 16px;
  text-align: center;
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

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.loading-content {
  text-align: center;
  color: #546e7a;
}

.loading-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a2e35;
}

.loading-content p {
  margin: 0;
  font-size: 14px;
  color: #546e7a;
}

/* Empty State Styles */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 12px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
  padding: 40px 20px;
}

.empty-state-content i {
  font-size: 48px;
  color: #e0e0e0;
  margin-bottom: 20px;
}

.empty-state-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a2e35;
  margin: 0 0 12px 0;
}

/* History Panel Loading and Empty States */
.loading-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-history i {
  font-size: 32px;
  color: var(--primary);
  margin-bottom: 16px;
}

.loading-history p {
  margin: 0;
  font-size: 16px;
  color: #546e7a;
  font-weight: 500;
}

.no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-history i {
  font-size: 48px;
  color: #e0e0e0;
  margin-bottom: 20px;
}

.no-history p {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a2e35;
}

.no-history small {
  font-size: 14px;
  color: #546e7a;
  margin: 0;
}

/* History Button Loading State */
.history-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.history-button:disabled:hover {
  background: var(--primary);
  transform: none;
}

.empty-state-content p {
  font-size: 14px;
  color: #546e7a;
  margin: 0;
  line-height: 1.5;
}
</style>