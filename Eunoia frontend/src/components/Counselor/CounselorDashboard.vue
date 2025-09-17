<template>
  <div class="dashboard-container">
    <!-- Left Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': !sidebarExpanded }" 
           @mouseenter="sidebarExpanded = true" 
           @mouseleave="sidebarExpanded = false">
      <div class="logo-container">
        <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="logo-svg">
        <div class="logo-text" v-show="sidebarExpanded">
          <h1>EUNOIA</h1>
          <p>Counselor Portal</p>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <h3 v-show="sidebarExpanded">Counselor Menu</h3>
        <ul>
          <li :class="{ active: currentView === 'dashboard' }">
            <a @click="setView('dashboard')" class="menu-item" data-tooltip="Dashboard">
              <div class="menu-icon">
              <i class="fas fa-th-large"></i>
              </div>
              <span v-show="sidebarExpanded">Dashboard</span>
            </a>
          </li>
          <li :class="{ active: ['bulkAssessment', 'individualAssessment', 'autoReminders'].includes(currentView) }">
            <a @click="toggleSubmenu('ryffAssessment')" class="menu-item has-submenu" data-tooltip="Test Management">
              <div class="menu-icon">
              <i class="fas fa-chart-bar"></i>
              </div>
              <span v-show="sidebarExpanded">Test Management</span>
              <i v-show="sidebarExpanded" class="fas fa-chevron-right submenu-arrow" :class="{ 'submenu-open': showSubmenu === 'ryffAssessment' }"></i>
            </a>
            <ul class="submenu" :class="{ 'submenu-open': showSubmenu === 'ryffAssessment' && sidebarExpanded }">
              <li :class="{ active: currentView === 'bulkAssessment' }">
                <a @click="setView('bulkAssessment')" class="submenu-item">
                  <i class="fas fa-users"></i>
                  <span v-show="sidebarExpanded">Bulk Assessment</span>
                </a>
              </li>
              <li :class="{ active: currentView === 'individualAssessment' }">
                <a @click="setView('individualAssessment')" class="submenu-item">
                  <i class="fas fa-user"></i>
                  <span v-show="sidebarExpanded">Individual Assessment</span>
                </a>
              </li>
              <li :class="{ active: currentView === 'autoReminders' }">
                <a @click="setView('autoReminders')" class="submenu-item">
                  <i class="fas fa-bell"></i>
                  <span v-show="sidebarExpanded">Auto-Reminders</span>
                </a>
              </li>
            </ul>
          </li>
          <!-- New Results Dropdown -->
          <li :class="{ active: ['ryffScoring', 'guidance'].includes(currentView) }">
            <a @click="toggleSubmenu('results')" class="menu-item has-submenu" data-tooltip="Results">
              <div class="menu-icon">
                <i class="fas fa-poll"></i>
              </div>
              <span v-show="sidebarExpanded">Results</span>
              <i v-show="sidebarExpanded" class="fas fa-chevron-right submenu-arrow" :class="{ 'submenu-open': showSubmenu === 'results' }"></i>
            </a>
            <ul class="submenu" :class="{ 'submenu-open': showSubmenu === 'results' && sidebarExpanded }">
              <li :class="{ active: currentView === 'ryffScoring' }">
                <a @click="setView('ryffScoring')" class="submenu-item">
                  <i class="fas fa-calculator"></i>
                  <span v-show="sidebarExpanded">Ryff Scoring</span>
                </a>
              </li>

              <li :class="{ active: currentView === 'guidance' }">
                <a @click="setView('guidance')" class="submenu-item">
                  <i class="fas fa-comment-alt"></i>
                  <span v-show="sidebarExpanded">College</span>
                </a>
              </li>
            </ul>
          </li>
          <li :class="{ active: currentView === 'intervention' }">
            <a @click="setView('intervention')" class="menu-item" data-tooltip="Intervention">
              <div class="menu-icon">
              <i class="fas fa-brain"></i>
              </div>
              <span v-show="sidebarExpanded">Intervention</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'status' }">
            <a @click="setView('status')" class="menu-item" data-tooltip="Account Management">
              <div class="menu-icon">
              <i class="fas fa-signal"></i>
              </div>
              <span v-show="sidebarExpanded">Account Management</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'reports' }">
            <a @click="setView('reports')" class="menu-item" data-tooltip="Reports">
              <div class="menu-icon">
              <i class="fas fa-file-alt"></i>
              </div>
              <span v-show="sidebarExpanded">Reports</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'settings' }">
            <a @click="setView('settings')" class="menu-item" data-tooltip="Settings">
              <div class="menu-icon">
              <i class="fas fa-cog"></i>
              </div>
              <span v-show="sidebarExpanded">Settings</span>
            </a>
          </li>
          <li class="logout-item">
            <a @click="logout" class="menu-item" data-tooltip="Logout">
              <div class="menu-icon logout-icon">
              <i class="fas fa-sign-out-alt"></i>
              </div>
              <span v-show="sidebarExpanded">Logout</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content" :class="{ 'content-collapsed': !sidebarExpanded }">
      <!-- Top Navigation Bar -->
      <header class="top-nav">
        <div class="page-title">
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>
        <div class="nav-actions">
          <!-- Removed notification and profile icons -->
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="content-container">
        
        <!-- Main Dashboard View -->
        <div v-if="currentView === 'dashboard'">




          <!-- Two Column Layout Container -->
          <div class="two-column-layout">
            <!-- Risk Alerts Section -->
            <div class="section risk-alerts-section">
              <div class="section-header alert-header">
                <div class="section-title">
                  <div class="section-icon alert-icon">
                    <i class="fas fa-exclamation-circle"></i>
                  </div>
                  <div>
                    <h3>Risk Alerts</h3>
                    <p>Dimensions requiring immediate attention</p>
                  </div>
                </div>

              </div>

              <div class="alerts-container">
                <div v-for="(dimension, index) in riskAlertsData" 
                     :key="index" 
                     class="alert-item"
                     @click="showDimensionDetails(dimension)"
                     :class="{ 'clickable': true, 'has-risk': dimension.totalAtRisk > 0 }">
                  <div class="alert-details">
                    <h4>{{ dimension.dimension }}</h4>
                    <div class="risk-badge" v-if="dimension.totalAtRisk > 0">
                      {{ dimension.totalAtRisk }}
                    </div>
                  </div>
                  <div class="alert-colleges" v-if="dimension.totalAtRisk > 0">
                    <p>{{ dimension.colleges.length }} colleges</p>
                    <span>at high risk</span>
                  </div>
                  <div class="alert-colleges no-risk" v-else>
                    <p>No students at risk</p>
                  </div>
                </div>
                <div v-if="riskAlertsLoading" class="loading-alerts">
                  <p>Loading risk alerts...</p>
                </div>
              </div>
            </div>

            <!-- College Assessment Overview -->
            <div class="section college-section">
              <div class="section-header">
                <div class="section-title">
                  <div class="section-icon dept-icon">
                    <i class="fas fa-building"></i>
                  </div>
                  <div>
                    <h3>College Assessment Overview</h3>
                    <p>Assessment participation and low scores by college</p>
                  </div>
                </div>

              </div>

              <div class="table-container">
                <table class="college-table">
                  <thead>
                    <tr>
                      <th>College</th>
                      <th>Total Test Takers</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="college in collegeOverviewData" :key="college.name">
                      <td :data-college="college.name">{{ college.name }}</td>
                      <td>{{ college.totalTestTakers }}</td>
                    </tr>
                    <tr v-if="collegeOverviewData.length === 0">
                      <td colspan="2" style="text-align: center; color: #999;">No college data available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Yearly Trend Analysis -->
          <YearlyTrendAnalysis />
        </div>

        <!-- Router View for Nested Components -->
        <router-view 
          :students="students"
          :selectedDimension="selectedRiskDimension" 
          :selectedCollege="selectedCollegeDetail"
          :assessmentType="$route.query.assessmentType || '42-item'"
          :preSelectedStudent="preSelectedStudent"
          :preSelectedReportType="preSelectedReportType"
          :riskFilterData="riskFilterData"
          @clearRiskFilters="clearRiskFilters"
          @navigateToReports="handleNavigateToReports"
          @studentsUpdated="updateStudentData"
          @studentsDeactivated="handleStudentsDeactivated"
          @navigateToCollege="showCollegeDetail"
          @goBack="hideCollegeDetail"
        />
      </div>

      <!-- Dimension Details Modal -->
      <div class="modal" v-if="showModal && selectedDimension" @click.self="closeModal">
        <div class="modal-content dimension-details">
          <div class="modal-header">
            <h3>{{ selectedDimension.dimension }} - Colleges at High Risk</h3>
            <button class="close-button" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="college-risk-list">
              <div v-for="(college, index) in selectedDimension.colleges" 
                   :key="index" 
                   class="college-risk-item"
                   @click="viewStudentsAtRisk(selectedDimension.dimension, college.name)">
                <div class="college-name">{{ college.name }}</div>
                <div class="student-count">
                  <span class="count">{{ college.studentCount }}</span>
                  <span class="label">students at risk</span>
                </div>
                <div class="view-students-link">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import authService from '@/services/authService'
import YearlyTrendAnalysis from './YearlyTrendAnalysis.vue'
import RyffScoring from './RyffScoring.vue'
import BulkAssessment from './BulkAssessment.vue'
import IndividualAssessment from './IndividualAssessment.vue'
import AutoReminders from './AutoReminders.vue'
import AccountManagement from './AccountManagement.vue'
import CollegeView from './CollegeView.vue'
import CollegeDetail from './CollegeDetail.vue'
import Reports from './Reports.vue'
import Settings from './Settings.vue'
import AIintervention from './AIintervention.vue'

import { calculateCollegeStats } from '../Shared/RyffScoringUtils'
import { apiUrl } from '../../utils/apiUtils'

export default {
  name: 'CounselorDashboard',
  components: {
    YearlyTrendAnalysis,
    RyffScoring,
    BulkAssessment,
    IndividualAssessment,
    AutoReminders,
    AccountManagement,
    CollegeView,
    CollegeDetail,
    Reports,
    Settings,
    AIintervention,

  },
  data() {
    return {
      
      showSubmenu: null,
      selectedCollege: 'all',
      showModal: false,
      selectedDimension: null,
      selectedRiskDimension: null,
      selectedRiskCollege: 'all',
      selectedCollegeDetail: null,
      preSelectedStudent: null,
      preSelectedReportType: null,
      riskFilterData: null,
      sidebarExpanded: false,
      viewChangeTimeout: null,
      // Student data - will be populated by initializeStudentData()
      students: [],
      // Risk threshold - scores at or below this value are considered "at risk"
      riskThreshold: 17,
      // Dimensions will be calculated dynamically (legacy)
      dimensions: [],
      // New risk alerts data from API
      riskAlertsData: [],
      riskAlertsLoading: false,
      // College overview data - will be populated from backend
      collegeOverviewData: [],
      currentDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),

      academicYears: [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]
    }
  },
  async created() {
    // Initialize student data and wait for it to complete
    await this.initializeStudentData();
    // Load college overview data
    await this.loadCollegeOverviewData();
    // Load new risk alerts data
    await this.loadRiskAlertsData();
    // Calculate risk dimensions only after student data is loaded (legacy)
    this.calculateRiskDimensions();
  },
  async mounted() {
    // Ensure data is available when components mount
    if (this.students.length === 0) {
      await this.initializeStudentData();
      this.calculateRiskDimensions();
    }
  },
  computed: {
    currentView() {
      const routeName = this.$route.name;
      const routeToViewMap = {
        'CounselorDashboard': 'dashboard',
        'BulkAssessment': 'bulkAssessment',
        'IndividualAssessment': 'individualAssessment',
        'AutoReminders': 'autoReminders',
        'RyffScoring': 'ryffScoring',
        'CollegeSummary': 'guidance',
        'CollegeDetail': 'guidance',
        'CollegeHistoryDetail': 'collegeHistoryDetail',
        'AIIntervention': 'intervention',
        'AccountManagement': 'status',
        'Reports': 'reports',
        'Settings': 'settings'
      };
      return routeToViewMap[routeName] || 'dashboard';
    },
    pageTitle() {
      switch(this.currentView) {
        case 'bulkAssessment':
          return 'Bulk Assessment';
        case 'individualAssessment':
          return 'Individual Assessment';
        case 'autoReminders':
          return 'Auto-Reminders';
        case 'ryffScoring':
          return 'Ryff Scoring';
        case 'guidance':
          return 'College Summary';
        case 'collegeHistoryDetail':
          return 'College History Detail';
        case 'intervention':
          return 'AI Intervention';
        case 'status':
          return 'Account Management';
        case 'settings':
          return 'Settings';
        default:
          return 'Dashboard Overview';
      }
    },
    pageSubtitle() {
      switch(this.currentView) {
        case 'bulkAssessment':
          return 'Distribute the Ryff assessment to target groups in one click';
        case 'individualAssessment':
          return 'Send assessments to specific students by searching and selecting them individually';
        case 'autoReminders':
          return 'Schedule automatic assessment reminders';
        case 'ryffScoring':
          return 'Review and analyze assessment scores';
        case 'guidance':
          return 'View and analyze assessment results by college';
        case 'collegeHistoryDetail':
          return 'View detailed historical assessment data for the selected college';
        case 'intervention':
          return 'Intelligent categorization and intervention recommendations for student well-being';
        case 'status':
          return 'Manage college accounts and user access';
        case 'settings':
          return 'Configure system preferences and account settings';
        default:
          return 'Monitor well-being metrics across colleges';
      }
    }
  },
  methods: {
    setView(view) {
      // Clear any existing timeout to prevent conflicts
      if (this.viewChangeTimeout) clearTimeout(this.viewChangeTimeout);
      
      // Map view names to router paths
      const routeMap = {
        'dashboard': '/counselor',
        'bulkAssessment': '/counselor/bulk-assessment',
        'individualAssessment': '/counselor/individual-assessment',
        'autoReminders': '/counselor/auto-reminders',
        'ryffScoring': '/counselor/ryff-scoring',
        'guidance': '/counselor/college-summary',
        'intervention': '/counselor/ai-intervention',
        'status': '/counselor/account-management',
        'reports': '/counselor/reports',
        'settings': '/counselor/settings'
      };
      
      const routePath = routeMap[view] || '/counselor';
      
      // Only navigate if we're not already on the target route
      if (this.$route.path !== routePath) {
        this.$router.push(routePath);
      }
    },
    async logout() {
      await authService.logout();
    },
    toggleSubmenu(menu) {
      this.showSubmenu = this.showSubmenu === menu ? null : menu;
    },
    showDimensionDetails(dimension) {
      this.selectedDimension = dimension;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.selectedDimension = null;
    },
    // New method to navigate to RyffScoring with filters
    viewStudentsAtRisk(dimensionName, collegeName) {
      // Find the specific dimension data from riskAlertsData
      const dimensionData = this.riskAlertsData.find(alert => alert.dimension === dimensionName);
      if (!dimensionData) {
        console.error('Dimension data not found:', dimensionName);
        return;
      }
      
      // Find the specific college data within the dimension
      const collegeData = dimensionData.colleges.find(college => college.name === collegeName);
      if (!collegeData) {
        console.error('College data not found:', collegeName);
        return;
      }
      
      // Extract detailed student information
      const studentsAtRisk = collegeData.students || [];
      
      // Group students by assessment type to detect multiple assessment types
      const assessmentTypes = [...new Set(studentsAtRisk.map(student => student.assessmentType))];
      const hasMultipleAssessmentTypes = assessmentTypes.length > 1;
      
      // Prepare detailed filter data
      const riskFilterData = {
        dimension: dimensionName,
        college: collegeName,
        students: studentsAtRisk,
        assessmentTypes: assessmentTypes,
        hasMultipleAssessmentTypes: hasMultipleAssessmentTypes,
        sections: [...new Set(studentsAtRisk.map(student => student.section))],
        // Determine primary assessment type (most common)
        primaryAssessmentType: assessmentTypes.length > 0 ? 
          assessmentTypes.reduce((a, b) => 
            studentsAtRisk.filter(s => s.assessmentType === a).length >= 
            studentsAtRisk.filter(s => s.assessmentType === b).length ? a : b
          ) : 'ryff_42'
      };
      
      // Set the risk filter data for RyffScoring component
      this.selectedRiskDimension = dimensionName;
      this.selectedRiskCollege = collegeName;
      this.riskFilterData = riskFilterData;
      
      // Navigate to RyffScoring with query parameters for additional context
      this.$router.push({
        path: '/counselor/ryff-scoring',
        query: {
          riskFilter: 'true',
          dimension: dimensionName,
          college: collegeName,
          assessmentTypes: assessmentTypes.join(','),
          hasMultiple: hasMultipleAssessmentTypes.toString()
        }
      });
      
      this.closeModal();
      
      console.log('Navigating to RyffScoring with risk filter data:', riskFilterData);
    },
    // Handle navigation to Reports from RyffScoring
    handleNavigateToReports(data) {
      // Navigate to reports with pre-selected data
      
      // Set the pre-selected student and report type
      this.preSelectedStudent = data.student;
      this.preSelectedReportType = data.reportType;
      
      // Navigate to reports view
      this.$router.push('/counselor/reports');
    },
    refreshData() {
      // Refresh dashboard data
      // Implement actual refresh logic here
    },
    
    // Add method to clear risk filters
    clearRiskFilters() {
      this.selectedRiskDimension = null;
      this.selectedRiskCollege = null;
      this.riskFilterData = null;
    },
    
    // Load risk alerts data from API
    async loadRiskAlertsData() {
      this.riskAlertsLoading = true;
      try {
        const response = await fetch(apiUrl('/risk-alerts'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          this.riskAlertsData = result.data;
          console.log('Risk alerts data loaded:', this.riskAlertsData);
        } else {
          console.error('Failed to load risk alerts:', result.error);
          // Initialize with empty data structure for all 6 dimensions
          this.initializeEmptyRiskAlerts();
        }
      } catch (error) {
        console.error('Error loading risk alerts:', error);
        // Initialize with empty data structure for all 6 dimensions
        this.initializeEmptyRiskAlerts();
      } finally {
        this.riskAlertsLoading = false;
      }
    },
    
    // Initialize empty risk alerts structure
    initializeEmptyRiskAlerts() {
      this.riskAlertsData = [
        { dimension: 'Autonomy', dimensionKey: 'autonomy', totalAtRisk: 0, colleges: [] },
        { dimension: 'Environmental Mastery', dimensionKey: 'environmental_mastery', totalAtRisk: 0, colleges: [] },
        { dimension: 'Personal Growth', dimensionKey: 'personal_growth', totalAtRisk: 0, colleges: [] },
        { dimension: 'Positive Relations with Others', dimensionKey: 'positive_relations', totalAtRisk: 0, colleges: [] },
        { dimension: 'Purpose in Life', dimensionKey: 'purpose_in_life', totalAtRisk: 0, colleges: [] },
        { dimension: 'Self-Acceptance', dimensionKey: 'self_acceptance', totalAtRisk: 0, colleges: [] }
      ];
    },
    
    // Handle navigation to college detail
    showCollegeDetail(college) {
      // Enhance college data with year-specific information
      const enhancedCollege = {
        ...college,
        yearData: {
          '1st': {
            completionRate: '92%',
            overallScore: Math.round(college.avgScore * 1.05), // Slightly higher for 1st year
            atRiskCount: Math.max(1, Math.round(college.atRisk * 0.3)),
            dimensions: this.generateYearSpecificDimensions(college.dimensions, 1.05)
          },
          '2nd': {
            completionRate: '88%',
            overallScore: Math.round(college.avgScore * 0.98), // Slightly lower for 2nd year
            atRiskCount: Math.max(1, Math.round(college.atRisk * 0.35)),
            dimensions: this.generateYearSpecificDimensions(college.dimensions, 0.98)
          },
          '3rd': {
            completionRate: '85%',
            overallScore: Math.round(college.avgScore * 0.95), // Lower for 3rd year
            atRiskCount: Math.max(1, Math.round(college.atRisk * 0.4)),
            dimensions: this.generateYearSpecificDimensions(college.dimensions, 0.95)
          },
          '4th': {
            completionRate: '90%',
            overallScore: Math.round(college.avgScore * 1.08), // Higher for 4th year (more mature)
            atRiskCount: Math.max(1, Math.round(college.atRisk * 0.25)),
            dimensions: this.generateYearSpecificDimensions(college.dimensions, 1.08)
          }
        }
      };
      
      // Set the college detail data for the component to access
      this.selectedCollegeDetail = enhancedCollege;
      
      // Navigate to the college detail route with assessment type as query parameter
      const collegeId = encodeURIComponent(college.name || college.code || 'unknown');
      const routeParams = {
        path: `/counselor/college-detail/${collegeId}`
      };
      
      // Include assessment type as query parameter if available
      if (college.assessmentType) {
        routeParams.query = { assessmentType: college.assessmentType };
      }
      
      this.$router.push(routeParams);
    },
    
    // Generate year-specific dimension scores based on base dimensions
    generateYearSpecificDimensions(baseDimensions, multiplier) {
      const yearDimensions = {};
      Object.keys(baseDimensions).forEach(dimKey => {
        const baseScore = baseDimensions[dimKey].score;
        // Use consistent multiplier without random variation to ensure stable scores
        const newScore = Math.max(1, Math.min(42, Math.round(baseScore * multiplier)));
        yearDimensions[dimKey] = { score: newScore };
      });
      return yearDimensions;
    },
    
    // Handle back navigation from college detail
    hideCollegeDetail() {
      this.selectedCollegeDetail = null;
    },
    
    // Initialize student data from backend API
    async initializeStudentData() {
      try {
        // Load students from backend API
        const response = await fetch(apiUrl('/accounts/students?page=1&limit=100'));
        if (response.ok) {
          const data = await response.json();
          this.students = data.students.map(student => ({
            id: student.id, // Use the UUID id for backend API calls
            id_number: student.id_number, // Keep id_number for display purposes
            name: student.name,
            college: student.college,
            section: student.section,
            email: student.email,
            yearLevel: `${student.year_level}${this.getYearSuffix(student.year_level)} Year`,
            submissionDate: null, // No assessment data initially
            subscales: null, // No assessment data initially
            assessmentHistory: [] // No assessment history initially
          }));
          // Student data loaded successfully
        } else {
          console.error('Failed to load students from backend');
          this.students = []; // Empty array if backend fails
        }
      } catch (error) {
        console.error('Error loading students:', error);
        this.students = []; // Empty array if error occurs
      }
    },
    
    // Helper method to get year suffix
    getYearSuffix(year) {
      const suffixes = { 1: 'st', 2: 'nd', 3: 'rd' };
      return suffixes[year] || 'th';
    },
    
    // Load college overview data from backend
    async loadCollegeOverviewData() {
      try {
        const response = await fetch(apiUrl('/accounts/colleges'));
        if (response.ok) {
          const data = await response.json();
          this.collegeOverviewData = data.colleges.map(college => ({
            name: college.name,
            totalTestTakers: college.totalUsers || 0,
            lowScores: Math.floor((college.totalUsers || 0) * 0.3) // Placeholder: 30% low scores
          }));
        } else {
          console.error('Failed to load college overview data from backend');
          this.collegeOverviewData = [];
        }
      } catch (error) {
        console.error('Error loading college overview data:', error);
        this.collegeOverviewData = [];
      }
    },
    
    // Update student data from AccountManagement
    updateStudentData(studentsData) {
      this.students = studentsData;
      // Recalculate risk dimensions when student data changes
      this.calculateRiskDimensions();
    },
    
    // Handle students deactivation event from AccountManagement
    async handleStudentsDeactivated() {
      console.log('Students deactivated, refreshing RyffScoring data...');
      
      // Refresh RyffScoring component data if it exists
      if (this.$refs.ryffScoringComponent && this.$refs.ryffScoringComponent.refreshData) {
        await this.$refs.ryffScoringComponent.refreshData();
      }
      
      // Also refresh dashboard data
      this.refreshData();
    },
    // Calculate risk dimensions based on actual student data
    calculateRiskDimensions() {
      // Define dimension names and their corresponding property names in student data
      const dimensionMap = {
        'Autonomy': 'autonomy',
        'Environmental Mastery': 'environmentalMastery',
        'Personal Growth': 'personalGrowth',
        'Positive Relations with Others': 'positiveRelations',
        'Purpose in Life': 'purposeInLife',
        'Self-Acceptance': 'selfAcceptance'
      };
      
      // Create a new array to store dimensions with at-risk students
      const calculatedDimensions = [];
      
      // For each dimension, check if there are any at-risk students
      for (const [dimensionName, propertyName] of Object.entries(dimensionMap)) {
        // Group at-risk students by college
        const collegeRisks = {};
        
        // Check each student
        this.students.forEach(student => {
          // Skip students without assessment data
          if (!student.subscales || !student.subscales[propertyName]) {
            return;
          }
          
          // Check if this dimension is at risk for this student
          const score = student.subscales[propertyName]; // Raw score from database
          if (score <= this.riskThreshold) {
            // Add this college to the list if not already present
            if (!collegeRisks[student.college]) {
              collegeRisks[student.college] = {
                name: student.college,
                studentCount: 0,
                // Store student IDs to verify counts
                studentIds: []
              };
            }
            // Increment the student count for this college
            collegeRisks[student.college].studentCount++;
            // Store student ID for verification
            collegeRisks[student.college].studentIds.push(student.id);
          }
        });
        
        // Convert the college risks object to an array
        const highRiskColleges = Object.values(collegeRisks);
        
        // Only add this dimension if there are any colleges with at-risk students
        if (highRiskColleges.length > 0) {
          calculatedDimensions.push({
            name: dimensionName,
            highRiskColleges: highRiskColleges
          });
        }
        
        // Track at-risk students for analysis
      }
      
      // Update the dimensions array
      this.dimensions = calculatedDimensions;
      
      // Risk dimensions calculated and updated
    }
  }
}
</script>

<style scoped>
:root {
  --primary: #00b3b0;
  --primary-dark: #009491;
  --secondary: #f8c630;
  --accent: #ff6b6b;
  --light: #ffffff;
  --dark: #1a2e35;
  --gray: #f7f9fa;
  --text: #546e7a;
  --text-light: #78909c;
  --border-radius: 8px;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --dim-1: #4caf50;
  --dim-2: #2196f3;
  --dim-3: #9c27b0;
  --dim-4: #ff9800;
  --dim-5: #f44336;
  --dim-6: #607d8b;
}

/* Layout Styles */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 30px 30px;
  font-family: 'Inter', sans-serif;
  color: var(--text);
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  background-color: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
  padding: 0;
  display: flex;
  flex-direction: column;
  z-index: 10;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-collapsed .logo-text,
.sidebar-collapsed .sidebar-menu h3,
.sidebar-collapsed .menu-item span,
.sidebar-collapsed .submenu-arrow {
  opacity: 0;
  visibility: hidden;
}

.sidebar-collapsed .submenu {
  max-height: 0 !important;
  overflow: hidden;
}

.sidebar-collapsed .menu-item {
  justify-content: center;
  padding: 12px 20px;
}

.sidebar-collapsed .menu-icon {
  margin-right: 0;
}

.sidebar-collapsed .logo-container {
  justify-content: center;
}

.sidebar-collapsed .logo-container img {
  margin-right: 0;
}

/* Tooltip for collapsed sidebar */
.sidebar-collapsed .menu-item {
  position: relative;
}

.sidebar-collapsed .menu-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  margin-left: 8px;
  opacity: 0;
  animation: fadeInTooltip 0.2s ease forwards;
}

@keyframes fadeInTooltip {
  to {
    opacity: 1;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 25px 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
  position: relative;
}

.logo-container::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%);
  transition: width 0.3s ease;
}

.sidebar:hover .logo-container::after {
  width: 100px;
}

.logo-container img {
  width: 35px;
  height: 35px;
  margin-right: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 179, 176, 0.2);
  transition: transform 0.3s ease;
}

.sidebar:hover .logo-container img {
  transform: rotate(5deg);
}

.logo-text h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--primary);
  letter-spacing: 0.5px;
}

.logo-text p {
  font-size: 12px;
  margin: 0;
  color: var(--text-light);
  opacity: 0.8;
}

.sidebar-menu {
  flex: 1;
  padding: 10px 0;
}

.sidebar-menu h3 {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-light);
  padding: 0 25px;
  margin-bottom: 15px;
  font-weight: 500;
  letter-spacing: 1px;
}

.sidebar-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  margin-bottom: 2px;
  position: relative;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 25px;
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  cursor: pointer;
  position: relative;
}

.menu-item:hover {
  background-color: rgba(0, 179, 176, 0.04);
  color: var(--primary);
}

.sidebar-menu li.active .menu-item {
  background-color: rgba(0, 179, 176, 0.08);
  color: var(--primary);
  border-left: 3px solid var(--primary);
  font-weight: 500;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-light);
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon,
.sidebar-menu li.active .menu-icon {
  color: var(--primary);
  transform: translateY(-1px);
}

.has-submenu {
  justify-content: space-between;
}

.has-submenu span {
  flex: 1;
}

.submenu-arrow {
  font-size: 10px;
  color: var(--text-light);
  transition: transform 0.3s ease;
}

.submenu-arrow.submenu-open {
  transform: rotate(90deg);
  color: var(--primary);
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0, 1, 0, 1);
  background-color: rgba(0, 0, 0, 0.02);
}

.submenu.submenu-open {
  max-height: 300px;
  transition: max-height 0.5s ease-in-out;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 57px;
  color: var(--text);
  font-size: 13px;
  transition: all 0.2s;
  cursor: pointer;
}

.submenu-item i {
  width: 18px;
  margin-right: 10px;
  font-size: 13px;
  color: var(--text-light);
}

.submenu-item:hover {
  background-color: rgba(0, 179, 176, 0.04);
  color: var(--primary);
}

.submenu-item:hover i {
  color: var(--primary);
}

.submenu li.active .submenu-item {
  color: var(--primary);
  font-weight: 500;
  background-color: rgba(0, 179, 176, 0.08);
}

.submenu li.active .submenu-item i {
  color: var(--primary);
}

/* Add this CSS for the logout button */
.logout-item {
  margin-top: 30px;
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.logout-item .menu-item {
  color: #f44336;
}

.logout-item .menu-item:hover {
  background-color: rgba(244, 67, 54, 0.05);
}

.logout-icon {
  color: #f44336 !important;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 260px; /* Match exactly the sidebar width */
  padding: 20px;
  background-color: #f5f5f5; /* Plain dirty white background */
  min-height: 100vh;
  overflow-y: auto;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.content-collapsed {
  margin-left: 64px;
}

.main-content > div {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: calc(100vh - 100px); /* Adjust for padding and top nav */
}

/* Content container for all views */
.content-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
  width: 100%;
}

/* Remove any dot patterns or textures */
.main-content::before,
.main-content::after {
  display: none;
}

/* Top Navigation */
.top-nav {
  height: 60px;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 5;
}

.page-title {
  font-size: 13px;
  color: var(--text-light);
  margin: 0;
}

.page-title h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--dark);
}

.page-title p {
  font-size: 13px;
  color: var(--text-light);
  margin: 0;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.notifications {
  position: relative;
  margin-right: 25px;
  cursor: pointer;
}

.notifications i {
  transition: transform 0.2s;
}

.notifications:hover i {
  transform: rotate(15deg);
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: var(--accent);
  color: white;
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-profile i {
  margin-right: 8px;
}

/* Add styling for the logout button */
.logout-button {
  display: flex;
  align-items: center;
  background-color: transparent;
  color: #f44336;
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  background-color: #f44336;
  color: white;
}

.logout-button i {
  margin-right: 8px;
}

/* Dashboard Content */
.dashboard-content {
  flex: 1;
  padding: 15px 20px;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 5px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

/* Custom Select Styling */
.custom-select-wrapper {
  position: relative;
  min-width: 240px;
}

.period-filter {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  padding: 0.7rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  font-size: 0.9rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.period-filter:hover {
  border-color: #94a3b8;
}

.period-filter:focus {
  outline: none;
  border-color: #00b3b0;
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
  transition: transform 0.2s ease;
}

.custom-select-wrapper:hover .select-icon {
  color: #00b3b0;
}

.period-filter:focus + .select-icon {
  transform: translateY(-50%) rotate(180deg);
  color: #00b3b0;
}

.year-filter,
.semester-filter {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  font-size: 0.9rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.year-filter:hover,
.semester-filter:hover {
  border-color: #94a3b8;
}

.year-filter:focus,
.semester-filter:focus {
  outline: none;
  border-color: #00b3b0;
  box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);
}



/* Metrics Row */
.metrics-row {
  margin-top: 32px;
  margin-bottom: 24px;
  width: 100%;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
}

.metric-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  width: 100%;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.metric-content {
  display: flex;
  flex-direction: column;
}

.metric-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.metric-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  margin: 0;
}

.metric-icon {
  margin-left: auto;
  color: var(--primary);
  font-size: 18px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 10px;
}

.metric-change {
  font-size: 13px;
  display: flex;
  align-items: center;
}

.metric-change i {
  margin-right: 5px;
}

.metric-change.positive {
  color: var(--dim-1);
}

.metric-change.negative {
  color: var(--dim-5);
}

.compared-text {
  color: var(--text-light);
  margin-left: 5px;
}

.metric-unit {
  font-size: 16px;
  color: var(--text-light);
  font-weight: normal;
}

/* Section Styles */
.section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 15px;
}

.section-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
}

.section-title i {
  margin-right: 10px;
  color: var(--accent);
}

.section-header p {
  font-size: 13px;
  color: var(--text-light);
  margin: 5px 0 0 0;
}

.export-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
}

.export-btn:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.export-btn i {
  margin-right: 5px;
  color: var(--primary);
}

/* Risk Alerts Section */
.risk-alerts-section {
  background-color: #fff9f9;
  border: 1px solid #ffe8e8;
}

.alert-header .section-title i {
  color: #f44336;
}

.alerts-container {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  background-color: white;
}

.alert-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-badge {
  width: 45px;
  height: 45px;
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 15px;
}

.alert-details {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-details h4 {
  font-size: 15px;
  font-weight: 500;
  margin: 0;
  color: var(--dark);
}

.risk-badge {
  background-color: var(--accent);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-left: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
  }
}

.alert-details p {
  font-size: 13px;
  margin: 0;
  color: var(--text);
}

.negative {
  color: #f44336;
}

.alert-colleges {
  text-align: right;
}

.alert-colleges p {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--dark);
}

.alert-colleges.no-risk p {
  color: var(--text-light);
  font-size: 13px;
}

.alert-colleges span {
  font-size: 12px;
  color: var(--text-light);
}

.alert-item.has-risk {
  border-left: 3px solid var(--accent);
}

.alert-item:not(.has-risk) {
  opacity: 0.7;
}

.alert-item:not(.has-risk):hover {
  opacity: 1;
}

.loading-alerts {
  text-align: center;
  padding: 20px;
  color: var(--text-light);
}

.alert-students {
  text-align: right;
}

.alert-students p {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--dark);
}

.alert-students span {
  font-size: 12px;
  color: var(--accent);
}

/* College Table */
.table-container {
  padding: 0 20px 20px;
  overflow: auto;
  max-height: 300px;
}

.college-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

.college-table th {
  text-align: left;
  padding: 15px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  background-color: #f7f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.college-table td {
  padding: 12px 15px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.college-table tr:hover td {
  background-color: #f9fcff;
}

.college-table tr:last-child td {
  border-bottom: none;
}

/* Chart Section */
.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.college-filter {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.college-filter i {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-light);
}

.chart-types {
  display: flex;
}

.chart-type {
  background-color: transparent;
  border: 1px solid #e0e0e0;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}

.chart-type:first-child {
  border-radius: 4px 0 0 4px;
}

.chart-type:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.chart-type.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.chart-container {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
  min-height: 500px;
}

.chart-placeholder {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.barchart-container {
  display: flex;
  height: 300px;
  margin: 20px 0;
  position: relative;
  background-color: white;
  border-radius: 8px;
  background-image: linear-gradient(to top, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 100% 20%;
  background-repeat: repeat-y;
}

.y-axis {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  width: 30px;
  padding: 10px 0;
}

.y-label {
  font-size: 12px;
  color: var(--text-light);
  text-align: right;
  padding-right: 8px;
}

.chart-content {
  display: flex;
  flex: 1;
  justify-content: space-around;
  align-items: flex-end;
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
}

.college-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 18%;
}

.bar-group {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-around;
  align-items: flex-end;
}

.bar {
  width: 14px;
  border-radius: 4px 4px 0 0;
  margin: 0 3px;
  transition: height 0.3s ease, opacity 0.2s;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.bar:hover {
  opacity: 0.85;
}

.bar.autonomy {
  background-color: #f44336;
}

.bar.self-acceptance {
  background-color: #2196f3;
}

.bar.personal-growth {
  background-color: #1a2e35;
}

.bar.purpose-in-life {
  background-color: #ffc107;
}

.bar.environmental-mastery {
  background-color: #ff9800;
}

.bar.positive-relations {
  background-color: #e91e63;
}

.dept-label {
  font-size: 12px;
  font-weight: 500;
  margin-top: 10px;
  padding: 4px 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.x-axis {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.x-label {
  font-size: 11px;
  color: var(--text-light);
  text-align: center;
  width: 16.66%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Add these styles for the user avatar */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.user-avatar:hover {
  background-color: #e0e0e0;
}

.user-avatar i {
  font-size: 20px;
  color: #757575;
}

/* Improve the action button styling for mute alerts */
.action-btn {
  display: flex;
  align-items: center;
  background-color: #fff2f2;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #f44336;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.1);
}

.action-btn:hover {
  background-color: #f44336;
  color: white;
  border-color: #f44336;
}

.action-btn i {
  margin-right: 8px;
}

/* Add section icons to college section and subscale section */
.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: 15px;
  font-size: 20px;
}

.alert-icon {
  color: #f44336;
}

.dept-icon {
  color: #2196f3;
}

.chart-icon {
  color: #4caf50;
}

/* Add subtle hover effects to table rows */
.college-table tr {
  transition: all 0.2s;
}

.college-table tr:hover td {
  background-color: #f0f7ff;
}

/* Add college badge to the table */
.college-table td:first-child {
  padding: 12px 15px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.college-table td:first-child::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: var(--primary);
}

/* Add two-column layout styles */
.two-column-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 32px;
  margin-bottom: 24px;
  width: 100%;
}

.two-column-layout .section {
  flex: 1;
  margin-bottom: 0;
}

/* Additional styles for two-column layout */
.two-column-layout .section {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.two-column-layout .section-header {
  flex-shrink: 0;
}

.two-column-layout .alerts-container,
.two-column-layout .table-container {
  flex: 1;
}

@media (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
  }
}

/* Improve the table styling for the two-column layout */
.college-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* Add these additional styles */
.two-column-layout .college-table {
  font-size: 13px;
}

.two-column-layout .college-table th {
  padding: 12px 10px;
  font-size: 12px;
}

.two-column-layout .college-table td {
  padding: 10px;
  font-size: 13px;
}

/* Also adjust the alert items to fit better */
.two-column-layout .alert-item {
  padding: 10px;
  margin-bottom: 6px;
}

.two-column-layout .alert-badge {
  width: 38px;
  height: 38px;
  font-size: 13px;
  margin-right: 10px;
}

/* Enhanced Chart Styles */
.enhanced-chart {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 20px;
}

.chart-controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.chart-tab {
  padding: 8px 16px;
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  position: relative;
  transition: all 0.2s;
}

.chart-tab.active {
  color: var(--primary);
  font-weight: 500;
}

.chart-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary);
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-light);
  transition: all 0.2s;
}

.chart-action-btn:hover {
  background-color: #f5f5f5;
  color: var(--primary);
}

.main-chart-area {
  display: flex;
  height: 300px;
  margin-bottom: 10px;
  position: relative;
}

.chart-y-axis {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  width: 40px;
  padding-right: 10px;
  border-right: 1px solid #f0f0f0;
}

.y-value {
  font-size: 11px;
  color: var(--text-light);
  text-align: right;
}

.chart-visualization {
  flex: 1;
  position: relative;
  padding-left: 10px;
}

.horizontal-grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  z-index: 1;
}

.h-grid-line {
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.h-grid-line:first-child {
  background-color: rgba(0, 0, 0, 0.1);
}

.chart-columns {
  display: flex;
  justify-content: space-around;
  height: 100%;
  position: relative;
  z-index: 2;
}

.chart-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 18%;
}

.column-bars {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.bar-set {
  display: flex;
  align-items: flex-end;
  height: 100%;
  width: 100%;
  justify-content: space-around;
}

.data-bar {
  width: 12px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s;
}

.data-bar:hover {
  transform: scaleY(1.05);
}

.bar-tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 10;
}

.bar-tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid rgba(0, 0, 0, 0.8);
}

.bar-tooltip strong {
  display: block;
  font-weight: 500;
  margin-bottom: 2px;
}

.data-bar:hover .bar-tooltip {
  opacity: 1;
}

.column-label {
  font-size: 12px;
  font-weight: 500;
  padding: 6px 10px;
  margin-top: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.chart-categories {
  display: flex;
  justify-content: space-around;
  padding: 15px 40px 0;
  margin-bottom: 20px;
  border-top: 1px solid #f0f0f0;
}

.category {
  font-size: 11px;
  color: var(--text-light);
  text-align: center;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enhanced-legend {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.legend-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
  color: var(--dark);
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.legend-item:hover {
  background-color: #f0f0f0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.legend-text {
  font-size: 12px;
  color: var(--text);
}

/* Bar colors */
.data-bar.autonomy,
.legend-color.autonomy {
  background-color: #f44336;
}

.data-bar.self-acceptance,
.legend-color.self-acceptance {
  background-color: #2196f3;
}

.data-bar.personal-growth,
.legend-color.personal-growth {
  background-color: #1a2e35;
}

.data-bar.purpose-in-life,
.legend-color.purpose-in-life {
  background-color: #ffc107;
}

.data-bar.environmental-mastery,
.legend-color.environmental-mastery {
  background-color: #ff9800;
}

.data-bar.positive-relations,
.legend-color.positive-relations {
  background-color: #e91e63;
}

@media (max-width: 992px) {
  .metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .two-column-layout {
    flex-direction: column;
  }
}

@media (max-width: 576px) {
  .metrics-row {
    grid-template-columns: 1fr;
  }
}

/* Updated and new styles */
.alert-item.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.alert-item.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

.modal-content {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  transform: translateY(20px);
  animation: slideUp 0.3s ease forwards;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: var(--dark);
  font-size: 1.25rem;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--gray);
  color: var(--dark);
}

.modal-body {
  padding: 24px;
}

.college-risk-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* College Risk Item Styles */
.college-risk-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  margin-bottom: 10px;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid #e9ecef;
}

.college-risk-item:hover {
  background-color: #e9f5f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border-color: var(--primary);
}

.college-name {
  font-weight: 500;
  flex: 1;
  color: var(--dark);
}

.student-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 15px;
}

.student-count .count {
  font-weight: 600;
  font-size: 18px;
  color: var(--accent);
}

.student-count .label {
  font-size: 12px;
  color: var(--text-light);
}

.view-students-link {
  color: var(--primary);
  margin-left: 10px;
}

.view-students-link i {
  transition: transform 0.2s;
}

.college-risk-item:hover .view-students-link i {
  transform: translateX(3px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Update existing alert styles */
.alert-colleges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.alert-colleges p {
  font-weight: 600;
  color: var(--accent);
  margin: 0;
}

.alert-colleges span {
  font-size: 0.85rem;
  color: var(--text-light);
}
</style>