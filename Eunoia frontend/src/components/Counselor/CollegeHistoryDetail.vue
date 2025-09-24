<template>
  <div class="college-detail-container" v-if="historyData">
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
        <div class="history-indicator">
          <i class="fas fa-history"></i>
          <span>Archived on {{ formatDate(historyData?.date) }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State when no assessment is selected -->
    <div class="empty-state" v-if="!historyData?.assessmentName">
      <div class="empty-state-content">
        <i class="fas fa-clipboard-list"></i>
        <h3>No Assessment Data Available</h3>
        <p>No historical assessment data found for this college.</p>
      </div>
    </div>

    <!-- Main content when assessment data is available -->
    <div v-else>

    <!-- College Info Card -->
    <div class="college-info-card">
      <div class="college-icon">
        <i class="fas fa-graduation-cap"></i>
      </div>
      <div class="college-details">
        <h2>{{ collegeName }}</h2>
        <p>{{ historyData?.totalStudents || 0 }} Total students</p>
        <span class="risk-level medium-risk">Historical Data</span>
        
        <!-- College metrics -->
        <div class="college-metrics">
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Completion Rate</span>
              <span class="metric-value">{{ getCompletionRate() }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Students Year</span>
              <div class="dropdown-container">
                <select v-model="selectedYear" class="metric-dropdown" :disabled="loadingFilters">
                  <option value="">All Years</option>
                  <option v-for="year in availableYears" :key="year" :value="year">
                    {{ getYearDisplayName(year) }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">Overall Score</span>
              <span class="metric-value">{{ getOverallScore() }}</span>
            </div>
            <div class="metric-item" v-show="selectedYear">
              <span class="metric-label">Sections</span>
              <div class="dropdown-container">
                <select v-model="selectedSection" class="metric-dropdown" :disabled="loadingFilters || !selectedYear">
                  <option value="">All Sections</option>
                  <option v-for="section in filteredSections" :key="section" :value="section">
                    {{ section }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <div class="risk-distribution">
        <h3>Risk Distribution (Overall Score of Student)</h3>
        <div class="risk-stats">
          <div class="risk-item high-risk">
            <span class="risk-count">{{ getRiskDistribution().atRisk }}</span>
            <span class="risk-label">At Risk</span>
          </div>
          <div class="risk-item medium-risk">
            <span class="risk-count">{{ getRiskDistribution().moderate }}</span>
            <span class="risk-label">Moderate</span>
          </div>
          <div class="risk-item low-risk">
            <span class="risk-count">{{ getRiskDistribution().healthy }}</span>
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
      <div class="dimension-card" v-for="(dimension, key) in filteredDimensions" :key="key">
        <div class="dimension-header" :style="{ borderLeft: `4px solid ${getDimensionColor(dimension)}` }">
          <div class="dimension-title-section">
            <div class="dimension-color-indicator" :style="{ backgroundColor: getDimensionColor(dimension) }"></div>
            <h3>{{ getDimensionName(key) }}</h3>
          </div>
          <button class="expand-btn">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        
        <div class="dimension-content">
          <div class="dimension-score-section">
            <div class="score-display" :style="{ borderLeft: `4px solid ${getDimensionColor(dimension)}` }">
              <span class="score-label">Dimension Score:</span>
              <span class="score-value" style="color: black;">{{ formatScore(dimension.score) }}</span>
            </div>
            <div class="score-interpretation">
              <h4>Score Interpretation</h4>
              <p>{{ getScoreInterpretation(dimension.score, key) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    </div>
    </div> <!-- End of main content when assessment data is available -->
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
import { getCollegeDimensionColor, getCollegeDimensionRiskLevel } from '../Shared/RyffScoringUtils';
import { apiUrl } from '../../utils/apiUtils.js';

export default {
  name: 'CollegeHistoryDetail',
  props: {
    collegeName: {
      type: String,
      required: true
    },
    assessmentName: {
      type: String,
      default: null
    },
    assessmentType: {
      type: String,
      default: '42-item'
    }
  },
  data() {
    return {
      selectedYear: '',
      selectedSection: '',
      availableYears: [],
      availableSections: [],
      loadingFilters: false,
      historyData: null,
      loading: true,
      error: null,
      
    };
  },
  watch: {
    collegeName: {
      handler() {
        this.fetchHistoryData();
      },
      immediate: true
    },
    assessmentName: {
      handler() {
        this.fetchHistoryData();
      }
    },
    historyData: {
      handler(newData) {
        if (newData && typeof newData === 'object' && Object.keys(newData).length > 0) {
          this.initializeFilters();
        } else {
          // Reset filters when historyData becomes null/undefined
          this.availableYears = [];
          this.availableSections = [];
        }
      },
      immediate: true
    },
    selectedYear: {
      handler(newVal, oldVal) {
        console.log('selectedYear changed from', oldVal, 'to', newVal);
        // Only apply filters if this is a user-initiated change, not programmatic
        if (oldVal !== undefined && oldVal !== newVal) {
          // Reset section selection when year changes (same as original CollegeDetail)
          this.selectedSection = '';
          this.applyFilters();
        }
      }
    },
    selectedSection: {
      handler(newVal, oldVal) {
        console.log('selectedSection changed from', oldVal, 'to', newVal);
        // Only apply filters if this is a user-initiated change, not programmatic
        if (oldVal !== undefined && oldVal !== newVal) {
          this.applyFilters();
        }
      }
    }
  },
  mounted() {
    this.fetchHistoryData();
  },
  computed: {
    currentHistoryData() {
      return this.historyData;
    },
    filteredDimensions() {
      // Since we're now using API-based filtering, just return the dimensions from historyData
      // The API handles all filtering logic and returns the properly filtered data
      console.log('📊 Preserved/Reset filters - Year:', this.selectedYear, 'Section:', this.selectedSection);
      console.log('🔍 filteredDimensions called, historyData:', this.historyData);
      console.log('🔍 historyData.dimensions:', this.historyData?.dimensions);
      console.log('🔍 dimensions count:', Object.keys(this.historyData?.dimensions || {}).length);
      
      return this.historyData?.dimensions || {};
    },

    filteredSections() {
      // If no year is selected or "All Years" is selected, return all sections
      if (!this.selectedYear || this.selectedYear === '') {
        return this.availableSections;
      }
      
      // Filter sections based on selected year (same logic as original CollegeDetail)
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
    
    currentHistoryData() {
      // Return filtered history data based on current selections
      if (!this.historyData) return null;
      
      // If no filters applied, return original data
      if (!this.selectedYear && !this.selectedSection) {
        return this.historyData;
      }
      
      // Create filtered version of history data
      const filteredData = {
        ...this.historyData,
        dimensions: this.filteredDimensions,
        // Update metadata to reflect filtering
        _filterStatus: {
          year: this.selectedYear || 'All',
          section: this.selectedSection || 'All',
          isFiltered: !!(this.selectedYear || this.selectedSection)
        }
      };
      
      return filteredData;
    }
  },
  methods: {
    goBack() {
      // Navigate back to college detail or college summary
      const collegeId = encodeURIComponent(this.collegeName);
      this.$router.push({
        name: 'CollegeDetail',
        params: { collegeId },
        query: { assessmentType: this.assessmentType }
      });
    },
    async fetchHistoryData(yearLevel = null, section = null) {
      if (!this.collegeName) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
        const params = new URLSearchParams({
          college: this.collegeName,
          assessmentType: dbAssessmentType
        });
        
        if (this.assessmentName) {
          params.append('assessmentName', this.assessmentName);
        }
        
        // Add filter parameters if provided
        if (yearLevel) {
          params.append('yearLevel', yearLevel);
        }
        
        if (section) {
          params.append('section', section);
        }
        
        console.log('📊 Fetching college history with filters:', {
          college: this.collegeName,
          assessmentType: dbAssessmentType,
          assessmentName: this.assessmentName,
          yearLevel,
          section
        });
        
        const url = apiUrl(`accounts/colleges/history?${params.toString()}`);
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          console.log('📊 College history API response:', data);
          
          if (data.success && data.history && data.history.length > 0) {
            // Update available filters from API response
            if (data.filteringMetadata) {
              this.availableYears = data.filteringMetadata.availableYearLevels || [];
              this.availableSections = data.filteringMetadata.availableSections || [];
            }
            
            // If assessmentName is specified, find that specific assessment
            if (this.assessmentName) {
              console.log('🔍 Looking for assessment:', this.assessmentName);
              console.log('🔍 Available assessments:', data.history.map(h => h.assessmentName));
              
              const specificHistory = data.history.find(h => h.assessmentName === this.assessmentName);
              if (specificHistory) {
                console.log('✅ Found matching assessment:', specificHistory.assessmentName);
                console.log('🔍 History structure:', specificHistory);
                console.log('🔍 Colleges in history:', specificHistory.colleges);
                
                // Extract dimensions and risk distribution from the first college in the history
                const firstCollege = specificHistory.colleges && specificHistory.colleges.length > 0 ? specificHistory.colleges[0] : null;
                const dimensions = firstCollege ? firstCollege.dimensions : {};
                const riskDistribution = firstCollege ? firstCollege.riskDistribution : null;
                
                console.log('🔍 Extracted dimensions:', dimensions);
                console.log('🔍 Dimensions count:', Object.keys(dimensions).length);
                console.log('🔍 Extracted risk distribution:', riskDistribution);
                
                this.historyData = {
                  ...specificHistory,
                  date: specificHistory.archivedAt,
                  completionRate: '100%',
                  dimensions: dimensions, // Extract dimensions from college data
                  riskDistribution: riskDistribution, // Extract risk distribution from college data
                  filteringMetadata: data.filteringMetadata
                };
              } else {
                console.log('❌ Assessment not found in history');
                console.log('🔍 Exact comparison results:');
                data.history.forEach((h, index) => {
                  console.log(`${index}: "${h.assessmentName}" === "${this.assessmentName}" = ${h.assessmentName === this.assessmentName}`);
                });
                this.error = 'Assessment not found in history';
              }
            } else {
              // Take the first (most recent) history item
              const latestHistory = data.history[0];
              console.log('🔍 Using latest history:', latestHistory);
              console.log('🔍 Latest history colleges:', latestHistory.colleges);
              
              // Extract dimensions and risk distribution from the first college in the history
              const firstCollege = latestHistory.colleges && latestHistory.colleges.length > 0 ? latestHistory.colleges[0] : null;
              const dimensions = firstCollege ? firstCollege.dimensions : {};
              const riskDistribution = firstCollege ? firstCollege.riskDistribution : null;
              
              console.log('🔍 Latest extracted dimensions:', dimensions);
              console.log('🔍 Latest dimensions count:', Object.keys(dimensions).length);
              console.log('🔍 Latest extracted risk distribution:', riskDistribution);
              
              this.historyData = {
                ...latestHistory,
                date: latestHistory.archivedAt,
                completionRate: '100%',
                dimensions: dimensions, // Extract dimensions from college data
                riskDistribution: riskDistribution, // Extract risk distribution from college data
                filteringMetadata: data.filteringMetadata
              };
            }
          } else {
            this.error = 'No history data available';
            // Still update available filters even if no data
            if (data.filteringMetadata) {
              this.availableYears = data.filteringMetadata.availableYearLevels || [];
              this.availableSections = data.filteringMetadata.availableSections || [];
            }
          }
        } else {
          this.error = 'Failed to fetch history data';
        }
      } catch (error) {
        console.error('Error fetching history data:', error);
        this.error = 'Error loading history data';
      } finally {
        this.loading = false;
      }
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
        return 'Invalid Date';
      }
    },
    getCompletionRate() {
      if (!this.currentHistoryData || !this.currentHistoryData.totalStudents) {
        return '0/0';
      }
      
      // For historical data, we assume all students in the history completed the assessment
      // since it's archived data from when the assessment was actually completed
      const completed = this.currentHistoryData.totalStudents;
      const total = this.currentHistoryData.totalStudents;
      
      return `${completed}/${total}`;
    },
    getOverallScore() {
      // Calculate overall score from current dimensions (filtered or original)
      if (!this.currentHistoryData?.dimensions) return '0';
      
      let totalScore = 0;
      const dimensions = this.currentHistoryData.dimensions;
      
      if (dimensions && typeof dimensions === 'object') {
        Object.values(dimensions).forEach(dimension => {
          if (dimension && typeof dimension.score === 'number') {
            totalScore += dimension.score;
          }
        });
      }
      
      return this.formatScore(totalScore);
    },
    getRiskDistribution() {
      if (!this.currentHistoryData) {
        return {
          atRisk: 0,
          moderate: 0,
          healthy: 0
        };
      }
      
      // Use the actual risk distribution calculated by the backend
      if (this.currentHistoryData.riskDistribution) {
        return {
          atRisk: this.currentHistoryData.riskDistribution.at_risk || 0,
          moderate: this.currentHistoryData.riskDistribution.moderate || 0,
          healthy: this.currentHistoryData.riskDistribution.healthy || 0
        };
      }
      
      // Fallback to zero if no risk distribution data available
      return {
        atRisk: 0,
        moderate: 0,
        healthy: 0
      };
    },
    getDimensionName(key) {
      const dimensionNames = {
        'autonomy': 'Autonomy',
        'environmental_mastery': 'Environmental Mastery',
        'personal_growth': 'Personal Growth',
        'positive_relations': 'Positive Relations with Others',
        'purpose_in_life': 'Purpose in Life',
        'self_acceptance': 'Self-Acceptance'
      };
      return dimensionNames[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
    getDimensionColor(dimension) {
      const score = dimension?.score || 0;
      if (score > 0) {
        return getCollegeDimensionColor(score, this.assessmentType);
      }
      return '#6c757d'; // Gray for no data
    },
    formatScore(score) {
      if (!score || score === 0) return '0';
      if (score % 1 === 0) return score.toString();
      return parseFloat(score.toFixed(2)).toString();
    },
    getScoreInterpretation(score, dimensionKey) {
      // Get risk level from score to determine interpretation
      const dbAssessmentType = this.assessmentType === '42-item' ? 'ryff_42' : 'ryff_84';
      const riskLevel = this.getCollegeDimensionRiskLevel(score, dbAssessmentType);
      
      // Dynamic interpretations based on risk levels (same as CollegeDetail.vue)
      const interpretations = {
        // Use original dimension keys (snake_case and camelCase) as they come from backend
        'autonomy': {
          'Healthy': 'Most students in this college demonstrate a strong sense of independence and self-direction. They are generally able to resist social pressures and make decisions based on their own values and standards. On average, their behavior is regulated from within, and they rely less on external validation or approval from others.',
          'Moderate': 'Students in this college show a balanced level of autonomy. While they are often capable of making independent decisions, they may still be influenced by social expectations or others\' opinions. On average, they strive to maintain personal standards but sometimes seek validation from peers or authority figures.',
          'At Risk': 'Most students in this college may struggle with independence and self-direction. They often look to others for guidance and may have difficulty making decisions without external input. On average, they are more susceptible to social pressures and may compromise their values to fit in or gain approval.'
        },
        'environmental_mastery': {
          'Healthy': 'Most students in this college demonstrate strong environmental mastery skills. They are effective at managing daily responsibilities and can navigate complex situations with confidence. On average, they feel in control of their surroundings and are able to create environments that suit their needs and values.',
          'Moderate': 'Students in this college show moderate environmental mastery. While they can handle most daily tasks, they may occasionally feel overwhelmed by complex situations or responsibilities. On average, they are working to improve their ability to manage their environment and may benefit from additional support in certain areas.',
          'At Risk': 'Most students in this college may struggle with environmental mastery. They often feel overwhelmed by daily responsibilities and may have difficulty managing complex situations. On average, they may feel that external circumstances control their lives rather than feeling in control of their environment.'
        },
        'personal_growth': {
          'Healthy': 'Most students in this college demonstrate a strong commitment to personal growth and development. They are open to new experiences and actively seek opportunities to learn and improve themselves. On average, they view challenges as opportunities for growth and maintain a sense of curiosity about life.',
          'Moderate': 'Students in this college show some interest in personal growth but may not consistently pursue development opportunities. They are sometimes open to new experiences but may also resist change. On average, they recognize the importance of growth but may need encouragement to step outside their comfort zones.',
          'At Risk': 'Most students in this college may show limited interest in personal growth and development. They may resist new experiences or feel stuck in their current situation. On average, they may feel that they have reached their potential or may be afraid of change and new challenges.'
        },
        'positive_relations': {
          'Healthy': 'Most students in this college excel at building and maintaining positive relationships with others. They demonstrate empathy, trust, and strong communication skills in their interactions. On average, they have satisfying relationships and are able to give and receive emotional support effectively.',
          'Moderate': 'Students in this college show some ability to maintain positive relationships but may find it challenging to engage in deeper emotional connections. While they value social interaction, they may sometimes hold back emotionally or avoid vulnerability. On average, relationships may be somewhat superficial or inconsistent.',
          'At Risk': 'Most students in this college have difficulty building or sustaining trusting and meaningful relationships. They may feel emotionally disconnected or isolated in their interactions. On average, they show lower levels of warmth, openness, or willingness to compromise, which can impact their social connections.'
        },
        'purpose_in_life': {
           'Healthy': 'Most students in this college demonstrate a strong sense of purpose and direction in life. They have clear goals and derive meaning from their past and present experiences. On average, their beliefs and values provide guidance, giving their lives a coherent and motivating structure.',
           'Moderate': 'Students in this college show some awareness of purpose and direction, but may also experience periods of uncertainty or lack of clarity. They often set short-term goals but may struggle to connect them with a deeper sense of meaning. On average, their sense of purpose is present but may need strengthening.',
           'At Risk': 'Most students in this college appear to lack clear goals or a strong sense of meaning in life. They may feel disconnected from both their past experiences and future aspirations. On average, the group shows lower motivation and direction, which can contribute to a sense of aimlessness or confusion about life\'s purpose.'
         },
         'purposeInLife': {
           'Healthy': 'Most students in this college demonstrate a strong sense of purpose and direction in life. They have clear goals and derive meaning from their past and present experiences. On average, their beliefs and values provide guidance, giving their lives a coherent and motivating structure.',
           'Moderate': 'Students in this college show some awareness of purpose and direction, but may also experience periods of uncertainty or lack of clarity. They often set short-term goals but may struggle to connect them with a deeper sense of meaning. On average, their sense of purpose is present but may need strengthening.',
           'At Risk': 'Most students in this college appear to lack clear goals or a strong sense of meaning in life. They may feel disconnected from both their past experiences and future aspirations. On average, the group shows lower motivation and direction, which can contribute to a sense of aimlessness or confusion about life\'s purpose.'
         },
         'self_acceptance': {
            'Healthy': 'Most students in this college demonstrate a positive and accepting attitude toward themselves. They are aware of both strengths and shortcomings and reflect on their life experiences with appreciation and self-respect. On average, they show psychological maturity and inner confidence.',
            'Moderate': 'Students in this college show partial self-acceptance. While they acknowledge certain strengths, they may also experience recurring doubts or dissatisfaction with aspects of themselves or their past. On average, they are working toward greater self-understanding but have not yet achieved full self-acceptance.',
            'At Risk': 'Most students in this college express dissatisfaction with themselves and their life experiences. They may feel regretful about past events or critical of personal traits. On average, there is a stronger desire to be different, reflecting challenges with self-worth and acceptance.'
          },
          'selfAcceptance': {
            'Healthy': 'Most students in this college demonstrate a positive and accepting attitude toward themselves. They are aware of both strengths and shortcomings and reflect on their life experiences with appreciation and self-respect. On average, they show psychological maturity and inner confidence.',
            'Moderate': 'Students in this college show partial self-acceptance. While they acknowledge certain strengths, they may also experience recurring doubts or dissatisfaction with aspects of themselves or their past. On average, they are working toward greater self-understanding but have not yet achieved full self-acceptance.',
            'At Risk': 'Most students in this college express dissatisfaction with themselves and their life experiences. They may feel regretful about past events or critical of personal traits. On average, there is a stronger desire to be different, reflecting challenges with self-worth and acceptance.'
          }
      };
      
      // Fix case sensitivity issue - handle risk level formatting
      // Convert 'at-risk' to 'At Risk' and capitalize other risk levels
      let capitalizedRiskLevel;
      if (riskLevel === 'at-risk') {
        capitalizedRiskLevel = 'At Risk';
      } else {
        capitalizedRiskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase();
      }
      
      const dimensionInterpretations = interpretations[dimensionKey];
      if (dimensionInterpretations && dimensionInterpretations[capitalizedRiskLevel]) {
        return dimensionInterpretations[capitalizedRiskLevel];
      }
      
      // Fallback to basic interpretation if no specific interpretation found
      if (score >= 4.5) {
        return `Students in this college show excellent levels of ${this.getDimensionName(dimensionKey).toLowerCase()}. They demonstrate strong capabilities in this psychological well-being dimension.`;
      } else if (score >= 3.5) {
        return `Students in this college show moderate levels of ${this.getDimensionName(dimensionKey).toLowerCase()}. There are opportunities for growth in this area.`;
      } else {
        return `Students in this college may need additional support in ${this.getDimensionName(dimensionKey).toLowerCase()}. Consider targeted interventions for this dimension.`;
      }
    },
    getCollegeDimensionRiskLevel(score, assessmentType = null) {
      // Use the shared utility function for consistent risk level calculation
      // Import the function from RyffScoringUtils
      const { getCollegeDimensionRiskLevel } = require('../Shared/RyffScoringUtils');
      return getCollegeDimensionRiskLevel(score, assessmentType);
    },
    initializeFilters() {
      console.log('🔧 Initializing filters with historyData:', this.historyData);
      
      if (this.historyData && this.historyData.filteringMetadata) {
        console.log('✅ Found filteringMetadata:', this.historyData.filteringMetadata);
        
        // Store current selections to preserve them
        const currentYear = this.selectedYear;
        const currentSection = this.selectedSection;
        
        // Extract available years and sections from filteringMetadata
        this.availableYears = this.historyData.filteringMetadata.availableYearLevels || [];
        this.availableSections = this.historyData.filteringMetadata.availableSections || [];
        
        console.log('📊 Available years:', this.availableYears);
        console.log('📊 Available sections:', this.availableSections);
        
        // Only reset selections if this is the first initialization (both are empty)
        // Otherwise, preserve current selections if they're still valid
        if (!currentYear && !currentSection) {
          // First time initialization - reset to show all data
          this.selectedYear = '';
          this.selectedSection = '';
        } else {
          // Preserve current selections if they're still valid in the new data
          if (currentYear && this.availableYears.includes(currentYear)) {
            this.selectedYear = currentYear;
          } else {
            this.selectedYear = '';
          }
          
          if (currentSection && this.availableSections.includes(currentSection)) {
            this.selectedSection = currentSection;
          } else {
            this.selectedSection = '';
          }
        }
        
        console.log('📊 Preserved/Reset filters - Year:', this.selectedYear, 'Section:', this.selectedSection);
      } else {
        console.log('❌ No filteringMetadata found in historyData');
        this.availableYears = [];
        this.availableSections = [];
      }
    },
    async applyFilters() {
       console.log('📊 Applying filters - Year:', this.selectedYear, 'Section:', this.selectedSection);
       
       // Set loading state
       this.loadingFilters = true;
       
       try {
         // Fetch history data with filters (like original CollegeDetail.vue)
         await this.fetchHistoryData(
           this.selectedYear || null,
           this.selectedSection || null
         );
         
         // Also emit event for parent component compatibility
         this.$emit('apply-filters', {
           yearLevel: this.selectedYear || null,
           section: this.selectedSection || null
         });
       } catch (error) {
         console.error('Error applying filters:', error);
       } finally {
         this.loadingFilters = false;
       }
     },
    onYearChange() {
      console.log('📊 Year changed to:', this.selectedYear);
      // Filter application is now handled by the watch handlers
    },
    onSectionChange() {
      console.log('📊 Section changed to:', this.selectedSection);
      // Filter application is now handled by the watch handlers
    },
    getYearSuffix(year) {
      const yearNum = parseInt(year);
      if (yearNum === 1) return 'st';
      if (yearNum === 2) return 'nd';
      if (yearNum === 3) return 'rd';
      return 'th';
    },
    getYearDisplayName(year) {
      return `${year}${this.getYearSuffix(year)} Year`;
    },
    clearFilters() {
       this.selectedYear = '';
       this.selectedSection = '';
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