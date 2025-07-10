<template>
  <div class="bulk-assessment-container">
    <div class="action-buttons-container">
      <button class="action-button" 
              @click="currentView = 'form'"
              :class="{ 'active': currentView === 'form' }">
        <i class="fas fa-plus"></i> Create
      </button>
      <button class="action-button" 
              @click="currentView = 'versions'"
              :class="{ 'active': currentView === 'versions' }">
        <i class="fas fa-history"></i> Versions
      </button>
      <button class="action-button"
              @click="currentView = 'history'"
              :class="{ 'active': currentView === 'history' }">
        <i class="fas fa-history"></i> History
      </button>
    </div>

    <!-- Saved Versions Section -->
    <saved-versions v-if="currentView === 'versions'" 
                   @select-version="selectVersion"
                   @create-version="createNewVersion" />

    <!-- Assessment History Section -->
    <assessment-history v-if="currentView === 'history'" />
                   
    <!-- Assessment Form -->
    <div class="assessment-form-card" v-if="currentView === 'form'">
      <div class="form-group">
        <label for="assessment-name">Assessment Name</label>
        <input 
          type="text" 
          id="assessment-name" 
          placeholder="Enter a name for this assessment" 
          v-model="assessmentName"
          class="form-control"
        >
        <small v-if="validationErrors.assessmentName" class="error-text">{{ validationErrors.assessmentName }}</small>
      </div>

      <div class="form-group">
        <div class="section-header">
          <label>Select Departments</label>
          <div class="select-all-option">
            <div class="checkbox-label">
              <input type="checkbox" id="select-all" v-model="selectAllDepartments" @change="toggleAllDepartments">
              <label for="select-all">Select All Departments</label>
            </div>
          </div>
        </div>

        <div class="departments-list">
          <div v-for="(dept, index) in departments" :key="index" class="department-item">
            <div class="checkbox-label">
              <input type="checkbox" :id="'dept-' + index" v-model="dept.selected" @change="updateSelectAllState">
              <label :for="'dept-' + index">{{ dept.name }}</label>
            </div>
            <button 
              class="customize-button" 
              @click="customizeDepartment(dept)" 
              :disabled="!dept.selected" 
              :class="{ 'disabled': !dept.selected }"
            >
              <i class="fas fa-filter"></i> Customize
            </button>
          </div>
        </div>
        <small v-if="validationErrors.departments" class="error-text">{{ validationErrors.departments }}</small>

        <!-- Selected Departments Summary -->
        <div class="selected-departments-summary" v-if="hasSelectedDepartmentsWithFilters">
          <h4 class="summary-title">Selected Departments:</h4>
          
          <div v-for="(dept, index) in selectedDepartmentsWithFilters" :key="'summary-' + index" class="selected-department-item">
            <div class="department-name">
              <span class="department-label">{{ dept.name }}</span>
              <span class="customized-badge" v-if="dept.customized">(Customized)</span>
            </div>
            
            <ul class="selected-years-list">
              <li v-if="dept.years.first > 0">
                <i class="fas fa-circle bullet"></i> 1st Year: {{ dept.years.first }} sections
              </li>
              <li v-if="dept.years.second > 0">
                <i class="fas fa-circle bullet"></i> 2nd Year: {{ dept.years.second }} sections
              </li>
              <li v-if="dept.years.third > 0">
                <i class="fas fa-circle bullet"></i> 3rd Year: {{ dept.years.third }} sections
              </li>
              <li v-if="dept.years.fourth > 0">
                <i class="fas fa-circle bullet"></i> 4th Year: {{ dept.years.fourth }} sections
              </li>
            </ul>
          </div>
          
          <div class="total-recipients">
            <span>Total Estimated Recipients:</span>
            <span class="recipients-count">{{ totalEstimatedRecipients }}</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="schedule-label">
          <i class="far fa-clock"></i> Select Schedule
        </label>
        <div class="radio-options schedule-options">
          <div class="radio-option">
            <input type="radio" id="send-now" value="now" v-model="scheduleOption">
            <label for="send-now">Send Now (immediate dispatch)</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="schedule-later" value="later" v-model="scheduleOption">
            <label for="schedule-later">Schedule Later</label>
          </div>
        </div>
        <div v-if="scheduleOption === 'later'" class="date-selector">
          <input type="datetime-local" v-model="scheduledDate" class="form-control">
        </div>
      </div>

      <div class="form-group">
        <label>Select Ryff Scale PWB Test Items</label>
        <div class="radio-options test-item-options">
          <div class="radio-option">
            <input type="radio" id="items-84" value="84" v-model="selectedVersion">
            <label for="items-84">84 items (Complete version)</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="items-54" value="54" v-model="selectedVersion">
            <label for="items-54">54 items (Medium version)</label>
          </div>
          <div class="radio-option">
            <input type="radio" id="items-42" value="42" v-model="selectedVersion">
            <label for="items-42">42 items (Brief version)</label>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="custom-message">Custom Message (Optional)</label>
        <textarea 
          id="custom-message" 
          v-model="customMessage" 
          rows="6"
          class="form-control"
          placeholder="Enter a custom message for participants"
        ></textarea>
        <div class="message-note">
          <i class="fas fa-info-circle"></i> This message will be included in the email and notification sent to participants.
        </div>
      </div>

      <div class="form-actions">
        <button class="view-versions-button" @click="showVersions">
          <i class="fas fa-eye"></i> View Versions
        </button>
        <div class="primary-actions">
          <button class="secondary-button" @click="previewAssessment">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button class="primary-button" @click="sendAssessment" :disabled="isSending">
            <i class="fas fa-paper-plane"></i> {{ isSending ? 'Sending...' : 'Send Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Department Filter Modal -->
    <department-filter 
      :is-visible="showDepartmentFilter" 
      :department-name="currentDepartment ? currentDepartment.name : ''"
      :existing-filters="currentDepartment ? departmentFilters[currentDepartment.name] : null"
      @close="showDepartmentFilter = false"
      @apply-filters="applyDepartmentFilters"
    />

    <!-- Preview Modal -->
    <div class="modal" v-if="showPreview">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Assessment Preview</h2>
          <button class="close-button" @click="showPreview = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="preview-item">
            <span class="preview-label">Assessment Name:</span>
            <span class="preview-value">{{ assessmentName || 'Not specified' }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Selected Departments:</span>
            <span class="preview-value">{{ selectedDepartmentsText }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Version:</span>
            <span class="preview-value">{{ selectedVersion }} items</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Schedule:</span>
            <span class="preview-value">{{ scheduleText }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Custom Message:</span>
            <div class="preview-message">{{ customMessage || 'No custom message' }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showPreview = false">Close</button>
          <button class="primary-button" @click="confirmSend">Confirm & Send</button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div class="toast" v-if="showToast" :class="{ 'show': showToast }">
      <div class="toast-content">
        <i class="fas fa-check-circle"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import SavedVersions from './SavedVersions.vue';
import DepartmentFilter from './DepartmentFilter.vue';
import AssessmentHistory from './AssessmentHistory.vue';
import AutoReminders from './AutoReminders.vue'; // Kept for future use

export default {
  name: 'BulkAssessment',
  components: {
    SavedVersions,
    DepartmentFilter,
    AssessmentHistory,
    AutoReminders
  },
  data() {
    return {
      currentView: 'versions', // Start with versions view
      showDepartmentFilter: false,
      currentDepartment: null,
      departmentFilters: {}, // Stores customization info for each department
      filteredSections: {},
      assessmentName: '',
      selectAllDepartments: false,
      departments: [
        { name: 'CCS', selected: false, students: 245 },
        { name: 'CN', selected: false, students: 189 },
        { name: 'CBA', selected: false, students: 156 },
        { name: 'COE', selected: false, students: 203 },
        { name: 'CAS', selected: false, students: 178 }
      ],
      scheduleOption: 'now',
      scheduledDate: this.getDefaultScheduledDate(),
      selectedVersion: '84',
      customMessage: 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.',
      showPreview: false,
      showToast: false,
      toastMessage: '',
      isSending: false,
      validationErrors: {
        assessmentName: '',
        departments: ''
      }
    }
  },
  computed: {
    selectedDepartmentsText() {
      const selected = this.departments.filter(d => d.selected).map(d => d.name);
      return selected.length ? selected.join(', ') : 'None selected';
    },
    scheduleText() {
      if (this.scheduleOption === 'now') {
        return 'Immediate dispatch';
      } else {
        return `Scheduled for ${new Date(this.scheduledDate).toLocaleString()}`;
      }
    },
    hasSelectedDepartments() {
      return this.departments.some(d => d.selected);
    },
    hasSelectedDepartmentsWithFilters() {
      return this.selectedDepartmentsWithFilters.length > 0;
    },
    selectedDepartmentsWithFilters() {
      return this.departments
        .filter(dept => dept.selected)
        .map(dept => {
          const isCustomized = this.departmentFilters[dept.name] !== undefined;
          const filters = this.departmentFilters[dept.name] || {
            yearCounts: { first: 8, second: 8, third: 8, fourth: 8 },
            totalSections: 32
          };
          
          return {
            name: dept.name,
            customized: isCustomized && filters.customized,
            years: {
              first: filters.yearCounts.first,
              second: filters.yearCounts.second,
              third: filters.yearCounts.third,
              fourth: filters.yearCounts.fourth
            },
            totalSections: filters.totalSections
          };
        });
    },
    totalEstimatedRecipients() {
      // Each section is assumed to have 35 students on average
      let total = 0;
      this.selectedDepartmentsWithFilters.forEach(dept => {
        total += (dept.years.first + dept.years.second + dept.years.third + dept.years.fourth) * 35;
      });
      return total;
    }
  },
  methods: {
    getDefaultScheduledDate() {
      const now = new Date();
      now.setDate(now.getDate() + 1); // Default to tomorrow
      now.setHours(9, 0, 0, 0); // Default to 9:00 AM
      return now.toISOString().slice(0, 16); // Format for datetime-local
    },
    toggleAllDepartments() {
      this.departments.forEach(dept => {
        dept.selected = this.selectAllDepartments;
        
        // Apply default filters when selecting
        if (dept.selected && !this.departmentFilters[dept.name]) {
          this.departmentFilters[dept.name] = {
            department: dept.name,
            customized: false,
            yearCounts: {
              first: 8,
              second: 8,
              third: 8,
              fourth: 8
            },
            totalSections: 32,
            totalStudents: 32 * 35 // 35 students per section
          };
        } else if (!dept.selected) {
          // Remove filters when deselecting
          delete this.departmentFilters[dept.name];
        }
      });
    },
    updateSelectAllState() {
      this.selectAllDepartments = this.departments.every(dept => dept.selected);
      
      // When a department is checked directly (without customization)
      this.departments.forEach(dept => {
        if (dept.selected && !this.departmentFilters[dept.name]) {
          // Create default filter data with all sections selected
          this.departmentFilters[dept.name] = {
            department: dept.name,
            customized: false,
            yearCounts: {
              first: 8,
              second: 8,
              third: 8,
              fourth: 8
            },
            totalSections: 32,
            totalStudents: 32 * 35 // 35 students per section
          };
        } else if (!dept.selected) {
          // If department is deselected, remove its filters
          delete this.departmentFilters[dept.name];
        }
      });
    },
    customizeDepartment(dept) {
      if (!dept.selected) return;
      
      this.currentDepartment = dept;
      this.showDepartmentFilter = true;
    },
    applyDepartmentFilters(summary) {
      // Store the selected sections for the current department
      if (this.currentDepartment) {
        this.departmentFilters[this.currentDepartment.name] = summary;
        
        // Show a toast notification
        this.showToast = true;
        this.toastMessage = `Filters applied to ${this.currentDepartment.name}`;
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      }
    },
    validate() {
      let isValid = true;
      this.validationErrors = {
        assessmentName: '',
        departments: ''
      };

      if (!this.assessmentName.trim()) {
        this.validationErrors.assessmentName = 'Assessment name is required';
        isValid = false;
      }

      if (!this.hasSelectedDepartments) {
        this.validationErrors.departments = 'Please select at least one department';
        isValid = false;
      }

      return isValid;
    },
    previewAssessment() {
      if (this.validate()) {
        this.showPreview = true;
      }
    },
    sendAssessment() {
      if (this.validate()) {
        this.showPreview = true;
      }
    },
    confirmSend() {
      this.isSending = true;
      // Simulate API call
      setTimeout(() => {
        this.isSending = false;
        this.showPreview = false;
        this.showToast = true;
        this.toastMessage = `Assessment "${this.assessmentName}" has been sent to ${this.selectedDepartmentsText}`;
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      }, 1500);
    },
    showVersions() {
      this.currentView = 'versions';
    },
    selectVersion(version) {
      // Set the selected version from the saved template
      this.selectedVersion = version.items;
      this.assessmentName = `${version.title} - ${new Date().toLocaleDateString()}`;
      
      // Switch to form view
      this.currentView = 'form';
      
      // Show a toast notification
      this.showToast = true;
      this.toastMessage = `"${version.title}" template loaded`;
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },
    createNewVersion() {
      // Reset form to default values
      this.assessmentName = '';
      this.selectAllDepartments = false;
      this.departments.forEach(dept => dept.selected = false);
      this.scheduleOption = 'now';
      this.scheduledDate = this.getDefaultScheduledDate();
      this.selectedVersion = '54'; // Default to medium version
      this.customMessage = 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.';
      
      // Switch to form view
      this.currentView = 'form';
      
      // Show a toast notification
      this.showToast = true;
      this.toastMessage = 'Creating a new assessment version';
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    }
  }
}
</script>

<style scoped>
.bulk-assessment-container {
  background-color: var(--gray);
  padding: 20px;
  position: relative;
}

.action-buttons-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.action-button {
  background-color: white;
  border: 1px solid #e0e0e0;
  color: var(--text);
  padding: 10px 15px;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.action-button:hover, .action-button.active {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.action-button.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.assessment-form-card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 25px;
  margin-bottom: 30px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: var(--dark);
  font-size: 15px;
}

.schedule-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-label i {
  color: var(--primary);
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 14px;
  transition: border-color 0.2s;
  background-color: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 179, 176, 0.1);
}

textarea.form-control {
  resize: vertical;
  font-family: inherit;
  min-height: 120px;
}

.select-all-option {
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  margin: 0;
  width: 16px;
  height: 16px;
}

.checkbox-label label {
  margin: 0;
  padding: 0;
  font-weight: normal;
  cursor: pointer;
  line-height: 1;
  display: inline-block;
  vertical-align: middle;
}

.departments-list {
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.department-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.department-item:last-child {
  border-bottom: none;
}

.department-item:hover {
  background-color: #f9f9f9;
}

.customize-button {
  background: none;
  border: 1px solid #e0e0e0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--border-radius);
  transition: all 0.2s;
  min-width: 100px;
  justify-content: center;
}

.customize-button:hover:not(.disabled) {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.customize-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #aaa;
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-left: 10px;
}

.schedule-options, .test-item-options {
  margin-top: 5px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
}

.radio-option label {
  margin-bottom: 0;
  font-weight: normal;
  cursor: pointer;
}

.date-selector {
  margin-top: 15px;
  padding-left: 26px;
}

.message-note {
  font-size: 13px;
  color: var(--text-light);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
}

.view-versions-button {
  background-color: transparent;
  border: none;
  color: var(--text);
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.view-versions-button:hover {
  color: var(--primary);
}

.primary-actions {
  display: flex;
  gap: 15px;
}

.secondary-button {
  background-color: white;
  border: 1px solid #e0e0e0;
  color: var(--text);
  padding: 10px 20px;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 500;
}

.secondary-button:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.primary-button {
  background-color: var(--primary);
  border: none;
  color: white;
  padding: 10px 25px;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
  font-weight: 500;
}

.primary-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-text {
  color: #f44336;
  font-size: 12px;
  margin-top: 5px;
  display: block;
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
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--dark);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: var(--text);
}

.modal-body {
  padding: 25px;
}

.preview-item {
  margin-bottom: 15px;
}

.preview-label {
  font-weight: 500;
  color: var(--text);
  display: block;
  margin-bottom: 5px;
}

.preview-value {
  color: var(--dark);
}

.preview-message {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: var(--border-radius);
  font-size: 14px;
  white-space: pre-line;
  margin-top: 5px;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: var(--primary);
  color: white;
  padding: 15px 20px;
  border-radius: var(--border-radius);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1000;
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-content i {
  font-size: 18px;
}

/* Selected Departments Summary Styles */
.selected-departments-summary {
  margin-top: 25px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: var(--border-radius);
  border: 1px solid #eaeaea;
  animation: fadeIn 0.3s ease-in-out;
}

.summary-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dark);
  margin: 0 0 15px 0;
}

.selected-department-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.selected-department-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.department-name {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.department-label {
  font-weight: 500;
  color: var(--dark);
}

.customized-badge {
  font-size: 12px;
  color: var(--primary);
  margin-left: 8px;
}

.selected-years-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.selected-years-list li {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 4px;
  padding-left: 12px;
}

.bullet {
  font-size: 6px;
  margin-right: 8px;
  color: var(--primary);
}

.total-recipients {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eaeaea;
  font-weight: 500;
}

.recipients-count {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark);
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
  
  .primary-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 