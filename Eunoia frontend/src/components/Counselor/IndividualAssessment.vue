<template>
  <div class="individual-assessment-container">
    <div class="action-buttons-container">
      <button class="action-button" 
              @click="currentView = 'form'"
              :class="{ 'active': currentView === 'form' }">
        <i class="fas fa-plus"></i> Create
      </button>
      <button class="action-button"
              @click="currentView = 'history'"
              :class="{ 'active': currentView === 'history' }">
        <i class="fas fa-history"></i> History
      </button>
    </div>

    <!-- History Section -->
    <div v-if="currentView === 'history'" class="assessment-history-container">
      <div class="history-header">
        <div class="header-title">
          <i class="fas fa-history"></i>
          <h2>Assessment History</h2>
          <p>View and manage past assessment distributions</p>
        </div>
        <div class="search-container">
          <div class="filter-dropdown">
            <select v-model="assessmentTypeFilter" @change="fetchHistory" class="assessment-type-filter">
              <option value="">All Assessment Types</option>
              <option value="ryff_42">42-Item Assessments</option>
              <option value="ryff_84">84-Item Assessments</option>
            </select>
          </div>
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" placeholder="Search assessments..." v-model="searchQuery" @input="filterAssessments">
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="historyLoading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p class="loading-text">Loading assessment history...</p>
      </div>

      <div v-else class="history-table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>Assessment Name</th>
              <th>Target Student</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="assessment in filteredAssessments" :key="assessment.id" class="assessment-row">
              <td>{{ assessment.assessmentName }}</td>
              <td>{{ assessment.targetStudent?.name }}</td>
              <td>{{ formatDateShort(assessment.createdAt) }}</td>
              <td>
                <span class="status-text" :class="{ 'completed': assessment.assignmentStatus === 'completed', 'not-completed': assessment.assignmentStatus !== 'completed' }">
                  {{ assessment.assignmentStatus === 'completed' ? 'Completed' : 'Not Completed' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="historyPagination.totalPages > 1" class="pagination">
        <button 
          @click="changePage(historyPagination.currentPage - 1)"
          :disabled="historyPagination.currentPage === 1"
          class="pagination-button"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="pagination-info">
          Page {{ historyPagination.currentPage }} of {{ historyPagination.totalPages }}
        </span>
        
        <button 
          @click="changePage(historyPagination.currentPage + 1)"
          :disabled="historyPagination.currentPage === historyPagination.totalPages"
          class="pagination-button"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
                   
    <!-- Assessment Form -->
    <div class="assessment-form-card" v-if="currentView === 'form'">
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>

      <!-- Student Search Section -->
      <div class="form-group">
        <label for="student-search">
          <i class="fas fa-search"></i>
          Search Student
        </label>
        <input
          id="student-search"
          v-model="searchQuery"
          @input="searchStudents"
          type="text"
          placeholder="Search students by name, ID, email, or section..."
          class="search-input"
        />
        
        <!-- Searching Indicator -->
        <div v-if="isSearching" class="searching">
          <i class="fas fa-spinner fa-spin"></i>
          Searching students...
        </div>

        <!-- Search Results -->
        <div v-if="searchQuery && !isSearching && searchResults.length > 0" class="search-results">
          <div
            v-for="student in searchResults"
            :key="student.id"
            class="student-result"
            @click="addStudent(student)"
          >
            <div class="student-info">
              <strong>{{ student.name }}</strong>
              <span class="student-details">{{ student.college }} - Year {{ student.year_level }} - {{ student.section }}</span>
            </div>
            <span class="student-id">ID: {{ student.id_number || student.id }}</span>
          </div>
        </div>
        
        <!-- No Results -->
        <div v-if="searchQuery && !isSearching && searchResults.length === 0" class="no-results">
          <i class="fas fa-user-slash"></i>
          No students found matching "{{ searchQuery }}"
        </div>
      </div>

      <!-- Selected Students Section -->
      <div v-if="selectedStudents.length > 0" class="form-group">
        <label>
          <i class="fas fa-users"></i>
          Selected Students ({{ selectedStudents.length }})
        </label>
        <div class="selected-students">
          <div
            v-for="student in selectedStudents"
            :key="student.id"
            class="selected-student"
          >
            <span class="student-name">{{ student.name }}</span>
            <button
              @click="removeStudent(student.id)"
              class="remove-button"
              title="Remove student"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Schedule Section -->
      <div class="form-section">
        <div class="form-group">
          <label class="schedule-label">
            <i class="far fa-clock"></i> Select Schedule
          </label>
          <div class="radio-options schedule-options">
            <div class="radio-option">
              <input type="radio" id="send-now-individual" value="now" v-model="scheduleOption">
              <label for="send-now-individual">Send Now (immediate dispatch)</label>
            </div>
            <div class="radio-option">
              <input type="radio" id="schedule-later-individual" value="later" v-model="scheduleOption">
              <label for="schedule-later-individual">Schedule Later</label>
            </div>
          </div>
          <div v-if="scheduleOption === 'later'" class="date-selector">
            <input type="datetime-local" v-model="scheduledDate" class="form-control">
          </div>
        </div>
      </div>

      <!-- Test Items Section -->
      <div class="form-section">
        <div class="form-group">
          <label>Select Ryff Scale PWB Test Items</label>
          <div class="radio-options test-item-options">
            <div class="radio-option">
              <input type="radio" id="items-84-individual" value="84" v-model="selectedVersion">
              <label for="items-84-individual">84 items (Complete version)</label>
            </div>
            <div class="radio-option">
              <input type="radio" id="items-42-individual" value="42" v-model="selectedVersion">
              <label for="items-42-individual">42 items (Brief version)</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Message Section -->
      <div class="form-section">
        <div class="form-group">
          <label for="custom-message-individual">Custom Message (Optional)</label>
          <textarea 
            id="custom-message-individual" 
            v-model="customMessage" 
            rows="6"
            class="form-control"
            placeholder="Enter a custom message for participants"
          ></textarea>
          <div class="message-note">
            <i class="fas fa-info-circle"></i> This message will be included in the email and notification sent to participants.
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button 
          class="secondary-button" 
          @click="previewAssessment"
          :disabled="selectedStudents.length === 0"
        >
          <i class="fas fa-eye"></i> Preview
        </button>
        <button 
          class="primary-button" 
          @click="sendAssessment" 
          :disabled="isSending || selectedStudents.length === 0"
        >
          <i class="fas fa-paper-plane"></i> {{ isSending ? 'Sending...' : 'Send Assessment' }}
        </button>
      </div>
    </div>

    <!-- Preview Modal -->
    <div class="modal" v-if="showPreview">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Individual Assessment Preview</h2>
          <button class="close-button" @click="showPreview = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="preview-item">
            <span class="preview-label">Selected Students:</span>
            <div class="preview-students">
              <div v-for="student in selectedStudents" :key="student.id" class="preview-student">
                {{ student.name }} ({{ student.id_number || student.id }})
              </div>
            </div>
          </div>
          <div class="preview-item">
            <span class="preview-label">Schedule:</span>
            <span class="preview-value">{{ scheduleOption === 'now' ? 'Send Immediately' : `Scheduled for ${formatDate(scheduledDate)}` }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Test Version:</span>
            <span class="preview-value">{{ selectedVersion }} items ({{ selectedVersion === '84' ? 'Complete' : 'Brief' }} version)</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">Custom Message:</span>
            <span class="preview-value">{{ customMessage || 'No custom message' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showPreview = false" :disabled="isSending">Cancel</button>
          <button class="primary-button" @click="confirmSend" :disabled="isSending">
            <span v-if="!isSending">Confirm & Send</span>
            <span v-else class="sending-indicator">
              <i class="fas fa-spinner fa-spin"></i> Sending...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Sending Assessment Loading Modal -->
  <div v-if="showSendingModal" class="modal-overlay">
    <div class="modal-content sending-loading-modal">
      <div class="modal-body">
        <div v-if="sendingState === 'loading'" class="loading-content">
          <div class="spinner-container">
            <i class="fas fa-spinner fa-spin loading-spinner"></i>
          </div>
          <h3>Sending Assessment...</h3>
          <p>Please wait while we send the assessment to selected students.</p>
        </div>
        <div v-else-if="sendingState === 'success'" class="success-content">
          <div class="success-icon-container">
            <i class="fas fa-check-circle success-icon"></i>
          </div>
          <h3>Assessment Sent Successfully!</h3>
          <p>The assessment has been sent to all selected students.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Duplication Error Modal -->
  <div class="modal-overlay" v-if="showDuplicationModal" @click.self="showDuplicationModal = false">
    <div class="modal-content duplication-error-modal">
      <div class="modal-header">
        <h3><i class="fas fa-exclamation-triangle"></i> Duplicate Assessment Detected</h3>
        <button class="close-button" @click="showDuplicationModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="error-message">
          <p><strong>{{ duplicationErrorMessage }}</strong></p>
        </div>
        <div class="help-text">
          <p><i class="fas fa-info-circle"></i> This student already has an assessment of this type for the current academic period. Please check the student's assessment history or try again later.</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="primary-button" @click="showDuplicationModal = false">OK, Got It</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IndividualAssessment',
  data() {
    return {
      currentView: 'form',
      searchQuery: '',
      searchResults: [],
      selectedStudents: [],
      isSearching: false,
      scheduleOption: 'now',
      scheduledDate: '',
      selectedVersion: '84',
      customMessage: 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.',
      error: '',
      isSending: false,
      showPreview: false,
      showSendingModal: false,
      sendingState: 'loading', // 'loading' or 'success'
      searchTimeout: null,
      currentAcademicPeriod: null, // Will store current school year and semester from API
      
      // Duplication error modal
      showDuplicationModal: false,
      duplicationErrorMessage: '',
      
      // History data
      assessmentHistory: [],
      filteredAssessments: [],
      historyLoading: false,
      historyError: '',
      assessmentTypeFilter: '',
      historyPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      },
      cancellingAssessment: null
    };
  },
  methods: {
    async searchStudents() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        return;
      }

      this.isSearching = true;
      
      // Debounce search to avoid too many API calls
      this.searchTimeout = setTimeout(async () => {
        try {
          const response = await fetch(`/api/accounts/students?search=${encodeURIComponent(this.searchQuery)}`, {
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to search students');
          }

          if (data.students) {
            this.searchResults = data.students || [];
            this.error = '';
          } else {
            this.searchResults = [];
            this.error = 'No students found matching your search';
          }
        } catch (error) {
          console.error('Error searching students:', error);
          this.error = 'Error searching students. Please try again.';
          this.searchResults = [];
        } finally {
          this.isSearching = false;
        }
      }, 300);
    },
    
    addStudent(student) {
      if (!this.selectedStudents.some(selected => selected.id === student.id)) {
        this.selectedStudents.push(student);
        this.searchQuery = '';
        this.searchResults = [];
        this.error = '';
      }
    },
    

    
    removeStudent(studentId) {
      this.selectedStudents = this.selectedStudents.filter(student => student.id !== studentId);
    },
    
    previewAssessment() {
      if (this.selectedStudents.length === 0) {
        this.error = 'Please select at least one student before previewing.';
        return;
      }
      
      if (this.scheduleOption === 'later' && !this.scheduledDate) {
        this.error = 'Please select a scheduled date and time.';
        return;
      }
      
      this.error = '';
      this.showPreview = true;
    },
    
    sendAssessment() {
      this.previewAssessment();
    },
    
    async confirmSend() {
      this.isSending = true;
      this.showPreview = false;
      this.showSendingModal = true;
      this.sendingState = 'loading';
      
      try {
        // Send individual assessment for each selected student
        const promises = this.selectedStudents.map(async (student) => {
          // Generate assessment name using current academic period (like bulk assessments)
          let assessmentName = `${this.selectedVersion} Items`;
          
          if (this.currentAcademicPeriod) {
            // If we have semester info, include it; otherwise just school year
            if (this.currentAcademicPeriod.semester) {
              assessmentName += `, ${this.currentAcademicPeriod.schoolYear} ${this.currentAcademicPeriod.semester} - ${student.college}`;
            } else {
              assessmentName += `, ${this.currentAcademicPeriod.schoolYear} - ${student.college}`;
            }
          } else {
            // Fallback to current year if academic period is not available
            const currentYear = new Date().getFullYear();
            assessmentName += `, ${currentYear}-${currentYear + 1} - ${student.college}`;
          }

          const assessmentData = {
            studentId: student.id,
            assessmentName: assessmentName,
            assessmentType: this.selectedVersion === '84' ? 'ryff_84' : 'ryff_42',
            customMessage: this.customMessage,
            scheduleOption: this.scheduleOption,
            scheduledDate: this.scheduledDate
          };
          
          const response = await fetch('/api/individual-assessments/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(assessmentData)
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 409 && data.duplicate) {
              // Handle duplicate assessment - return special object instead of throwing
              return {
                isDuplicate: true,
                studentName: student.name,
                message: data.message
              };
            }
            throw new Error(`${student.name}: ${data.message || 'Failed to send assessment'}`);
          }

          return data;
        });

        const results = await Promise.allSettled(promises);
        
        // Check results and separate duplicates from other errors
        const successful = results.filter(result => 
          result.status === 'fulfilled' && !result.value?.isDuplicate
        );
        const duplicates = results.filter(result => 
          result.status === 'fulfilled' && result.value?.isDuplicate
        );
        const failed = results.filter(result => result.status === 'rejected');
        
        // Handle duplicates first - show modal and exit early
        if (duplicates.length > 0) {
          // Close loading modal
          this.showSendingModal = false;
          this.sendingState = 'loading'; // Reset for next time
          
          // Show duplication modal with the first duplicate's message
          const firstDuplicate = duplicates[0].value;
          this.duplicationErrorMessage = firstDuplicate.message;
          this.showDuplicationModal = true;
          
          return; // Exit early, don't process other results
        }

        if (successful.length > 0) {
          // Reset form after successful sends
          this.selectedStudents = [];
          this.customMessage = 'Dear participant,\n\nYou have been selected to participate in our well-being assessment. Your insights will help us better understand and support the mental health needs of our community.\n\nThank you for your participation.';
          this.scheduleOption = 'now';
          this.scheduledDate = '';
          this.selectedVersion = '84';
          this.searchQuery = '';
          this.searchResults = [];
        }

        if (failed.length === 0) {
          // All successful - show success state
          this.sendingState = 'success';
          
          // Show success for 2 seconds, then close modal
          setTimeout(() => {
            this.showSendingModal = false;
            this.sendingState = 'loading'; // Reset for next time
          }, 2000);
          
          this.$emit('show-toast', {
            type: 'success',
            message: `Assessment sent successfully to ${successful.length} student(s)!`
          });
        } else if (successful.length > 0) {
          // Partial success - close modal and show warning
          this.showSendingModal = false;
          this.sendingState = 'loading'; // Reset for next time
          
          this.$emit('show-toast', {
            type: 'warning',
            message: `Assessment sent to ${successful.length} student(s). ${failed.length} failed: ${failed.map(f => f.reason.message).join(', ')}`
          });
        } else {
          // All failed
          throw new Error(failed.map(f => f.reason.message).join(', '));
        }

      } catch (error) {
        console.error('Error sending assessments:', error);
        this.error = error.message || 'Failed to send assessments. Please try again.';
        
        // Close modal on error
        this.showSendingModal = false;
        this.sendingState = 'loading'; // Reset for next time
        
        this.$emit('show-toast', {
          type: 'error',
          message: this.error
        });
      } finally {
        this.isSending = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    },

    // History methods
    async fetchHistory() {
      this.historyLoading = true;
      this.historyError = '';
      
      try {
        const params = new URLSearchParams({
          page: this.historyPagination.currentPage,
          limit: this.historyPagination.itemsPerPage
        });
        
        if (this.assessmentTypeFilter) {
          params.append('assessment_type', this.assessmentTypeFilter);
        }
        
        const response = await fetch(`/api/individual-assessments/history?${params}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
        
        if (!response.ok) {
          throw new Error('Failed to fetch assessment history');
        }
        
        const data = await response.json();
        this.assessmentHistory = data.assessments;
        this.historyPagination = {
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          itemsPerPage: data.pagination.itemsPerPage
        };
      } catch (error) {
        console.error('Error fetching history:', error);
        this.historyError = 'Failed to load assessment history. Please try again.';
      } finally {
        this.historyLoading = false;
      }
    },

    formatDateShort(dateString) {
       if (!dateString) return '';
       const date = new Date(dateString);
       return date.toLocaleDateString();
     },

     getCompletionColor(completion) {
       if (completion >= 80) return '#10b981';
       if (completion >= 50) return '#f59e0b';
       return '#ef4444';
     },

     viewAssessment(assessment) {
       // Implement view assessment details
       console.log('View assessment:', assessment);
     },

     filterAssessments() {
       // This method will be called when search query changes
       // The actual filtering is handled by the computed property
     },

    changePage(page) {
      if (page >= 1 && page <= this.historyPagination.totalPages) {
        this.historyPagination.currentPage = page;
        this.fetchHistory();
      }
    },

    async cancelAssessment(assessmentId) {
      if (!confirm('Are you sure you want to cancel this assessment?')) {
        return;
      }
      
      this.cancellingAssessment = assessmentId;
      
      try {
        const response = await fetch(`/api/individual-assessments/${assessmentId}/cancel`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
        
        if (!response.ok) {
          throw new Error('Failed to cancel assessment');
        }
        
        // Refresh the history to show updated status
        await this.fetchHistory();
        
        this.$toast.success('Assessment cancelled successfully');
      } catch (error) {
        console.error('Error cancelling assessment:', error);
        this.$toast.error('Failed to cancel assessment. Please try again.');
      } finally {
        this.cancellingAssessment = null;
      }
    },

    formatStatus(status) {
      const statusMap = {
        'pending': 'Pending',
        'sent': 'Sent',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      };
      return statusMap[status] || status;
    },

    formatAssignmentStatus(status) {
      const statusMap = {
        'not_started': 'Not Started',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'overdue': 'Overdue'
      };
      return statusMap[status] || status;
    },

    // Load current academic period from backend API
    async loadCurrentAcademicPeriod() {
      try {
        const response = await fetch('/api/academic-settings/current');
        
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
    }
  },
  computed: {
    filteredAssessments() {
      let filtered = [...this.assessmentHistory];
      
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(assessment => 
          assessment.assessmentName?.toLowerCase().includes(query) ||
          assessment.targetStudent?.name?.toLowerCase().includes(query) ||
          assessment.targetStudent?.idNumber?.toLowerCase().includes(query) ||
          assessment.targetStudent?.college?.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    }
  },
  async mounted() {
    // Load current academic period when component mounts
    await this.loadCurrentAcademicPeriod();
  },
    watch: {
      currentView(newView) {
        if (newView === 'history') {
          this.fetchHistory();
        }
      }
    },
    beforeDestroy() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
    }
}
</script>

<style scoped>
.individual-assessment-container {
  background-color: var(--gray);
  padding: 20px;
  width: 100%;
  min-height: 100vh;
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
  background-color: transparent;
  padding: 0;
  margin-bottom: 0;
  animation: fadeIn 0.3s ease-in-out;
  width: 100%;
}

.form-section {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 30px;
  margin-bottom: 25px;
  border: 1px solid #e5e7eb;
}

.history-section {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 40px;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;
}

/* Assessment History Container */
.assessment-history-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.history-header {
  background: linear-gradient(135deg, #00B3B0 0%, #00A3A0 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.header-title {
  flex: 1;
  min-width: 250px;
}

.header-title i {
  font-size: 1.2rem;
  margin-right: 8px;
}

.header-title h2 {
  margin: 0 0 5px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-title p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.search-container {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-dropdown {
  position: relative;
}

.assessment-type-filter {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.assessment-type-filter:focus {
  outline: none;
  border-color: #00B3B0;
}

.assessment-type-filter option {
  background: white;
  color: black;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: rgba(255, 255, 255, 0.7);
  z-index: 1;
}

.search-box input {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px 8px 35px;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-box input:focus {
  outline: none;
  border-color: #00B3B0;
}

/* Loading Indicator Styles - Apply to all screen sizes */
.loading-container {
  display: flex; /* Use flexbox for centering */
  flex-direction: column; /* Stack spinner and text vertically */
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  min-height: 200px; /* Ensure enough height for visibility */
  padding: 80px 20px;
  color: #666;
  margin-top: 50px;
}

.loading-spinner {
  font-size: 5rem; /* Further increased font size */
  color: #00B3B0;
  margin-bottom: 25px; /* Further increased margin */
}

.loading-container .loading-text {
  font-size: 22px; /* Further increased font size */
  font-weight: bold; /* Make text bold */
  margin: 0 !important; /* Override default p tag margins */
  color: #777;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state i {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 15px;
}

.empty-state h4 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.empty-state p {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* History Table */
.history-table-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  background-color: #f9f9f9;
  padding: 12px 15px;
  font-weight: 600;
  text-align: left;
  color: #333;
  border-bottom: 1px solid #eee;
}

.history-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
}

.assessment-row:hover {
  background-color: #f9f9f9;
}

.assessment-row:last-child td {
  border-bottom: none;
}

.completion-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex-grow: 1;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

.completion-percent {
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.completion-ratio {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.status-text {
  font-weight: 500;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-text.completed {
  color: #10b981;
  background-color: #ecfdf5;
}

.status-text.not-completed {
  color: #ef4444;
  background-color: #fef2f2;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  padding: 20px;
}

.pagination-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.pagination-button:hover:not(:disabled) {
  background: #0056b3;
}

.pagination-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.pagination-info {
  font-weight: bold;
  color: #333;
}

/* Responsive Design */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .search-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .assessment-type-filter,
  .search-box input {
    min-width: 100%;
  }
  
  .history-table th,
  .history-table td {
    padding: 10px 12px;
    font-size: 12px;
  }
  
  .completion-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .progress-bar {
    width: 100%;
  }
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

.header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.header h2 {
  color: var(--dark);
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 600;
}

.header p {
  color: var(--text-light);
  font-size: 16px;
  margin: 0;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: var(--dark);
  font-size: 15px;
}

label i {
  margin-right: 8px;
  color: var(--primary);
}

.search-label,
.selected-label,
.schedule-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  font-size: 16px;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #00b3b0;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  margin-top: 8px;
  background-color: white;
  box-shadow: var(--shadow);
}

.student-result {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-result:hover {
  background-color: #f8f9fa;
  border-left: 3px solid var(--primary);
}

.student-result:last-child {
  border-bottom: none;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-info strong {
  color: var(--dark);
  font-weight: 600;
  font-size: 15px;
}

.student-details {
  color: var(--text-light);
  font-size: 13px;
}

.student-id {
  color: var(--text-light);
  font-size: 12px;
  font-weight: 500;
  background-color: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.no-results,
.searching {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.selected-students-container {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9fafb;
}

.selected-student-item {
  margin-bottom: 16px;
}

.selected-student-item:last-child {
  margin-bottom: 0;
}

.student-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: box-shadow 0.2s;
}

.student-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.student-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.student-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.student-details p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.selected-students {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: var(--border-radius);
  border: 1px solid #e0e0e0;
  min-height: 60px;
}

.selected-student {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: white;
  padding: 10px 15px;
  border-radius: 25px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.selected-student:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.student-name {
  color: var(--dark);
  font-weight: 500;
}

.remove-button {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-button:hover {
  background-color: #dc3545;
  color: white;
  transform: scale(1.1);
}

.selected-count {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-weight: 600;
  color: #374151;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius);
  transition: all 0.2s;
  margin-bottom: 8px;
}

.checkbox-label:hover {
  background-color: #f9fafb;
  border-color: var(--primary);
}

.checkbox-label input[type="radio"],
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
  color: var(--text);
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.schedule-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-label i {
  color: var(--primary);
}

.date-selector {
  margin-top: 15px;
  padding-left: 26px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background-color: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.message-note {
  margin-top: 8px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: var(--border-radius);
  font-size: 13px;
  color: #0369a1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.primary-button,
.secondary-button {
  padding: 12px 24px;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.primary-button {
  background: var(--primary);
  color: white;
  border: none;
}

.primary-button:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.primary-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.secondary-button {
  background: #f8f9fa;
  color: var(--text);
  border: 1px solid #e0e0e0;
}

.secondary-button:hover:not(:disabled) {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.secondary-button:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* Modal Styles */
.modal {
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #111827;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.close-button:hover {
  color: #374151;
}

.modal-body {
  padding: 30px;
}

.preview-item {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-weight: 600;
  color: #374151;
}

.preview-value {
  color: #6b7280;
}

.preview-students {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-student {
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.sending-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sending-indicator i {
  font-size: 14px;
}

/* Modal Overlay for Sending Assessment */
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
}

/* Sending Assessment Loading Modal Styles */
.sending-loading-modal {
  max-width: 400px;
  text-align: center;
}

.sending-loading-modal .modal-body {
  padding: 60px 30px;
  background-color: #fff;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content,
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
  width: 100%;
}

.spinner-container {
  margin-bottom: 10px;
}

.loading-spinner {
  font-size: 3rem;
  color: #00b3b0;
  animation: spin 1s linear infinite;
}

.success-icon-container {
  margin-bottom: 10px;
}

.success-icon {
  font-size: 3rem;
  color: #4CAF50;
  animation: successPulse 0.6s ease-out;
}

.sending-loading-modal h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #374151;
  font-weight: 600;
}

.sending-loading-modal p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes successPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Duplication Error Modal Styles */
.duplication-error-modal {
  max-width: 500px;
  width: 90%;
}

.duplication-error-modal .modal-header {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-bottom: 1px solid #fca5a5;
}

.duplication-error-modal .modal-header h3 {
  color: #dc2626;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.duplication-error-modal .modal-header i {
  color: #dc2626;
  font-size: 1.2rem;
}

.duplication-error-modal .error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.duplication-error-modal .error-message p {
  margin: 0;
  color: #dc2626;
  font-size: 1rem;
  line-height: 1.5;
}

.duplication-error-modal .help-text {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.duplication-error-modal .help-text p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.duplication-error-modal .help-text i {
  color: #3b82f6;
  margin-top: 2px;
  flex-shrink: 0;
}

.duplication-error-modal .modal-footer {
  justify-content: center;
}

.duplication-error-modal .primary-button {
  min-width: 120px;
}
</style>