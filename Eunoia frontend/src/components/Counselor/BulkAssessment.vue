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
                   @preview-version="previewSavedVersion" />

    <!-- Assessment History Section -->
    <assessment-history v-if="currentView === 'history'" />
                   
    <!-- Assessment Form -->
    <div class="assessment-form-card" v-if="currentView === 'form'">
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>

      <!-- Assessment Name is now automatically generated based on selected colleges and current academic period -->

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

      <div class="form-group" v-if="false">
        <label class="schedule-label">
          <i class="far fa-clock"></i> Schedule
        </label>
        <div class="schedule-info">
          <div class="schedule-display">
            <i class="fas fa-paper-plane"></i>
            <span>Send Now (immediate dispatch)</span>
          </div>
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
          <!-- School year and semester are now automatically detected and included in assessment name -->
          <div class="preview-item">
            <span class="preview-label">Assessment Name:</span>
            <span class="preview-value">{{ fullAssessmentName || 'Not specified' }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Selected Colleges:</span>
            <span class="preview-value">{{ selectedCollegesText }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Version:</span>
            <span class="preview-value">{{ selectedVersion }} items</span>
          </div>
          <div class="preview-item" v-if="false">
            <span class="preview-label">Schedule:</span>
            <span class="preview-value">{{ scheduleText }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Custom Message:</span>
            <div class="preview-message">{{ customMessage || 'No custom message' }}</div>
          </div>
          
          <!-- Simple Assessment Confirmation -->
          <div class="assessment-confirmation">
            <div class="confirmation-message">
              <i class="fas fa-check-circle confirmation-icon"></i>
              <h3>Ready to Send Assessment</h3>
              <p>The {{ selectedVersion }}-item Ryff Scales assessment is ready to be sent to the selected students.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showPreview = false">Close</button>
          <button class="primary-button" @click="confirmSend" :disabled="isSending">
            <i class="fas fa-spinner fa-spin" v-if="isSending"></i>
            <i class="fas fa-paper-plane" v-else></i>
            {{ isSending ? 'Sending...' : 'Confirm & Send' }}
          </button>
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
            
            <!-- Simple Assessment Confirmation -->
            <div class="assessment-confirmation">
              <div class="confirmation-message">
                <i class="fas fa-check-circle confirmation-icon"></i>
                <h3>Ready to Send Assessment</h3>
                <p>The {{ selectedVersion }}-item Ryff Scales assessment is ready to be sent to the selected students.</p>
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
                   <p><strong>Dimensions Assessed:</strong> Autonomy, Environmental Mastery, Personal Growth, Positive Relations with Others, Purpose in Life, Self-Acceptance</p>
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

    <!-- Duplicate Error Modal -->
    <div class="modal" v-if="showDuplicateModal" @click.self="showDuplicateModal = false">
      <div class="modal-content duplicate-error-modal">
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle"></i> Duplicate Assessment Detected</h3>
          <button class="close-button" @click="showDuplicateModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="error-message">
            <p><strong>{{ duplicateErrorData.message }}</strong></p>
          </div>
          <div v-if="duplicateErrorData.duplicateInfo" class="duplicate-details">
            <h4>Duplicate Assessment Details:</h4>
            <div class="detail-item">
              <span class="label">Assessment Name:</span>
              <span class="value">{{ duplicateAssessmentDisplayName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">College:</span>
              <span class="value">{{ Array.isArray(duplicateErrorData.duplicateInfo.colleges) ? duplicateErrorData.duplicateInfo.colleges.join(', ') : duplicateErrorData.duplicateInfo.colleges }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Section:</span>
              <span class="value">{{ Array.isArray(duplicateErrorData.duplicateInfo.sections) ? duplicateErrorData.duplicateInfo.sections.join(', ') : duplicateErrorData.duplicateInfo.sections }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Semester:</span>
              <span class="value">{{ duplicateErrorData.duplicateInfo.semester }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Created:</span>
              <span class="value">{{ new Date(duplicateErrorData.duplicateInfo.createdAt).toLocaleString() }}</span>
            </div>
          </div>
          <div class="help-text">
            <p><i class="fas fa-info-circle"></i> Please modify your selection or wait before creating a similar assessment.</p>
          </div>
        </div>
        <div class="modal-footer">
           <button class="secondary-button" @click="showDuplicateModal = false">OK, Got It</button>
           <button class="primary-button" @click="removeDuplicateAndProceed">Remove Overlapping & Proceed</button>
         </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" v-if="showToast" :class="{ 'show': showToast, 'error': toastIsError }">
      <div class="toast-content">
        <i :class="toastIsError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import SavedVersions from './SavedVersions.vue';
import CollegeFilter from './CollegeFilter.vue';
import AssessmentHistory from './AssessmentHistory.vue';

import { ryff42ItemQuestionnaire } from '../../assets/ryff42ItemQuestionnaire.js';
import { ryff84ItemQuestionnaire } from '../../assets/ryff84ItemQuestionnaire.js';
import { apiUrl } from '../../utils/apiUtils.js';

export default {
  name: 'BulkAssessment',
  components: {
    SavedVersions,
    CollegeFilter,
    AssessmentHistory,

  },
  async mounted() {
    // Load colleges and current academic period from backend when component mounts
    await this.loadCollegesFromBackend();
    await this.loadCurrentAcademicPeriod();
  },
  data() {
    return {
      // API configuration - uses environment variable for production
      
      currentView: 'form', // Start with create form view
      showCollegeFilter: false,
      currentCollege: null,
      collegeFilters: {}, // Stores customization info for each college
      filteredSections: {},
      currentAcademicPeriod: null, // Will store current school year and semester from API
      selectAllColleges: false,
      error: null,
      colleges: [], // Will be populated from backend API
      selectedVersion: '84',
      customMessage: 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.',
      showPreview: false,
      showVersionsModal: false,
      showToast: false,
      toastMessage: '',
      toastIsError: false,
      isSending: false,
      validationErrors: {
        assessmentName: '',
        colleges: ''
      },
      showDuplicateModal: false,
      duplicateErrorData: {
        message: '',
        duplicateInfo: null
      }
    }
  },
  computed: {
    fullAssessmentName() {
      const selectedColleges = this.colleges.filter(c => c.selected).map(c => c.name);
      const collegeNames = selectedColleges.length > 0 ? selectedColleges.join(', ') : 'No Colleges Selected';
      
      // Include selected Ryff Scale items count at the beginning
      const itemsCount = `${this.selectedVersion} Items`;
      
      if (this.currentAcademicPeriod) {
        // If we have semester info, include it; otherwise just school year
        if (this.currentAcademicPeriod.semester) {
          return `${itemsCount}, ${this.currentAcademicPeriod.schoolYear} ${this.currentAcademicPeriod.semester} - ${collegeNames}`;
        } else {
          return `${itemsCount}, ${this.currentAcademicPeriod.schoolYear} - ${collegeNames}`;
        }
      }
      return `${itemsCount}, ${collegeNames}`;
    },
    questionnaire() {
      return this.selectedVersion === '84' ? ryff84ItemQuestionnaire : ryff42ItemQuestionnaire;
    },
    // Custom assessment name for duplicate modal showing only overlapping college
    duplicateAssessmentDisplayName() {
      if (!this.duplicateErrorData.duplicateInfo) {
        return this.duplicateErrorData.duplicateInfo?.assessmentName || '';
      }
      
      const overlappingColleges = this.duplicateErrorData.duplicateInfo.colleges || [];
      const semester = this.duplicateErrorData.duplicateInfo.semester || '';
      
      // Extract the assessment type (42 Items or 84 Items) from the original name
      const originalName = this.duplicateErrorData.duplicateInfo.assessmentName || '';
      const itemsMatch = originalName.match(/(\d+)\s*Items/);
      const itemsCount = itemsMatch ? `${itemsMatch[1]} Items` : '42 Items';
      
      // Create a clean name with only the overlapping college
      const collegeNames = Array.isArray(overlappingColleges) ? overlappingColleges.join(', ') : overlappingColleges;
      
      if (semester && collegeNames) {
        return `${itemsCount}, ${semester} - ${collegeNames}`;
      } else if (collegeNames) {
        return `${itemsCount} - ${collegeNames}`;
      }
      
      // Fallback to original name if we can't parse it properly
      return originalName;
    },
    selectedCollegesText() {
      const selected = this.colleges.filter(c => c.selected).map(c => c.name);
      return selected.length ? selected.join(', ') : 'None selected';
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
            // Use a Set to track unique sections and avoid duplicates
            const addedSections = new Set();
            
            filters.programs.forEach(program => {
              program.yearLevels.forEach(yearLevel => {
                const yearKey = this.getYearKey(yearLevel.year);
                if (yearKey) {
                  yearLevel.sections.forEach(section => {
                    if (filters.selectedSections.includes(section.id)) {
                      // Create unique identifier to prevent duplicates
                      const sectionKey = `${yearKey}-${section.name}`;
                      
                      if (!addedSections.has(sectionKey)) {
                        // Extract section part from section name (e.g., "BSCS-3A" -> "3A")
                        const sectionPart = section.name.split('-').pop() || section.name;
                        // Format: "Course - Section" (e.g., "BSIS - 2A")
                        sectionsByYear[yearKey].push(`${program.name} - ${sectionPart}`);
                        addedSections.add(sectionKey);
                      }
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
    async loadCurrentAcademicPeriod() {
      try {
        const response = await fetch(apiUrl('academic-settings/current'));
        
        if (response.ok) {
          const data = await response.json();
          // Map backend property names to frontend expected names
          this.currentAcademicPeriod = {
            schoolYear: data.data.school_year,
            semester: data.data.semester_name
          };
        } else {
          console.error('Failed to load current academic period');
          // Fallback to current year if API fails
          const currentYear = new Date().getFullYear();
          this.currentAcademicPeriod = {
            schoolYear: `${currentYear}-${currentYear + 1}`,
            semester: null
          };
        }
      } catch (error) {
        console.error('Error loading current academic period:', error);
        // Fallback to current year if API fails
        const currentYear = new Date().getFullYear();
        this.currentAcademicPeriod = {
          schoolYear: `${currentYear}-${currentYear + 1}`,
          semester: null
        };
      }
    },
    async loadCollegesFromBackend() {
      try {
        const response = await fetch(apiUrl('accounts/colleges'));
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
        colleges: ''
      };

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
      // Prevent duplicate submissions
      if (this.isSending) {
        return;
      }
      
      this.isSending = true;
      this.error = null;
      
      try {
        // Extract year levels and sections from selected colleges
        const selectedColleges = this.colleges.filter(college => college.selected);
        const targetYearLevels = new Set();
        const targetSections = new Set();
        
        selectedColleges.forEach(college => {
          const filters = this.collegeFilters[college.name];
          if (filters && filters.programs) {
            // Extract year levels and sections from the college filters
            filters.programs.forEach(program => {
              program.yearLevels.forEach(yearLevel => {
                // Add year level if it has selected sections
                const hasSelectedSections = yearLevel.sections.some(section => 
                  filters.selectedSections.includes(section.id)
                );
                if (hasSelectedSections) {
                  targetYearLevels.add(yearLevel.year);
                  
                  // Add sections that are selected
                  yearLevel.sections.forEach(section => {
                    if (filters.selectedSections.includes(section.id)) {
                      targetSections.add(section.name);
                    }
                  });
                }
              });
            });
          }
        });
        
        // Prepare the request payload
        const payload = {
          assessmentName: this.fullAssessmentName,
          assessmentType: this.selectedVersion === '84' ? 'ryff_84' : 'ryff_42',
          targetType: 'college', // Currently only supporting college targeting
          targetColleges: selectedColleges.map(college => college.name),
          targetYearLevels: Array.from(targetYearLevels).sort((a, b) => a - b), // Convert Set to sorted array
          targetSections: Array.from(targetSections).sort(), // Convert Set to sorted array
          customMessage: this.customMessage
        };
        
        console.log('Payload with target data:', payload); // Debug log

        // Call the backend API
        const response = await fetch(apiUrl('bulk-assessments/create'), {
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
          this.toastIsError = false;
          
          // Show detailed success message with assignment info
          let successMessage = `Assessment "${this.fullAssessmentName}" has been successfully created and sent to ${data.data.assignedStudents} students`;
          if (data.data.skippedStudents > 0) {
            successMessage += `. ${data.data.skippedStudents} students were skipped as they already have active assignments`;
          }
          this.toastMessage = successMessage;
          
          // Reset form after successful submission
          this.resetForm();
          
          // Hide toast after 5 seconds
          setTimeout(() => {
            this.showToast = false;
          }, 5000);
        } else {
          // Handle specific error cases
          if (response.status === 409) {
            // Close Assessment Preview modal and show duplicate error modal
            this.showPreview = false;
            this.showDuplicateModal = true;
            this.duplicateErrorData = {
              message: data.message || 'Duplicate assessment detected',
              duplicateInfo: data.duplicateInfo || null
            };
            this.isSending = false;
            return; // Don't throw error, just show modal
          } else if (response.status === 400 && data.data?.errorType === 'all_students_skipped') {
            // Handle case where all students were skipped due to existing assessments
            this.isSending = false;
            this.showPreview = false;
            this.showToast = true;
            this.toastIsError = true;
            this.toastMessage = data.message;
            
            // Hide toast after 5 seconds
            setTimeout(() => {
              this.showToast = false;
              this.toastIsError = false;
            }, 5000);
            return; // Don't throw error, just show error toast
          } else {
            throw new Error(data.message || 'Failed to create assessment');
          }
        }
      } catch (error) {
        console.error('Error creating bulk assessment:', error);
        this.isSending = false;
        this.error = error.message || 'Failed to create assessment. Please try again.';
        
        // Show error toast
        this.showToast = true;
        this.toastIsError = true;
        this.toastMessage = 'Error: ' + (error.message || 'Failed to create assessment');
        
        setTimeout(() => {
          this.showToast = false;
          this.toastIsError = false;
        }, 5000);
      }
    },
    async removeDuplicateAndProceed() {
      try {
        // Close the duplicate modal
        this.showDuplicateModal = false;
        
        // Get the overlapping colleges and sections from the error data structure
        const overlappingColleges = this.duplicateErrorData.duplicateInfo?.colleges || [];
        const overlappingSections = this.duplicateErrorData.duplicateInfo?.sections || [];
        
        // Remove the overlapping selections from current form
        this.colleges.forEach(college => {
          if (overlappingColleges.includes(college.name)) {
            // If this college has overlaps, we need to remove the overlapping sections
            const filters = this.collegeFilters[college.name];
            if (filters && filters.programs && overlappingSections.length > 0) {
              // Remove overlapping sections from selectedSections
              const updatedSelectedSections = filters.selectedSections.filter(sectionId => {
                // Find the section name for this ID
                let sectionName = '';
                filters.programs.forEach(program => {
                  program.yearLevels.forEach(yearLevel => {
                    yearLevel.sections.forEach(section => {
                      if (section.id === sectionId) {
                        sectionName = section.name;
                      }
                    });
                  });
                });
                // Keep sections that are NOT in the overlapping list
                return !overlappingSections.includes(sectionName);
              });
              
              // Update the filters
              filters.selectedSections = updatedSelectedSections;
              
              // If no sections left for this college, unselect the college
              if (updatedSelectedSections.length === 0) {
                college.selected = false;
              }
            } else {
              // If no specific sections are mentioned or no filters exist, 
              // remove the entire college to be safe
              college.selected = false;
            }
          }
        });
        
        // Validate that we still have valid selections
        const hasValidSelections = this.colleges.some(college => {
          if (!college.selected) return false;
          const filters = this.collegeFilters[college.name];
          return filters && filters.selectedSections && filters.selectedSections.length > 0;
        });
        
        if (!hasValidSelections) {
          // Show error if no valid selections remain
          this.showToast = true;
          this.toastMessage = 'No valid selections remain after removing overlapping assessments. Please select different colleges or sections.';
          setTimeout(() => {
            this.showToast = false;
          }, 5000);
          return;
        }
        
        // Show success message about overlapping removal
        this.showToast = true;
        this.toastMessage = 'Overlapping assessments removed. Proceeding with remaining selections...';
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
        
        // Wait a moment then proceed with the assessment
        setTimeout(() => {
          this.confirmSend();
        }, 1000);
        
      } catch (error) {
        console.error('Error removing overlapping assessments:', error);
        this.showToast = true;
        this.toastMessage = 'Error removing overlapping assessments. Please try again.';
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
        const response = await fetch(apiUrl(`accounts/colleges/${encodeURIComponent(collegeName)}/sections`));
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
      this.selectAllColleges = false;
      this.colleges.forEach(college => college.selected = false);
      this.selectedVersion = '84'; // Default to full version
      this.customMessage = 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.';
      this.error = null;
      this.validationErrors = {
        colleges: ''
      };
    },

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

.schedule-info {
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: var(--border-radius);
  margin-top: 5px;
}

.schedule-display {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary);
  font-weight: 500;
}

.schedule-display i {
  font-size: 16px;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-left: 10px;
}

.test-item-options {
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

.primary-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.primary-button:disabled:hover {
  background-color: #ccc;
  transform: none;
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

.info-text {
  color: #6c757d;
  font-size: 12px;
  margin-top: 5px;
  display: block;
  font-style: italic;
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

.toast.error {
  background-color: #dc3545; /* Red background for errors */
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

/* Assessment Confirmation Styles */
.assessment-confirmation {
  padding: 40px 20px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.confirmation-message {
  max-width: 400px;
  margin: 0 auto;
}

.confirmation-icon {
  font-size: 48px;
  color: #34a853;
  margin-bottom: 16px;
  display: block;
}

.confirmation-message h3 {
  color: #202124;
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 12px 0;
}

.confirmation-message p {
  color: #5f6368;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
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

/* Duplicate Error Modal Styles */
.duplicate-error-modal {
  max-width: 500px;
}

.duplicate-error-modal .modal-header {
  background-color: #fff3cd;
  border-bottom: 1px solid #ffeaa7;
}

.duplicate-error-modal .modal-header h3 {
  color: #856404;
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.duplicate-error-modal .modal-header i {
  color: #f39c12;
}

.duplicate-error-modal .modal-body {
  padding: 20px 25px;
}

.duplicate-error-modal .error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 20px;
}

.duplicate-error-modal .error-message p {
  margin: 0;
  color: #721c24;
}

.duplicate-error-modal .duplicate-details {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.duplicate-error-modal .duplicate-details h4 {
  margin: 0 0 12px 0;
  color: var(--dark);
  font-size: 14px;
  font-weight: 600;
}

.duplicate-error-modal .detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #e9ecef;
}

.duplicate-error-modal .detail-item:last-child {
  border-bottom: none;
}

.duplicate-error-modal .detail-item .label {
  font-weight: 500;
  color: var(--text);
  font-size: 13px;
}

.duplicate-error-modal .detail-item .value {
  font-weight: 400;
  color: var(--text-light);
  font-size: 13px;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.duplicate-error-modal .help-text {
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
  padding: 12px;
  margin-top: 15px;
}

.duplicate-error-modal .help-text p {
  margin: 0;
  color: #0c5460;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.duplicate-error-modal .help-text i {
  color: #17a2b8;
}

.duplicate-error-modal .modal-footer {
  padding: 15px 25px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.duplicate-error-modal .primary-button {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.duplicate-error-modal .primary-button:hover {
  background-color: var(--primary-dark);
}

.duplicate-error-modal .secondary-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.duplicate-error-modal .secondary-button:hover {
  background-color: #5a6268;
}
</style>