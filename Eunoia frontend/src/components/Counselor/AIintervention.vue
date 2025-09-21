<template>
  <div class="ai-intervention-container">
    <!-- Notification System -->
    <div v-if="notification.show" :class="['notification', notification.type]" @click="hideNotification">
      <div class="notification-content">
        <i :class="notificationIcon"></i>
        <div class="notification-text">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
        </div>
        <button class="notification-close" @click="hideNotification">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>


    <!-- Main Dashboard View -->
    <div class="dashboard-view" v-if="currentView === 'dashboard'">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h2>AI Intervention Dashboard</h2>
          <p>Generate personalized interventions using AI for student mental wellness</p>
        </div>
        <div class="header-actions">
          <div class="assessment-filter">
            <label for="assessmentTypeFilter">Assessment Type:</label>
            <select id="assessmentTypeFilter" v-model="assessmentTypeFilter" @change="onAssessmentTypeChange">
              <option value="">Please select an assessment type</option>
              <option value="ryff_42">42-Item Assessment</option>
              <option value="ryff_84">84-Item Assessment</option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <i class="fas fa-spinner loading-spinner"></i>
        <p class="loading-text">Loading student data...</p>
      </div>
      
      <!-- Assessment Selection Prompt -->
      <div v-else-if="!assessmentTypeFilter" class="assessment-prompt">
        <div class="prompt-content">
          <div class="prompt-icon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <h3>Select Assessment Type for AI Intervention</h3>
          <p>Please choose either 42-Item or 84-Item assessment type from the dropdown above to view student data and generate personalized interventions.</p>
          <div class="assessment-options">
            <div class="option-card" @click="selectAssessmentType('ryff_42')">
              <i class="fas fa-list"></i>
              <h4>42-Item Assessment</h4>
              <p>Shorter assessment format</p>
            </div>
            <div class="option-card" @click="selectAssessmentType('ryff_84')">
              <i class="fas fa-list-ul"></i>
              <h4>84-Item Assessment</h4>
              <p>Comprehensive assessment format</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Statistics Cards -->
      <div v-else class="stats-cards">
        <div class="stat-card at-risk" @click="navigateToStudents('at-risk')">
          <div class="card-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <h3>At Risk Students</h3>
            <div class="stat-number">{{ atRiskStudents.length }}</div>
            <p>Students with 1+ at-risk score in 6 dimensions</p>
            <div class="card-action">
              <span>View Details</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>

        <div class="stat-card moderate" @click="navigateToStudents('moderate')">
          <div class="card-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="card-content">
            <h3>Moderate Students</h3>
            <div class="stat-number">{{ moderateStudents.length }}</div>
            <p>Students with moderate and healthy scores in 6 dimensions</p>
            <div class="card-action">
              <span>View Details</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>

        <div class="stat-card healthy" @click="navigateToStudents('healthy')">
          <div class="card-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-content">
            <h3>Healthy Students</h3>
            <div class="stat-number">{{ healthyStudents.length }}</div>
            <p>Students with all healthy scores in 6 dimensions</p>
            <div class="card-action">
              <span>View Details</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Student List View -->
    <div class="student-list-view" v-if="currentView !== 'dashboard'">
      <!-- Back Button and Title -->
      <div class="list-header">
        <button class="back-button" @click="backToDashboard">
          <i class="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>
        <div class="list-title">
          <h3>{{ getViewTitle() }}</h3>
          <p>{{ getViewDescription() }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search by name, ID, or section..." v-model="searchQuery" @input="filterCurrentStudents">
        </div>
        
        <div class="filter-dropdowns">
          <div class="filter-dropdown">
            <select v-model="collegeFilter" @change="filterCurrentStudents">
              <option value="all">All Colleges</option>
              <option value="CCS">CCS</option>
              <option value="CN">CN</option>
              <option value="CBA">CBA</option>
              <option value="COE">COE</option>
              <option value="CAS">CAS</option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <!-- Bulk Actions for Healthy Students -->
      <div class="bulk-actions" v-if="currentView === 'healthy' && filteredCurrentStudents.length > 0">
        <button class="bulk-send-btn" @click="bulkSendHealthyInterventions" :disabled="isBulkGenerating">
          <i class="fas" :class="isBulkGenerating ? 'fa-spinner fa-spin' : 'fa-robot'"></i>
          {{ isBulkGenerating ? 'Generating AI Interventions...' : `Generate AI Interventions (${filteredCurrentStudents.length} students)` }}
        </button>
      </div>

      <!-- Student Table -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>College</th>
              <th>Year</th>
              <th>Section</th>
              <th>{{ getDimensionColumnTitle() }}</th>
              <th>Intervention Status</th>
              <th>Review</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, index) in filteredCurrentStudents" :key="student?.id || index" class="student-row">
              <td class="student-id-cell">{{ student?.id_number || 'N/A' }}</td>
              <td>
                <div class="student-info">
                  <span class="student-name">{{ student?.name || 'N/A' }}</span>
                </div>
              </td>
              <td>{{ student?.college || 'N/A' }}</td>
              <td>{{ student?.yearLevel || 'N/A' }}</td>
              <td>{{ student?.section || 'N/A' }}</td>
              <td>
                <div class="dimension-risk">
                  <!-- For at-risk students, show at-risk count -->
                  <span class="risk-count" v-if="currentView === 'at-risk' && hasAnyRiskDimension(student)" title="Number of at-risk dimensions">
                    {{ getAtRiskDimensionsCount(student) }}/6
                  </span>
                  <!-- For moderate students, show moderate count -->
                  <span class="moderate-count" v-if="currentView === 'moderate' && hasModerateScores(student)" title="Number of moderate dimensions">
                    {{ getModerateDimensionsCount(student) }}/6
                  </span>
                  <!-- For healthy students, show all healthy -->
                  <span class="healthy-count" v-if="currentView === 'healthy'" title="All dimensions are healthy">
                    6/6
                  </span>
                  
                  <div class="risk-scores" v-if="currentView === 'at-risk'">
                    <div 
                      v-for="(score, subscale) in (student?.subscales || {})" 
                      :key="subscale"
                      v-if="score !== undefined && score !== null && isAtRisk(score)"
                      class="risk-dimension-container"
                    >
                      <div class="risk-dimension-score">
                        {{ Math.round(score) }}
                        <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="risk-scores" v-if="currentView === 'moderate'">
                    <div 
                      v-for="(score, subscale) in (student?.subscales || {})" 
                      :key="subscale"
                      v-if="score !== undefined && score !== null && isModerate(score)"
                      class="risk-dimension-container moderate-dimension"
                    >
                      <div class="risk-dimension-score">
                        {{ Math.round(score) }}
                        <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <span v-if="currentView === 'at-risk' && !hasAnyRiskDimension(student)" class="no-risk">No At-Risk</span>
                  <span v-if="currentView === 'moderate' && !hasModerateScores(student)" class="no-risk">No Moderate</span>
                  <span v-if="currentView === 'healthy'" class="no-risk healthy-text">All Healthy</span>
                </div>
              </td>
              <td>
                <div class="intervention-status">
                  <span v-if="hasInterventionSent(student)" class="status-sent" title="Intervention sent">
                    <i class="fas fa-check-circle"></i>
                    Sent
                  </span>
                  <span v-else class="status-pending" title="Intervention not sent">
                    <i class="fas fa-clock"></i>
                    Pending
                  </span>
                </div>
              </td>
              <td>
                <div class="review-status">
                  <span v-if="getStudentReviewStatus(student)" class="status-reviewed" title="Student has reviewed the intervention">
                    <i class="fas fa-check-circle"></i>
                    Completed Review
                  </span>
                  <span v-else-if="hasInterventionSent(student)" class="status-not-reviewed" title="Student has not reviewed the intervention yet">
                    <i class="fas fa-clock"></i>
                    Not Been Review
                  </span>
                  <span v-else class="status-no-intervention" title="No intervention sent yet">
                    <i class="fas fa-minus"></i>
                    -
                  </span>
                </div>
              </td>
              <td>
                <button 
                  class="view-button" 
                  @click="viewStudentDetails(student)"
                  :disabled="generatingStudents.has(student.id)"
                  :class="{ 'generating': generatingStudents.has(student.id) }"
                >
                  <i v-if="generatingStudents.has(student.id)" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-eye"></i>
                  {{ generatingStudents.has(student.id) ? 'Generating...' : 'View' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredCurrentStudents.length === 0" class="no-data">
              <td colspan="9">No students found in this category</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Student Intervention Modal -->
    <div class="modal" v-if="showDetailsModal" @click.self="showDetailsModal = false">
      <div class="modal-content intervention-modal">
        <div class="modal-header">
          <h3>Personalized Mental Health Intervention</h3>
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
            <div class="assessment-summary">
              <div class="overall-score">
                <span class="score-label">Overall Score:</span>
                <span class="score-value" :class="getOverallRiskClass(selectedStudent)">{{ calculateOverallScore(selectedStudent) }}/{{ getMaxPossibleScore(selectedStudent) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Overall Intervention -->
          <div class="intervention-section overall-intervention">
            <h4><i class="fas fa-heart"></i> Overall Mental Health Strategy</h4>
            <div class="intervention-content">
              <p>{{ getOverallIntervention(selectedStudent) }}</p>
            </div>
          </div>

          <!-- Dimension Scores and Interventions -->
          <div class="dimensions-intervention">
            <h4><i class="fas fa-brain"></i> Dimension Scores & Targeted Interventions</h4>
            <div class="dimensions-grid">
              <div 
                class="dimension-card" 
                v-for="(score, subscale) in (selectedStudent?.subscales || {})" 
                :key="subscale"
                :class="{ 'at-risk': score !== undefined && score !== null && isAtRisk(score, selectedStudent), 'moderate': score !== undefined && score !== null && isModerate(score, selectedStudent), 'healthy': score !== undefined && score !== null && isHealthy(score, selectedStudent) }"
              >
                <div class="dimension-header">
                  <span class="dimension-name">{{ formatSubscaleName(subscale) }}</span>
                  <span class="dimension-score" :class="(score !== undefined && score !== null) ? getDimensionRiskClass(score, selectedStudent) : 'no-data'">
                {{ (score !== undefined && score !== null) ? Math.round(score) : 'N/A' }}/{{ getDimensionMaxScore(selectedStudent) }}
                  </span>
                </div>
                <div class="intervention-text" v-if="score !== undefined && score !== null">
                  <p>{{ getDimensionIntervention(subscale, score) }}</p>
                </div>
                <div class="no-data-text" v-else>
                  <p>No assessment data available for this dimension.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Plan -->
          <div class="intervention-section action-plan">
            <div class="action-plan-header">
              <h4><i class="fas fa-clipboard-list"></i> Recommended Action Plan</h4>
              <button 
                class="edit-button" 
                @click="toggleEditActionPlan"
                :class="{ 'editing': isEditingActionPlan }"
              >
                <i :class="isEditingActionPlan ? 'fas fa-save' : 'fas fa-edit'"></i>
                {{ isEditingActionPlan ? 'Save' : 'Edit' }}
              </button>
            </div>
            
            <!-- Read-only view -->
            <div class="action-items" v-if="!isEditingActionPlan">
              <div class="action-item" v-for="(action, index) in editableActionPlan" :key="index">
                <i class="fas fa-check-circle"></i>
                <span>{{ action }}</span>
              </div>
            </div>
            
            <!-- Editable view -->
            <div class="action-items-editable" v-else>
              <div class="editable-action-item" v-for="(action, index) in editableActionPlan" :key="index">
                <i class="fas fa-grip-vertical drag-handle"></i>
                <textarea 
                  v-model="editableActionPlan[index]"
                  class="action-input"
                  rows="2"
                  placeholder="Enter action plan item..."
                ></textarea>
                <button class="remove-action-btn" @click="removeActionItem(index)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button class="add-action-btn" @click="addActionItem">
                <i class="fas fa-plus"></i> Add Action Item
              </button>
            </div>
            
            <!-- Send to Student Button -->
            <div class="action-plan-footer">
              <button class="send-to-student-btn" @click="sendToStudent" :disabled="isEditingActionPlan || isSendingIntervention">
                <i class="fas" :class="isSendingIntervention ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                {{ isSendingIntervention ? 'Sending...' : 'Send to Student' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiUrl } from '../../utils/apiUtils';

export default {
  name: 'AIintervention',
  data() {
    return {
      
      currentView: 'dashboard', // 'dashboard', 'at-risk', 'moderate', 'healthy'
      searchQuery: '',
      collegeFilter: 'all',
      assessmentTypeFilter: '', // '', 'ryff_42', 'ryff_84'
      showDetailsModal: false,
      selectedStudent: null,
      filteredCurrentStudents: [],
      editableActionPlan: [],
      isEditingActionPlan: false,
      sentInterventions: new Set(), // Track students who have received interventions
      interventionReviewStatus: [], // Store review status for each student's intervention
      isLoading: false,
      isSendingIntervention: false, // Loading state for sending intervention
      isBulkGenerating: false, // Loading state for bulk intervention generation
      isGeneratingIntervention: false, // Loading state for individual intervention generation
      generatingStudents: new Set(), // Track which students are currently having interventions generated

      // Notification system
      notification: {
        show: false,
        type: 'success', // 'success', 'error', 'warning', 'info'
        title: '',
        message: ''
      },

      aiGeneratedInterventions: new Map(), // Store AI-generated interventions by student ID
      // Real student data from backend
      atRiskStudents: [],
      moderateStudents: [],
      healthyStudents: [],
      ryffDimensionsList: [
        { key: 'autonomy', name: 'Autonomy' },
        { key: 'environmentalMastery', name: 'Environmental Mastery' },
        { key: 'personalGrowth', name: 'Personal Growth' },
        { key: 'positiveRelations', name: 'Positive Relations with Others' },
        { key: 'purposeInLife', name: 'Purpose in Life' },
        { key: 'selfAcceptance', name: 'Self-Acceptance' }
      ],
      riskThresholds: {
        'ryff_42': {
          atRisk: 18,     // 7-18: At-Risk
          moderate: 30,   // 19-30: Moderate, 31-42: Healthy
          // Dimension-level thresholds
          q1: 18, // Below or equal to this is "At Risk" (7-18)
          q4: 30  // Above this is "Healthy" (31-42), moderate is 19-30
        },
        'ryff_84': {
          atRisk: 36,     // 14-36: At-Risk
          moderate: 59,   // 37-59: Moderate, 60-84: Healthy
          // Dimension-level thresholds
          q1: 36, // Below or equal to this is "At Risk" (14-36)
          q4: 59  // Above or equal to this is "Healthy" (60-84)
        }
      }
    };
  },
  async mounted() {
    // Don't fetch student data initially - wait for user to select assessment type
    await this.fetchSentInterventions();
  },
  computed: {
    // These are now data properties fetched from backend
    notificationIcon() {
      switch (this.notification.type) {
        case 'success':
          return 'fas fa-check-circle';
        case 'error':
          return 'fas fa-exclamation-circle';
        case 'warning':
          return 'fas fa-exclamation-triangle';
        case 'info':
          return 'fas fa-info-circle';
        default:
          return 'fas fa-info-circle';
      }
    }
  },
  methods: {


    // Handle assessment type filter change
    async onAssessmentTypeChange() {
      if (this.assessmentTypeFilter) {
        await this.fetchStudentsByRiskLevel();
      } else {
        // Clear data when no assessment type is selected
        this.atRiskStudents = [];
        this.moderateStudents = [];
        this.healthyStudents = [];
      }
    },

    // Select assessment type from prompt cards
    async selectAssessmentType(type) {
      this.assessmentTypeFilter = type;
      await this.fetchStudentsByRiskLevel();
    },

    // Fetch students by risk level from backend API
    async fetchStudentsByRiskLevel() {
      if (!this.assessmentTypeFilter) {
        console.log('No assessment type selected, returning');
        return; // Don't fetch if no assessment type is selected
      }
      this.isLoading = true;
      try {
        // Build query parameters
        const assessmentTypeParam = `&assessmentType=${this.assessmentTypeFilter}`;
        
        // Fetch at-risk students
        const atRiskResponse = await fetch(apiUrl(`counselor-assessments/students/at-risk?${assessmentTypeParam}`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (atRiskResponse.ok) {
          const atRiskData = await atRiskResponse.json();
          this.atRiskStudents = this.mapAssessmentData(atRiskData.data || []);
        }
        
        // Fetch moderate students
        const moderateResponse = await fetch(apiUrl(`counselor-assessments/students/moderate?${assessmentTypeParam}`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (moderateResponse.ok) {
          const moderateData = await moderateResponse.json();
          this.moderateStudents = this.mapAssessmentData(moderateData.data || []);
        }
        
        // Fetch healthy students
        const healthyResponse = await fetch(apiUrl(`counselor-assessments/students/healthy?${assessmentTypeParam}`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (healthyResponse.ok) {
          const healthyData = await healthyResponse.json();
          this.healthyStudents = this.mapAssessmentData(healthyData.data || []);
        }
        
        console.log('Student data loaded:', {
          atRisk: this.atRiskStudents.length,
          moderate: this.moderateStudents.length,
          healthy: this.healthyStudents.length
        });
        
        // Fetch sent interventions after student data is loaded to ensure proper status display
        await this.fetchSentInterventions();
        
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Map assessment data from backend to frontend format
    mapAssessmentData(assessments) {
      return assessments.map(assessment => {
        const student = assessment.student || {};
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          id_number: student.id_number,
          college: student.college,
          section: student.section,
          year_level: student.year_level,
          yearLevel: student.year_level, // Alternative property name
          overallScore: assessment.overall_score,
          riskLevel: assessment.risk_level,
          subscales: assessment.scores || {},
          completedAt: assessment.completed_at,
          assessmentType: assessment.assessment_type, // Fixed: use camelCase to match getDimensionMaxScore function
          atRiskDimensions: assessment.at_risk_dimensions || []
        };
      });
    },
    
    // Fetch previously sent interventions to maintain status across page refreshes
    async fetchSentInterventions() {
      try {
        const response = await fetch(apiUrl('/counselor-interventions/sent'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            // Clear existing sent interventions and populate with backend data
            this.sentInterventions.clear();
            this.interventionReviewStatus = [];
            
            result.data.forEach(intervention => {
              if (intervention.status === 'sent') {
                this.sentInterventions.add(intervention.student_id);
              }
              
              // Store review status for each intervention
              this.interventionReviewStatus.push({
                student_id: intervention.student_id,
                is_read: intervention.is_read || false
              });
            });
            
            console.log('Sent interventions loaded:', this.sentInterventions.size, 'students');
            console.log('Review status loaded for:', this.interventionReviewStatus.length, 'interventions');
          }
        } else {
          console.error('Failed to fetch sent interventions - status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching sent interventions:', error);
      }
    },
    
    navigateToStudents(category) {
      this.currentView = category;
      this.searchQuery = '';
      this.collegeFilter = 'all';
      this.filterCurrentStudents();
    },
    backToDashboard() {
      this.currentView = 'dashboard';
    },
    getViewTitle() {
      switch(this.currentView) {
        case 'at-risk': return 'At Risk Students';
        case 'moderate': return 'Moderate Students';
        case 'healthy': return 'Healthy Students';
        default: return '';
      }
    },
    getViewDescription() {
      switch(this.currentView) {
        case 'at-risk': return 'Students with one or more at-risk dimensions requiring immediate attention';
        case 'moderate': return 'Students with moderate scores who may benefit from preventive interventions';
        case 'healthy': return 'Students with healthy scores across all dimensions';
        default: return '';
      }
    },
    filterCurrentStudents() {
      let students = [];
      
      switch(this.currentView) {
        case 'at-risk':
          students = [...this.atRiskStudents];
          break;
        case 'moderate':
          students = [...this.moderateStudents];
          break;
        case 'healthy':
          students = [...this.healthyStudents];
          break;
        default:
          students = [];
      }
      
      // Apply search filter
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        students = students.filter(student => 
          (student.name && student.name.toLowerCase().includes(query)) ||
          (student.id && student.id.toLowerCase().includes(query)) ||
          (student.section && student.section.toLowerCase().includes(query))
        );
      }
      
      // Apply college filter
      if (this.collegeFilter !== 'all') {
        students = students.filter(student => student.college === this.collegeFilter);
      }
      
      this.filteredCurrentStudents = students;
    },
    
    // Risk assessment methods
    getThresholdsForStudent(student) {
      // Determine assessment type from student data
      const assessmentType = student?.assessmentType === 'ryff_84' ? 'ryff_84' : 'ryff_42';
      return this.riskThresholds[assessmentType];
    },
    isAtRisk(score, student = null) {
      const thresholds = student ? this.getThresholdsForStudent(student) : this.riskThresholds['ryff_42'];
      return score <= thresholds.q1;
    },
    isHealthy(score, student = null) {
      const thresholds = student ? this.getThresholdsForStudent(student) : this.riskThresholds['ryff_42'];
      return score > thresholds.q4;
    },
    isModerate(score, student = null) {
      const thresholds = student ? this.getThresholdsForStudent(student) : this.riskThresholds['ryff_42'];
      return score > thresholds.q1 && score <= thresholds.q4;
    },
    hasAnyRiskDimension(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isAtRisk(student.subscales[subscale], student)) {
          return true;
        }
      }
      return false;
    },
    getAtRiskDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isAtRisk(student.subscales[subscale], student)) {
          count++;
        }
      }
      return count;
    },
    hasModerateScores(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isModerate(student.subscales[subscale], student)) {
          return true;
        }
      }
      return false;
    },
    getModerateDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isModerate(student.subscales[subscale], student)) {
          count++;
        }
      }
      return count;
    },
    isAllDimensionsHealthy(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && !this.isHealthy(student.subscales[subscale], student)) {
          return false;
        }
      }
      return true;
    },
    
    // Utility methods
    calculateOverallScore(student) {
      if (!student) return 0;
      // Return the overall_score directly from the database
      return student.overallScore || 0;
    },
    getMaxPossibleScore(student) {
      if (!student) return 252; // Default to 42-item
      // Calculate max score based on assessment type
      // For 42-item: 42 questions × 6 points = 252
      // For 84-item: 84 questions × 6 points = 504
      return student.assessmentType === 'ryff_84' ? 504 : 252;
    },
    getDimensionMaxScore(student) {
      if (!student) return 42; // Default to 42-item
      // Calculate max score per dimension based on assessment type
      // For 42-item: 7 items per dimension × 6 points = 42
      // For 84-item: 14 items per dimension × 6 points = 84
      return student.assessmentType === 'ryff_84' ? 84 : 42;
    },
    formatSubscaleName(subscale) {
      const dimension = this.ryffDimensionsList.find(d => d.key === subscale);
      return dimension ? dimension.name : subscale;
    },
    getDimensionColumnTitle() {
      switch(this.currentView) {
        case 'at-risk': return 'At-Risk Dimensions';
        case 'moderate': return 'Moderate Dimensions';
        case 'healthy': return 'Healthy Dimensions';
        default: return 'Dimension Status';
      }
    },
    getDimensionScoreColor(score, student = null) {
      const thresholds = student ? this.getThresholdsForStudent(student) : this.riskThresholds['ryff_42'];
      if (score <= thresholds.q1) return '#f44336';  // Red for at risk
      if (score < thresholds.q4) return '#ff9800';  // Orange for moderate
      return '#4caf50';  // Green for healthy
    },
    getDimensionRiskClass(score, student = null) {
      const thresholds = student ? this.getThresholdsForStudent(student) : this.riskThresholds['ryff_42'];
      if (score <= thresholds.q1) return 'high-risk';
      if (score < thresholds.q4) return 'medium-risk';
      return 'low-risk';
    },
    getDimensionRiskLabel(score, student = null) {
      const thresholds = student ? this.getThresholdsForStudent(student) : this.riskThresholds['ryff_42'];
      if (score <= thresholds.q1) return 'At Risk';
      if (score < thresholds.q4) return 'Moderate';
      return 'Healthy';
    },
    async viewStudentDetails(student) {
      // Prevent viewing if intervention is currently being generated for this student
      if (this.generatingStudents.has(student.id)) {
        return;
      }
      
      this.selectedStudent = student;
      this.isEditingActionPlan = false;
      this.showDetailsModal = true;
      
      // Fetch AI intervention for this student if not already loaded
      await this.fetchAIInterventionForStudent(student.id);
      
      // Check if intervention exists, if not, generate one automatically
      const aiIntervention = this.aiGeneratedInterventions.get(student.id);
      if (!aiIntervention || (!aiIntervention.overallStrategy && Object.keys(aiIntervention.dimensionInterventions || {}).length === 0)) {
        console.log('No AI intervention found for student, generating automatically...');
        await this.generateInterventionForStudent(student.id);
      }
      
      // Set action plan after intervention is loaded/generated
      setTimeout(() => {
        this.updateEditableActionPlan();
      }, 100);
    },
    
    // Action Plan Editing Methods
    async toggleEditActionPlan() {
      if (this.isEditingActionPlan) {
        // Save changes to database
        await this.saveActionPlan();
      } else {
        // Enter edit mode
        this.isEditingActionPlan = true;
      }
    },
    
    async saveActionPlan() {
      if (!this.selectedStudent) return;
      
      try {
        // Get the current intervention ID
        let aiIntervention = this.aiGeneratedInterventions.get(this.selectedStudent.id);
        if (!aiIntervention || !aiIntervention.id) {
          // Try to fetch the intervention again if not found
          await this.fetchAIInterventionForStudent(this.selectedStudent.id);
          aiIntervention = this.aiGeneratedInterventions.get(this.selectedStudent.id);
          if (!aiIntervention || !aiIntervention.id) {
            this.showNotification('error', 'Error', 'No intervention found to update. Please ensure an intervention has been generated for this student.');
            return;
          }
        }
        
        // Filter out empty action items
        const filteredActionPlan = this.editableActionPlan.filter(item => item.trim() !== '');
        
        const response = await fetch(apiUrl(`counselor-interventions/${aiIntervention.id}/action-plan`), {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            actionPlan: filteredActionPlan
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Update the stored intervention data with the response from server
          const updatedIntervention = {
            ...aiIntervention,
            action_plan: result.data.action_plan || filteredActionPlan
          };
          this.aiGeneratedInterventions.set(this.selectedStudent.id, updatedIntervention);
          
          // Update the editable action plan to reflect the saved changes
          this.editableActionPlan = [...(result.data.action_plan || filteredActionPlan)];
          
          // Exit edit mode
          this.isEditingActionPlan = false;
          
          // Show success notification
          this.showNotification('success', 'Success', 'Action plan updated successfully!');
        } else {
          this.showNotification('error', 'Error', result.error || 'Failed to update action plan');
        }
      } catch (error) {
        console.error('Error saving action plan:', error);
        this.showNotification('error', 'Error', 'Failed to save action plan. Please try again.');
      }
    },
    
    addActionItem() {
      this.editableActionPlan.push('');
    },
    
    removeActionItem(index) {
      this.editableActionPlan.splice(index, 1);
    },
    
    async sendToStudent() {
      if (!this.selectedStudent || this.isEditingActionPlan) return;
      
      try {
        // Show loading state
        this.isSendingIntervention = true;
        
        // Send existing AI intervention to student
        const response = await fetch(apiUrl('/counselor-interventions/send-existing'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: this.selectedStudent.id
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Mark intervention as sent
          this.sentInterventions.add(this.selectedStudent.id);
          
          // Show success notification
          this.showNotification(
            'success',
            'Intervention Sent Successfully!',
            `AI intervention has been sent to ${this.selectedStudent.name}. They will receive personalized mental health recommendations based on their assessment results.`
          );
          
          // Close modal
          this.showDetailsModal = false;
        } else {
          console.error('Failed to send intervention:', result.error);
          if (result.error.includes('No intervention found')) {
            this.showNotification(
              'warning',
              'No Intervention Available',
              'No AI intervention found for this student. The system will generate one automatically when needed.'
            );
          } else {
            this.showNotification(
              'error',
              'Failed to Send Intervention',
              'Unable to send the intervention. Please check your connection and try again.'
            );
          }
        }
      } catch (error) {
        console.error('Error sending intervention:', error);
        alert('Error sending intervention. Please check your connection and try again.');
      } finally {
        this.isSendingIntervention = false;
      }
    },
    
    hasInterventionSent(student) {
      return this.sentInterventions.has(student?.id);
    },
    
    hasInterventionAvailable(student) {
      // Check if there's an AI-generated intervention available for this student
      const aiIntervention = this.aiGeneratedInterventions.get(student?.id);
      return aiIntervention && (aiIntervention.overallStrategy || Object.keys(aiIntervention.dimensionInterventions || {}).length > 0);
    },


    
    getStudentReviewStatus(student) {
      // Find the intervention for this student and check if it's been reviewed
      const intervention = this.interventionReviewStatus.find(item => item.student_id === student?.id);
      return intervention ? intervention.is_read : false;
    },
    
    getDimensionInterventions(student) {
      const interventions = {};
      if (student?.subscales) {
        Object.entries(student.subscales).forEach(([subscale, score]) => {
          if (score !== undefined) {
            interventions[subscale] = this.getDimensionIntervention(subscale, score);
          }
        });
      }
      return interventions;
    },
    
    async bulkSendHealthyInterventions() {
      if (this.filteredCurrentStudents.length === 0) return;
      
      try {
        // Show loading state
        this.isBulkGenerating = true;
        
        // Get student IDs for bulk generation
        const studentIds = this.filteredCurrentStudents.map(student => student.id);
        
        // Generate AI interventions for all students
        const response = await fetch(apiUrl('/ai-interventions/bulk-generate'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentIds: studentIds
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Mark all successful interventions as sent
          result.data.successful.forEach(intervention => {
            this.sentInterventions.add(intervention.student_id);
          });
          
          // Show success message with details
          const successCount = result.data.summary.successful;
          const failedCount = result.data.summary.failed;
          
          if (failedCount > 0) {
            this.showNotification(
              'warning',
              'Bulk Interventions Completed',
              `${successCount} interventions sent successfully, ${failedCount} failed. Check console for detailed error information.`,
              7000
            );
            console.log('Failed interventions:', result.data.errors);
          } else {
            this.showNotification(
              'success',
              'Bulk Interventions Sent Successfully!',
              `AI interventions have been sent to all ${successCount} students. They will receive personalized mental health recommendations.`,
              6000
            );
          }
        } else {
          console.error('Failed to generate bulk interventions:', result.error);
          if (result.error.includes('AI service is not available')) {
            this.showNotification(
              'error',
              'AI Service Unavailable',
              'The AI service is currently not available. Please ensure Ollama is running with the Qwen 4B model and try again.'
            );
          } else {
            this.showNotification(
              'error',
              'Failed to Generate Interventions',
              'Unable to generate bulk interventions. Please check your connection and try again.'
            );
          }
        }
      } catch (error) {
        console.error('Error generating bulk interventions:', error);
        alert('Error generating interventions. Please check your connection and try again.');
      } finally {
        this.isBulkGenerating = false;
      }
    },
    
    // Intervention Methods
    getOverallRiskClass(student) {
      const overallScore = this.calculateOverallScore(student);
      const assessmentType = student?.assessmentType || 'ryff_42';
      const thresholds = this.riskThresholds[assessmentType];
      
      if (overallScore <= thresholds.atRisk) return 'high-risk';
      if (overallScore <= thresholds.moderate) return 'medium-risk';
      return 'low-risk';
    },
    
    getRiskLevelForAPI(student) {
      const overallScore = this.calculateOverallScore(student);
      const atRiskCount = this.getAtRiskDimensionsCount(student);
      
      // Determine risk level based on overall score and at-risk dimensions
      if (atRiskCount >= 4 || overallScore <= this.riskThresholds.q1) {
        return 'high';
      } else if (atRiskCount >= 2 || overallScore <= this.riskThresholds.q2) {
        return 'moderate';
      } else if (atRiskCount >= 1 || overallScore < this.riskThresholds.q4) {
        return 'moderate';
      } else {
        return 'low';
      }
    },
    
    getOverallIntervention(student) {
      // Check if we have AI-generated intervention for this student
      const aiIntervention = this.aiGeneratedInterventions.get(student?.id);
      if (aiIntervention && aiIntervention.overallStrategy) {
        return aiIntervention.overallStrategy;
      }
      
      // Provide meaningful fallback strategy based on student's risk level and scores
      if (!student || !student.subscales) {
        return "A comprehensive mental health strategy will be developed based on your assessment results. Please ensure your assessment is completed for personalized recommendations.";
      }
      
      const riskLevel = student.riskLevel || this.determineRiskLevel(student);
      const atRiskDimensions = this.getAtRiskDimensionsForStudent(student);
      const moderateDimensions = this.getModerateDimensionsForStudent(student);
      
      let strategy = "";
      
      if (riskLevel === 'at-risk' || atRiskDimensions.length > 0) {
        strategy = `Based on your assessment results, you show some areas that need immediate attention across ${atRiskDimensions.length} dimension(s). `;
        strategy += "Your mental health strategy should focus on building resilience and developing coping mechanisms in these key areas. ";
        strategy += "It's recommended to work closely with a counselor to address these concerns and develop personalized interventions. ";
        strategy += "Remember that seeking help is a sign of strength, and with proper support, significant improvement is achievable.";
      } else if (riskLevel === 'moderate' || moderateDimensions.length > 0) {
        strategy = `Your assessment shows moderate scores in ${moderateDimensions.length} dimension(s), indicating areas for growth and improvement. `;
        strategy += "Your mental health strategy should focus on preventive measures and skill-building to maintain and enhance your well-being. ";
        strategy += "This is an excellent opportunity to develop healthy habits and coping strategies before any issues become more serious. ";
        strategy += "Consider engaging in wellness activities and maintaining regular check-ins with support systems.";
      } else {
        strategy = "Your assessment results indicate healthy functioning across all dimensions of psychological well-being. ";
        strategy += "Your mental health strategy should focus on maintaining these positive patterns and continuing personal growth. ";
        strategy += "Consider this an opportunity to further develop your strengths and perhaps support others in their wellness journey. ";
        strategy += "Regular self-reflection and continued engagement in meaningful activities will help sustain your well-being.";
      }
      
      return strategy;
    },
    
    getAtRiskDimensionsForStudent(student) {
      const atRiskDimensions = [];
      if (student?.subscales) {
        Object.entries(student.subscales).forEach(([subscale, score]) => {
          if (score !== undefined && score !== null && this.isAtRisk(score, student)) {
            atRiskDimensions.push(subscale);
          }
        });
      }
      return atRiskDimensions;
    },
    
    getModerateDimensionsForStudent(student) {
      const moderateDimensions = [];
      if (student?.subscales) {
        Object.entries(student.subscales).forEach(([subscale, score]) => {
          if (score !== undefined && score !== null && this.isModerate(score, student)) {
            moderateDimensions.push(subscale);
          }
        });
      }
      return moderateDimensions;
    },
    
    determineRiskLevel(student) {
      if (!student?.subscales) return 'moderate';
      
      const atRiskCount = this.getAtRiskDimensionsForStudent(student).length;
      const moderateCount = this.getModerateDimensionsForStudent(student).length;
      
      if (atRiskCount > 0) {
        return 'at-risk';
      } else if (moderateCount > 0) {
        return 'moderate';
      } else {
        return 'healthy';
      }
    },
    
    getDimensionIntervention(subscale, score) {
      // Check if intervention is currently being generated
      if (this.isGeneratingIntervention) {
        return "Generating AI intervention for this dimension...";
      }
      
      // Check if we have AI-generated intervention for this student
      const aiIntervention = this.aiGeneratedInterventions.get(this.selectedStudent?.id);
      
      if (!aiIntervention) {
        // Still loading - no data fetched yet
        return "Loading AI-generated intervention for this dimension...";
      }
      
      if (aiIntervention.dimensionInterventions && aiIntervention.dimensionInterventions[subscale]) {
        // AI intervention exists for this dimension
        return aiIntervention.dimensionInterventions[subscale];
      }
      
      // AI intervention was fetched but no intervention exists for this dimension
      return "No AI intervention available for this dimension. Please generate interventions using the 'Generate AI Interventions' button above.";
    },
    
    getActionPlan(student) {
      // Check if we have AI-generated intervention for this student
      const aiIntervention = this.aiGeneratedInterventions.get(this.selectedStudent?.id);
      if (aiIntervention && aiIntervention.actionPlan) {
        return aiIntervention.actionPlan;
      }
      
      // Provide meaningful fallback action plan based on student's risk level and scores
      if (!student || !student.subscales) {
        return [
          "Complete your psychological well-being assessment (Example: Take the full assessment to get personalized recommendations)",
          "Schedule a consultation with your counselor (Example: Book a 30-minute session within the next week)",
          "Begin a daily self-reflection practice (Example: Write in a journal for 10 minutes each evening)"
        ];
      }
      
      const riskLevel = student.riskLevel || this.determineRiskLevel(student);
      const atRiskDimensions = this.getAtRiskDimensionsForStudent(student);
      const moderateDimensions = this.getModerateDimensionsForStudent(student);
      
      let actionPlan = [];
      
      if (riskLevel === 'at-risk' || atRiskDimensions.length > 0) {
        actionPlan = [
          "Schedule an immediate consultation with a counselor (Example: Book an appointment within 48 hours to discuss your results)",
          "Develop a daily stress management routine (Example: Practice deep breathing exercises for 10 minutes each morning)",
          "Build a support network (Example: Reach out to 2-3 trusted friends or family members this week)",
          "Engage in regular physical activity (Example: Take a 20-minute walk daily or join a fitness class)",
          "Practice mindfulness and relaxation techniques (Example: Use a meditation app for 15 minutes before bed)",
          "Establish healthy sleep habits (Example: Go to bed and wake up at the same time daily, aim for 7-8 hours)",
          "Monitor your progress weekly (Example: Keep a mood diary and review it with your counselor)"
        ];
      } else if (riskLevel === 'moderate' || moderateDimensions.length > 0) {
        actionPlan = [
          "Schedule a check-in with a counselor (Example: Book a session within 2 weeks to discuss improvement strategies)",
          "Develop personal growth goals (Example: Set 3 specific, measurable goals for the next month)",
          "Practice regular self-care activities (Example: Dedicate 30 minutes daily to activities you enjoy)",
          "Strengthen social connections (Example: Plan weekly social activities with friends or join a club)",
          "Engage in meaningful activities (Example: Volunteer for 2 hours weekly or pursue a hobby)",
          "Maintain physical wellness (Example: Exercise 3 times per week for at least 30 minutes)",
          "Practice stress prevention techniques (Example: Learn and use time management strategies)"
        ];
      } else {
        actionPlan = [
          "Continue your current positive practices (Example: Maintain the healthy habits that are working well for you)",
          "Set new personal development goals (Example: Learn a new skill or take on a leadership role)",
          "Share your wellness strategies with others (Example: Mentor a peer or participate in wellness programs)",
          "Engage in community service (Example: Volunteer 4 hours monthly for a cause you care about)",
          "Pursue advanced personal growth (Example: Take a course in emotional intelligence or mindfulness)",
          "Maintain work-life balance (Example: Set clear boundaries between study/work time and personal time)",
          "Regular wellness check-ins (Example: Schedule quarterly self-assessments to maintain your well-being)"
        ];
      }
      
      return actionPlan;
    },
    
    createComprehensiveIntervention(student, overallIntervention, dimensionInterventions, actionPlan) {
      let comprehensive = "# Comprehensive Well-being Intervention Plan\n\n";
      
      // Overall Mental Health Strategy
      comprehensive += "## Overall Mental Health Strategy\n";
      comprehensive += overallIntervention + "\n\n";
      
      // Dimension Scores & Targeted Interventions
      comprehensive += "## Dimension Scores & Targeted Interventions\n\n";
      
      if (student?.subscales) {
        Object.entries(student.subscales).forEach(([subscale, score]) => {
          if (score !== undefined) {
            const dimensionName = this.formatDimensionName(subscale);
            const intervention = this.getDimensionIntervention(subscale, score);
            const riskLevel = this.isAtRisk(score) ? 'At Risk' : 
                            score < this.riskThresholds.q4 ? 'Moderate' : 'Healthy';
            
            comprehensive += `### ${dimensionName}\n`;
            comprehensive += `**Score:** ${score.toFixed(1)} (${riskLevel})\n`;
            comprehensive += `**Recommendation:** ${intervention}\n\n`;
          }
        });
      }
      
      // Recommended Action Plan
      comprehensive += "## Recommended Action Plan\n\n";
      
      if (actionPlan && actionPlan.length > 0) {
        actionPlan.forEach((action, index) => {
          comprehensive += `${index + 1}. ${action}\n`;
        });
      } else {
        // Use generated action plan if no custom one provided
        const generatedActions = this.getActionPlan(student);
        generatedActions.forEach((action, index) => {
          comprehensive += `${index + 1}. ${action}\n`;
        });
      }
      
      comprehensive += "\n---\n";
      comprehensive += "*This intervention plan is personalized based on your assessment results. Please review all sections and implement the recommendations gradually. Feel free to reach out for support or clarification.*";
      
      return comprehensive;
    },
    
    formatDimensionName(subscale) {
      const names = {
        autonomy: 'Autonomy',
        environmentalMastery: 'Environmental Mastery',
        personalGrowth: 'Personal Growth',
        positiveRelations: 'Positive Relations',
        purposeInLife: 'Purpose in Life',
        selfAcceptance: 'Self Acceptance'
      };
      return names[subscale] || subscale;
    },
    
    // Fetch AI-generated intervention for a specific student
    async fetchAIInterventionForStudent(studentId) {
      try {
        const response = await fetch(apiUrl(`counselor-interventions/student/${studentId}/latest`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success && result.data) {
          // Parse the AI intervention content
          const intervention = result.data;
          this.aiGeneratedInterventions.set(studentId, {
            id: intervention.id, // Include intervention ID for saving
            overallStrategy: intervention.overall_strategy,
            dimensionInterventions: intervention.dimension_interventions,
            actionPlan: intervention.action_plan
          });
          
          // Update action plan if this is the currently selected student
          if (this.selectedStudent && this.selectedStudent.id === studentId) {
            this.updateEditableActionPlan();
          }
        } else if (response.status === 404) {
          // No intervention found for this student - set empty data to stop loading
          console.log('No AI intervention found for student:', studentId);
          this.aiGeneratedInterventions.set(studentId, {
            overallStrategy: null,
            dimensionInterventions: {},
            actionPlan: []
          });
        } else {
          console.error('Failed to fetch AI intervention:', result.error || 'Unknown error');
          // Set empty data to stop loading even on error
          this.aiGeneratedInterventions.set(studentId, {
            overallStrategy: null,
            dimensionInterventions: {},
            actionPlan: []
          });
        }
      } catch (error) {
        console.error('Error fetching AI intervention for student:', error);
        // Set empty data to stop loading on network error
        this.aiGeneratedInterventions.set(studentId, {
          overallStrategy: null,
          dimensionInterventions: {},
          actionPlan: []
        });
      }
    },
    
    // Generate AI intervention for a specific student
    async generateInterventionForStudent(studentId) {
      try {
        this.generatingStudents.add(studentId);
        this.isGeneratingIntervention = true;
        console.log('Generating AI intervention for student:', studentId);
        
        const response = await fetch(apiUrl('ai-interventions/generate'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: studentId
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('AI intervention generated successfully for student:', studentId);
          // Fetch the newly generated intervention
          await this.fetchAIInterventionForStudent(studentId);
          this.showNotification(
            'success',
            'Intervention Generated',
            'AI intervention has been successfully generated for this student.'
          );
        } else {
          console.error('Failed to generate AI intervention:', result.error || 'Unknown error');
          // Show a user-friendly notification
          this.showNotification(
            'warning',
            'Intervention Generation',
            'Unable to generate AI intervention automatically. You can manually generate interventions using the "Generate AI Interventions" button.'
          );
        }
      } catch (error) {
        console.error('Error generating AI intervention for student:', error);
        // Show a user-friendly notification
        this.showNotification(
          'warning',
          'Intervention Generation',
          'Unable to generate AI intervention automatically. Please check your connection and try again.'
        );
      } finally {
        this.generatingStudents.delete(studentId);
        this.isGeneratingIntervention = false;
      }
    },
    
    // Update editable action plan based on current data
    updateEditableActionPlan() {
      if (!this.selectedStudent) return;
      
      const aiIntervention = this.aiGeneratedInterventions.get(this.selectedStudent.id);
      if (aiIntervention && aiIntervention.actionPlan && aiIntervention.actionPlan.length > 0) {
        // Use AI-generated action plan if available
        this.editableActionPlan = [...aiIntervention.actionPlan];
      } else {
        // Use fallback action plan only if no AI intervention exists
        this.editableActionPlan = [...this.getActionPlan(this.selectedStudent)];
      }
    },
    
    // Notification methods
    showNotification(type, title, message, duration = 5000) {
      this.notification = {
        show: true,
        type,
        title,
        message
      };
      
      // Auto-hide notification after duration
      setTimeout(() => {
        this.hideNotification();
      }, duration);
    },
    
    hideNotification() {
      this.notification.show = false;
    }

  },
  watch: {
    currentView() {
      this.filterCurrentStudents();
    }
  },
  created() {
    this.filterCurrentStudents();
  }
};
</script>

<style scoped>
.ai-intervention-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Header Styles */
.intervention-header {
  background: white;
  color: #333;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-title i {
  font-size: 2.5rem;
  color: #667eea;
}

.header-title h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: #2d3748;
}

.header-title p {
  margin: 5px 0 0 0;
  color: #718096;
  font-size: 1.1rem;
}

/* Dashboard Header Styles */
.dashboard-header {
  background: linear-gradient(135deg, #00B3B0 0%, #00A3A0 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  border-radius: 8px 8px 0 0;
}

.header-content h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: white;
}

.header-content p {
  margin: 8px 0 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* Assessment Filter Styles */
.assessment-filter {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.assessment-filter label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.95rem;
  white-space: nowrap;
}

.assessment-filter select {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #333;
  padding: 8px 35px 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  transition: all 0.3s ease;
  min-width: 200px;
}

.assessment-filter select:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 0.5);
}

.assessment-filter select:focus {
  outline: none;
  background: rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.assessment-filter select option {
  background: white;
  color: #333;
  padding: 8px;
}

.assessment-filter i {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
  font-size: 12px;
}

.test-connection-btn,
.generate-all-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.test-connection-btn:hover:not(:disabled),
.generate-all-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.test-connection-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.test-connection-btn i {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .header-content h2 {
    font-size: 1.5rem;
  }
  
  .header-content p {
    font-size: 1rem;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .assessment-filter {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  
  .assessment-filter select {
    min-width: 280px;
    width: 100%;
    max-width: 320px;
  }
}

/* Dashboard Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 5px solid;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.stat-card.at-risk {
  border-left-color: #f44336;
}

.stat-card.moderate {
  border-left-color: #ff9800;
}

.stat-card.healthy {
  border-left-color: #4caf50;
}

.card-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  opacity: 0.1;
  font-size: 4rem;
}

.stat-card.at-risk .card-icon {
  color: #f44336;
}

.stat-card.moderate .card-icon {
  color: #ff9800;
}

.stat-card.healthy .card-icon {
  color: #4caf50;
}

.card-content h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #333;
  font-weight: 600;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  margin: 10px 0;
}

.stat-card.at-risk .stat-number {
  color: #f44336;
}

.stat-card.moderate .stat-number {
  color: #ff9800;
}

.stat-card.healthy .stat-number {
  color: #4caf50;
}

.card-content p {
  margin: 10px 0;
  color: #666;
  font-size: 0.95rem;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  color: #667eea;
  font-weight: 500;
}

/* List View Styles */
.list-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.back-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background: #5a67d8;
}

.list-title h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.list-title p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 1rem;
}

/* Filters */
.filters-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

/* Bulk Actions */
.bulk-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
  border-radius: 8px;
  border: 1px solid #c8e6c9;
}

.bulk-send-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.bulk-send-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #388e3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #00B3B0;
  font-size: 14px;
}

.search-container input {
  width: 100%;
  padding: 10px 12px 10px 35px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s ease;
}

.search-container input:focus {
  outline: none;
  border-color: #00B3B0;
  box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);
}

.search-container input::placeholder {
  color: #a0aec0;
}

.filter-dropdowns {
  display: flex;
  gap: 15px;
}

.filter-dropdown {
  position: relative;
}

.filter-dropdown select {
  padding: 10px 35px 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all 0.3s ease;
}

.filter-dropdown select:focus {
  outline: none;
  border-color: #00B3B0;
  box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);
}

.filter-dropdown i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Table Styles */
.data-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

.data-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.student-row:hover {
  background-color: #f8f9fa;
}

.student-id-cell {
  font-weight: 600;
  color: #00B3B0;
}

.student-name {
  font-weight: 500;
  color: #333;
}

/* Dimension Risk Styles */
.dimension-risk {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.risk-count {
  background: #f44336;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.risk-scores {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.risk-dimension-container {
  position: relative;
}

.risk-dimension-score {
  background: #f44336;
  color: white;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.risk-dimension-score:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.moderate-dimension .risk-dimension-score {
  background: #ff9800;
  color: white;
}

.moderate-dimension .risk-dimension-score:hover {
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.hover-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.risk-dimension-score:hover .hover-label {
  opacity: 1;
}

.no-risk {
  color: #4caf50;
  font-weight: 500;
  font-size: 0.9rem;
}

.healthy-text {
  color: #4caf50;
  font-weight: 600;
  font-style: normal;
}

.moderate-count {
  background-color: #ffeb3b;
  color: #333;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.moderate-count:hover {
  box-shadow: 0 2px 4px rgba(255, 235, 59, 0.3);
}

.healthy-count {
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.healthy-count:hover {
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

/* Action Button */
.view-button {
  background: #00B3B0;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.view-button:hover {
  background: #00A3A0;
}

.view-button:disabled,
.view-button.generating {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.view-button.generating {
  background: #ff9800;
  cursor: not-allowed;
}

.view-button.generating:hover {
  background: #ff9800;
}

.no-data {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 30px;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.intervention-modal {
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-button {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255,255,255,0.3);
}

.modal-body {
  padding: 25px;
}

.student-details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.student-profile h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.3rem;
}

.student-profile p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.assessment-summary {
  display: flex;
  align-items: center;
}

.overall-score {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 8px;
}

.score-label {
  font-weight: 600;
  color: #555;
}

.score-value {
  font-weight: bold;
  font-size: 1.2rem;
  padding: 4px 12px;
  border-radius: 6px;
}

.score-value.high-risk {
  background: #ffebee;
  color: #c62828;
}

.score-value.medium-risk {
  background: #fff3e0;
  color: #ef6c00;
}

.score-value.low-risk {
  background: #e8f5e8;
  color: #2e7d32;
}

/* Intervention Sections */
.intervention-section {
  margin-bottom: 30px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.overall-intervention {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #bbdefb;
}

.intervention-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
  padding: 20px 20px 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.intervention-content {
  padding: 0 20px 20px 20px;
}

.intervention-content p {
  margin: 0;
  color: #555;
  line-height: 1.6;
  font-size: 1rem;
}

/* Dimensions Grid */
.dimensions-intervention {
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 20px 20px 20px;
}

.dimension-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.dimension-card:hover {
  transform: translateY(-2px);
}

.dimension-card.at-risk {
  border-left-color: #f44336;
  background: linear-gradient(135deg, #ffebee 0%, #fff 100%);
}

.dimension-card.moderate {
  border-left-color: #ff9800;
  background: linear-gradient(135deg, #fff3e0 0%, #fff 100%);
}

.dimension-card.healthy {
  border-left-color: #4caf50;
  background: linear-gradient(135deg, #e8f5e8 0%, #fff 100%);
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dimension-name {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.dimension-score {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.dimension-score.high-risk {
  background: #ffcdd2;
  color: #c62828;
}

.dimension-score.medium-risk {
  background: #ffe0b2;
  color: #ef6c00;
}

.dimension-score.low-risk {
  background: #c8e6c9;
  color: #2e7d32;
}

.dimension-score.no-data {
  background: #f5f5f5;
  color: #757575;
}

.intervention-text p {
  margin: 0;
  color: #555;
  line-height: 1.5;
  font-size: 0.9rem;
}

.no-data-text p {
  margin: 0;
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
}

/* Action Plan */
.action-plan {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%);
  border: 1px solid #c8e6c9;
}

.action-plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
}

.action-plan-header h4 {
  margin: 0;
  color: #2e7d32;
  font-size: 1.1rem;
}

.edit-button {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-button:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.edit-button.editing {
  background: #2196f3;
}

.edit-button.editing:hover {
  background: #1976d2;
}

.action-items {
  padding: 0 20px 20px 20px;
}

.action-items-editable {
  padding: 0 20px 10px 20px;
}

.editable-action-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.drag-handle {
  color: #999;
  cursor: grab;
  margin-top: 8px;
}

.action-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 40px;
}

.action-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.remove-action-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.3s ease;
}

.remove-action-btn:hover {
  background: #d32f2f;
}

.add-action-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.add-action-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.action-plan-footer {
  padding: 15px 20px 20px 20px;
  border-top: 1px solid #e0e0e0;
  background: rgba(255, 255, 255, 0.5);
}

.send-to-student-btn {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.send-to-student-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.send-to-student-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
}

.action-item:last-child {
  margin-bottom: 0;
}

.action-item i {
  color: #4caf50;
  margin-top: 2px;
  flex-shrink: 0;
}

.action-item span {
  color: #333;
  line-height: 1.4;
  font-size: 0.95rem;
}

/* Intervention Status Styles */
.intervention-status {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.status-sent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4caf50;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-sent i {
  font-size: 0.9rem;
}

.status-pending {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff9800;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-pending i {
  font-size: 0.9rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Review Status Styles */
.review-status {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.status-reviewed {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4caf50;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(76, 175, 80, 0.15);
  border-radius: 20px;
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.status-reviewed i {
  font-size: 0.9rem;
}

.status-not-reviewed {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff9800;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-not-reviewed i {
  font-size: 0.9rem;
  animation: pulse 2s infinite;
}

.status-no-intervention {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9e9e9e;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(158, 158, 158, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(158, 158, 158, 0.3);
}

.status-no-intervention i {
  font-size: 0.9rem;
}

/* Assessment Prompt Styles */
.assessment-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.prompt-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.prompt-icon {
  margin-bottom: 24px;
}

.prompt-icon i {
  font-size: 4rem;
  color: #6c5ce7;
  opacity: 0.8;
}

.prompt-content h3 {
  font-size: 1.8rem;
  color: #2d3436;
  margin-bottom: 16px;
  font-weight: 600;
}

.prompt-content p {
  font-size: 1.1rem;
  color: #636e72;
  margin-bottom: 32px;
  line-height: 1.6;
}

.assessment-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 32px;
}

.option-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 24px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.option-card:hover {
  border-color: #6c5ce7;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(108, 92, 231, 0.15);
}

.option-card i {
  font-size: 2.5rem;
  color: #6c5ce7;
  margin-bottom: 16px;
  display: block;
}

.option-card h4 {
  font-size: 1.2rem;
  color: #2d3436;
  margin-bottom: 8px;
  font-weight: 600;
}

.option-card p {
  font-size: 0.95rem;
  color: #636e72;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-dropdowns {
    justify-content: stretch;
  }
  
  .filter-dropdown {
    flex: 1;
  }
  
  .student-details-header {
    flex-direction: column;
  }
  
  .subscale-grid {
    grid-template-columns: 1fr;
  }
  
  .assessment-options {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .prompt-content h3 {
    font-size: 1.5rem;
  }
  
  .prompt-content p {
    font-size: 1rem;
  }
}

/* Loading State Styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.loading-spinner {
  font-size: 2rem;
  color: #00B3B0;
  margin-bottom: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container .loading-text {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
  margin: 0;
}

/* Notification Styles */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 350px;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideInRight 0.3s ease-out;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.notification.success {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.notification.error {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.notification.warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.notification.info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  gap: 15px;
}

.notification-content i {
  font-size: 24px;
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-text h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.notification-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  opacity: 0.95;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive notification styles */
@media (max-width: 768px) {
  .notification {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
  
  .notification-content {
    padding: 16px;
  }
  
  .notification-text h4 {
    font-size: 15px;
  }
  
  .notification-text p {
    font-size: 13px;
  }
}
</style>