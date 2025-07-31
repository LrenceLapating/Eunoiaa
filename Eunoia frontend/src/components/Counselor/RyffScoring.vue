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
        
        <div class="filter-dropdown">
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
        
        <div class="filter-dropdown">
          <select v-model="riskLevelFilter">
            <option value="all">All Levels</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Low Risk">Low Risk</option>
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
            <td class="student-id-cell">{{ student?.id || 'N/A' }}</td>
            <td>{{ student?.college || 'N/A' }}</td>
            <td>{{ student?.section || 'N/A' }}</td>
            <td>{{ student?.submissionDate || 'N/A' }}</td>
            <td>
              <span class="score">{{ calculateOverallScore(student) }}</span>
            </td>
            <td>
              <div class="dimension-risk">
                <span class="risk-count" v-if="hasAnyRiskDimension(student)" title="Number of at-risk dimensions">
                  {{ getAtRiskDimensionsCount(student) }}/6
                </span>
                <div class="risk-scores">
                  <div 
                    v-for="(score, subscale) in (student?.subscales || {})" 
                    :key="subscale"
                    v-if="score !== undefined && isAtRisk(score * 7)"
                    class="risk-dimension-container"
                  >
                    <div class="risk-dimension-score">
                      {{ Math.round(score * 7) }}
                      <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                    </div>
                  </div>
                </div>
                <span v-if="!hasAnyRiskDimension(student)" class="no-risk">No Risk</span>
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in filteredStudents" :key="student?.id || index" class="student-row">
            <td>{{ student?.id || 'N/A' }}</td>
            <td>{{ student?.name || 'N/A' }}</td>
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
            <p>{{ selectedStudent?.id || 'N/A' }} • {{ selectedStudent?.college || 'N/A' }} • {{ selectedStudent?.section || 'N/A' }}</p>
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
                <span v-if="hasAnyRiskDimension(selectedStudent)" class="risk-badge high-risk">
                  {{ getAtRiskDimensionsCount(selectedStudent) }} Dimension(s)
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
                :class="{ 'at-risk': score !== undefined && isAtRisk(score * 7) }"
              >
                <div class="subscale-header">
                  <span class="subscale-name">{{ formatSubscaleName(subscale) }}</span>
                  <span class="subscale-score">{{ score !== undefined ? Math.round(score * 7) : 'N/A' }}/49</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="score !== undefined ? { width: (score*7/49*100) + '%', backgroundColor: getDimensionScoreColor(score*7) } : { width: '0%' }"
                  ></div>
                </div>
                <div class="risk-status">
                  <span :class="score !== undefined ? getDimensionRiskClass(score*7) : 'no-data'">
                    {{ score !== undefined ? getDimensionRiskLabel(score*7) : 'No Data' }}
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
              <p>ID: {{ selectedStudentForHistory.id }} | College: {{ selectedStudentForHistory.college }} | Section: {{ selectedStudentForHistory.section }}</p>
            </div>
          </div>
          
          <div class="history-table-container">
            <h5>Assessment History</h5>
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
      required: true
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
      selectedStudent: null,
      selectedStudentForHistory: null,
      filteredStudents: [],
      // Use the same risk threshold as the dashboard
      riskThresholds: {
        q1: 17, // Below or equal to this is "At Risk" (Q1)
        q4: 39  // Above or equal to this is "Healthy" (Q4)
      }
    };
  },
  created() {
    // Initialize filteredStudents with the prop data
    this.filteredStudents = [...this.students];
    
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
      console.log("Component mounted, re-applying dimension filter");
      this.filterByDimensionAndCollege();
    }
  },
  methods: {
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
      let result = [...this.students];
      
      // Apply college filter
      if (this.collegeFilter !== 'all') {
        result = result.filter(student => student.college === this.collegeFilter);
      }
      
      // Apply section filter
      if (this.sectionFilter !== 'all') {
        result = result.filter(student => student.section === this.sectionFilter);
      }
      
      // Apply risk level filter - now based on having at-risk dimensions
      if (this.riskLevelFilter !== 'all') {
        if (this.riskLevelFilter === 'High Risk') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            return atRiskCount >= 3; // High risk if 3+ dimensions are at risk
          });
        } else if (this.riskLevelFilter === 'Medium Risk') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            return atRiskCount > 0 && atRiskCount < 3; // Medium risk if 1-2 dimensions are at risk
          });
        } else if (this.riskLevelFilter === 'Low Risk') {
          result = result.filter(student => !this.hasAnyRiskDimension(student));
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
      
      console.log(`FILTERING: Dimension=${this.selectedDimension}, College=${this.collegeFilter}`);
      console.log(`Risk threshold: ${this.riskThresholds.q1}`);
      
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
      
      // Start with all students
      let result = [...this.students];
      console.log(`Starting with ${result.length} students`);
      
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
          console.log(`${student.name} (${student.college}): ${subscaleKey}=${score}, at risk: ${dimensionMatch}`);
        } else if (subscaleKey) {
          dimensionMatch = false;
        }
        
        const shouldInclude = collegeMatch && dimensionMatch;
        return shouldInclude;
      });
      
      console.log(`RESULT: ${result.length} students match criteria`);
      if (result.length > 0) {
        console.log('Filtered students:', result.map(s => `${s.name} (${s.college})`));
      } else {
        console.log('No students match the criteria');
      }
      
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
      
      console.log('Contacting student:', student);
      
      const studentEmail = this.getStudentEmail(student);
      console.log('Student email:', studentEmail);
      
      const subject = encodeURIComponent(`Follow-up on Your Well-being Assessment - ${student.name}`);
      
      const body = encodeURIComponent(
        `Dear ${student.name},\n\n` +
        `I hope this email finds you well. I am reaching out regarding your recent psychological well-being assessment submission.\n\n` +
        `Student Details:\n` +
        `- Name: ${student.name}\n` +
        `- Student ID: ${student.id}\n` +
        `- College: ${student.college}\n` +
        `- Section: ${student.section}\n` +
        `- Assessment Date: ${student.submissionDate}\n\n` +
        `Please feel free to reach out if you have any questions or would like to discuss your results.\n\n` +
        `Best regards,\n` +
        `Counseling Services`
      );
      
      // Open Gmail directly with pre-filled compose window
      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(studentEmail)}&su=${subject}&body=${body}`;
      console.log('Opening Gmail compose:', gmailComposeUrl);
      
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
      
      console.log('Generating report for student:', student);
      
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
  color: #f44336;
  font-size: 13px;
  background-color: #ffebee;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 3px;
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

</style>