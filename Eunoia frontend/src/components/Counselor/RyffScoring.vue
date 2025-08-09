<template>
  <div class="ryff-scoring-container">
    <div class="scoring-header">
      <div class="header-title">
        <i class="fas fa-calculator"></i>
        <h2>Ryff Scale Automated Scoring</h2>
        <p>View automatically scored assessments and monitor student well-being</p>
      </div>
    </div>

    <!-- Risk Filter Indicator -->
    <div class="risk-filter-indicator" v-if="selectedDimension">
      <div class="indicator-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Showing <strong>only</strong> students at risk for <strong>{{ selectedDimension }}</strong> 
          <span v-if="selectedCollege !== 'all'">in <strong>{{ selectedCollege }}</strong></span>
        </span>
        <button class="clear-filter-btn" @click="clearRiskFilters">
          <i class="fas fa-times"></i> Clear Filter
        </button>
      </div>
    </div>

    <!-- View Selection Tabs -->
    <div class="view-tabs">
      <div class="tab-option" :class="{ active: currentTab === 'student' }" @click="currentTab = 'student'">
        <div class="radio-circle">
          <div class="radio-inner" v-if="currentTab === 'student'"></div>
        </div>
        <span>Student View</span>
      </div>
      <div class="tab-option" :class="{ active: currentTab === 'history' }" @click="currentTab = 'history'">
        <div class="radio-circle">
          <div class="radio-inner" v-if="currentTab === 'history'"></div>
        </div>
        <span>History View</span>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-container">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search by name, ID, or section..." v-model="searchQuery" @input="filterStudents">
      </div>
      
      <div class="filter-dropdowns">
        <div class="filter-dropdown">
          <select v-model="collegeFilter">
            <option value="all">All Colleges</option>
            <option value="CCS">CCS</option>
            <option value="CN">CN</option>
            <option value="CBA">CBA</option>
            <option value="COE">COE</option>
            <option value="CAS">CAS</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
        
        <div class="filter-dropdown" v-if="currentTab === 'student'">
          <select v-model="sectionFilter">
            <option value="all">All Sections</option>
            <option value="BSIT1A">BSIT1A</option>
            <option value="BSCS3A">BSCS3A</option>
            <option value="BSIT3A">BSIT3A</option>
            <option value="BSCE3B">BSCE3B</option>
            <option value="BSPS2B">BSPS2B</option>
            <option value="BSBA3A">BSBA3A</option>
            <option value="BSCS2B">BSCS2B</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
        
        <div class="filter-dropdown" v-if="currentTab === 'student'">
          <select v-model="riskLevelFilter">
            <option value="all">All Levels</option>
            <option value="At Risk">At Risk</option>
            <option value="Moderate">Moderate</option>
            <option value="Healthy">Healthy</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>
    </div>

    <!-- Student Data Table -->
    <div class="data-table-container" v-if="currentTab === 'student'">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>College</th>
            <th>Section</th>
            <th class="sortable" @click="sortBy('submissionDate')">
              Submission Date
              <i class="fas fa-sort"></i>
            </th>
            <th class="sortable" @click="sortBy('overallScore')">
              Overall Score
              <i class="fas fa-sort"></i>
            </th>
            <th>Dimension Risk</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in filteredStudents" :key="student?.id || index" class="student-row">
            <td>
              <div class="student-info">
                <span class="student-name">{{ student?.name || 'N/A' }}</span>
              </div>
            </td>
            <td class="student-id-cell">{{ student?.id_number || 'N/A' }}</td>
            <td>{{ student?.college || 'N/A' }}</td>
            <td>{{ student?.section || 'N/A' }}</td>
            <td>{{ student?.submissionDate || 'N/A' }}</td>
            <td>
              <span class="score">{{ calculateOverallScore(student) }}</span>
            </td>
            <td>
              <div class="dimension-risk">
                <!-- At Risk: Show count in red -->
                <span class="risk-count at-risk" v-if="getAtRiskDimensionsCount(student) > 0" title="Number of at-risk dimensions">
                  {{ getAtRiskDimensionsCount(student) }}/6
                </span>
                <!-- Moderate: Show count in yellow -->
                <span class="risk-count moderate" v-else-if="getModerateDimensionsCount(student) > 0" title="Number of moderate dimensions">
                  {{ getModerateDimensionsCount(student) }}/6
                </span>
                <!-- No Risk: When all dimensions are healthy (6/6) -->
                <span class="no-risk" v-else-if="getHealthyDimensionsCount(student) === 6" title="All dimensions are healthy">No Risk</span>
                <!-- Fallback for edge cases -->
                <span v-else class="no-data">No Data</span>
                
                <div class="risk-scores">
                  <div 
                    v-for="(score, subscale) in (student?.subscales || {})" 
                    :key="subscale"
                    v-if="score !== undefined && score !== null && (isAtRisk(score * 7) || isModerate(score * 7))"
                    class="risk-dimension-container"
                  >
                    <div class="risk-dimension-score" :class="getDimensionRiskClass(score * 7)">
                      {{ Math.round(score * 7) }}
                      <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <button class="view-button" @click="viewStudentDetails(student)">
                <i class="fas fa-eye"></i> View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- History Data Table -->
    <div class="data-table-container" v-if="currentTab === 'history'">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>College</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in filteredStudents" :key="student?.id || index" class="student-row">
            <td>{{ student?.id_number || 'N/A' }}</td>
            <td>{{ student?.name || 'N/A' }}</td>
            <td>{{ student?.college || 'N/A' }}</td>
            <td>
              <button class="history-button" @click="viewStudentHistory(student)">
                <i class="fas fa-history"></i> History
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Student Details Modal -->
    <div class="modal" v-if="showDetailsModal" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Student Assessment Details</h3>
          <button class="close-button" @click="showDetailsModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedStudent">
          <div class="student-details-header">
            <div class="student-profile">
            <h4>{{ selectedStudent?.name || 'N/A' }}</h4>
            <p>{{ selectedStudent?.id_number || 'N/A' }} • {{ selectedStudent?.college || 'N/A' }} • {{ selectedStudent?.section || 'N/A' }}</p>
          </div>
          <div class="assessment-info">
            <div class="info-item">
              <span class="info-label">Submission Date:</span>
              <span class="info-value">{{ selectedStudent?.submissionDate || 'N/A' }}</span>
            </div>
              <div class="info-item">
                <span class="info-label">Overall Score:</span>
                <span class="info-value score">{{ calculateOverallScore(selectedStudent) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">At-Risk Dimensions:</span>
                <span v-if="getAtRiskDimensionsCount(selectedStudent) > 0" class="risk-badge high-risk">
                  {{ getAtRiskDimensionsCount(selectedStudent) }} Dimension(s)
                </span>
                <span v-else-if="getModerateDimensionsCount(selectedStudent) > 0" class="risk-badge moderate">
                  {{ getModerateDimensionsCount(selectedStudent) }}/6 Moderate
                </span>
                <span v-else class="risk-badge low-risk">None</span>
              </div>
            </div>
          </div>
          
          <div class="subscale-scores">
            <h4>Subscale Scores</h4>
            <div class="subscale-grid">
              <div 
                class="subscale-item" 
                v-for="(score, subscale) in (selectedStudent?.subscales || {})" 
                :key="subscale"
                :class="{ 'at-risk': score !== undefined && score !== null && isAtRisk(score * 7) }"
              >
                <div class="subscale-header">
                  <span class="subscale-name">{{ formatSubscaleName(subscale) }}</span>
                  <span class="subscale-score">{{ (score !== undefined && score !== null) ? Math.round(score * 7) : 'N/A' }}/49</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="(score !== undefined && score !== null) ? { width: (score*7/49*100) + '%', backgroundColor: getDimensionScoreColor(score*7) } : { width: '0%' }"
                  ></div>
                </div>
                <div class="risk-status">
                  <span :class="(score !== undefined && score !== null) ? getDimensionRiskClass(score*7) : 'no-data'">
                    {{ (score !== undefined && score !== null) ? getDimensionRiskLabel(score*7) : 'No Data' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="action-buttons">
            <button class="action-btn print-btn" @click="printStudentReport(selectedStudent)">
              <i class="fas fa-print"></i> Print Report
            </button>
            <button class="action-btn contact-btn" @click="contactStudent(selectedStudent)">
              <i class="fas fa-envelope"></i> Contact Student
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Student History Modal -->
    <div class="modal" v-if="showHistoryModal" @click.self="showHistoryModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Student Assessment History</h3>
          <button class="close-button" @click="showHistoryModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedStudentForHistory">
          <div class="student-details-header">
            <div class="student-info">
              <h4>{{ selectedStudentForHistory.name }}</h4>
              <p>ID: {{ selectedStudentForHistory.id_number }} | College: {{ selectedStudentForHistory.college }} | Section: {{ selectedStudentForHistory.section }}</p>
            </div>
          </div>
          
          <div class="history-table-container">
            <div class="history-header">
              <h5>Assessment History</h5>
              <button class="view-complete-history-btn" @click="showCompleteHistoryModal = true" v-if="getStudentAssessmentHistory(selectedStudentForHistory).length > 0">
                <i class="fas fa-chart-line"></i> View Comprehensive Report
              </button>
            </div>
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Assessment Type</th>
                  <th>Overall Score</th>
                  <th>Risk Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(assessment, index) in getStudentAssessmentHistory(selectedStudentForHistory)" :key="index">
                  <td>{{ assessment.submissionDate }}</td>
                  <td>{{ assessment.assessmentType || 'Ryff PWB (42-item)' }}</td>
                  <td>{{ calculateAssessmentOverallScore(assessment) }}</td>
                  <td>
                    <span class="risk-badge" :class="hasAssessmentRisk(assessment) ? 'high-risk' : 'low-risk'">
                      {{ hasAssessmentRisk(assessment) ? 'At Risk' : 'Healthy' }}
                    </span>
                  </td>
                  <td>
                    <button class="view-details-btn" @click="viewAssessmentDetails(assessment, selectedStudentForHistory)">
                      <i class="fas fa-eye"></i> View Details
                    </button>
                  </td>
                </tr>
                <tr class="no-data" v-if="getStudentAssessmentHistory(selectedStudentForHistory).length === 0">
                  <td colspan="5">No assessment history available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Comprehensive Assessment Report Modal -->
    <div class="modal comprehensive-modal" v-if="showCompleteHistoryModal" @click.self="showCompleteHistoryModal = false">
      <div class="modal-content comprehensive-content">
        <div class="modal-header">
          <h3>Comprehensive Assessment Report</h3>
          <div class="header-actions">
            <button class="print-report-btn" @click="printComprehensiveReport()">
              <i class="fas fa-print"></i> Print Report
            </button>
            <button class="close-button" @click="showCompleteHistoryModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body comprehensive-body" v-if="selectedStudentForHistory">
          <!-- Report Header -->
          <div class="report-header">
            <div class="system-info">
              <h2>EUNOIA Well-being Assessment System</h2>
              <p>Comprehensive Assessment Report</p>
            </div>
            <div class="student-report-info">
              <div class="info-row">
                <span class="label">Student Name:</span>
                <span class="value">{{ selectedStudentForHistory.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Student ID:</span>
                <span class="value">{{ selectedStudentForHistory.id }}</span>
              </div>
              <div class="info-row">
                <span class="label">College:</span>
                <span class="value">{{ selectedStudentForHistory.college }}</span>
              </div>
              <div class="info-row">
                <span class="label">Section:</span>
                <span class="value">{{ selectedStudentForHistory.section }}</span>
              </div>
              <div class="info-row">
                <span class="label">Generated:</span>
                <span class="value">{{ formatDateShort(new Date().toISOString()) }}</span>
              </div>
            </div>
          </div>

          <!-- Assessment Summary Table -->
          <div class="report-section">
            <h4>Assessment Summary</h4>
            <table class="assessment-summary-table">
              <thead>
                <tr>
                  <th>Assessment Date</th>
                  <th>Type</th>
                  <th>Overall Score</th>
                  <th>Risk Status</th>
                  <th>At-Risk Dimensions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(assessment, index) in getStudentAssessmentHistory(selectedStudentForHistory)" :key="index">
                  <td>{{ assessment.submissionDate }}</td>
                  <td>{{ assessment.assessmentType || 'Ryff PWB (42-item)' }}</td>
                  <td class="score-cell">{{ calculateAssessmentOverallScore(assessment) }}</td>
                  <td>
                    <span class="risk-badge" :class="hasAssessmentRisk(assessment) ? 'high-risk' : 'low-risk'">
                      {{ hasAssessmentRisk(assessment) ? 'AT RISK' : 'HEALTHY' }}
                    </span>
                  </td>
                  <td>{{ getAssessmentAtRiskDimensionsCount(assessment) }}/6</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Detailed Dimension Scores -->
          <div class="report-section">
            <h4>Detailed Dimension Scores History</h4>
            <div class="dimensions-comparison">
              <table class="dimension-scores-table">
                <thead>
                  <tr>
                    <th class="dimension-header">Dimension</th>
                    <th v-for="(assessment, index) in getStudentAssessmentHistory(selectedStudentForHistory)" :key="index" class="assessment-date-header">
                      {{ formatDateShort(assessment.submissionDate) }}
                    </th>
                    <th class="trend-header">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="dimension in ryffDimensionsList" :key="dimension.key">
                    <td class="dimension-name">{{ dimension.name }}</td>
                    <td v-for="(assessment, index) in getStudentAssessmentHistory(selectedStudentForHistory)" :key="index" class="score-cell">
                      <div class="score-container">
                        <span class="score-value" :class="getDimensionScoreClass(assessment, dimension.key)">
                          {{ getDimensionScore(assessment, dimension.key) }}
                        </span>
                        <div class="score-bar">
                          <div class="score-fill" :style="getScoreBarStyle(assessment, dimension.key)"></div>
                        </div>
                      </div>
                    </td>
                    <td class="trend-cell">
                      <div class="trend-indicator" :class="getDimensionTrend(dimension.key)">
                        <i :class="getTrendIcon(dimension.key)"></i>
                        <span>{{ getTrendLabel(dimension.key) }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Progress Analysis -->
          <div class="report-section">
            <h4>Progress Analysis</h4>
            <div class="progress-analysis">
              <div class="analysis-card">
                <h5>Overall Trend</h5>
                <div class="overall-trend">
                  <div class="trend-chart">
                    <canvas ref="trendChart" width="300" height="150"></canvas>
                  </div>
                  <div class="trend-summary">
                    <p>{{ getOverallTrendSummary() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trend Analysis Information -->
          <div class="report-section">
            <h4>Trend Analysis Guide</h4>
            <div class="trend-legend">
              <div class="legend-item">
                <div class="trend-indicator trend-improving">
                  <i class="fas fa-arrow-up"></i>
                  <span>Improving</span>
                </div>
                <p>Consistent upward trend across all assessments (2+ point improvement)</p>
              </div>
              <div class="legend-item">
                <div class="trend-indicator trend-declining">
                  <i class="fas fa-arrow-down"></i>
                  <span>Declining</span>
                </div>
                <p>Consistent downward trend across all assessments (2+ point decline)</p>
              </div>
              <div class="legend-item">
                <div class="trend-indicator trend-stable">
                  <i class="fas fa-minus"></i>
                  <span>Stable</span>
                </div>
                <p>Minimal change across all assessments (less than 2 points variation)</p>
              </div>
              <div class="legend-item">
                <div class="trend-indicator trend-no-trend">
                  <i class="fas fa-question"></i>
                  <span>No Data</span>
                </div>
                <p>Insufficient assessment history (less than 2 assessments) for trend analysis</p>
              </div>
            </div>
            <div class="trend-note">
              <p><strong>Note:</strong> Trend analysis uses linear regression across ALL assessment records to calculate the overall direction of change for each psychological dimension. A 2-point threshold is used to determine significant trends in well-being indicators.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="report-footer">
            <div class="footer-info">
              <p><strong>Note:</strong> This transcript contains confidential psychological assessment data. Handle with appropriate care and in accordance with privacy regulations.</p>
              <p><strong>Generated by:</strong> EUNOIA System | <strong>Date:</strong> {{ new Date().toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  calculateOverallScore,
  getDimensionRiskLevel,
  getAtRiskDimensions,
  getAtRiskDimensionsCount,
  hasAnyRiskDimension,
  formatDimensionName
} from '../Shared/RyffScoringUtils';

export default {
  name: 'RyffScoring',
  props: {
    selectedDimension: {
      type: String,
      default: null
    },
    selectedCollege: {
      type: String,
      default: 'all'
    },
    students: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentTab: 'student',
      currentView: 'student',
      searchQuery: '',
      collegeFilter: 'all',
      sectionFilter: 'all',
      riskLevelFilter: 'all',
      sortField: 'submissionDate',
      sortDirection: 'desc',
      showDetailsModal: false,
      showHistoryModal: false,
      showCompleteHistoryModal: false,
      selectedStudent: null,
      selectedStudentForHistory: null,
      filteredStudents: [],
      ryffDimensionsList: [
        { key: 'autonomy', name: 'Autonomy' },
        { key: 'environmentalMastery', name: 'Environmental Mastery' },
        { key: 'personalGrowth', name: 'Personal Growth' },
        { key: 'positiveRelations', name: 'Positive Relations' },
        { key: 'purposeInLife', name: 'Purpose in Life' },
        { key: 'selfAcceptance', name: 'Self-Acceptance' }
      ],
      // Use the same risk threshold as the dashboard
      riskThresholds: {
        q1: 17, // Below or equal to this is "At Risk" (Q1)
        q4: 39  // Above or equal to this is "Healthy" (Q4)
      }
    };
  },
  async created() {
    // Fetch real assessment data from backend
    await this.fetchAssessmentResults();
    
    // Apply filters from props if they exist
    if (this.selectedDimension || this.selectedCollege !== 'all') {
      this.collegeFilter = this.selectedCollege;
      this.filterByDimensionAndCollege();
    } else {
      this.filterStudents();
    }
  },
  
  mounted() {
    // Double-check that filters are applied correctly after mounting
    if (this.selectedDimension) {
      // Re-apply dimension filter on component mount
      this.filterByDimensionAndCollege();
    }
  },
  methods: {
    // Fetch real assessment results from backend
    async fetchAssessmentResults() {
      try {
        // Request all results by setting a high limit
        const response = await fetch('http://localhost:3000/api/counselor-assessments/results?limit=1000', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Use session-based authentication
        });

        if (response.ok) {
          const apiResponse = await response.json();
          console.log('Fetched assessment results:', apiResponse);
          console.log('Total assessments available:', apiResponse.pagination?.total);
          console.log('Received assessments count:', apiResponse.data?.length);
          
          if (apiResponse.success && apiResponse.data) {
            // Transform the backend data to match the component's expected format
            const transformedStudents = apiResponse.data.map(assessment => {
              console.log('Processing assessment:', assessment);
              
              // Ensure scores exist and are properly formatted
              const scores = assessment.scores || {};
              console.log('Assessment scores:', scores);
              
              return {
                id: assessment.student?.id || assessment.student_id,
                name: assessment.student?.name || assessment.student_name || 'Unknown Student',
                college: assessment.student?.college || assessment.student_college || 'Unknown College',
                section: assessment.student?.section || assessment.student_section || 'Unknown Section',
                email: assessment.student?.email || assessment.student_email || '',
                submissionDate: assessment.completed_at || assessment.submission_date,
                subscales: {
                   autonomy: parseFloat(scores.autonomy) || 0,
                   environmentalMastery: parseFloat(scores.environmental_mastery) || 0,
                   personalGrowth: parseFloat(scores.personal_growth) || 0,
                   positiveRelations: parseFloat(scores.positive_relations) || 0,
                   purposeInLife: parseFloat(scores.purpose_in_life) || 0,
                   selfAcceptance: parseFloat(scores.self_acceptance) || 0
                 },
                overallScore: assessment.overall_score,
                atRiskDimensions: assessment.at_risk_dimensions || [],
                assessmentType: assessment.assessment_type,
                assignmentId: assessment.assignment?.id,
                riskLevel: assessment.risk_level,
                id_number: assessment.student?.id_number || assessment.student_id
              };
            });
            
            console.log('Transformed students data:', transformedStudents);
            
            // Update the students data with real assessment results
            this.filteredStudents = transformedStudents;
            
            // Emit the updated data to parent component if needed
            this.$emit('students-updated', transformedStudents);
          } else {
            console.error('Invalid API response structure:', apiResponse);
            // Fallback to prop data if API response is invalid
            this.filteredStudents = [...this.students];
          }
        } else {
          console.error('Failed to fetch assessment results:', response.statusText);
          // Fallback to prop data if API fails
          this.filteredStudents = [...this.students];
        }
      } catch (error) {
        console.error('Error fetching assessment results:', error);
        // Fallback to prop data if API fails
        this.filteredStudents = [...this.students];
      }
    },

    // Calculate overall score as sum of all dimension scores (scaled from 0-5 to 7-49)
    calculateOverallScore(student) {
      if (!student || !student.subscales) return 0;
      let total = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined) {
          total += Math.round(student.subscales[subscale] * 7);
        }
      }
      return total;
    },
    
    // Check if a dimension score is at risk (in Q1)
    isAtRisk(score) {
      return score <= this.riskThresholds.q1;
    },
    
    // Check if student has any at-risk dimensions
    hasAnyRiskDimension(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isAtRisk(student.subscales[subscale] * 7)) {
          return true;
        }
      }
      return false;
    },
    
    // Get count of at-risk dimensions
    getAtRiskDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isAtRisk(student.subscales[subscale] * 7)) {
          count++;
        }
      }
      return count;
    },
    
    // Get count of moderate dimensions (between at-risk and healthy)
    getModerateDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined) {
          const score = student.subscales[subscale] * 7;
          if (score > this.riskThresholds.q1 && score < this.riskThresholds.q4) {
            count++;
          }
        }
      }
      return count;
    },
    
    // Get count of healthy dimensions
    getHealthyDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined) {
          const score = student.subscales[subscale] * 7;
          if (score >= this.riskThresholds.q4) {
            count++;
          }
        }
      }
      return count;
    },
    
    // Check if dimension score is moderate
    isModerate(score) {
      return score > this.riskThresholds.q1 && score < this.riskThresholds.q4;
    },
    
    // Check if dimension score is healthy
    isHealthy(score) {
      return score >= this.riskThresholds.q4;
    },
    
    // Get color based on dimension score
    getDimensionScoreColor(score) {
      if (score <= this.riskThresholds.q1) return '#f44336';  // Red for at risk (Q1)
      if (score < this.riskThresholds.q4) return '#ff9800';  // Orange for moderate (Q2-Q3)
      return '#4caf50';  // Green for healthy (Q4)
    },
    
    // Get risk class for styling
    getDimensionRiskClass(score) {
      if (score <= this.riskThresholds.q1) return 'high-risk';
      if (score < this.riskThresholds.q4) return 'medium-risk';
      return 'low-risk';
    },
    
    // Get risk label based on score
    getDimensionRiskLabel(score) {
      if (score <= this.riskThresholds.q1) return 'AT RISK';
      if (score < this.riskThresholds.q4) return 'MODERATE';
      return 'HEALTHY';
    },
    
    filterStudents() {
      // Use filteredStudents as base if available, otherwise fall back to students prop
      const baseStudents = this.filteredStudents.length > 0 ? this.filteredStudents : this.students;
      let result = [...baseStudents];
      
      // Apply college filter
      if (this.collegeFilter !== 'all') {
        result = result.filter(student => student.college === this.collegeFilter);
      }
      
      // Apply section filter
      if (this.sectionFilter !== 'all') {
        result = result.filter(student => student.section === this.sectionFilter);
      }
      
      // Apply risk level filter - based on overall student risk profile
      if (this.riskLevelFilter !== 'all') {
        if (this.riskLevelFilter === 'At Risk') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            return atRiskCount > 0; // At risk if any dimension is at risk
          });
        } else if (this.riskLevelFilter === 'Moderate') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            const moderateCount = this.getModerateDimensionsCount(student);
            return atRiskCount === 0 && moderateCount > 0; // Moderate if no at-risk but has moderate dimensions
          });
        } else if (this.riskLevelFilter === 'Healthy') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            const moderateCount = this.getModerateDimensionsCount(student);
            return atRiskCount === 0 && moderateCount === 0; // Healthy if all dimensions are healthy
          });
        }
      }
      
      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(student => {
          if (!student) return false;
          const name = student.name?.toLowerCase() || '';
          const id = student.id?.toLowerCase() || '';
          const section = student.section?.toLowerCase() || '';
          return name.includes(query) || id.includes(query) || section.includes(query);
        });
      }
      
      // Apply sorting
      result.sort((a, b) => {
        let comparison = 0;
        
        if (this.sortField === 'overallScore') {
          comparison = this.calculateOverallScore(a) - this.calculateOverallScore(b);
        } else if (this.sortField === 'submissionDate') {
          comparison = new Date(a.submissionDate) - new Date(b.submissionDate);
        }
        
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
      
      this.filteredStudents = result;
    },
    
    // Update filterByDimensionAndCollege to use props
    filterByDimensionAndCollege() {
      // Reset other filters
      this.sectionFilter = 'all';
      this.riskLevelFilter = 'all';
      this.searchQuery = '';
      
      // Apply filtering based on dimension and college criteria
      
      // Map from dashboard dimension names to student data property names
      const dimensionMapping = {
        'Autonomy': 'autonomy',
        'Environmental Mastery': 'environmentalMastery',
        'Personal Growth': 'personalGrowth',
        'Positive Relations': 'positiveRelations',
        'Purpose in Life': 'purposeInLife',
        'Self-Acceptance': 'selfAcceptance'
      };
      
      const subscaleKey = this.selectedDimension ? dimensionMapping[this.selectedDimension] : null;
      
      if (!subscaleKey && this.selectedDimension) {
        console.error(`Unknown dimension: ${this.selectedDimension}`);
        return;
      }
      
      // Start with all students - use fetched data if available, otherwise fall back to prop data
      const baseStudents = this.filteredStudents.length > 0 ? this.filteredStudents : this.students;
      let result = [...baseStudents];
      // Filter students based on criteria
      
      // Apply both filters at once to ensure correct results
      result = result.filter(student => {
        if (!student || !student.subscales) return false;

        // Check college filter
        const collegeMatch = this.collegeFilter === 'all' || student.college === this.collegeFilter;
        
        // Check dimension filter if applicable
        let dimensionMatch = true;
        if (subscaleKey && student.subscales[subscaleKey] !== undefined) {
          const score = student.subscales[subscaleKey] * 7; // Scale to 7-49 range
          dimensionMatch = score <= this.riskThresholds.q1;
          // Student risk assessment check
        } else if (subscaleKey) {
          dimensionMatch = false;
        }
        
        const shouldInclude = collegeMatch && dimensionMatch;
        return shouldInclude;
      });
      
      // Update filtered results
      
      this.filteredStudents = result;
    },
    
    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'desc';
      }
      this.filterStudents();
    },
    getRiskClass(riskLevel) {
      if (riskLevel === 'High Risk') return 'high-risk';
      if (riskLevel === 'Medium Risk') return 'medium-risk';
      return 'low-risk';
    },
    formatSubscaleName(subscale) {
      if (subscale === 'autonomy') return 'Autonomy';
      if (subscale === 'environmentalMastery') return 'Environmental Mastery';
      if (subscale === 'personalGrowth') return 'Personal Growth';
      if (subscale === 'positiveRelations') return 'Positive Relations';
      if (subscale === 'purposeInLife') return 'Purpose in Life';
      if (subscale === 'selfAcceptance') return 'Self-Acceptance';
      
      // Fallback to the original formatting logic
      const formatted = subscale.replace(/([A-Z])/g, ' $1').trim();
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    viewStudentDetails(student) {
      this.selectedStudent = student;
      this.showDetailsModal = true;
    },
    viewStudentHistory(student) {
      this.selectedStudentForHistory = student;
      this.showHistoryModal = true;
    },
    contactStudent(student) {
      if (!student) {
        console.error('No student data provided');
        alert('Error: No student data available');
        return;
      }
      
      // Contact student via email
        const studentEmail = student.email;
      
      const subject = encodeURIComponent(`Follow-up on Your Well-being Assessment - ${student.name}`);
      
      const body = encodeURIComponent(
        `Dear ${student.name},\n\n` +
        `I hope this email finds you well. I am reaching out regarding your recent psychological well-being assessment submission.\n\n` +
        `Student Details:\n` +
        `- Name: ${student.name}\n` +
        `- Student ID: ${student.id_number}\n` +
        `- College: ${student.college}\n` +
        `- Section: ${student.section}\n` +
        `- Assessment Date: ${student.submissionDate}\n\n` +
        `Please feel free to reach out if you have any questions or would like to discuss your results.\n\n` +
        `Best regards,\n` +
        `Counseling Services`
      );
      
      // Open Gmail directly with pre-filled compose window
      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(studentEmail)}&su=${subject}&body=${body}`;
      // Open Gmail compose window
      
      try {
        // Open Gmail compose in a new tab
        window.open(gmailComposeUrl, '_blank');
      } catch (error) {
        console.error('Error opening Gmail:', error);
        // Fallback to mailto if Gmail URL fails
        const mailtoLink = `mailto:${studentEmail}?subject=${subject}&body=${body}`;
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    getStudentEmail(student) {
      // First, try to get email directly from student data (from AccountManagement)
      if (student.email) {
        return student.email;
      }
      
      // Fallback: create dynamic email map from current students prop
      const studentEmailMap = {};
      this.students.forEach(s => {
        if (s.email) {
          studentEmailMap[s.id] = s.email;
        }
      });
      
      // Try to get email from the dynamic map
      if (studentEmailMap[student.id]) {
        return studentEmailMap[student.id];
      }
      
      // Fallback: generate email based on name if not found in map
      const emailDomain = '@student.university.edu';
      const emailPrefix = student.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
      return emailPrefix + emailDomain;
    },
    // Print student report - navigate to Reports with pre-selected student
    printStudentReport(student) {
      if (!student) {
        console.error('No student data provided for report generation');
        alert('Error: No student data available for report generation');
        return;
      }
      
      // Generate individual student report
      
      // Close the modal first
      this.showDetailsModal = false;
      
      // Emit event to parent component to navigate to Reports with pre-selected student
      this.$emit('navigate-to-reports', {
        student: student,
        reportType: 'individual'
      });
    },
    
    // Get assessment history for a student
    getStudentAssessmentHistory(student) {
      if (!student || !student.assessmentHistory) {
        // Fallback: create single assessment from current data
        return [{
          submissionDate: student?.submissionDate || 'N/A',
          assessmentType: 'Ryff PWB (42-item)',
          subscales: student?.subscales || {}
        }];
      }
      return student.assessmentHistory;
    },
    
    // Calculate overall score for a specific assessment
    calculateAssessmentOverallScore(assessment) {
      if (!assessment || !assessment.subscales) return 0;
      let total = 0;
      let count = 0;
      
      Object.values(assessment.subscales).forEach(score => {
        if (score !== undefined && score !== null) {
          total += score * 7; // Scale from 1-5 to 7-35
          count++;
        }
      });
      
      return count > 0 ? Math.round(total / count) : 0;
    },
    
    // Check if an assessment has any risk dimensions
    hasAssessmentRisk(assessment) {
      if (!assessment || !assessment.subscales) return false;
      
      return Object.values(assessment.subscales).some(score => {
        if (score === undefined || score === null) return false;
        const scaledScore = score * 7; // Scale to 7-49 range
        return scaledScore <= this.riskThresholds.q1;
      });
    },

    // Comprehensive report methods
    getAssessmentAtRiskDimensionsCount(assessment) {
      if (!assessment || !assessment.subscales) return 0;
      let count = 0;
      for (const subscale in assessment.subscales) {
        if (assessment.subscales[subscale] !== undefined && this.isAtRisk(assessment.subscales[subscale] * 7)) {
          count++;
        }
      }
      return count;
    },

    formatDateShort(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },

    getDimensionScore(assessment, dimensionKey) {
      if (!assessment || !assessment.subscales || assessment.subscales[dimensionKey] === undefined) {
        return 'N/A';
      }
      return Math.round(assessment.subscales[dimensionKey] * 7);
    },

    getDimensionScoreClass(assessment, dimensionKey) {
      if (!assessment || !assessment.subscales || assessment.subscales[dimensionKey] === undefined) {
        return 'no-data';
      }
      const score = assessment.subscales[dimensionKey] * 7;
      return this.getDimensionRiskClass(score);
    },

    getScoreBarStyle(assessment, dimensionKey) {
      if (!assessment || !assessment.subscales || assessment.subscales[dimensionKey] === undefined) {
        return { width: '0%', backgroundColor: '#e0e0e0' };
      }
      const score = assessment.subscales[dimensionKey] * 7;
      const percentage = (score / 49) * 100;
      return {
        width: percentage + '%',
        backgroundColor: this.getDimensionScoreColor(score)
      };
    },

    calculateLinearRegressionSlope(scores) {
      const n = scores.length;
      if (n < 2) return 0;
      
      // Create x values (time points: 0, 1, 2, ...)
      const xValues = Array.from({length: n}, (_, i) => i);
      
      // Calculate means
      const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
      const yMean = scores.reduce((sum, y) => sum + y, 0) / n;
      
      // Calculate slope using least squares method
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (xValues[i] - xMean) * (scores[i] - yMean);
        denominator += (xValues[i] - xMean) ** 2;
      }
      
      return denominator === 0 ? 0 : numerator / denominator;
    },

    getDimensionTrend(dimensionKey) {
      const history = this.getStudentAssessmentHistory(this.selectedStudentForHistory);
      if (history.length < 2) return 'no-trend';
      
      const scores = history.map(assessment => {
        if (!assessment.subscales || assessment.subscales[dimensionKey] === undefined) return null;
        return assessment.subscales[dimensionKey] * 7;
      }).filter(score => score !== null);
      
      if (scores.length < 2) return 'no-trend';
      
      // Use linear regression to calculate trend across ALL assessment records
      const slope = this.calculateLinearRegressionSlope(scores);
      const totalChange = slope * (scores.length - 1);
      
      // Consider both slope significance and total change magnitude
      if (Math.abs(totalChange) < 2) return 'stable';
      return totalChange > 0 ? 'improving' : 'declining';
    },

    getTrendIcon(dimensionKey) {
      const trend = this.getDimensionTrend(dimensionKey);
      switch (trend) {
        case 'improving': return 'fas fa-arrow-up';
        case 'declining': return 'fas fa-arrow-down';
        case 'stable': return 'fas fa-minus';
        default: return 'fas fa-question';
      }
    },

    getTrendLabel(dimensionKey) {
      const trend = this.getDimensionTrend(dimensionKey);
      switch (trend) {
        case 'improving': return 'Improving';
        case 'declining': return 'Declining';
        case 'stable': return 'Stable';
        default: return 'No Data';
      }
    },

    getOverallTrendSummary() {
      const history = this.getStudentAssessmentHistory(this.selectedStudentForHistory);
      if (history.length < 2) {
        return 'Insufficient data for trend analysis. At least two assessments are required.';
      }
      
      // Calculate overall scores for all assessments
      const overallScores = history.map(assessment => this.calculateAssessmentOverallScore(assessment));
      
      // Use linear regression to analyze trend across ALL assessments
      const slope = this.calculateLinearRegressionSlope(overallScores);
      const totalChange = slope * (overallScores.length - 1);
      const assessmentCount = overallScores.length;
      
      if (Math.abs(totalChange) < 8) {
        return `Overall well-being scores have remained relatively stable across ${assessmentCount} assessments (${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)} points trend).`;
      } else if (totalChange > 0) {
        return `Positive trend observed with consistent improvement of ${totalChange.toFixed(1)} points across ${assessmentCount} assessments.`;
      } else {
        return `Concerning declining trend with ${Math.abs(totalChange).toFixed(1)} points decrease across ${assessmentCount} assessments. Recommend immediate attention.`;
      }
    },

    getRiskChanges() {
      const history = this.getStudentAssessmentHistory(this.selectedStudentForHistory);
      if (history.length < 2) return [];
      
      const changes = [];
      const firstAssessment = history[0];
      const lastAssessment = history[history.length - 1];
      
      this.ryffDimensionsList.forEach(dimension => {
        const firstScore = firstAssessment.subscales?.[dimension.key] ? firstAssessment.subscales[dimension.key] * 7 : null;
        const lastScore = lastAssessment.subscales?.[dimension.key] ? lastAssessment.subscales[dimension.key] * 7 : null;
        
        if (firstScore !== null && lastScore !== null) {
          const firstRisk = this.isAtRisk(firstScore);
          const lastRisk = this.isAtRisk(lastScore);
          
          if (firstRisk && !lastRisk) {
            changes.push({
              dimension: dimension.name,
              description: 'Moved out of risk zone',
              type: 'improvement'
            });
          } else if (!firstRisk && lastRisk) {
            changes.push({
              dimension: dimension.name,
              description: 'Entered risk zone',
              type: 'concern'
            });
          }
        }
      });
      
      return changes;
    },

    getRecommendations() {
      const history = this.getStudentAssessmentHistory(this.selectedStudentForHistory);
      const recommendations = [];
      
      if (history.length === 0) {
        return [{
          type: 'no-data',
          icon: 'fas fa-info-circle',
          title: 'No Assessment Data',
          description: 'No assessment history available for this student.'
        }];
      }
      
      const latestAssessment = history[history.length - 1];
      const atRiskCount = this.getAssessmentAtRiskDimensionsCount(latestAssessment);
      
      if (atRiskCount >= 3) {
        recommendations.push({
          type: 'urgent',
          icon: 'fas fa-exclamation-triangle',
          title: 'Urgent Intervention Required',
          description: `Student shows high risk in ${atRiskCount} dimensions. Immediate counseling session recommended.`
        });
      } else if (atRiskCount > 0) {
        recommendations.push({
          type: 'moderate',
          icon: 'fas fa-user-md',
          title: 'Targeted Support Needed',
          description: `Student shows risk in ${atRiskCount} dimension(s). Schedule follow-up session to address specific areas.`
        });
      } else {
        recommendations.push({
          type: 'positive',
          icon: 'fas fa-thumbs-up',
          title: 'Positive Well-being Status',
          description: 'Student shows healthy well-being across all dimensions. Continue regular monitoring.'
        });
      }
      
      if (history.length >= 2) {
        const trend = this.getOverallTrendSummary();
        if (trend.includes('decline')) {
          recommendations.push({
            type: 'trend',
            icon: 'fas fa-chart-line',
            title: 'Monitor Declining Trend',
            description: 'Recent assessments show declining scores. Consider proactive intervention strategies.'
          });
        }
      }
      
      recommendations.push({
        type: 'general',
        icon: 'fas fa-calendar-check',
        title: 'Regular Assessment Schedule',
        description: 'Continue regular assessments to monitor progress and maintain comprehensive records.'
      });
      
      return recommendations;
    },

    printComprehensiveReport() {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      const reportContent = document.querySelector('.comprehensive-content').innerHTML;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprehensive Report - ${this.selectedStudentForHistory.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .report-header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
              .report-section { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .score-cell { text-align: center; }
              .risk-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
              .high-risk { background-color: #ffebee; color: #c62828; }
              .low-risk { background-color: #e8f5e8; color: #2e7d32; }
              @media print { .header-actions { display: none; } }
            </style>
          </head>
          <body>${reportContent}</body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
    },
    
    // View details for a specific assessment
    viewAssessmentDetails(assessment, student) {
      // Create a temporary student object with the selected assessment data
      const assessmentStudent = {
        ...student,
        submissionDate: assessment.submissionDate,
        subscales: assessment.subscales
      };
      
      // Close history modal and show details modal
      this.showHistoryModal = false;
      this.selectedStudent = assessmentStudent;
      this.showDetailsModal = true;
    },
    // Reset filters
    resetFilters() {
      this.collegeFilter = 'all';
      this.sectionFilter = 'all';
      this.riskLevelFilter = 'all';
      this.selectedDimension = null;
      this.searchQuery = '';
      this.filterStudents();
    },
    // Add method to clear risk filters
    clearRiskFilters() {
      this.$emit('clear-risk-filters');
      this.collegeFilter = 'all';
      this.filterStudents();
    }
  },
  watch: {
    collegeFilter() {
      if (this.selectedDimension) {
        this.filterByDimensionAndCollege();
      } else {
        this.filterStudents();
      }
    },
    sectionFilter() {
      this.filterStudents();
    },
    riskLevelFilter() {
      this.filterStudents();
    },
    selectedDimension() {
      this.filterByDimensionAndCollege();
    },
    selectedCollege() {
      this.collegeFilter = this.selectedCollege;
      this.filterByDimensionAndCollege();
    }
  }
};
</script>

<style scoped>
.ryff-scoring-container {
  background-color: #f5f5f5;
  padding: 20px;
}

.scoring-header {
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
}

.header-title i {
  font-size: 20px;
  margin-right: 10px;
  color: #00B3B0;
}

.header-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 15px 0 0;
}

.header-title p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* View Tabs */
.view-tabs {
  display: flex;
  margin-bottom: 20px;
}

.tab-option {
  display: flex;
  align-items: center;
  margin-right: 30px;
  cursor: pointer;
  user-select: none;
}

.tab-option.active {
  /* Remove the border-bottom and padding-bottom */
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #ccc;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-option.active .radio-circle {
  border-color: #00B3B0;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00B3B0;
}

.tab-option span {
  font-size: 14px;
  color: #555;
}

.tab-option.active span {
  font-weight: 500;
  color: #333;
}

/* Filters Row */
.filters-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-container input {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-dropdowns {
  display: flex;
  gap: 10px;
}

.filter-dropdown {
  position: relative;
}

.filter-dropdown select {
  appearance: none;
  padding: 10px 35px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
}

.filter-dropdown i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Data Table */
.data-table-container {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f9f9f9;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.data-table th.sortable {
  cursor: pointer;
}

.data-table th.sortable:hover {
  background-color: #f0f0f0;
}

.data-table th i {
  margin-left: 5px;
  font-size: 12px;
  color: #999;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #444;
}

.student-row:hover {
  background-color: #f9f9f9;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 500;
  color: #333;
}

.student-id {
  font-size: 12px;
  color: #777;
  margin-top: 3px;
}

.score {
  font-weight: 500;
  color: #333;
}

.risk-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.risk-badge.high-risk {
  background-color: #ffebee;
  color: #f44336;
}

.risk-badge.medium-risk {
  background-color: #e3f2fd;
  color: #2196f3;
}

.risk-badge.low-risk {
  background-color: #e8f5e9;
  color: #4caf50;
}

.view-button {
  background-color: transparent;
  border: 1px solid #ddd;
  color: #555;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.view-button:hover {
  background-color: #f0f0f0;
  border-color: #ccc;
}

.view-button i {
  font-size: 12px;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 6px;
  width: 700px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #777;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.student-details-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
}

.student-profile h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
}

.student-profile p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.assessment-info {
  text-align: right;
}

.info-item {
  margin-bottom: 5px;
}

.info-label {
  font-weight: 500;
  color: #555;
  margin-right: 5px;
}

.info-value {
  color: #333;
}

.subscale-scores h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.subscale-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.subscale-item {
  margin-bottom: 10px;
}

.subscale-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.subscale-name {
  font-size: 14px;
  color: #555;
}

.subscale-score {
  font-weight: 500;
  color: #333;
}

.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 30px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.print-btn:hover {
  background-color: #e0e0e0;
}

.contact-btn {
  background-color: #00B3B0;
  color: white;
  border: none;
}

.contact-btn:hover {
  background-color: #009e9b;
}

/* Add styles for the dimension risk column */
.dimension-risk {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.risk-count {
  font-weight: 600;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 3px;
}

.risk-count.at-risk {
  color: #f44336;
  background-color: #ffebee;
}

.risk-count.moderate {
  color: #ff9800;
  background-color: #fff3e0;
}

.risk-count.healthy {
  color: #4caf50;
  background-color: #e8f5e8;
}

.risk-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.risk-dimension-container {
  position: relative;
  display: inline-block;
  margin: 2px;
}

.risk-dimension-score {
  display: inline-block;
  padding: 3px 6px;
  background-color: #ffebee;
  color: #f44336;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(244, 67, 54, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.risk-dimension-container:hover .risk-dimension-score {
  background-color: #f44336;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.hover-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 100;
}

.hover-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

.risk-dimension-score:hover .hover-label {
  opacity: 1;
  visibility: visible;
}

/* Remove unused tooltip styles */
:global(.custom-tooltip),
:global(.custom-tooltip::after),
:global(.show-tooltip),
.dimension-name-tooltip,
.dimension-name-tooltip::after,
.risk-dimension-container:hover .dimension-name-tooltip {
  display: none;
}

.no-risk {
  color: #4caf50;
  font-size: 12px;
  font-weight: 500;
}

/* Add styles for subscale risk indicators */
.subscale-item.at-risk {
  background-color: rgba(244, 67, 54, 0.05);
  border-left: 3px solid #f44336;
  padding-left: 12px;
  border-radius: 4px;
}

.risk-status {
  margin-top: 5px;
  font-size: 11px;
  font-weight: 500;
}

.risk-status .high-risk {
  color: #f44336;
}

.risk-status .medium-risk {
  color: #ff9800;
}

.risk-status .low-risk {
  color: #4caf50;
}

/* Risk Filter Indicator */
.risk-filter-indicator {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.indicator-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.indicator-content i {
  color: #856404;
  font-size: 18px;
  margin-right: 10px;
}

.indicator-content span {
  color: #856404;
  flex-grow: 1;
}

.clear-filter-btn {
  background-color: transparent;
  border: 1px solid #856404;
  color: #856404;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-filter-btn:hover {
  background-color: #856404;
  color: white;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-container {
    width: 100%;
  }
  
  .filter-dropdowns {
    width: 100%;
  }
  
  .filter-dropdown select {
    width: 100%;
  }
  
  .student-details-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .assessment-info {
    text-align: left;
  }
  
  .subscale-grid {
    grid-template-columns: 1fr;
  }
}

/* Student ID Column Styles */
.student-id-cell {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  color: #6b7280;
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
  padding: 12px 8px;
}

/* History Button Styles */
.history-button {
  background: linear-gradient(135deg, #00b3b0 0%, #009491 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 179, 176, 0.3);
  position: relative;
  overflow: hidden;
}

.history-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.history-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 179, 176, 0.4);
  background: linear-gradient(135deg, #009491 0%, #007a77 100%);
}

.history-button:hover::before {
  left: 100%;
}

.history-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 179, 176, 0.3);
}

.history-button i {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.history-button:hover i {
  transform: scale(1.1);
}

/* History Modal Styles */
.history-table-container {
  margin-top: 20px;
}

.history-table-container h5 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-table th,
.history-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.history-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
  font-size: 13px;
}

.history-table td {
  font-size: 13px;
  color: #666;
}

.history-table tbody tr:hover {
  background-color: #f9f9f9;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.risk-badge.high-risk {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.risk-badge.low-risk {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.view-details-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s;
}

.view-details-btn:hover {
  background-color: #45a049;
}

.view-details-btn i {
  font-size: 10px;
}

.no-data {
  text-align: center;
  font-style: italic;
  color: #999;
}

/* Tab styling improvements */
.tab-option {
  cursor: pointer;
  transition: all 0.2s;
}

.tab-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Comprehensive Report Modal Styles */
.comprehensive-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.comprehensive-content {
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.report-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.student-report-info {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 5px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions .btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.header-actions .btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.comprehensive-body {
  padding: 30px;
}

.report-section {
  margin-bottom: 40px;
}

.report-section h4 {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-section h4 i {
  color: #667eea;
}

.assessment-summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.assessment-summary-table th,
.assessment-summary-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.assessment-summary-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.assessment-summary-table td {
  font-size: 0.9rem;
}

.score-cell {
  text-align: center;
  font-weight: 600;
}

.dimension-scores-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dimension-scores-table th,
.dimension-scores-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.85rem;
}

.dimension-scores-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.dimension-scores-table .dimension-name {
  text-align: left;
  font-weight: 600;
  color: #555;
  min-width: 150px;
}

.score-bar-container {
  position: relative;
  width: 60px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  margin: 0 auto;
  overflow: hidden;
}

.score-bar {
  height: 100%;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 600;
}

.trend-improving {
  color: #4caf50;
}

.trend-declining {
  color: #f44336;
}

.trend-stable {
  color: #ff9800;
}

.trend-no-trend {
  color: #9e9e9e;
}

/* Trend Legend Styles */
.trend-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.legend-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #e0e0e0;
}

.legend-item .trend-indicator {
  margin-bottom: 8px;
  font-weight: 600;
}

.legend-item p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.trend-note {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #2196f3;
}

.trend-note p {
  margin: 0;
  font-size: 0.9rem;
  color: #1565c0;
  line-height: 1.5;
}

.progress-analysis {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  margin-bottom: 20px;
}

.progress-analysis h5 {
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.progress-analysis p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.risk-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.risk-change-item {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.risk-change-improvement {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.risk-change-concern {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.recommendation-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
  transition: transform 0.2s ease;
}

.recommendation-card:hover {
  transform: translateY(-2px);
}

.recommendation-card.urgent {
  border-left-color: #f44336;
}

.recommendation-card.moderate {
  border-left-color: #ff9800;
}

.recommendation-card.positive {
  border-left-color: #4caf50;
}

.recommendation-card.trend {
  border-left-color: #2196f3;
}

.recommendation-card.general {
  border-left-color: #9e9e9e;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.recommendation-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.8rem;
}

.recommendation-card.urgent .recommendation-icon {
  background: #ffebee;
  color: #f44336;
}

.recommendation-card.moderate .recommendation-icon {
  background: #fff3e0;
  color: #ff9800;
}

.recommendation-card.positive .recommendation-icon {
  background: #e8f5e8;
  color: #4caf50;
}

.recommendation-card.trend .recommendation-icon {
  background: #e3f2fd;
  color: #2196f3;
}

.recommendation-card.general .recommendation-icon {
  background: #f5f5f5;
  color: #9e9e9e;
}

.recommendation-title {
  font-weight: 600;
  color: #333;
  margin: 0;
}

.recommendation-description {
  color: #666;
  line-height: 1.5;
  margin: 0;
  font-size: 0.9rem;
}

.no-data {
  color: #9e9e9e;
  font-style: italic;
}

/* Risk level badges in comprehensive report */
.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.risk-badge.high-risk {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.risk-badge.moderate {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc02;
}

.risk-badge.low-risk {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.risk-badge.no-data {
  background: #f5f5f5;
  color: #9e9e9e;
  border: 1px solid #e0e0e0;
}

/* Responsive design for comprehensive report modal */
@media (max-width: 768px) {
  .comprehensive-content {
    width: 98%;
    margin: 10px;
  }
  
  .report-header {
    padding: 15px 20px;
  }
  
  .comprehensive-body {
    padding: 20px;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
  
  .dimension-scores-table {
    font-size: 0.8rem;
  }
  
  .assessment-summary-table th,
  .assessment-summary-table td {
    padding: 8px 10px;
  }
}

</style>