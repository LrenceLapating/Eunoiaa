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
          <li class="active">
            <a href="#">
              <i class="fas fa-th-large"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i class="fas fa-chart-bar"></i>
              <span>Ryff Assessment</span>
            </a>
            <ul class="submenu">
              <li><a href="#">Bulk Assessment</a></li>
              <li><a href="#">Auto-Reminders</a></li>
              <li><a href="#">Ryff Scoring</a></li>
            </ul>
          </li>
          <li>
            <a href="#">
              <i class="fas fa-signal"></i>
              <span>Status</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i class="fas fa-comment-alt"></i>
              <span>Guidance Feedback</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i class="fas fa-file-alt"></i>
              <span>Reports</span>
            </a>
          </li>
          <li>
            <a href="#">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>
          </li>
          <li class="logout-item">
            <a @click="goToLanding">
              <i class="fas fa-sign-out-alt"></i>
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
          <h1>Dashboard</h1>
          <p>Overview</p>
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
        <div class="dashboard-header">
          <div class="title-section">
            <div class="title-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div>
              <h2>Dashboard Overview</h2>
              <p>Monitor well-being metrics across departments</p>
            </div>
          </div>
          <div class="filter-section">
            <div class="filter-group">
              <div class="filter-label">Time Period:</div>
              <div class="date-filter">
                <i class="far fa-calendar"></i>
                <span>Last 30 Days</span>
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>
            <button class="refresh-btn" title="Refresh Data">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <!-- Metrics Cards -->
        <div class="metrics-row">
          <div class="metric-card">
            <div class="metric-content">
              <div class="metric-header">
                <h3>Total Assessments</h3>
                <div class="metric-icon">
                  <i class="fas fa-clipboard-list"></i>
                </div>
              </div>
              <div class="metric-value">971</div>
              <div class="metric-change positive">
                <i class="fas fa-arrow-up"></i>
                <span>+8.2%</span>
                <span class="compared-text">Compared to previous month</span>
              </div>
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
              <div class="metric-change positive">
                <i class="fas fa-arrow-up"></i>
                <span>+2.5%</span>
                <span class="compared-text">Compared to previous month</span>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-content">
              <div class="metric-header">
                <h3>Average Well-being Score</h3>
                <div class="metric-icon">
                  <i class="fas fa-smile"></i>
                </div>
              </div>
              <div class="metric-value">3.9<span class="metric-unit">/5</span></div>
              <div class="metric-change negative">
                <i class="fas fa-arrow-down"></i>
                <span>-0.1</span>
                <span class="compared-text">Compared to previous month</span>
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
                  <p>Departments and subscales requiring immediate attention</p>
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
              <div class="alert-item">
                <div class="alert-badge">COE</div>
                <div class="alert-details">
                  <h4>Positive Relations</h4>
                  <p>Score: 3.5 • <span class="negative">-0.3</span></p>
                </div>
                <div class="alert-students">
                  <p>41 students</p>
                  <span>at risk</span>
                </div>
              </div>

              <div class="alert-item">
                <div class="alert-badge">CCS</div>
                <div class="alert-details">
                  <h4>Self-Acceptance</h4>
                  <p>Score: 3.6 • <span class="negative">-0.2</span></p>
                </div>
                <div class="alert-students">
                  <p>32 students</p>
                  <span>at risk</span>
                </div>
              </div>

              <div class="alert-item">
                <div class="alert-badge">CN</div>
                <div class="alert-details">
                  <h4>Purpose in Life</h4>
                  <p>Score: 3.8 • <span class="negative">-0.1</span></p>
                </div>
                <div class="alert-students">
                  <p>28 students</p>
                  <span>at risk</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Department Assessment Overview -->
          <div class="section department-section">
            <div class="section-header">
              <div class="section-title">
                <div class="section-icon dept-icon">
                  <i class="fas fa-building"></i>
                </div>
                <div>
                  <h3>Department Assessment Overview</h3>
                  <p>Assessment participation and low scores by department</p>
                </div>
              </div>
              <button class="export-btn">
                <i class="fas fa-download"></i>
                Export
              </button>
            </div>

            <div class="table-container">
              <table class="department-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Test Takers</th>
                    <th>Low Scores</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CCS</td>
                    <td>245</td>
                    <td>32</td>
                  </tr>
                  <tr>
                    <td>CN</td>
                    <td>189</td>
                    <td>28</td>
                  </tr>
                  <tr>
                    <td>CBA</td>
                    <td>156</td>
                    <td>19</td>
                  </tr>
                  <tr>
                    <td>COE</td>
                    <td>203</td>
                    <td>41</td>
                  </tr>
                  <tr>
                    <td>CAS</td>
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
                <h3>Average Ryff Subscale Scores by Department</h3>
                <p>Visual representation of well-being scores across departments</p>
              </div>
            </div>
            <div class="chart-controls">
              <div class="department-filter">
                <span>All Departments</span>
                <i class="fas fa-chevron-down"></i>
              </div>
              <div class="chart-types">
                <button class="chart-type active">Bar Chart</button>
                <button class="chart-type">Trend</button>
              </div>
            </div>
          </div>

          <div class="chart-container">
            <div class="modern-chart">
              <div class="chart-header">
                <p>Visual representation of well-being scores across departments</p>
              </div>
              
              <div class="chart-area">
                <!-- Y-axis -->
                <div class="y-axis">
                  <div class="y-label">5</div>
                  <div class="y-label">4</div>
                  <div class="y-label">3</div>
                  <div class="y-label">2</div>
                  <div class="y-label">1</div>
                  <div class="y-label">0</div>
                </div>
                
                <!-- Chart grid -->
                <div class="chart-grid">
                  <!-- Horizontal grid lines -->
                  <div class="grid-line"></div>
                  <div class="grid-line"></div>
                  <div class="grid-line"></div>
                  <div class="grid-line"></div>
                  <div class="grid-line"></div>
                </div>
                
                <!-- Department groups -->
                <div class="departments-container">
                  <!-- CCS Department -->
                  <div class="dept-column">
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div class="bar autonomy" style="height: 82%;">
                          <span class="bar-value">4.1</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar self-acceptance" style="height: 76%;">
                          <span class="bar-value">3.8</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar personal-growth" style="height: 80%;">
                          <span class="bar-value">4.0</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar purpose-in-life" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar environmental-mastery" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar positive-relations" style="height: 72%;">
                          <span class="bar-value">3.6</span>
                        </div>
                      </div>
                    </div>
                    <div class="dept-name">CCS</div>
                  </div>
                  
                  <!-- CN Department -->
                  <div class="dept-column">
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div class="bar autonomy" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar self-acceptance" style="height: 82%;">
                          <span class="bar-value">4.1</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar personal-growth" style="height: 76%;">
                          <span class="bar-value">3.8</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar purpose-in-life" style="height: 84%;">
                          <span class="bar-value">4.2</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar environmental-mastery" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar positive-relations" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                    </div>
                    <div class="dept-name">CN</div>
                  </div>
                  
                  <!-- CBA Department -->
                  <div class="dept-column">
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div class="bar autonomy" style="height: 80%;">
                          <span class="bar-value">4.0</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar self-acceptance" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar personal-growth" style="height: 80%;">
                          <span class="bar-value">4.0</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar purpose-in-life" style="height: 76%;">
                          <span class="bar-value">3.8</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar environmental-mastery" style="height: 82%;">
                          <span class="bar-value">4.1</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar positive-relations" style="height: 78%;">
                          <span class="bar-value">3.9</span>
                        </div>
                      </div>
                    </div>
                    <div class="dept-name">CBA</div>
                  </div>
                  
                  <!-- COE Department -->
                  <div class="dept-column">
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div class="bar autonomy" style="height: 74%;">
                          <span class="bar-value">3.7</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar self-acceptance" style="height: 72%;">
                          <span class="bar-value">3.6</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar personal-growth" style="height: 76%;">
                          <span class="bar-value">3.8</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar purpose-in-life" style="height: 74%;">
                          <span class="bar-value">3.7</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar environmental-mastery" style="height: 76%;">
                          <span class="bar-value">3.8</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar positive-relations" style="height: 70%;">
                          <span class="bar-value">3.5</span>
                        </div>
                      </div>
                    </div>
                    <div class="dept-name">COE</div>
                  </div>
                  
                  <!-- CAS Department -->
                  <div class="dept-column">
                    <div class="bar-group">
                      <div class="bar-wrapper">
                        <div class="bar autonomy" style="height: 82%;">
                          <span class="bar-value">4.1</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar self-acceptance" style="height: 80%;">
                          <span class="bar-value">4.0</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar personal-growth" style="height: 84%;">
                          <span class="bar-value">4.2</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar purpose-in-life" style="height: 80%;">
                          <span class="bar-value">4.0</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar environmental-mastery" style="height: 82%;">
                          <span class="bar-value">4.1</span>
                        </div>
                      </div>
                      <div class="bar-wrapper">
                        <div class="bar positive-relations" style="height: 76%;">
                          <span class="bar-value">3.8</span>
                        </div>
                      </div>
                    </div>
                    <div class="dept-name">CAS</div>
                  </div>
                </div>
              </div>
              
              <!-- X-axis categories -->
              <div class="x-axis">
                <div class="x-label">Autonomy</div>
                <div class="x-label">Self-Acceptance</div>
                <div class="x-label">Personal Growth</div>
                <div class="x-label">Purpose in Life</div>
                <div class="x-label">Environmental Mastery</div>
                <div class="x-label">Positive Relations</div>
              </div>
              
              <!-- Legend -->
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="color-box autonomy"></div>
                  <span>Autonomy</span>
                </div>
                <div class="legend-item">
                  <div class="color-box self-acceptance"></div>
                  <span>Self-Acceptance</span>
                </div>
                <div class="legend-item">
                  <div class="color-box personal-growth"></div>
                  <span>Personal Growth</span>
                </div>
                <div class="legend-item">
                  <div class="color-box purpose-in-life"></div>
                  <span>Purpose in Life</span>
                </div>
                <div class="legend-item">
                  <div class="color-box environmental-mastery"></div>
                  <span>Environmental Mastery</span>
                </div>
                <div class="legend-item">
                  <div class="color-box positive-relations"></div>
                  <span>Positive Relations</span>
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
export default {
  name: 'CounselorDashboard',
  data() {
    return {
      selectedDepartment: 'all',
      currentDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  },
  methods: {
    goToLanding() {
      this.$emit('switch-to-landing');
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
  width: 250px;
  background-color: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  z-index: 10;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 0 20px 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
  position: relative;
}

.logo-container::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20px;
  width: 50px;
  height: 2px;
  background-color: var(--primary);
}

.logo-container img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo-text h1 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--primary);
}

.logo-text p {
  font-size: 12px;
  margin: 0;
  color: var(--text-light);
}

.sidebar-menu {
  flex: 1;
}

.sidebar-menu h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-light);
  padding: 0 20px;
  margin-bottom: 10px;
  font-weight: 500;
}

.sidebar-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  margin-bottom: 2px;
}

.sidebar-menu li a {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.sidebar-menu li.active a {
  background-color: rgba(0, 179, 176, 0.08);
  color: var(--primary);
  border-left: 3px solid var(--primary);
  font-weight: 500;
}

.sidebar-menu li a:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.sidebar-menu li i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.submenu {
  padding-left: 46px !important;
  margin-top: 5px;
}

.submenu li {
  margin-bottom: 0;
}

.submenu li a {
  padding: 8px 0;
  font-size: 13px;
}

/* Add this CSS for the logout button */
.logout-item {
  margin-top: 30px;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.logout-item a {
  color: #f44336 !important;
}

.logout-item a:hover {
  background-color: rgba(244, 67, 54, 0.05) !important;
}

.logout-item i {
  color: #f44336;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 250px;
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
  display: flex;
  align-items: center;
}

.page-title p::before {
  content: 'Home';
  color: var(--text-light);
}

.page-title p::after {
  content: '/';
  margin: 0 5px;
  color: var(--text-light);
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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}

.title-section {
  display: flex;
  align-items: center;
}

.title-icon {
  margin-right: 10px;
}

.title-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: var(--dark);
}

.title-section p {
  font-size: 13px;
  color: var(--text-light);
  margin: 0;
}

.filter-section {
  display: flex;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-light);
  margin-right: 5px;
}

.date-filter {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 8px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.date-filter i:first-child {
  margin-right: 8px;
  color: var(--primary);
}

.date-filter i:last-child {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-light);
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: white;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  color: var(--text);
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Metrics Row */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.metric-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: var(--primary);
  opacity: 0;
  transition: opacity 0.2s;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);
}

.metric-card:hover::before {
  opacity: 1;
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
  background-color: #ffebee;
  color: #f44336;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 15px;
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.15);
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

.department-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

.department-table th {
  text-align: left;
  padding: 15px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  background-color: #f7f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.department-table td {
  padding: 12px 15px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.department-table tr:hover td {
  background-color: #f9fcff;
}

.department-table tr:last-child td {
  border-bottom: none;
}

/* Chart Section */
.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.department-filter {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.department-filter i {
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
  padding: 15px;
  background-color: #fdfdfd;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
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

.department-group {
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
  margin-top: 8px;
}

.x-axis {
  display: none;
}

.color-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 8px;
}

.color-box.autonomy {
  background-color: #f44336;
}

.color-box.self-acceptance {
  background-color: #2196f3;
}

.color-box.personal-growth {
  background-color: #1a2e35;
}

.color-box.purpose-in-life {
  background-color: #ffc107;
}

.color-box.environmental-mastery {
  background-color: #ff9800;
}

.color-box.positive-relations {
  background-color: #e91e63;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 15px 5px;
  padding: 5px 10px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.legend-item:hover {
  background-color: #f7f9fa;
}

@media (max-width: 1200px) {
  .metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .sidebar {
    width: 70px;
  }
  
  .logo-text, .sidebar-menu h3, .sidebar-menu li a span {
    display: none;
  }
  
  .logo-container {
    justify-content: center;
    padding: 15px 0;
  }
  
  .logo-container img {
    margin-right: 0;
  }
  
  .sidebar-menu li a {
    justify-content: center;
    padding: 15px 0;
  }
  
  .sidebar-menu li i {
    margin-right: 0;
    font-size: 18px;
  }
  
  .submenu {
    display: none;
  }
}

@media (max-width: 768px) {
  .metrics-row {
    grid-template-columns: 1fr;
  }
  
  .top-nav {
    padding: 0 15px;
  }
  
  .dashboard-content {
    padding: 15px;
  }
}

/* New styles for the modern chart */
.modern-chart {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 15px;
}

.chart-header {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.chart-header h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: var(--dark);
  position: relative;
}

.chart-header h4::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 2px;
  background-color: var(--primary);
}

.chart-header p {
  font-size: 13px;
  color: var(--text-light);
  margin: 0;
}

.chart-filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filter-dropdown {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}

.filter-dropdown i {
  margin-left: 8px;
  color: var(--text-light);
}

.chart-type-selector {
  display: flex;
}

.type-btn {
  background-color: white;
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}

.type-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.type-btn:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.type-btn.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.chart-area {
  position: relative;
  height: 300px;
  display: flex;
  margin-bottom: 30px;
}

.y-axis {
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  width: 30px;
  height: 100%;
}

.y-label {
  font-size: 12px;
  color: var(--text-light);
  text-align: right;
  padding-right: 8px;
}

.chart-grid {
  position: absolute;
  left: 30px;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
}

.grid-line:nth-child(5) {
  background-color: rgba(0, 0, 0, 0.1);
  height: 2px;
}

.departments-container {
  display: flex;
  justify-content: space-around;
  flex: 1;
  height: 100%;
  padding-left: 30px;
}

.dept-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 18%;
}

.bar-group {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: flex-end;
}

.bar-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 0 2px;
}

.bar {
  width: 100%;
  max-width: 14px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s;
}

.bar:hover {
  transform: scaleY(1.02);
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.bar:hover .bar-value {
  opacity: 1;
}

.dept-name {
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

/* Add section icons to department section and subscale section */
.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-right: 15px;
  font-size: 18px;
}

.alert-icon {
  background-color: #ffebee;
  color: #f44336;
}

/* Add: */
.dept-icon {
  background-color: #e3f2fd;
  color: #2196f3;
}

/* Add subtle hover effects to table rows */
.department-table tr {
  transition: all 0.2s;
}

.department-table tr:hover td {
  background-color: #f0f7ff;
}

/* Add department badge to the table */
.department-table td:first-child {
  padding: 12px 15px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.department-table td:first-child::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: var(--primary);
}

/* Add style for the chart icon */
.chart-icon {
  background-color: #e8f5e9;
  color: #4caf50;
}

/* Add two-column layout styles */
.two-column-layout {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
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
.department-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* Add these additional styles */
.two-column-layout .department-table {
  font-size: 13px;
}

.two-column-layout .department-table th {
  padding: 12px 10px;
  font-size: 12px;
}

.two-column-layout .department-table td {
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
</style> 