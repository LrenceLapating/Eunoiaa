<template>
  <div class="dashboard-container">
    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="logo-container">
        <img src="https://via.placeholder.com/32x32/00b3b0/ffffff?text=O" alt="ORCA Logo">
        <div class="logo-text">
          <h1>Ryff PWB</h1>
          <p>Counselor Portal</p>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <h3>Counselor Menu</h3>
        <ul>
          <li :class="{ active: currentView === 'dashboard' }">
            <a @click="currentView = 'dashboard'" class="menu-item">
              <div class="menu-icon">
              <i class="fas fa-th-large"></i>
              </div>
              <span>Dashboard</span>
            </a>
          </li>
          <li :class="{ active: ['bulkAssessment', 'autoReminders', 'ryffScoring'].includes(currentView) }">
            <a @click="toggleSubmenu('ryffAssessment')" class="menu-item has-submenu">
              <div class="menu-icon">
              <i class="fas fa-chart-bar"></i>
              </div>
              <span>Ryff Assessment</span>
              <i class="fas fa-chevron-right submenu-arrow" :class="{ 'submenu-open': showSubmenu === 'ryffAssessment' }"></i>
            </a>
            <ul class="submenu" :class="{ 'submenu-open': showSubmenu === 'ryffAssessment' }">
              <li :class="{ active: currentView === 'bulkAssessment' }">
                <a @click="currentView = 'bulkAssessment'" class="submenu-item">
                  <i class="fas fa-users"></i>
                  <span>Bulk Assessment</span>
                </a>
              </li>
              <li :class="{ active: currentView === 'autoReminders' }">
                <a @click="currentView = 'autoReminders'" class="submenu-item">
                  <i class="fas fa-bell"></i>
                  <span>Auto-Reminders</span>
                </a>
              </li>
              <li :class="{ active: currentView === 'ryffScoring' }">
                <a @click="currentView = 'ryffScoring'" class="submenu-item">
                  <i class="fas fa-calculator"></i>
                  <span>Ryff Scoring</span>
                </a>
              </li>
            </ul>
          </li>
          <li :class="{ active: currentView === 'status' }">
            <a @click="currentView = 'status'" class="menu-item">
              <div class="menu-icon">
              <i class="fas fa-signal"></i>
              </div>
              <span>Status</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'guidance' }">
            <a @click="currentView = 'guidance'" class="menu-item">
              <div class="menu-icon">
              <i class="fas fa-comment-alt"></i>
              </div>
              <span>Guidance Feedback</span>
            </a>
          </li>
          <li :class="{ active: currentView === 'reports' }">
            <a @click="currentView = 'reports'" class="menu-item">
              <div class="menu-icon">
              <i class="fas fa-file-alt"></i>
              </div>
              <span>Reports</span>
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
            <a @click="goToLanding" class="menu-item">
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
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>
        <div class="nav-actions">
          <div class="notifications">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">2</span>
          </div>
          <div class="user-profile">
            <div class="user-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard Content -->
      <div class="dashboard-content">
        <!-- Main Dashboard View -->
        <div v-if="currentView === 'dashboard'">
          <div class="dashboard-header">
            <div class="filter-section">
              <div class="filter-group">
                <div class="filter-label">Academic Period:</div>
                <select v-model="selectedPeriod" class="period-filter" @change="refreshData">
                  <option value="1-2024">1st Semester 2024-2025</option>
                  <option value="2-2024">2nd Semester 2024-2025</option>
                  <option value="1-2025">1st Semester 2025-2026</option>
                  <option value="2-2025">2nd Semester 2025-2026</option>
                </select>
              </div>
              <button class="refresh-btn" title="Refresh Data" @click="refreshData">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          <!-- Metrics Cards -->
          <div class="metrics-row">
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-content">
                  <div class="metric-header">
                    <h3>Total Assessments</h3>
                    <div class="metric-icon">
                      <i class="fas fa-clipboard-list"></i>
                    </div>
                  </div>
                  <div class="metric-value">971</div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-content">
                  <div class="metric-header">
                    <h3>Completion Rate</h3>
                    <div class="metric-icon">
                      <i class="fas fa-check-circle"></i>
                    </div>
                  </div>
                  <div class="metric-value">84.3%</div>
                </div>
              </div>
            </div>
          </div>

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
                <div class="section-actions">
                  <button class="action-btn">
                    <i class="fas fa-bell-slash"></i>
                    <span>Mute Alerts</span>
                  </button>
                </div>
              </div>

              <div class="alerts-container">
                <div v-for="(dimension, index) in dimensions" 
                     :key="index" 
                     class="alert-item"
                     @click="showDimensionDetails(dimension)"
                     :class="{ 'clickable': true }">
                  <div class="alert-details">
                    <h4>{{ dimension.name }}</h4>
                  </div>
                  <div class="alert-colleges">
                    <p>{{ dimension.highRiskColleges.length }} colleges</p>
                    <span>at high risk</span>
                  </div>
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
                <button class="export-btn">
                  <i class="fas fa-download"></i>
                  Export
                </button>
              </div>

              <div class="table-container">
                <table class="college-table">
                  <thead>
                    <tr>
                      <th>College</th>
                      <th>Total Test Takers</th>
                      <th>Low Scores</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td data-college="CCS">CCS</td>
                      <td>245</td>
                      <td>32</td>
                    </tr>
                    <tr>
                      <td data-college="CN">CN</td>
                      <td>189</td>
                      <td>28</td>
                    </tr>
                    <tr>
                      <td data-college="CBA">CBA</td>
                      <td>156</td>
                      <td>19</td>
                    </tr>
                    <tr>
                      <td data-college="COE">COE</td>
                      <td>203</td>
                      <td>41</td>
                    </tr>
                    <tr>
                      <td data-college="CAS">CAS</td>
                      <td>178</td>
                      <td>23</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Average Ryff Subscale Scores -->
          <div class="section subscale-section">
            <div class="section-header">
              <div class="section-title">
                <div class="section-icon chart-icon">
                  <i class="fas fa-chart-bar"></i>
                </div>
                <div>
                  <h3>Average Ryff Subscale Scores by College</h3>
                  <p>Visual representation of well-being scores across colleges</p>
                </div>
              </div>
            </div>

            <div class="chart-container">
              <SimpleRyffChart />
            </div>
          </div>
        </div>

        <!-- Bulk Assessment View -->
        <bulk-assessment v-if="currentView === 'bulkAssessment'" />

        <!-- Auto Reminders View -->
        <auto-reminders v-if="currentView === 'autoReminders'" />

        <!-- Ryff Scoring View -->
        <ryff-scoring v-if="currentView === 'ryffScoring'" />
      </div>

      <!-- Dimension Details Modal -->
      <div class="modal" v-if="showModal" @click.self="closeModal">
        <div class="modal-content dimension-details">
          <div class="modal-header">
            <h3>{{ selectedDimension.name }} - Colleges at High Risk</h3>
            <button class="close-button" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="college-risk-list">
              <div v-for="(college, index) in selectedDimension.highRiskColleges" 
                   :key="index" 
                   class="college-risk-item">
                <div class="college-name">{{ college.name }}</div>
                <div class="student-count">
                  <span class="count">{{ college.studentCount }}</span>
                  <span class="label">students at risk</span>
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
import SimpleRyffChart from '../Shared/SimpleRyffChart.vue'
import BulkAssessment from './BulkAssessment.vue'
import AutoReminders from './AutoReminders.vue'
import RyffScoring from './RyffScoring.vue'

export default {
  name: 'CounselorDashboard',
  components: {
    SimpleRyffChart,
    BulkAssessment,
    AutoReminders,
    RyffScoring
  },
  data() {
    return {
      currentView: 'dashboard',
      showSubmenu: null,
      selectedCollege: 'all',
      showModal: false,
      selectedDimension: null,
      dimensions: [
        {
          name: 'Autonomy',
          highRiskColleges: [
            { name: 'CCS', studentCount: 15 },
            { name: 'COE', studentCount: 12 },
            { name: 'CAS', studentCount: 14 }
          ]
        },
        {
          name: 'Environmental Mastery',
          highRiskColleges: [
            { name: 'CN', studentCount: 18 },
            { name: 'CBA', studentCount: 10 },
            { name: 'CCS', studentCount: 7 }
          ]
        },
        {
          name: 'Personal Growth',
          highRiskColleges: [
            { name: 'CAS', studentCount: 16 },
            { name: 'COE', studentCount: 12 }
          ]
        },
        {
          name: 'Positive Relations',
          highRiskColleges: [
            { name: 'CN', studentCount: 20 },
            { name: 'CCS', studentCount: 15 },
            { name: 'CBA', studentCount: 10 }
          ]
        },
        {
          name: 'Purpose in Life',
          highRiskColleges: [
            { name: 'COE', studentCount: 17 },
            { name: 'CAS', studentCount: 15 }
          ]
        },
        {
          name: 'Self-Acceptance',
          highRiskColleges: [
            { name: 'CCS', studentCount: 18 },
            { name: 'CN', studentCount: 12 },
            { name: 'CBA', studentCount: 8 }
          ]
        }
      ],
      currentDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      selectedPeriod: '1-2024',  // default to 1st sem 2024-2025
      academicYears: [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]
    }
  },
  computed: {
    pageTitle() {
      switch(this.currentView) {
        case 'bulkAssessment':
          return 'Bulk Assessment';
        case 'autoReminders':
          return 'Auto-Reminders';
        case 'ryffScoring':
          return 'Ryff Scoring';
        default:
          return 'Dashboard Overview';
      }
    },
    pageSubtitle() {
      switch(this.currentView) {
        case 'bulkAssessment':
          return 'Distribute the Ryff assessment to target groups in one click';
        case 'autoReminders':
          return 'Schedule automatic assessment reminders';
        case 'ryffScoring':
          return 'Review and analyze assessment scores';
        default:
          return 'Monitor well-being metrics across colleges';
      }
    }
  },
  methods: {
    goToLanding() {
      this.$emit('switch-to-landing');
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
    refreshData() {
      // Extract semester and year from selectedPeriod
      const [semester, year] = this.selectedPeriod.split('-');
      console.log(`Refreshing data for ${semester === '1' ? '1st' : '2nd'} Semester ${year}-${Number(year)+1}`);
      // Implement actual refresh logic here
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
  transition: all 0.3s ease;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
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
  margin-left: 250px;
  padding: 20px;
  background-color: #f5f5f5; /* Plain dirty white background */
  min-height: 100vh;
  overflow-y: auto;
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

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: #f8fafc;
  color: #00b3b0;
  border-color: #00b3b0;
}

.refresh-btn i {
  font-size: 1rem;
}

/* Metrics Row */
.metrics-row {
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
  padding: 15px;
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
  padding: 10px 15px;
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
}

.alert-details h4 {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 5px 0;
  color: var(--dark);
}

.alert-details p {
  font-size: 13px;
  margin: 0;
  color: var(--text);
}

.negative {
  color: #f44336;
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

/* Department Table */
.table-container {
  padding: 0 15px 15px;
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

.college-risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--gray);
  border-radius: var(--border-radius);
  transition: background-color 0.2s ease;
}

.college-risk-item:hover {
  background: #f0f2f5;
}

.college-name {
  font-weight: 600;
  color: var(--dark);
}

.student-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-count .count {
  font-weight: 600;
  color: var(--accent);
}

.student-count .label {
  color: var(--text-light);
  font-size: 0.9rem;
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