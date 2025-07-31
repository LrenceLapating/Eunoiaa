<template>
  <div class="settings-container">
    <!-- Settings Header -->
    <div class="settings-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="fas fa-cog"></i>
        </div>
        <div class="header-text">
          <h1>Settings</h1>
          <p>Manage your account, system preferences, and application settings</p>
        </div>
      </div>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <!-- Settings Navigation -->
      <div class="settings-nav">
        <div class="nav-item" 
             :class="{ active: activeTab === 'account' }"
             @click="setActiveTab('account')">
          <i class="fas fa-user"></i>
          <span>Account Settings</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'system' }"
             @click="setActiveTab('system')">
          <i class="fas fa-cogs"></i>
          <span>System Preferences</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'notifications' }"
             @click="setActiveTab('notifications')">
          <i class="fas fa-bell"></i>
          <span>Notifications</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'security' }"
             @click="setActiveTab('security')">
          <i class="fas fa-shield-alt"></i>
          <span>Security</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'data' }"
             @click="setActiveTab('data')">
          <i class="fas fa-database"></i>
          <span>Data Management</span>
        </div>
      </div>

      <!-- Settings Panels -->
      <div class="settings-panels">
        <!-- Account Settings -->
        <div v-if="activeTab === 'account'" class="settings-panel" key="account">
          <div class="panel-header">
            <h2>Account Information</h2>
            <p>Update your personal information and profile settings</p>
          </div>
          
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label for="fullName">Full Name</label>
                <input type="text" id="fullName" v-model="accountSettings.fullName" 
                       placeholder="Enter your full name">
              </div>
              <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" v-model="accountSettings.email" 
                       placeholder="Enter your email address">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="department">Department</label>
                <select id="department" v-model="accountSettings.department">
                  <option value="">Select Department</option>
                  <option value="guidance">Guidance Office</option>
                  <option value="psychology">Psychology Department</option>
                  <option value="admin">Administration</option>
                </select>
              </div>
              <div class="form-group">
                <label for="position">Position</label>
                <input type="text" id="position" v-model="accountSettings.position" 
                       placeholder="Your position/title">
              </div>
            </div>
            
            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea id="bio" v-model="accountSettings.bio" 
                        placeholder="Brief description about yourself" rows="3"></textarea>
            </div>
          </div>
        </div>

        <!-- System Preferences -->
        <div v-if="activeTab === 'system'" class="settings-panel" key="system">
          <div class="panel-header">
            <h2>System Preferences</h2>
            <p>Configure system behavior and default settings</p>
          </div>
          
          <div class="form-section">
            <div class="preference-item">
              <div class="preference-info">
                <h3>Default Assessment Version</h3>
                <p>Choose the default Ryff Scale version for new assessments</p>
              </div>
              <select v-model="systemSettings.defaultAssessmentVersion" class="preference-select">
                <option value="42">42-item version</option>
                <option value="54">54-item version</option>
                <option value="84">84-item version</option>
              </select>
            </div>
            
            <div class="preference-item">
              <div class="preference-info">
                <h3>Risk Threshold</h3>
                <p>Set the score threshold for identifying at-risk students</p>
              </div>
              <div class="threshold-input">
                <input type="number" v-model="systemSettings.riskThreshold" 
                       min="1" max="30" class="threshold-number">
                <span class="threshold-label">points or below</span>
              </div>
            </div>
            
            <div class="preference-item">
              <div class="preference-info">
                <h3>Auto-Save Frequency</h3>
                <p>How often should the system automatically save data</p>
              </div>
              <select v-model="systemSettings.autoSaveFrequency" class="preference-select">
                <option value="30">Every 30 seconds</option>
                <option value="60">Every minute</option>
                <option value="300">Every 5 minutes</option>
                <option value="600">Every 10 minutes</option>
              </select>
            </div>
            
            <div class="preference-item">
              <div class="preference-info">
                <h3>Dashboard Theme</h3>
                <p>Choose your preferred dashboard appearance</p>
              </div>
              <div class="theme-options">
                <div class="theme-option" 
                     :class="{ active: systemSettings.theme === 'light' }"
                     @click="systemSettings.theme = 'light'">
                  <div class="theme-preview light"></div>
                  <span>Light</span>
                </div>
                <div class="theme-option" 
                     :class="{ active: systemSettings.theme === 'dark' }"
                     @click="systemSettings.theme = 'dark'">
                  <div class="theme-preview dark"></div>
                  <span>Dark</span>
                </div>
                <div class="theme-option" 
                     :class="{ active: systemSettings.theme === 'auto' }"
                     @click="systemSettings.theme = 'auto'">
                  <div class="theme-preview auto"></div>
                  <span>Auto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div v-if="activeTab === 'notifications'" class="settings-panel" key="notifications">
          <div class="panel-header">
            <h2>Notification Settings</h2>
            <p>Manage how and when you receive notifications</p>
          </div>
          
          <div class="form-section">
            <div class="notification-group">
              <h3>Email Notifications</h3>
              
              <div class="notification-item">
                <div class="notification-info">
                  <h4>Assessment Completions</h4>
                  <p>Get notified when students complete assessments</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="emailAssessments" 
                         v-model="notificationSettings.email.assessmentCompletions">
                  <label for="emailAssessments"></label>
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <h4>High-Risk Alerts</h4>
                  <p>Immediate alerts for students with concerning scores</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="emailRisk" 
                         v-model="notificationSettings.email.riskAlerts">
                  <label for="emailRisk"></label>
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <h4>Weekly Reports</h4>
                  <p>Summary of assessment activities and trends</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="emailReports" 
                         v-model="notificationSettings.email.weeklyReports">
                  <label for="emailReports"></label>
                </div>
              </div>
            </div>
            
            <div class="notification-group">
              <h3>In-App Notifications</h3>
              
              <div class="notification-item">
                <div class="notification-info">
                  <h4>Real-time Updates</h4>
                  <p>Show notifications within the application</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="inAppUpdates" 
                         v-model="notificationSettings.inApp.realTimeUpdates">
                  <label for="inAppUpdates"></label>
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <h4>Sound Alerts</h4>
                  <p>Play sound for important notifications</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="soundAlerts" 
                         v-model="notificationSettings.inApp.soundAlerts">
                  <label for="soundAlerts"></label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Security -->
        <div v-if="activeTab === 'security'" class="settings-panel" key="security">
          <div class="panel-header">
            <h2>Security Settings</h2>
            <p>Manage your password and security preferences</p>
          </div>
          
          <div class="form-section">
            <div class="security-section">
              <h3>Change Password</h3>
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" 
                       v-model="securitySettings.currentPassword" 
                       placeholder="Enter current password">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="newPassword">New Password</label>
                  <input type="password" id="newPassword" 
                         v-model="securitySettings.newPassword" 
                         placeholder="Enter new password">
                </div>
                <div class="form-group">
                  <label for="confirmPassword">Confirm Password</label>
                  <input type="password" id="confirmPassword" 
                         v-model="securitySettings.confirmPassword" 
                         placeholder="Confirm new password">
                </div>
              </div>
            </div>
            
            <div class="security-section">
              <h3>Session Management</h3>
              
              <div class="security-item">
                <div class="security-info">
                  <h4>Auto-logout</h4>
                  <p>Automatically log out after period of inactivity</p>
                </div>
                <select v-model="securitySettings.autoLogoutTime" class="security-select">
                  <option value="0">Never</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
              
              <div class="security-item">
                <div class="security-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="twoFactor" 
                         v-model="securitySettings.twoFactorAuth">
                  <label for="twoFactor"></label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div v-if="activeTab === 'data'" class="settings-panel" key="data">
          <div class="panel-header">
            <h2>Data Management</h2>
            <p>Manage data retention, exports, and privacy settings</p>
          </div>
          
          <div class="form-section">
            <div class="data-section">
              <h3>Data Retention</h3>
              
              <div class="data-item">
                <div class="data-info">
                  <h4>Assessment Data Retention</h4>
                  <p>How long to keep completed assessment data</p>
                </div>
                <select v-model="dataSettings.retentionPeriod" class="data-select">
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="5">5 years</option>
                  <option value="10">10 years</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              
              <div class="data-item">
                <div class="data-info">
                  <h4>Auto-Archive</h4>
                  <p>Automatically archive old assessment data</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="autoArchive" 
                         v-model="dataSettings.autoArchive">
                  <label for="autoArchive"></label>
                </div>
              </div>
            </div>
            
            <div class="data-section">
              <h3>Export & Backup</h3>
              
              <div class="export-options">
                <button class="export-btn" @click="exportData('assessments')">
                  <i class="fas fa-download"></i>
                  Export Assessment Data
                </button>
                <button class="export-btn" @click="exportData('reports')">
                  <i class="fas fa-file-export"></i>
                  Export Reports
                </button>
                <button class="export-btn" @click="exportData('all')">
                  <i class="fas fa-database"></i>
                  Full Data Export
                </button>
              </div>
            </div>
            
            <div class="data-section">
              <h3>Privacy Settings</h3>
              
              <div class="data-item">
                <div class="data-info">
                  <h4>Data Anonymization</h4>
                  <p>Remove personal identifiers from exported data</p>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="anonymize" 
                         v-model="dataSettings.anonymizeExports">
                  <label for="anonymize"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="settings-actions">
      <button class="btn-secondary" @click="resetToDefaults">
        <i class="fas fa-undo"></i>
        Reset to Defaults
      </button>
      <button class="btn-primary" @click="saveSettings">
        <i class="fas fa-save"></i>
        Save Changes
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="success-message">
      <i class="fas fa-check-circle"></i>
      Settings saved successfully!
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  data() {
    return {
      activeTab: 'account',
      showSuccessMessage: false,
      
      accountSettings: {
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        department: 'guidance',
        position: 'Senior Counselor',
        bio: 'Experienced counselor specializing in student mental health and well-being assessment.'
      },
      
      systemSettings: {
        defaultAssessmentVersion: '42',
        riskThreshold: 17,
        autoSaveFrequency: 60,
        theme: 'light'
      },
      
      notificationSettings: {
        email: {
          assessmentCompletions: true,
          riskAlerts: true,
          weeklyReports: false
        },
        inApp: {
          realTimeUpdates: true,
          soundAlerts: false
        }
      },
      
      securitySettings: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        autoLogoutTime: 60,
        twoFactorAuth: false
      },
      
      dataSettings: {
        retentionPeriod: '5',
        autoArchive: true,
        anonymizeExports: true
      }
    }
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
    },
    
    saveSettings() {
      // Simulate saving settings
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
      
      // Here you would typically send the settings to your backend
      console.log('Saving settings:', {
        account: this.accountSettings,
        system: this.systemSettings,
        notifications: this.notificationSettings,
        security: this.securitySettings,
        data: this.dataSettings
      });
    },
    
    resetToDefaults() {
      if (confirm('Are you sure you want to reset all settings to their default values?')) {
        // Reset all settings to defaults
        this.systemSettings = {
          defaultAssessmentVersion: '42',
          riskThreshold: 17,
          autoSaveFrequency: 60,
          theme: 'light'
        };
        
        this.notificationSettings = {
          email: {
            assessmentCompletions: true,
            riskAlerts: true,
            weeklyReports: false
          },
          inApp: {
            realTimeUpdates: true,
            soundAlerts: false
          }
        };
        
        this.securitySettings.autoLogoutTime = 60;
        this.securitySettings.twoFactorAuth = false;
        
        this.dataSettings = {
          retentionPeriod: '5',
          autoArchive: true,
          anonymizeExports: true
        };
      }
    },
    
    exportData(type) {
      // Simulate data export
      alert(`Exporting ${type} data... This feature will be implemented with backend integration.`);
    }
  }
}
</script>

<style scoped>
:root {
  --primary: #00b3b0;
  --primary-dark: #008b89;
  --secondary: #4a6572;
  --accent: #ff6b6b;
  --success: #4caf50;
  --warning: #ff9800;
  --danger: #f44336;
  --dark: #1a2e35;
  --gray: #f5f7fa;
  --text: #546e7a;
  --text-light: #78909c;
  --border-radius: 8px;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --transition: all 0.3s ease;
}

.settings-container {
  padding: 0;
  background-color: #f5f7fa;
  min-height: 100vh;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 30px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}

.settings-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.header-content {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.header-icon i {
  font-size: 24px;
}

.header-text h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 5px 0;
}

.header-text p {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

.settings-content {
  display: flex;
  gap: 30px;
  padding: 0 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.settings-nav {
  width: 280px;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 20px 0;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 25px;
  cursor: pointer;
  transition: var(--transition);
  border-left: 3px solid transparent;
  position: relative;
}

.nav-item:hover {
  background-color: rgba(0, 179, 176, 0.05);
  color: var(--primary);
}

.nav-item.active {
  background-color: rgba(0, 179, 176, 0.1);
  color: var(--primary);
  border-left-color: var(--primary);
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: bounce 1s ease-in-out;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(-50%);
  }
  40% {
    transform: translateY(-70%);
  }
  60% {
    transform: translateY(-60%);
  }
}

.nav-item i {
  width: 20px;
  margin-right: 15px;
  font-size: 16px;
}

.settings-panels {
  flex: 1;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.settings-panel {
  padding: 30px;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.panel-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  position: relative;
}

.panel-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--primary);
  animation: expandWidth 0.6s ease-out;
}

@keyframes expandWidth {
  from {
    width: 0;
  }
  to {
    width: 60px;
  }
}

.panel-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--dark);
}

.panel-header p {
  font-size: 14px;
  color: var(--text-light);
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 14px;
  transition: var(--transition);
  background: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
  transform: translateY(-1px);
}

.preference-item,
.notification-item,
.security-item,
.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary);
  transition: var(--transition);
}

.preference-item:hover,
.notification-item:hover,
.security-item:hover,
.data-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.preference-info h3,
.notification-info h4,
.security-info h4,
.data-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: var(--dark);
}

.preference-info p,
.notification-info p,
.security-info p,
.data-info p {
  font-size: 13px;
  color: var(--text-light);
  margin: 0;
}

.preference-select,
.security-select,
.data-select {
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  background: white;
  font-size: 14px;
  min-width: 150px;
  transition: var(--transition);
}

.threshold-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.threshold-number {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.threshold-label {
  font-size: 14px;
  color: var(--text);
}

.theme-options {
  display: flex;
  gap: 15px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.theme-option:hover {
  background: rgba(0, 179, 176, 0.05);
}

.theme-option.active {
  background: rgba(0, 179, 176, 0.1);
  color: var(--primary);
  font-weight: 600;
}

.theme-preview {
  width: 40px;
  height: 30px;
  border-radius: 4px;
  border: 2px solid #e0e0e0;
  position: relative;
  overflow: hidden;
}

.theme-preview.light {
  background: linear-gradient(45deg, #ffffff 50%, #f5f5f5 50%);
}

.theme-preview.dark {
  background: linear-gradient(45deg, #2d3748 50%, #1a202c 50%);
}

.theme-preview.auto {
  background: linear-gradient(45deg, #ffffff 25%, #2d3748 25%, #2d3748 50%, #ffffff 50%, #ffffff 75%, #2d3748 75%);
  background-size: 8px 8px;
}

.notification-group,
.security-section,
.data-section {
  margin-bottom: 30px;
}

.notification-group h3,
.security-section h3,
.data-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--dark);
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
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
  background-color: #ccc;
  transition: var(--transition);
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
  transition: var(--transition);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + label {
  background-color: var(--primary);
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.toggle-switch label:hover {
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
}

.export-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.export-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.3);
}

.export-btn:active {
  transform: translateY(0);
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 30px;
  background: white;
  border-top: 1px solid #e0e0e0;
  margin-top: 30px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.3);
}

.btn-secondary {
  background: #f8f9fa;
  color: var(--text);
  border: 2px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--success);
  color: white;
  padding: 15px 20px;
  border-radius: var(--border-radius);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  z-index: 1000;
  animation: slideInRight 0.4s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .settings-content {
    flex-direction: column;
    padding: 0 20px;
  }
  
  .settings-nav {
    width: 100%;
    display: flex;
    overflow-x: auto;
    padding: 10px 0;
  }
  
  .nav-item {
    white-space: nowrap;
    min-width: fit-content;
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  
  .nav-item.active {
    border-left: none;
    border-bottom-color: var(--primary);
  }
}

@media (max-width: 768px) {
  .settings-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .header-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .settings-panel {
    padding: 20px;
  }
  
  .preference-item,
  .notification-item,
  .security-item,
  .data-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .export-options {
    flex-direction: column;
  }
  
  .export-btn {
    justify-content: center;
  }
}
</style>