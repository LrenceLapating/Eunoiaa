<template>
  <div class="dashboard-container">
    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="logo-container">
        <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="logo-svg">
        <div class="logo-text">
          <h1>EUNOIA</h1>
          <p>Student Portal</p>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <h3>Student Menu</h3>
        <ul>
          <li :class="{ active: currentView === 'assessment' }">
            <a @click="currentView = 'assessment'" class="menu-item">
              <div class="menu-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <span>Assessment</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'settings' }">
            <a @click="currentView = 'settings'" class="menu-item">
              <div class="menu-icon">
                <i class="fas fa-cog"></i>
              </div>
              <span>Settings</span>
            </a>
          </li>
          <li class="logout-item">
            <a @click="logout" class="menu-item">
              <div class="menu-icon logout-icon">
                <i class="fas fa-sign-out-alt"></i>
              </div>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Top Navigation Bar -->
      <header class="top-nav">
        <div class="page-title">
          <h1>{{ currentView === 'assessment' ? 'Assessment Dashboard' : 'Settings' }}</h1>
          <p>{{ currentView === 'assessment' ? 'Complete your psychological well-being assessment' : 'Manage your account settings' }}</p>
        </div>
        <div class="nav-actions">
          <div class="user-profile">
            <div class="user-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="content-container">
        <!-- Assessment View -->
        <div v-if="currentView === 'assessment'" class="assessment-view">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <div class="welcome-content">
              <h1 class="welcome-title">Welcome to Your Well-being Journey</h1>
              <p class="welcome-subtitle">Take control of your mental health with our comprehensive psychological assessment</p>
            </div>
            <div class="welcome-illustration">
              <div class="floating-elements">
                <div class="element element-1"><i class="fas fa-brain"></i></div>
                <div class="element element-2"><i class="fas fa-heart"></i></div>
                <div class="element element-3"><i class="fas fa-leaf"></i></div>
              </div>
            </div>
          </div>

          <!-- No Assessment State -->
          <div v-if="!hasAssignedAssessments" class="no-assessment-state">
            <div class="no-assessment-card">
              <div class="no-assessment-icon">
                <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="no-assessment-logo">
              </div>
              <h3>No Assessment Yet</h3>
              <p>You don't have any assessments assigned at the moment. Your counselor will send you assessments when they're ready.</p>
              <div class="no-assessment-actions">
                <button class="contact-counselor-btn">
                  <i class="fas fa-envelope"></i>
                  Contact Counselor
                </button>
              </div>
            </div>
          </div>

          <!-- Assessment Cards Grid (when assessments are available) -->
          <div v-if="hasAssignedAssessments" class="assessment-grid">
            <!-- Main Assessment Card -->
            <div class="main-assessment-card">
              <div class="card-header">
                <div class="assessment-icon">
                <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="assessment-logo">
              </div>
                <div class="assessment-info">
                  <h3>{{ getAssessmentTitle }}</h3>
                  <p class="assessment-type">{{ getAssessmentDescription }}</p>
                  <div class="assessment-meta">
                    <span class="duration"><i class="fas fa-clock"></i> {{ getEstimatedDuration }}</span>
                    <span class="due-date"><i class="fas fa-calendar"></i> Due: {{ getFormattedDueDate }}</span>
                  </div>
                </div>
                <div class="status-indicator">
                  <span class="status-badge not-started">Not Started</span>
                </div>
              </div>
              
              <div class="card-body">
                <div class="assessment-description">
                  <p>Evaluate your psychological well-being across six key dimensions: autonomy, environmental mastery, personal growth, positive relations with others, purpose in life, and self-acceptance.</p>
                </div>
                
                <div class="progress-section">
                  <div class="progress-header">
                    <span class="progress-label">Completion Progress</span>
                    <span class="progress-value">0%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: 0%"></div>
                    <div class="progress-glow"></div>
                  </div>
                </div>
                
                <div class="dimensions-preview">
                  <h4>Assessment Dimensions</h4>
                  <div class="dimensions-grid">
                    <div class="dimension-item">
                      <i class="fas fa-user-check"></i>
                      <span>Autonomy</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-globe"></i>
                      <span>Environmental Mastery</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-seedling"></i>
                      <span>Personal Growth</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-users"></i>
                      <span>Positive Relations with Others</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-bullseye"></i>
                      <span>Purpose in Life</span>
                    </div>
                    <div class="dimension-item">
                      <i class="fas fa-heart"></i>
                      <span>Self-Acceptance</span>
                    </div>
                  </div>
                </div>
                
                <div class="action-section">
                  <button class="primary-action-btn" @click="startAssessment">
                    <i class="fas fa-play"></i>
                    Begin Assessment
                  </button>
                  <button class="secondary-action-btn">
                    <i class="fas fa-info-circle"></i>
                    Learn More
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Quick Stats Card -->
            <div class="stats-card">
              <div class="stats-header">
                <h4>Your Progress</h4>
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">0</div>
                  <div class="stat-label">Assessments Completed</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">1</div>
                  <div class="stat-label">Pending Assessment</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">6</div>
                  <div class="stat-label">Dimensions to Explore</div>
                </div>
              </div>
            </div>
            
            <!-- Tips Card -->
            <div class="tips-card">
              <div class="tips-header">
                <h4>Assessment Tips</h4>
                <i class="fas fa-lightbulb"></i>
              </div>
              <div class="tips-content">
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Answer honestly for accurate results</span>
                </div>
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Take your time, no rush</span>
                </div>
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Find a quiet, comfortable space</span>
                </div>
                <div class="tip-item">
                  <i class="fas fa-check-circle"></i>
                  <span>Your responses are confidential</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assessment Taking View -->
        <AssessmentTaking 
          v-if="currentView === 'taking-assessment'"
          :assessment-type="currentAssessment?.type"
          :assigned-assessment-id="currentAssessment?.assignedAssessmentId"
          @assessment-complete="onAssessmentComplete"
          @return-to-dashboard="onReturnToDashboard"
        />

        <!-- Assessment Complete View -->
        <AssessmentComplete 
          v-if="currentView === 'assessment-complete'"
          :assessment-type="currentAssessment?.type || '42'"
          @return-to-dashboard="onReturnToDashboard"
        />

        <!-- Settings View -->
        <div v-if="currentView === 'settings'" class="settings-view">
          <!-- Profile Information Section -->
          <section class="profile-info-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <i class="fas fa-user-circle"></i>
              </div>
              <div class="profile-details">
                <h2>{{ studentProfile.name || 'Loading...' }}</h2>
                <p class="student-id">Student ID: {{ studentProfile.id_number || 'N/A' }}</p>
                <div class="academic-info">
                  <span class="college-badge">{{ studentProfile.college || 'N/A' }}</span>
                  <span class="section-badge">{{ studentProfile.section || 'N/A' }}</span>
                  <span class="year-badge">Year {{ studentProfile.year_level || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Account Settings Section -->
          <section class="settings-card">
            <div class="settings-header">
              <h3><i class="fas fa-cog"></i> Account Settings</h3>
              <p>Manage your account preferences and security</p>
            </div>
            
            <div class="settings-form">
              <!-- Personal Information -->
              <div class="settings-section">
                <h4>Personal Information</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label for="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      v-model="userSettings.name" 
                      :placeholder="studentProfile.name || 'Your full name'"
                      readonly
                    >
                    <small class="form-note">Contact your administrator to update your name</small>
                  </div>
                  <div class="form-group">
                    <label for="student-id">Student ID</label>
                    <input 
                      type="text" 
                      id="student-id" 
                      :value="studentProfile.id_number" 
                      readonly
                    >
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="college">College</label>
                    <input 
                      type="text" 
                      id="college" 
                      :value="studentProfile.college" 
                      readonly
                    >
                  </div>
                  <div class="form-group">
                    <label for="section">Section</label>
                    <input 
                      type="text" 
                      id="section" 
                      :value="studentProfile.section" 
                      readonly
                    >
                  </div>
                </div>
              </div>

              <!-- Account Security -->
              <div class="settings-section">
                <h4>Account Security</h4>
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    v-model="userSettings.email" 
                    :placeholder="studentProfile.email || 'Your email address'"
                  >
                </div>
                <div class="form-group">
                  <label for="current-password">Current Password</label>
                  <input 
                    type="password" 
                    id="current-password" 
                    v-model="userSettings.currentPassword" 
                    placeholder="Enter current password"
                  >
                </div>
                <div class="form-group">
                  <label for="new-password">New Password</label>
                  <input 
                    type="password" 
                    id="new-password" 
                    v-model="userSettings.newPassword" 
                    placeholder="Enter new password"
                  >
                </div>
                <div class="form-group">
                  <label for="confirm-password">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="confirm-password" 
                    v-model="userSettings.confirmPassword" 
                    placeholder="Confirm new password"
                  >
                </div>
              </div>

              <!-- Preferences -->
              <div class="settings-section">
                <h4>Preferences</h4>
                <div class="preference-item">
                  <div class="preference-info">
                    <label>Email Notifications</label>
                    <small>Receive assessment reminders and updates via email</small>
                  </div>
                  <div class="toggle-switch">
                    <input type="checkbox" id="notifications" v-model="userSettings.notifications">
                    <label for="notifications"></label>
                  </div>
                </div>
                <div class="preference-item">
                  <div class="preference-info">
                    <label>Assessment Reminders</label>
                    <small>Get notified about upcoming assessment deadlines</small>
                  </div>
                  <div class="toggle-switch">
                    <input type="checkbox" id="reminders" v-model="userSettings.reminders">
                    <label for="reminders"></label>
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button class="save-btn" @click="saveSettings" :disabled="isLoading">
                  <i class="fas fa-save"></i>
                  {{ isLoading ? 'Saving...' : 'Save Changes' }}
                </button>
                <button class="cancel-btn" @click="resetSettings">
                  <i class="fas fa-undo"></i>
                  Reset
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import authService from '@/services/authService'
import AssessmentTaking from './AssessmentTaking.vue'
import AssessmentComplete from './AssessmentComplete.vue'

export default {
  name: 'StudentDashboard',
  components: {
    AssessmentTaking,
    AssessmentComplete
  },
  data() {
    return {
      currentView: 'assessment', // 'assessment', 'settings', 'taking-assessment', 'assessment-complete'
      isLoading: false,
      hasAssignedAssessments: false,
      assignedAssessments: [],
      currentAssessment: null,
      studentProfile: {
        name: '',
        email: '',
        id_number: '',
        college: '',
        section: '',
        year_level: ''
      },
      userSettings: {
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        notifications: true,
        reminders: true
      },
      originalSettings: {}
    };
  },
  computed: {
    getAssessmentTitle() {
      if (this.assignedAssessments.length > 0) {
        return this.assignedAssessments[0].bulk_assessment?.assessment_name || 'Ryff Psychological Well-being Scale';
      }
      return 'Ryff Psychological Well-being Scale';
    },
    getAssessmentDescription() {
      if (this.assignedAssessments.length > 0) {
        const assessmentType = this.assignedAssessments[0].bulk_assessment?.assessment_type || 'ryff_42';
        const itemCount = assessmentType === 'ryff_84' ? '84' : '42';
        return `${itemCount}-Item Comprehensive Assessment`;
      }
      return '42-Item Comprehensive Assessment';
    },
    getEstimatedDuration() {
      if (this.assignedAssessments.length > 0) {
        const assessmentType = this.assignedAssessments[0].bulk_assessment?.assessment_type || 'ryff_42';
        return assessmentType === 'ryff_84' ? '25-30 minutes' : '15-20 minutes';
      }
      return '15-20 minutes';
    },
    getFormattedDueDate() {
      if (this.assignedAssessments.length > 0) {
        const expiresAt = this.assignedAssessments[0].expires_at;
        if (expiresAt) {
          const date = new Date(expiresAt);
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      }
      return 'No due date';
    }
  },
  async mounted() {
    await this.fetchStudentProfile();
    await this.fetchAssignedAssessments();
  },
  methods: {
    async fetchStudentProfile() {
      try {
        const result = await authService.getCurrentUserProfile();
        
        if (result.success) {
          this.studentProfile = result.user;
          
          // Pre-populate settings with profile data
          this.userSettings.name = result.user.name;
          this.userSettings.email = result.user.email;
          
          // Store original settings for reset functionality
          this.originalSettings = { ...this.userSettings };
        } else {
          console.error('Failed to fetch student profile');
        }
      } catch (error) {
        console.error('Error fetching student profile:', error);
      }
    },
    
    async fetchAssignedAssessments() {
      try {
        console.log('Fetching assigned assessments...');
        const response = await fetch('http://localhost:3000/api/student-assessments/assigned', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.assignedAssessments = result.data;
          this.hasAssignedAssessments = result.data.length > 0;
          console.log('Assigned assessments loaded:', result.data.length, 'assessments found');
          console.log('Assessment details:', result.data);
        } else {
          console.error('Failed to fetch assigned assessments:', result.message);
          this.hasAssignedAssessments = false;
        }
      } catch (error) {
        console.error('Error fetching assigned assessments:', error);
        this.hasAssignedAssessments = false;
      }
    },
    
    startAssessment() {
      if (this.assignedAssessments.length > 0) {
        // Navigate to the first assigned assessment
        const firstAssessment = this.assignedAssessments[0];
        console.log('Starting assessment:', firstAssessment);
        console.log('First assessment ID:', firstAssessment.id);
        
        // Determine assessment type from the bulk assessment
        const bulkAssessmentType = firstAssessment.bulk_assessment?.assessment_type || 'ryff_42';
        let assessmentType = '42'; // default
        
        if (bulkAssessmentType === 'ryff_84') {
          assessmentType = '84';
        } else if (bulkAssessmentType === 'ryff_42') {
          assessmentType = '42';
        }
        
        console.log('Bulk assessment type:', bulkAssessmentType, 'Parsed type:', assessmentType);
        
        // Set current assessment data and switch to taking view
        this.currentAssessment = {
          type: assessmentType,
          assignedAssessmentId: firstAssessment.id,
          assessmentData: firstAssessment
        };
        
        console.log('Current assessment set to:', this.currentAssessment);
        this.currentView = 'taking-assessment';
      } else {
        alert('No assessments available to start.');
      }
    },
    
    async saveSettings() {
      if (this.userSettings.newPassword && this.userSettings.newPassword !== this.userSettings.confirmPassword) {
        alert('New passwords do not match!');
        return;
      }

      this.isLoading = true;
      
      try {
        // Here you would implement the actual save functionality
        // For now, we'll just simulate a save operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update original settings
        this.originalSettings = { ...this.userSettings };
        
        // Clear password fields
        this.userSettings.currentPassword = '';
        this.userSettings.newPassword = '';
        this.userSettings.confirmPassword = '';
        
        alert('Settings saved successfully!');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    
    resetSettings() {
      this.userSettings = { ...this.originalSettings };
      this.userSettings.currentPassword = '';
      this.userSettings.newPassword = '';
      this.userSettings.confirmPassword = '';
    },
    async onAssessmentComplete(completionData) {
      // Handle assessment completion
      console.log('Assessment completed:', completionData);
      this.currentView = 'assessment-complete';
      // Add a longer delay to ensure database transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Refresh assigned assessments to remove completed one
      await this.fetchAssignedAssessments();
    },

    async onReturnToDashboard() {
      // Return to main assessment dashboard
      this.currentView = 'assessment';
      this.currentAssessment = null;
      // Add a longer delay to ensure any pending operations are complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Refresh assigned assessments
      await this.fetchAssignedAssessments();
    },

    async logout() {
      // Animation before logout
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('.main-content');
      
      if (sidebar && mainContent) {
        sidebar.classList.add('slide-out-left');
        mainContent.classList.add('fade-out');
        
        setTimeout(async () => {
          await authService.logout();
        }, 500); // Wait for animation to complete
      } else {
        // Fallback if elements not found
        await authService.logout();
      }
    }
  }
}
</script>

<style scoped>
/* Dashboard Layout */
:root {
  --primary: #00b3b0;
  --primary-dark: #008b89;
  --primary-light: #b2ebf2;
  --secondary: #4a6572;
  --accent: #ff6b6b;
  --dark: #1a2e35;
  --text: #333333;
  --text-light: #6b7280;
  --gray: #f3f4f6;
  --light: #ffffff;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  background-color: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
  padding: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  overflow-y: auto;
  transition: all 0.3s ease;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar.slide-out-left {
  transform: translateX(-100%);
  box-shadow: none;
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 25px 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
  position: relative;
  animation: fadeIn 0.8s ease-out;
}

.logo-container::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #00b3b0 0%, #008b89 100%);
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
  color: #00b3b0;
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
  animation: slideInLeft 0.5s ease-out;
  animation-fill-mode: both;
}

.sidebar-menu li:nth-child(1) { animation-delay: 0.1s; }
.sidebar-menu li:nth-child(2) { animation-delay: 0.2s; }
.sidebar-menu li:nth-child(3) { animation-delay: 0.3s; }

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
  color: #00b3b0;
}

.sidebar-menu li.active .menu-item {
  background-color: rgba(0, 179, 176, 0.08);
  color: #00b3b0;
  border-left: 3px solid #00b3b0;
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
  color: #00b3b0;
  transform: translateY(-1px);
}

.logout-item {
  margin-top: auto;
  padding-bottom: 20px;
}

.logout-icon {
  color: #ff6b6b;
}

.logout-item .menu-item {
  color: var(--text);
}

.logout-item .menu-item:hover {
  background-color: rgba(255, 107, 107, 0.08);
  color: #ff6b6b;
  border-left: 3px solid #ff6b6b;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  transition: opacity 0.5s ease, margin-left 0.5s ease;
}

.main-content.fade-out {
  opacity: 0;
}

.top-nav {
  background: white;
  padding: 20px 30px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  animation: fadeInDown 0.5s ease-out;
  position: fixed;
  top: 0;
  right: 0;
  left: 260px; /* Match the sidebar width */
  z-index: 99;
}

.page-title h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: var(--dark);
  transition: all 0.3s ease;
}

.page-title p {
  font-size: 14px;
  color: var(--text-light);
  margin: 5px 0 0 0;
  transition: all 0.3s ease;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.user-profile:hover {
  transform: scale(1.05);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00b3b0 0%, #008b89 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0, 179, 176, 0.3);
  transition: all 0.3s ease;
}

.user-avatar:hover {
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.4);
  transform: translateY(-2px);
}

.content-container {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  margin-top: 70px; /* Add margin to prevent overlay with the fixed header */
}

/* Assessment View */
.assessment-view {
  animation: fadeInUp 0.6s ease-out;
  padding: 0;
}

/* Welcome Section */
.welcome-section {
  background: linear-gradient(135deg, #00b3b0 0%, #4ecdc4 100%);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
  opacity: 0.3;
}

.welcome-content {
  flex: 1;
  z-index: 2;
  position: relative;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.welcome-subtitle {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

.welcome-illustration {
  position: relative;
  width: 200px;
  height: 150px;
}

.floating-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.element {
  position: absolute;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.element-1 {
  top: 20px;
  left: 30px;
  animation: float 3s ease-in-out infinite;
}

.element-2 {
  top: 60px;
  right: 20px;
  animation: float 3s ease-in-out infinite 1s;
}

.element-3 {
  bottom: 20px;
  left: 60px;
  animation: float 3s ease-in-out infinite 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Assessment Grid */
.assessment-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  align-items: start;
}

/* Main Assessment Card */
.main-assessment-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.main-assessment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 30px;
  background: linear-gradient(135deg, #f8fffe 0%, #f0fffe 100%);
  border-bottom: 1px solid rgba(0, 179, 176, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.assessment-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #00b3b0, #4ecdc4);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 16px rgba(0, 179, 176, 0.3);
  padding: 8px;
}

.assessment-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.assessment-info {
  flex: 1;
}

.assessment-info h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1a2e35;
}

.assessment-type {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.assessment-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #64748b;
}

.assessment-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator {
  align-self: flex-start;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.not-started {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 1px solid #fbbf24;
}

.card-body {
  padding: 30px;
}

.assessment-description {
  margin-bottom: 30px;
}

.assessment-description p {
  font-size: 16px;
  line-height: 1.6;
  color: #475569;
  margin: 0;
}

.progress-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.progress-value {
  font-size: 14px;
  font-weight: 700;
  color: #00b3b0;
}

.progress-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00b3b0, #4ecdc4);
  border-radius: 4px;
  transition: width 0.8s ease;
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.dimensions-preview {
  margin-bottom: 30px;
}

.dimensions-preview h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s ease;
}

.dimension-item:hover {
  border-color: #00b3b0;
  background: #f0fffe;
  color: #00b3b0;
}

.dimension-item i {
  color: #00b3b0;
  font-size: 14px;
}

.action-section {
  display: flex;
  gap: 16px;
}

.primary-action-btn {
  flex: 1;
  background: linear-gradient(135deg, #00b3b0, #4ecdc4);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 179, 176, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.4);
}

.secondary-action-btn {
  padding: 16px 24px;
  background: white;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.secondary-action-btn:hover {
  border-color: #00b3b0;
  color: #00b3b0;
  background: #f0fffe;
}

/* Stats Card */
.stats-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 20px;
}

.stats-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.stats-header i {
  font-size: 18px;
  opacity: 0.8;
}

.stats-content {
  padding: 24px;
}

.stat-item {
  text-align: center;
  margin-bottom: 20px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #00b3b0;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tips Card */
.tips-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tips-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.tips-header i {
  font-size: 18px;
  opacity: 0.8;
}

.tips-content {
  padding: 24px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #475569;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item i {
  color: #10b981;
  font-size: 16px;
  flex-shrink: 0;
}

/* No Assessment State */
.no-assessment-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.no-assessment-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  width: 100%;
  border: 2px dashed #e2e8f0;
  transition: all 0.3s ease;
}

.no-assessment-card:hover {
  border-color: #00b3b0;
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.no-assessment-icon {
  margin-bottom: 24px;
}

.no-assessment-logo {
  width: 80px;
  height: 80px;
  opacity: 0.6;
  filter: grayscale(1);
  transition: all 0.3s ease;
}

.no-assessment-card:hover .no-assessment-logo {
  opacity: 1;
  filter: grayscale(0);
  transform: scale(1.1);
}

.no-assessment-card h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.no-assessment-card p {
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.no-assessment-actions {
  display: flex;
  justify-content: center;
}

.contact-counselor-btn {
  background: linear-gradient(135deg, #00b3b0, #4ecdc4);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 179, 176, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-counselor-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.4);
}

.contact-counselor-btn:active {
  transform: translateY(0);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .assessment-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .welcome-illustration {
    width: 150px;
    height: 100px;
  }
  
  .no-assessment-card {
    padding: 30px 20px;
  }
  
  .no-assessment-logo {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 768px) {
  .dimensions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-section {
    flex-direction: column;
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .welcome-subtitle {
    font-size: 16px;
  }
}

/* Settings View */
.settings-view {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
  animation: fadeInUp 0.6s ease-out;
}

/* Profile Information Card */
.profile-info-card {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: 16px;
  padding: 30px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 179, 176, 0.2);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  font-size: 64px;
  color: rgba(255, 255, 255, 0.9);
}

.profile-details h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.student-id {
  margin: 0 0 15px 0;
  font-size: 16px;
  opacity: 0.9;
}

.academic-info {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.college-badge, .section-badge, .year-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

/* Settings Card */
.settings-card {
  background: var(--light);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 30px;
  border: 1px solid #f0f0f0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.settings-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.settings-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f5f5f5;
}

.settings-header h3 {
  color: var(--dark);
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-header p {
  margin: 0;
  color: var(--text-light);
  font-size: 14px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Settings Sections */
.settings-section {
  padding: 20px;
  background: #fafbfc;
  border-radius: 12px;
  border: 1px solid #e8eaed;
}

.settings-section h4 {
  margin: 0 0 20px 0;
  color: var(--dark);
  font-size: 18px;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: var(--light);
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 179, 176, 0.1);
}

.form-group input[readonly] {
  background: #f8f9fa;
  color: var(--text-light);
  cursor: not-allowed;
}

.form-note {
  font-size: 12px;
  color: var(--text-light);
  font-style: italic;
}

/* Preference Items */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e8eaed;
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info {
  flex: 1;
}

.preference-info label {
  font-weight: 600;
  color: var(--text);
  font-size: 15px;
  margin-bottom: 4px;
}

.preference-info small {
  color: var(--text-light);
  font-size: 13px;
  display: block;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 54px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 28px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + label {
  background-color: var(--primary);
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

/* Settings Actions */
.settings-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f5f5f5;
}

.save-btn, .cancel-btn {
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.save-btn {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  transition: left 0.7s ease;
  z-index: -1;
}

.save-btn:hover::before {
  left: 100%;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.3);
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.save-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 179, 176, 0.3);
}

.cancel-btn {
  background: #f8f9fa;
  color: var(--text);
  border: 2px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Responsive Styles */
@media (max-width: 900px) {
  .sidebar {
    width: 240px;
  }
  .main-content {
    margin-left: 240px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  .logo-text, .sidebar-menu h3, .menu-item span {
    display: none;
  }
  .menu-icon {
    margin-right: 0;
    font-size: 18px;
  }
  .main-content {
    margin-left: 70px;
  }
  .assessment-card, .settings-card {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .settings-view {
    gap: 20px;
    padding: 0 10px;
  }
  
  .profile-info-card {
    padding: 20px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .profile-avatar {
    font-size: 48px;
  }
  
  .academic-info {
    justify-content: center;
  }
  
  .settings-card {
    padding: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .settings-actions {
    flex-direction: column;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 600px) {
  .top-nav {
    padding: 15px;
  }
  .page-title h1 {
    font-size: 22px;
  }
  .content-container {
    padding: 15px;
  }
  .assessment-card, .settings-card {
    padding: 15px;
  }
  
  .profile-details h2 {
    font-size: 24px;
  }
  
  .settings-header h3 {
    font-size: 20px;
  }
  
  .settings-section h4 {
    font-size: 16px;
  }
}
</style>