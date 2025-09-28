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
          <p>Manage your account information and security preferences</p>
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
          <span>Account Information</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'security' }"
             @click="setActiveTab('security')">
          <i class="fas fa-shield-alt"></i>
          <span>Security Settings</span>
        </div>
        <div class="nav-item" 
             :class="{ active: activeTab === 'academic' }"
             @click="setActiveTab('academic')">
          <i class="fas fa-calendar-alt"></i>
          <span>School Year/Semester</span>
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
                <label for="college">College</label>
                <select id="college" v-model="accountSettings.college">
                  <option value="">Select College</option>
                  <option value="guidance">Guidance Office</option>
                  <option value="psychology">Psychology College</option>
                  <option value="admin">Administration</option>
                  <option value="student-affairs">Student Affairs</option>
                </select>
              </div>
              <div class="form-group">
                <label for="position">Position</label>
                <input type="text" id="position" v-model="accountSettings.position" 
                       placeholder="Your position/title">
              </div>
            </div>
            

            <div class="form-actions">
              <button class="btn-primary" type="button" @click="saveAccountSettings" :disabled="isLoading">
                <i class="fas fa-spinner fa-spin" v-if="isLoading"></i>
                <i class="fas fa-save" v-else></i>
                {{ isLoading ? 'Saving...' : 'Save Changes' }}
              </button>
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
                  <small class="password-hint">Password must be at least 8 characters long</small>
                </div>
                <div class="form-group">
                  <label for="confirmPassword">Confirm Password</label>
                  <input type="password" id="confirmPassword" 
                         v-model="securitySettings.confirmPassword" 
                         placeholder="Confirm new password">
                </div>
              </div>
              <button class="btn-change-password" @click="changePassword" :disabled="isChangingPassword">
                <i class="fas fa-spinner fa-spin" v-if="isChangingPassword"></i>
                <i class="fas fa-key" v-else></i>
                {{ isChangingPassword ? 'Changing Password...' : 'Change Password' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Academic Settings -->
        <div v-if="activeTab === 'academic'" class="settings-panel" key="academic">
          <div class="panel-header">
            <h2>School Year/Semester Date Range</h2>
            <p>Configure academic years and semester date ranges for your institution</p>
          </div>
          
          <div class="form-section">
            <!-- School Year Section -->
            <div class="academic-section">
              <h3>School Year Management</h3>
              <div class="form-group">
                <label for="schoolYear">Select School Year</label>
                <div class="school-year-container">
                  <select id="schoolYear" v-model="academicSettings.selectedSchoolYear" class="school-year-select">
                    <option value="">Select School Year</option>
                    <option v-for="year in academicSettings.schoolYears" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                  <button class="add-year-btn" @click="showAddYearModal = true" type="button">
                    <i class="fas fa-plus"></i>
                    Add School Year
                  </button>
                </div>
              </div>
            </div>

            <!-- Semester Section -->
            <div class="academic-section">
              <h3>Semester Configuration</h3>
              <div class="semester-list">
                <div v-for="(semester, index) in academicSettings.semesters" :key="index" class="semester-item">
                  <div class="semester-header">
                    <h4>{{ semester.name }}</h4>
                    <button class="remove-semester-btn" @click="removeSemester(index)" type="button">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div class="semester-dates">
                    <div class="form-group">
                      <label :for="'startDate' + index">Start Date</label>
                      <input type="date" :id="'startDate' + index" v-model="semester.startDate" class="date-input">
                    </div>
                    <div class="form-group">
                      <label :for="'endDate' + index">End Date</label>
                      <input type="date" :id="'endDate' + index" v-model="semester.endDate" class="date-input">
                    </div>
                  </div>
                  <div class="semester-summary" v-if="semester.startDate && semester.endDate">
                    <i class="fas fa-info-circle"></i>
                    <span>Duration: {{ calculateDuration(semester.startDate, semester.endDate) }} days</span>
                  </div>
                </div>
              </div>
              
              <button class="add-semester-btn" @click="addSemester" type="button" style="display: none;">
                <i class="fas fa-plus"></i>
                Add New Semester
              </button>
            </div>
            
            <div class="form-actions">
              <button class="btn-primary" type="button" @click="saveAcademicSettings" :disabled="isLoading">
                <i class="fas fa-spinner fa-spin" v-if="isLoading"></i>
                <i class="fas fa-save" v-else></i>
                {{ isLoading ? 'Saving...' : 'Save Academic Settings' }}
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>



    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="success-message">
      <i class="fas fa-check-circle"></i>
      Settings saved successfully!
    </div>
    
    <!-- Error Message -->
    <div v-if="showErrorMessage" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ errorMessage }}
    </div>

    <!-- Add School Year Modal -->
    <div v-if="showAddYearModal" class="modal-overlay" @click="closeAddYearModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Add New School Year</h3>
          <button class="modal-close" @click="closeAddYearModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="newSchoolYear">School Year</label>
            <input type="text" id="newSchoolYear" v-model="newSchoolYear" 
                   placeholder="e.g., 2024-2025" class="modal-input">
            <small class="input-hint">Format: YYYY-YYYY (e.g., 2024-2025)</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAddYearModal">Cancel</button>
          <button class="btn-primary" @click="addSchoolYear" :disabled="!newSchoolYear.trim()">
            <i class="fas fa-plus"></i>
            Add School Year
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { apiUrl } from '@/utils/apiUtils';

export default {
  name: 'Settings',
  data() {
    return {
      activeTab: 'account',
      showSuccessMessage: false,
      showErrorMessage: false,
      errorMessage: '',
      isLoading: false,
      isChangingPassword: false,
      
      accountSettings: {
        fullName: '',
        email: '',
        college: '',
        position: ''
      },
      
      securitySettings: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      
      academicSettings: {
        selectedSchoolYear: '',
        schoolYears: ['2023-2024', '2024-2025', '2025-2026'],
        semesters: [
          {
            name: '1st Semester',
            startDate: '',
            endDate: ''
          },
          {
            name: '2nd Semester', 
            startDate: '',
            endDate: ''
          },
          {
            name: 'Summer',
            startDate: '',
            endDate: ''
          }
        ]
      },
      
      showAddYearModal: false,
      newSchoolYear: '',
      semesterCounter: 3
    }
  },
  
  async mounted() {
    await this.loadCounselorProfile();
    await this.loadAcademicSettings();
  },
  
  watch: {
    'academicSettings.selectedSchoolYear'(newSchoolYear) {
      if (newSchoolYear && this.academicSettings.groupedSettings) {
        // Load semesters for the selected school year
        const yearSettings = this.academicSettings.groupedSettings[newSchoolYear];
        if (yearSettings && yearSettings.semesters) {
          // Keep the original semester names from database, don't normalize them
          this.academicSettings.semesters = yearSettings.semesters.map((semester, index) => ({
            ...semester
            // Remove the name normalization that was causing "Summer" to become "3rd Semester"
          }));
          this.semesterCounter = this.academicSettings.semesters.length;
        } else {
          // No semesters for this year, use defaults
          this.academicSettings.semesters = [
            { name: '1st Semester', startDate: '', endDate: '' },
            { name: '2nd Semester', startDate: '', endDate: '' },
            { name: 'Summer', startDate: '', endDate: '' }
          ];
          this.semesterCounter = this.academicSettings.semesters.length;
        }
      }
    }
  },
  
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
    },
    
    async loadCounselorProfile() {
      try {
        const response = await axios.get(apiUrl('auth/counselor/profile'), {
          withCredentials: true
        });
        
        if (response.data.success) {
          const profile = response.data.counselor;
          this.accountSettings = {
            fullName: profile.name || '',
            email: profile.email || '',
            college: profile.college || '',
            position: profile.role || ''
          };
        }
      } catch (error) {
        console.error('Error loading counselor profile:', error);
        this.showError('Failed to load profile information');
      }
    },
    
    async loadAcademicSettings() {
       try {
         const response = await axios.get(apiUrl('academic-settings'), {
           withCredentials: true
         });
         
         if (response.data.success && response.data.data) {
           // Load existing academic settings from the structured response
           const settings = response.data.data;
           
           this.academicSettings.schoolYears = settings.schoolYears || [];
           this.academicSettings.selectedSchoolYear = settings.selectedSchoolYear || '';
           
           // Store grouped settings for the watcher
           this.academicSettings.groupedSettings = response.data.groupedSettings || {};
           
           // Keep original semester names from database, don't normalize them
           if (settings.semesters && settings.semesters.length > 0) {
             this.academicSettings.semesters = settings.semesters.map((semester, index) => ({
               ...semester
               // Preserve the original semester names from database (including "Summer")
             }));
           } else {
             this.academicSettings.semesters = [];
           }
           
           // Update semesterCounter based on loaded semesters
           if (this.academicSettings.semesters.length > 0) {
             this.semesterCounter = this.academicSettings.semesters.length;
           }
         } else {
           // No existing settings, keep defaults
           console.log('No existing academic settings found, using defaults');
         }
       } catch (error) {
         console.error('Error loading academic settings:', error);
         this.showError('Failed to load academic settings');
       }
     },
    
    async saveAccountSettings() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      this.showErrorMessage = false;
      
      try {
        const response = await axios.put(apiUrl('auth/counselor/profile'), {
          name: this.accountSettings.fullName,
          email: this.accountSettings.email,
          college: this.accountSettings.college,
          role: this.accountSettings.position
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.showSuccess('Account information updated successfully!');
        } else {
          this.showError(response.data.message || 'Failed to update account information');
        }
      } catch (error) {
        console.error('Error updating account:', error);
        this.showError('Failed to update account information');
      } finally {
        this.isLoading = false;
      }
    },
    
    async changePassword() {
      if (this.isChangingPassword) return;
      
      // Validate passwords
      if (!this.securitySettings.currentPassword) {
        this.showError('Current password is required');
        return;
      }
      
      if (!this.securitySettings.newPassword) {
        this.showError('New password is required');
        return;
      }
      
      if (this.securitySettings.newPassword !== this.securitySettings.confirmPassword) {
        this.showError('New passwords do not match');
        return;
      }
      
      if (this.securitySettings.newPassword.length < 8) {
        this.showError('New password must be at least 8 characters long');
        return;
      }
      
      this.isChangingPassword = true;
      this.showErrorMessage = false;
      
      try {
        const response = await axios.post(apiUrl('auth/counselor/change-password'), {
          currentPassword: this.securitySettings.currentPassword,
          newPassword: this.securitySettings.newPassword
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.showSuccess('Password changed successfully!');
          // Clear password fields
          this.securitySettings.currentPassword = '';
          this.securitySettings.newPassword = '';
          this.securitySettings.confirmPassword = '';
        } else {
          this.showError(response.data.message || 'Failed to change password');
        }
      } catch (error) {
        console.error('Error changing password:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.showError(error.response.data.message);
        } else {
          this.showError('Failed to change password');
        }
      } finally {
        this.isChangingPassword = false;
      }
    },
    
    showSuccess(message) {
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },
    
    showError(message) {
      this.errorMessage = message;
      this.showErrorMessage = true;
      setTimeout(() => {
        this.showErrorMessage = false;
      }, 5000);
    },
    
    // Academic Settings Methods
    addSemester() {
      // Calculate the next semester number based on existing semesters
      const nextSemesterNumber = this.academicSettings.semesters.length + 1;
      
      // Use specific names for the first three semesters
      let semesterName;
      if (nextSemesterNumber === 1) {
        semesterName = '1st Semester';
      } else if (nextSemesterNumber === 2) {
        semesterName = '2nd Semester';
      } else if (nextSemesterNumber === 3) {
        semesterName = 'Summer';
      } else {
        semesterName = `${this.getOrdinalNumber(nextSemesterNumber)} Semester`;
      }
      
      this.academicSettings.semesters.push({
        name: semesterName,
        startDate: '',
        endDate: ''
      });
      // Update counter to match the new length
      this.semesterCounter = this.academicSettings.semesters.length;
    },
    
    removeSemester(index) {
      if (this.academicSettings.semesters.length > 1) {
        this.academicSettings.semesters.splice(index, 1);
        // Renumber remaining semesters to maintain proper sequence
        this.academicSettings.semesters.forEach((semester, idx) => {
          const semesterNumber = idx + 1;
          if (semesterNumber === 1) {
            semester.name = '1st Semester';
          } else if (semesterNumber === 2) {
            semester.name = '2nd Semester';
          } else if (semesterNumber === 3) {
            semester.name = 'Summer';
          } else {
            semester.name = `${this.getOrdinalNumber(semesterNumber)} Semester`;
          }
        });
        // Update counter to match the new length
        this.semesterCounter = this.academicSettings.semesters.length;
      } else {
        this.showError('At least one semester must be configured');
      }
    },
    
    addSchoolYear() {
      if (this.newSchoolYear.trim()) {
        // Validate format (YYYY-YYYY)
        const yearPattern = /^\d{4}-\d{4}$/;
        if (!yearPattern.test(this.newSchoolYear.trim())) {
          this.showError('Please use the format YYYY-YYYY (e.g., 2024-2025)');
          return;
        }
        
        // Check if year already exists
        if (this.academicSettings.schoolYears.includes(this.newSchoolYear.trim())) {
          this.showError('This school year already exists');
          return;
        }
        
        this.academicSettings.schoolYears.push(this.newSchoolYear.trim());
        this.academicSettings.schoolYears.sort();
        this.academicSettings.selectedSchoolYear = this.newSchoolYear.trim();
        this.closeAddYearModal();
        this.showSuccess('School year added successfully!');
      }
    },
    
    closeAddYearModal() {
      this.showAddYearModal = false;
      this.newSchoolYear = '';
    },
    
    calculateDuration(startDate, endDate) {
      if (!startDate || !endDate) return 0;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    
    getOrdinalNumber(num) {
      const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
      return ordinals[num] || `${num}th`;
    },
    
    async saveAcademicSettings() {
      if (this.isLoading) return;
      
      // Validate that a school year is selected
      if (!this.academicSettings.selectedSchoolYear) {
        this.showError('Please select a school year');
        return;
      }
      
      // Validate semester dates
      for (let i = 0; i < this.academicSettings.semesters.length; i++) {
        const semester = this.academicSettings.semesters[i];
        if (!semester.startDate || !semester.endDate) {
          this.showError(`Please set both start and end dates for ${semester.name}`);
          return;
        }
        
        if (new Date(semester.startDate) >= new Date(semester.endDate)) {
          this.showError(`End date must be after start date for ${semester.name}`);
          return;
        }
      }
      
      // Check for overlapping semesters
      for (let i = 0; i < this.academicSettings.semesters.length - 1; i++) {
        const current = this.academicSettings.semesters[i];
        const next = this.academicSettings.semesters[i + 1];
        
        if (new Date(current.endDate) >= new Date(next.startDate)) {
          this.showError(`${current.name} and ${next.name} have overlapping dates`);
          return;
        }
      }
      
      this.isLoading = true;
      this.showErrorMessage = false;
      
      try {
        // Prepare the payload for the API
        const payload = {
          schoolYear: this.academicSettings.selectedSchoolYear,
          semesters: this.academicSettings.semesters.map(semester => ({
            name: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate
          }))
        };
        
        const response = await axios.post(apiUrl('academic-settings'), payload, {
           withCredentials: true
         });
        
        if (response.data.success) {
          this.showSuccess('Academic settings saved successfully!');
        } else {
          this.showError(response.data.message || 'Failed to save academic settings');
        }
      } catch (error) {
        console.error('Error saving academic settings:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.showError(error.response.data.message);
        } else {
          this.showError('Failed to save academic settings');
        }
      } finally {
        this.isLoading = false;
      }
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

.form-group input.error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-change-password {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.3);
}

.btn-change-password:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.4);
}

.btn-change-password:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.password-hint {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 5px;
  font-style: italic;
}

.security-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary);
  margin-bottom: 20px;
}

.security-section h3 {
  color: var(--dark);
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.error-message {
  background: rgba(244, 67, 54, 0.1);
  color: var(--danger);
  padding: 12px 15px;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--danger);
  margin: 15px 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-message {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success);
  padding: 12px 15px;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--success);
  margin: 15px 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
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



.success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #4CAF50;
  color: white;
  padding: 30px 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-weight: 600;
  font-size: 16px;
  z-index: 10000;
  min-width: 300px;
  text-align: center;
  border: 3px solid #45a049;
  animation: fadeInScale 0.4s ease-out;
}

.success-message::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--danger);
  color: white;
  padding: 15px 20px;
  border-radius: var(--border-radius);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  z-index: 1000;
  animation: slideInRight 0.4s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
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

/* Academic Settings Styles */
.academic-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary);
  margin-bottom: 25px;
}

.academic-section h3 {
  color: var(--dark);
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.school-year-container {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.school-year-select {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 14px;
  transition: var(--transition);
  background: white;
}

.school-year-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
}

.add-year-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.add-year-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.3);
}

.semester-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.semester-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  padding: 20px;
  transition: var(--transition);
}

.semester-item:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 179, 176, 0.1);
}

.semester-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.semester-header h4 {
  margin: 0;
  color: var(--dark);
  font-size: 16px;
  font-weight: 600;
}

.remove-semester-btn {
  background: var(--danger);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-semester-btn:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.semester-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

.date-input {
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 14px;
  transition: var(--transition);
  background: white;
}

.date-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
}

.semester-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: rgba(0, 179, 176, 0.05);
  border-radius: var(--border-radius);
  color: var(--primary);
  font-size: 14px;
  font-weight: 500;
}

.add-semester-btn {
  background: transparent;
  color: var(--primary);
  border: 2px dashed var(--primary);
  padding: 15px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.add-semester-btn:hover {
  background: rgba(0, 179, 176, 0.05);
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: var(--dark);
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-light);
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: var(--transition);
}

.modal-close:hover {
  background: #f0f0f0;
  color: var(--dark);
}

.modal-body {
  padding: 25px;
}

.modal-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 14px;
  transition: var(--transition);
}

.modal-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.1);
}

.input-hint {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 5px;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px 25px;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 2px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.btn-secondary:hover {
  background: #f0f0f0;
  border-color: var(--text-light);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 179, 176, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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
  
  .school-year-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .semester-dates {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>