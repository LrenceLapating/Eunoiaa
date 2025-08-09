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
                   @preview-version="previewSavedVersion"
                   @create-version="createNewVersion" />

    <!-- Assessment History Section -->
    <assessment-history v-if="currentView === 'history'" />
                   
    <!-- Assessment Form -->
    <div class="assessment-form-card" v-if="currentView === 'form'">
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>

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
          <label>Select Colleges</label>
          <div class="select-all-option">
            <div class="checkbox-label">
              <input type="checkbox" id="select-all" v-model="selectAllColleges" @change="toggleAllColleges">
              <label for="select-all">Select All Colleges</label>
            </div>
          </div>
        </div>

        <div class="colleges-list">
          <div v-for="(college, index) in colleges" :key="index" class="college-item">
            <div class="checkbox-label">
              <input type="checkbox" :id="'college-' + index" v-model="college.selected" @change="updateSelectAllState">
              <label :for="'college-' + index">{{ college.name }}</label>
            </div>
            <button 
              class="customize-button" 
              @click="customizeCollege(college)" 
              :disabled="!college.selected" 
              :class="{ 'disabled': !college.selected }"
            >
              <i class="fas fa-filter"></i> Customize
            </button>
          </div>
        </div>
        <small v-if="validationErrors.colleges" class="error-text">{{ validationErrors.colleges }}</small>

        <!-- Selected Colleges Summary -->
        <div class="selected-colleges-summary" v-if="hasSelectedCollegesWithFilters">
          <h4 class="summary-title">Selected Colleges:</h4>
          
          <div v-for="(college, index) in selectedCollegesWithFilters" :key="'summary-' + index" class="selected-college-item">
            <div class="college-name">
              <span class="college-label">{{ college.name }}</span>
              <span class="customized-badge" v-if="college.customized">(Customized)</span>
            </div>
            
            <ul class="selected-years-list">
              <li v-if="college.sectionsByYear.first.length > 0">
                <i class="fas fa-circle bullet"></i> 1st Year:
                <div class="sections-list">
                  <span v-for="(section, idx) in college.sectionsByYear.first" :key="idx" class="section-name">{{ section }}</span>
                </div>
              </li>
              <li v-if="college.sectionsByYear.second.length > 0">
                <i class="fas fa-circle bullet"></i> 2nd Year:
                <div class="sections-list">
                  <span v-for="(section, idx) in college.sectionsByYear.second" :key="idx" class="section-name">{{ section }}</span>
                </div>
              </li>
              <li v-if="college.sectionsByYear.third.length > 0">
                <i class="fas fa-circle bullet"></i> 3rd Year:
                <div class="sections-list">
                  <span v-for="(section, idx) in college.sectionsByYear.third" :key="idx" class="section-name">{{ section }}</span>
                </div>
              </li>
              <li v-if="college.sectionsByYear.fourth.length > 0">
                <i class="fas fa-circle bullet"></i> 4th Year:
                <div class="sections-list">
                  <span v-for="(section, idx) in college.sectionsByYear.fourth" :key="idx" class="section-name">{{ section }}</span>
                </div>
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
          <button class="primary-button" @click="previewAssessment" :disabled="isSending">
            <i class="fas fa-paper-plane"></i> {{ isSending ? 'Sending...' : 'Send Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- College Filter Modal -->
    <college-filter 
      :is-visible="showCollegeFilter" 
      :college-name="currentCollege ? currentCollege.name : ''"
      :existing-filters="currentCollege ? collegeFilters[currentCollege.name] : null"
      @close="showCollegeFilter = false"
      @apply-filters="applyCollegeFilters"
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
            <span class="preview-label">Selected Colleges:</span>
            <span class="preview-value">{{ selectedCollegesText }}</span>
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
          
          <!-- 42-Item Questionnaire Preview -->
          <div v-if="selectedVersion === '42'" class="questionnaire-preview">
            <div class="questionnaire-header">
              <h3>{{ questionnaire.instructions.title }}</h3>
              <p class="questionnaire-description">{{ questionnaire.instructions.description }}</p>
              
              <div class="scale-legend">
                <h4>Rating Scale:</h4>
                <div class="scale-items">
                  <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="scale-item">
                    <span class="scale-number">{{ value }}</span>
                    <span class="scale-label">{{ label }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="questionnaire-items">
              <h4>Assessment Items ({{ questionnaire.items.length }} total):</h4>
              <div class="items-container">
                <div v-for="item in questionnaire.items" :key="item.id" class="questionnaire-item">
                  <div class="item-number">{{ item.id }}.</div>
                  <div class="item-content">
                    <p class="item-text">{{ item.text }}</p>
                    <div class="item-meta">
                      <span class="dimension-tag">{{ formatDimensionName(item.dimension) }}</span>
                      <span v-if="item.reverse" class="reverse-tag">Reverse Scored</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showPreview = false">Close</button>
          <button class="primary-button" @click="confirmSend">Confirm & Send</button>
        </div>
      </div>
    </div>

    <!-- Versions Modal -->
    <div class="modal" v-if="showVersionsModal">
      <div class="modal-content versions-modal">
        <div class="modal-header">
          <h2>Assessment Versions</h2>
          <button class="close-button" @click="showVersionsModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="version-tabs">
            <button 
              class="version-tab" 
              :class="{ active: selectedVersion === '84' }"
              @click="selectedVersion = '84'"
            >
              84 Items (Complete)
            </button>
            <button 
              class="version-tab" 
              :class="{ active: selectedVersion === '42' }"
              @click="selectedVersion = '42'"
            >
              42 Items (Brief)
            </button>
          </div>
          
          <!-- 84-Item Version Info -->
          <div v-if="selectedVersion === '84'" class="version-content">
            <div class="version-info">
              <h3>84-Item Ryff Scales of Psychological Well-Being</h3>
              <p class="version-description">
                The complete version provides the most comprehensive assessment of psychological well-being across all six dimensions. 
                This version offers the highest reliability and validity for research and clinical applications.
              </p>
              <div class="version-details">
                <div class="detail-item">
                  <span class="detail-label">Items per dimension:</span>
                  <span class="detail-value">14 items each</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estimated completion time:</span>
                  <span class="detail-value">20-25 minutes</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Reliability:</span>
                  <span class="detail-value">Highest (α > .85)</span>
                </div>
              </div>
            </div>
            
            <!-- 84-Item Assessment Form Preview -->
            <div class="assessment-form">
              <div class="form-header">
                <h3>{{ questionnaire.instructions.title }}</h3>
                <p class="form-description">{{ questionnaire.instructions.description }}</p>
                
                <div class="rating-scale-header">
                  <h4>Please rate each statement using the scale below:</h4>
                  <div class="scale-options">
                    <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="scale-option">
                      <span class="scale-value">{{ value }}</span>
                      <span class="scale-text">{{ label }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="form-questions">
                <div v-for="item in questionnaire.items" :key="item.id" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ item.id }}.</span>
                    <div class="question-content">
                      <p class="question-text">{{ item.text }}</p>
                      <div class="question-meta">
                        <span class="dimension-badge">{{ formatDimensionName(item.dimension) }}</span>
                        <span v-if="item.reverse" class="reverse-badge">Reverse Scored</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="rating-options">
                    <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="rating-option">
                      <input type="radio" :name="`preview-${item.id}`" :value="value" disabled>
                      <label class="rating-label">
                        <span class="rating-number">{{ value }}</span>
                        <span class="rating-text">{{ label }}</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="preview-note">
                  <p><strong>All {{ questionnaire.items.length }} items displayed</strong></p>
                  <p>The complete assessment includes all {{ questionnaire.items.length }} items across 6 psychological well-being dimensions.</p>
                </div>
              </div>
              
              <div class="form-footer">
                <div class="completion-info">
                  <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>Estimated completion: 20-25 minutes</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-chart-line"></i>
                    <span>{{ questionnaire.items.length }} total items</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-brain"></i>
                    <span>6 well-being dimensions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 42-Item Version Content -->
           <div v-if="selectedVersion === '42'" class="version-content">
             <div class="assessment-form">
               <div class="form-header">
                 <h3>{{ questionnaire.instructions.title }}</h3>
                 <p class="form-description">{{ questionnaire.instructions.description }}</p>
                 
                 <div class="rating-scale-header">
                   <h4>Please rate each statement using the scale below:</h4>
                   <div class="scale-options">
                     <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="scale-option">
                       <span class="scale-value">{{ value }}</span>
                       <span class="scale-text">{{ label }}</span>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div class="form-questions">
                 <div v-for="item in questionnaire.items" :key="item.id" class="question-item">
                   <div class="question-header">
                     <span class="question-number">{{ item.id }}.</span>
                     <div class="question-content">
                       <p class="question-text">{{ item.text }}</p>
                       <div class="question-meta">
                         <span class="dimension-badge">{{ formatDimensionName(item.dimension) }}</span>
                         <span v-if="item.reverse" class="reverse-badge">Reverse Scored</span>
                       </div>
                     </div>
                   </div>
                   
                   <div class="rating-options">
                     <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="rating-option">
                       <input 
                         type="radio" 
                         :id="`q${item.id}_${value}`" 
                         :name="`question_${item.id}`" 
                         :value="value"
                         disabled
                       >
                       <label :for="`q${item.id}_${value}`" class="rating-label">
                         <span class="rating-number">{{ value }}</span>
                         <span class="rating-text">{{ label }}</span>
                       </label>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div class="form-footer">
                 <div class="completion-info">
                   <p><strong>Total Questions:</strong> {{ questionnaire.items.length }}</p>
                   <p><strong>Estimated Time:</strong> 8-12 minutes</p>
                   <p><strong>Dimensions Assessed:</strong> Autonomy, Environmental Mastery, Personal Growth, Positive Relations, Purpose in Life, Self-Acceptance</p>
                 </div>
               </div>
             </div>
           </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showVersionsModal = false">Close</button>
          <button class="primary-button" @click="selectVersionFromModal">Use This Version</button>
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
import CollegeFilter from './CollegeFilter.vue';
import AssessmentHistory from './AssessmentHistory.vue';
import AutoReminders from './AutoReminders.vue'; // Kept for future use
import { ryff42ItemQuestionnaire } from '../../assets/ryff42ItemQuestionnaire.js';
import { ryff84ItemQuestionnaire } from '../../assets/ryff84ItemQuestionnaire.js';

export default {
  name: 'BulkAssessment',
  components: {
    SavedVersions,
    CollegeFilter,
    AssessmentHistory,
    AutoReminders
  },
  async mounted() {
    // Load colleges from backend when component mounts
    await this.loadCollegesFromBackend();
  },
  data() {
    return {
      currentView: 'form', // Start with create form view
      showCollegeFilter: false,
      currentCollege: null,
      collegeFilters: {}, // Stores customization info for each college
      filteredSections: {},
      assessmentName: '',
      selectAllColleges: false,
      error: null,
      colleges: [], // Will be populated from backend API
      scheduleOption: 'now',
      scheduledDate: (() => {
        const now = new Date();
        now.setDate(now.getDate() + 1); // Default to tomorrow
        now.setHours(9, 0, 0, 0); // Default to 9:00 AM
        return now.toISOString().slice(0, 16); // Format for datetime-local
      })(),
      selectedVersion: '84',
      customMessage: 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.',
      showPreview: false,
      showVersionsModal: false,
      showToast: false,
      toastMessage: '',
      isSending: false,
      validationErrors: {
        assessmentName: '',
        colleges: ''
      }
    }
  },
  computed: {
    questionnaire() {
      return this.selectedVersion === '84' ? ryff84ItemQuestionnaire : ryff42ItemQuestionnaire;
    },
    selectedCollegesText() {
      const selected = this.colleges.filter(c => c.selected).map(c => c.name);
      return selected.length ? selected.join(', ') : 'None selected';
    },
    scheduleText() {
      if (this.scheduleOption === 'now') {
        return 'Immediate dispatch';
      } else {
        return `Scheduled for ${new Date(this.scheduledDate).toLocaleString()}`;
      }
    },
    hasSelectedColleges() {
      return this.colleges.some(c => c.selected);
    },
    hasSelectedCollegesWithFilters() {
      return this.selectedCollegesWithFilters.length > 0;
    },
    selectedCollegesWithFilters() {
      return this.colleges
        .filter(college => college.selected)
        .map(college => {
          const isCustomized = this.collegeFilters[college.name] !== undefined;
          const filters = this.collegeFilters[college.name] || {
            yearCounts: { first: 0, second: 0, third: 0, fourth: 0 },
            totalSections: 0,
            programs: [],
            selectedSections: []
          };
          
          // Get actual section names grouped by year level
          const sectionsByYear = {
            first: [],
            second: [],
            third: [],
            fourth: []
          };
          
          if (filters.programs && filters.selectedSections) {
            filters.programs.forEach(program => {
              program.yearLevels.forEach(yearLevel => {
                const yearKey = this.getYearKey(yearLevel.year);
                if (yearKey) {
                  yearLevel.sections.forEach(section => {
                    if (filters.selectedSections.includes(section.id)) {
                      sectionsByYear[yearKey].push(`${program.name}-${section.name}`);
                    }
                  });
                }
              });
            });
          }
          
          return {
            name: college.name,
            customized: isCustomized && filters.customized,
            years: {
              first: filters.yearCounts.first,
              second: filters.yearCounts.second,
              third: filters.yearCounts.third,
              fourth: filters.yearCounts.fourth
            },
            sectionsByYear: sectionsByYear,
            totalSections: filters.totalSections,
            totalStudents: filters.totalStudents || 0
          };
        });
    },
    totalEstimatedRecipients() {
      // Use actual student count from backend data
      let total = 0;
      this.selectedCollegesWithFilters.forEach(college => {
        total += college.totalStudents;
      });
      return total;
    }
  },
  methods: {
    // Helper method to format dimension names for display
    formatDimensionName(dimension) {
      return dimension.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },
    // Helper method to convert year number to year key
    getYearKey(year) {
      const yearMap = {
        1: 'first',
        2: 'second', 
        3: 'third',
        4: 'fourth'
      };
      return yearMap[year];
    },
    // Load colleges data from backend
    async loadCollegesFromBackend() {
      try {
        const response = await fetch('http://localhost:3000/api/accounts/colleges');
        if (response.ok) {
          const data = await response.json();
          this.colleges = data.colleges.map(college => ({
            name: college.name,
            selected: false
          }));
        } else {
          console.error('Failed to load colleges from backend');
          // Fallback to empty array if backend fails
          this.colleges = [];
        }
      } catch (error) {
        console.error('Error loading colleges:', error);
        // Fallback to empty array if backend fails
        this.colleges = [];
      }
    },
    getDefaultScheduledDate() {
      const now = new Date();
      now.setDate(now.getDate() + 1); // Default to tomorrow
      now.setHours(9, 0, 0, 0); // Default to 9:00 AM
      return now.toISOString().slice(0, 16); // Format for datetime-local
    },
    async toggleAllColleges() {
      for (const college of this.colleges) {
        college.selected = this.selectAllColleges;
        
        // Load real data when selecting
        if (college.selected && !this.collegeFilters[college.name]) {
          await this.loadCollegeRealData(college.name);
        } else if (!college.selected) {
          // Remove filters when deselecting
          delete this.collegeFilters[college.name];
        }
      }
    },
    async updateSelectAllState() {
      this.selectAllColleges = this.colleges.every(college => college.selected);
      
      // When a college is checked directly (without customization)
      for (const college of this.colleges) {
        if (college.selected && !this.collegeFilters[college.name]) {
          // Load real data for the college
          await this.loadCollegeRealData(college.name);
        } else if (!college.selected) {
          // If college is deselected, remove its filters
          delete this.collegeFilters[college.name];
        }
      }
    },
    customizeCollege(college) {
      if (!college.selected) return;
      
      this.currentCollege = college;
      this.showCollegeFilter = true;
    },
    applyCollegeFilters(summary) {
      // Store the selected sections for the current college
      if (this.currentCollege) {
        this.collegeFilters[this.currentCollege.name] = summary;
        
        // Show a toast notification
        this.showToast = true;
        this.toastMessage = `Filters applied to ${this.currentCollege.name}`;
        
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
        colleges: ''
      };

      if (!this.assessmentName.trim()) {
        this.validationErrors.assessmentName = 'Assessment name is required';
        isValid = false;
      }

      if (!this.hasSelectedColleges) {
        this.validationErrors.colleges = 'Please select at least one college';
        isValid = false;
      }

      return isValid;
    },
    previewAssessment() {
      if (this.validate()) {
        this.showPreview = true;
      }
    },
    async confirmSend() {
      this.isSending = true;
      this.error = null;
      
      try {
        // Prepare the request payload
        const payload = {
          assessmentName: this.assessmentName,
          assessmentType: this.selectedVersion === '84' ? 'ryff_84' : 'ryff_42',
          targetType: 'college', // Currently only supporting college targeting
          targetColleges: this.colleges.filter(college => college.selected).map(college => college.name),
          customMessage: this.customMessage,
          scheduleOption: this.scheduleOption,
          scheduledDate: this.scheduleOption === 'scheduled' ? this.scheduledDate : null
        };

        // Call the backend API
        const response = await fetch('http://localhost:3000/api/bulk-assessments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Include session cookies
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          this.isSending = false;
          this.showPreview = false;
          this.showToast = true;
          this.toastMessage = `Assessment "${this.assessmentName}" has been successfully created and sent to ${this.selectedCollegesText}`;
          
          // Reset form after successful submission
          this.resetForm();
          
          // Hide toast after 5 seconds
          setTimeout(() => {
            this.showToast = false;
          }, 5000);
        } else {
          throw new Error(data.message || 'Failed to create assessment');
        }
      } catch (error) {
        console.error('Error creating bulk assessment:', error);
        this.isSending = false;
        this.error = error.message || 'Failed to create assessment. Please try again.';
        
        // Show error toast
        this.showToast = true;
        this.toastMessage = 'Error: ' + (error.message || 'Failed to create assessment');
        
        setTimeout(() => {
          this.showToast = false;
        }, 5000);
      }
    },
    showVersions() {
      // Set to 42-item version by default when opening the modal
      this.selectedVersion = '42';
      this.showVersionsModal = true;
    },
    previewSavedVersion(version) {
      // Set the version based on the saved template
      this.selectedVersion = version.items.toString();
      this.showVersionsModal = true;
    },
    selectVersionFromModal() {
      this.showVersionsModal = false;
      
      // Show a toast notification
      this.showToast = true;
      this.toastMessage = `${this.selectedVersion}-item version selected`;
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
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
    // Load real college data from backend
    async loadCollegeRealData(collegeName) {
      try {
        const response = await fetch(`http://localhost:3000/api/accounts/colleges/${encodeURIComponent(collegeName)}/sections`);
        if (response.ok) {
          const data = await response.json();
          
          // Collect all section IDs for auto-selection
          const allSectionIds = [];
          if (data.programs) {
            data.programs.forEach(program => {
              program.yearLevels.forEach(yearLevel => {
                yearLevel.sections.forEach(section => {
                  allSectionIds.push(section.id);
                });
              });
            });
          }
          
          this.collegeFilters[collegeName] = {
            college: collegeName,
            customized: false,
            yearCounts: {
              first: data.yearCounts?.first || 0,
              second: data.yearCounts?.second || 0,
              third: data.yearCounts?.third || 0,
              fourth: data.yearCounts?.fourth || 0
            },
            totalSections: data.totalSections || 0,
            totalStudents: data.totalStudents || 0,
            selectedSections: allSectionIds, // Auto-select all sections
            programs: data.programs || [] // Store programs data for section names
          };
        } else {
          console.error(`Failed to load data for ${collegeName}`);
          // Fallback to default values if API fails
          this.collegeFilters[collegeName] = {
            college: collegeName,
            customized: false,
            yearCounts: {
              first: 0,
              second: 0,
              third: 0,
              fourth: 0
            },
            totalSections: 0,
            totalStudents: 0,
            selectedSections: [],
            programs: []
          };
        }
      } catch (error) {
        console.error(`Error loading data for ${collegeName}:`, error);
        // Fallback to default values if API fails
        this.collegeFilters[collegeName] = {
          college: collegeName,
          customized: false,
          yearCounts: {
            first: 0,
            second: 0,
            third: 0,
            fourth: 0
          },
          totalSections: 0,
          totalStudents: 0,
          selectedSections: [],
          programs: []
        };
      }
    },
    resetForm() {
      // Reset form to default values
      this.assessmentName = '';
      this.selectAllColleges = false;
      this.colleges.forEach(college => college.selected = false);
      this.scheduleOption = 'now';
      this.scheduledDate = this.getDefaultScheduledDate();
      this.selectedVersion = '84'; // Default to full version
      this.customMessage = 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.';
      this.error = null;
      this.validationErrors = {
        assessmentName: '',
        colleges: ''
      };
    },
    createNewVersion() {
      this.resetForm();
      
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
.error-message {
  background-color: #fee;
  color: #c00;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-message i {
  font-size: 16px;
}

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

.action-button:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  opacity: 0.9;
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

.colleges-list {
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.college-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.college-item:last-child {
  border-bottom: none;
}

.college-item:hover {
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

/* Selected Colleges Summary Styles */
.selected-colleges-summary {
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

.selected-college-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.selected-college-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.college-name {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.college-label {
  font-weight: 500;
  color: var(--dark);
}

.customized-badge {
  font-size: 12px;
  color: var(--primary);
  margin-left: 8px;
}

.sections-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
  margin-left: 20px;
}

.section-name {
  background-color: var(--primary);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
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

/* Versions Modal Styles */
.versions-modal {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.version-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.version-tab {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.version-tab:hover {
  background-color: #f8f9fa;
  color: var(--primary);
}

.version-tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background-color: #f8f9fa;
}

.version-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.version-info {
  margin-bottom: 25px;
}

.version-info h3 {
  color: var(--primary);
  margin-bottom: 10px;
  font-size: 20px;
}

.version-description {
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 20px;
}

.version-details {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: var(--dark);
}

.detail-value {
  color: var(--primary);
  font-weight: 600;
}

/* Assessment Form Styles */
.assessment-form {
  max-height: 70vh;
  overflow-y: auto;
  background: #ffffff;
}

.form-header {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.form-header h3 {
  color: #1a73e8;
  margin-bottom: 12px;
  font-size: 24px;
  font-weight: 400;
}

.form-description {
  color: #5f6368;
  margin-bottom: 20px;
  line-height: 1.5;
  font-size: 14px;
}

.rating-scale-header {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.rating-scale-header h4 {
  margin-bottom: 12px;
  color: #202124;
  font-size: 16px;
  font-weight: 500;
}

.scale-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.scale-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  text-align: center;
}

.scale-value {
  font-weight: 600;
  color: #1a73e8;
  font-size: 16px;
  margin-bottom: 4px;
}

.scale-text {
  color: #5f6368;
  font-size: 12px;
  line-height: 1.2;
}

.form-questions {
  padding: 0;
}

.question-item {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.question-item:nth-child(even) {
  background: #fafafa;
}

.question-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.question-number {
  font-weight: 500;
  color: #5f6368;
  min-width: 30px;
  font-size: 14px;
  margin-top: 2px;
}

.question-content {
  flex: 1;
}

.question-text {
  margin: 0 0 8px 0;
  color: #202124;
  line-height: 1.5;
  font-size: 16px;
  font-weight: 400;
}

.question-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.dimension-badge {
  background: #e8f0fe;
  color: #1a73e8;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.reverse-badge {
  background: #fef7e0;
  color: #f9ab00;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.rating-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.rating-option {
  position: relative;
}

.rating-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.rating-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  text-align: center;
}

.rating-label:hover {
  border-color: #1a73e8;
  background: #f8f9fa;
}

.rating-option input[type="radio"]:checked + .rating-label {
  border-color: #1a73e8;
  background: #e8f0fe;
}

.rating-number {
  font-weight: 600;
  color: #1a73e8;
  font-size: 18px;
  margin-bottom: 4px;
}

.rating-text {
  color: #5f6368;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 400;
}

.preview-note {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  text-align: center;
}

.preview-note p {
  margin: 4px 0;
  color: #5f6368;
  font-size: 14px;
}

.preview-note strong {
  color: #1a73e8;
  font-weight: 600;
}

.form-footer {
  padding: 24px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.completion-info {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.completion-info p {
  margin: 8px 0;
  color: #5f6368;
  font-size: 14px;
}

.completion-info strong {
  color: #202124;
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
  
  .questionnaire-preview {
    padding: 15px;
  }
  
  .scale-items {
    grid-template-columns: 1fr;
  }
  
  .questionnaire-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .item-number {
    min-width: auto;
  }
  
  .versions-modal {
    max-width: 95vw;
    margin: 10px;
  }
  
  .version-tabs {
    flex-direction: column;
    gap: 0;
  }
  
  .version-tab {
    border-bottom: 1px solid #e9ecef;
    border-right: none;
  }
  
  .version-tab.active {
    border-bottom-color: var(--primary);
    border-right: none;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .scale-options {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-header {
    padding: 16px;
  }
  
  .form-header h3 {
    font-size: 20px;
  }
  
  .question-item {
    padding: 16px;
  }
  
  .question-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .question-number {
    min-width: auto;
    align-self: flex-start;
  }
  
  .rating-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .rating-label {
    padding: 8px 4px;
  }
  
  .rating-number {
    font-size: 16px;
  }
  
  .rating-text {
    font-size: 10px;
  }
  
  .form-footer {
    padding: 16px;
  }
  
  .completion-info {
    padding: 12px;
  }
}
</style>