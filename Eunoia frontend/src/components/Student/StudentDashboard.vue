<template>
  <div class="dashboard-container">
    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="logo-container">
        <div class="logo-icon">
          <i class="fas fa-brain"></i>
        </div>
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
          <!-- Assessment Card -->
          <section class="assessment-card">
            <div class="assessment-header">
              <div>
                <h2>Ryff PWB Assessment (42-item)</h2>
                <div class="due-date">Due by 2023-11-15</div>
              </div>
              <span class="status-badge pending">Pending</span>
            </div>
            <div class="assessment-body">
              <p class="description">
                Comprehensive psychological well-being assessment based on Ryff's six dimensions model (42-item version).
              </p>
              <div class="progress-row">
                <span>Progress</span>
                <span class="progress-percent">0%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 0%"></div>
              </div>
              <div class="actions">
                <button class="start-btn" @click="startAssessment">Start Assessment</button>
              </div>
            </div>
          </section>
        </div>

        <!-- Settings View -->
        <div v-if="currentView === 'settings'" class="settings-view">
          <section class="settings-card">
            <h2>Account Settings</h2>
            <div class="settings-form">
              <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" v-model="userSettings.name" placeholder="Your full name">
              </div>
              <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" v-model="userSettings.email" placeholder="Your email address">
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="userSettings.password" placeholder="Change your password">
              </div>
              <div class="form-group">
                <label for="notifications">Email Notifications</label>
                <div class="toggle-switch">
                  <input type="checkbox" id="notifications" v-model="userSettings.notifications">
                  <label for="notifications"></label>
                </div>
              </div>
              <div class="settings-actions">
                <button class="save-btn" @click="saveSettings">Save Changes</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'StudentDashboard',
  data() {
    return {
      currentView: 'assessment',
      userSettings: {
        name: 'John Doe',
        email: 'student@example.com',
        password: '',
        notifications: true
      }
    };
  },
  methods: {
    startAssessment() {
      alert('Assessment feature coming soon!');
    },
    saveSettings() {
      // Here you would typically save the settings to a backend
      alert('Settings saved successfully!');
    },
    logout() {
      // Animation before logout
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('.main-content');
      
      if (sidebar && mainContent) {
        sidebar.classList.add('slide-out-left');
        mainContent.classList.add('fade-out');
        
        setTimeout(() => {
          localStorage.removeItem('eunoia_logged_in');
          localStorage.removeItem('eunoia_user_type');
          this.$emit('switch-to-landing');
        }, 500); // Wait for animation to complete
      } else {
        // Fallback if elements not found
        localStorage.removeItem('eunoia_logged_in');
        localStorage.removeItem('eunoia_user_type');
        this.$emit('switch-to-landing');
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

.logo-icon {
  width: 35px;
  height: 35px;
  margin-right: 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #00b3b0, #008b89);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 179, 176, 0.2);
}

.sidebar:hover .logo-icon {
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
}

/* Assessment Card */
.assessment-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.assessment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, #00b3b0, #4ecdc4);
}

.assessment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}

.assessment-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--dark);
  position: relative;
}

.assessment-header h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: var(--primary);
  border-radius: 3px;
}

.due-date {
  font-size: 14px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 5px;
}

.due-date::before {
  content: '⏱';
  font-size: 12px;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  background: #e0f7fa;
  color: #009491;
  border: 1px solid #b2ebf2;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.status-badge.pending::before {
  content: '⏳';
  font-size: 12px;
}

.status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 179, 176, 0.15);
}

.description {
  color: var(--text);
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 25px;
  position: relative;
  padding-left: 15px;
  border-left: 3px solid #e0f7fa;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
}

.progress-bar-bg {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00b3b0, #4ecdc4);
  border-radius: 5px;
  transition: width 0.8s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%
  );
  background-size: 20px 20px;
  animation: progressStripes 1s linear infinite;
}

@keyframes progressStripes {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}

.progress-percent {
  font-weight: 600;
  color: var(--primary);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.start-btn {
  background: linear-gradient(135deg, #00b3b0 0%, #008b89 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.start-btn::before {
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

.start-btn:hover::before {
  left: 100%;
}

.start-btn:hover {
  background: linear-gradient(135deg, #008b89 0%, #006a68 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 179, 176, 0.35);
}

.start-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 179, 176, 0.2);
}

/* Settings View */
.settings-view {
  animation: fadeInUp 0.6s ease-out;
}

.settings-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.settings-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, #4a6572, #607d8b);
}

.settings-card h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 25px 0;
  color: var(--dark);
  position: relative;
  padding-bottom: 10px;
}

.settings-card h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: var(--secondary);
  border-radius: 3px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s ease;
  background-color: #f9fafb;
}

.form-group input:focus {
  outline: none;
  border-color: var(--secondary);
  box-shadow: 0 0 0 3px rgba(74, 101, 114, 0.1);
  background-color: white;
}

.toggle-switch {
  position: relative;
  width: 50px;
  height: 24px;
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
  background-color: #e5e7eb;
  transition: .4s;
  border-radius: 24px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: var(--secondary);
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.save-btn {
  background: linear-gradient(135deg, #4a6572 0%, #37474f 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 101, 114, 0.25);
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

.save-btn:hover {
  background: linear-gradient(135deg, #37474f 0%, #263238 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(74, 101, 114, 0.35);
}

.save-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(74, 101, 114, 0.2);
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
}
</style>