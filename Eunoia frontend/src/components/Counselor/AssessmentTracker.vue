<template>
  <div class="assessment-tracker">
    <!-- Header -->
    <div class="tracker-header">
     
    </div>

    <!-- Filters and Controls -->
    <div class="tracker-controls">
      <div class="filters-row">
        <!-- Search -->
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search by student name or ID..."
            class="search-input"
          >
        </div>

        <!-- College Filter -->
        <div class="filter-group">
          <label>College:</label>
          <select v-model="selectedCollege" class="filter-select">
            <option value="all">All Colleges</option>
            <option v-for="college in colleges" :key="college" :value="college">
              {{ college }}
            </option>
          </select>
        </div>

        <!-- Course Filter -->
        <div class="filter-group">
          <label>Course:</label>
          <select v-model="selectedCourse" class="filter-select" :disabled="selectedCollege === 'all'">
            <option value="all">All Courses</option>
            <option v-for="course in availableCourses" :key="course" :value="course">
              {{ course }}
            </option>
          </select>
        </div>

        <!-- Section Filter -->
        <div class="filter-group">
          <label>Section:</label>
          <select v-model="selectedSection" class="filter-select" :disabled="selectedCourse === 'all'">
            <option value="all">All Sections</option>
            <option v-for="section in availableSections" :key="section" :value="section">
              {{ section }}
            </option>
          </select>
        </div>

        <!-- Assessment Type Filter -->
        <div class="filter-group">
          <label>Assessment Type:</label>
          <select v-model="selectedAssessmentType" class="filter-select">
            <option value="all">All Types</option>
            <option value="ryff_42">42 item</option>
            <option value="ryff_84">84 item</option>
          </select>
        </div>



        <!-- Refresh Button -->
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>

      <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card incomplete-card">
            <div class="stat-number">{{ totalCount }}</div>
            <div class="stat-label">Incomplete Assessments</div>
          </div>
        </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading assessment data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="refreshData" class="retry-btn">Try Again</button>
    </div>

    <!-- Students List -->
    <div v-else class="students-list">
      <div v-if="filteredStudents.length === 0" class="empty-state">
        <i class="fas fa-check-circle"></i>
        <h3>All Caught Up!</h3>
        <p>No incomplete assessments found with current filters.</p>
      </div>

      <div v-else class="students-table">
        <div class="table-header">
          <div class="header-cell student-col">Student Name</div>
          <div class="header-cell college-col">College</div>
          <div class="header-cell course-col">Course</div>
          <div class="header-cell section-col">Section</div>
          <div class="header-cell assessment-col">Assessment</div>
          <div class="header-cell days-col">Days Pending</div>
        </div>

        <div 
          v-for="student in paginatedStudents" 
          :key="student.assignment_id"
          class="table-row"
          :class="{ 'urgent-row': student.days_pending >= 7 }"
        >
          <div class="table-cell student-col">
            <div class="student-name">{{ student.student_name }}</div>
          </div>
          
          <div class="table-cell college-col">
            <span class="college-badge">{{ student.college }}</span>
          </div>
          
          <div class="table-cell course-col">
            <span class="course-text">{{ student.course }}</span>
          </div>
          
          <div class="table-cell section-col">
            <span class="section-text">{{ student.section }}</span>
          </div>
          
          <div class="table-cell assessment-col">
            <span class="assessment-badge">{{ student.assessment }}-Item</span>
          </div>
          
          <div class="table-cell days-col">
            <span class="days-badge" :class="getDaysClass(student.days_pending)">
              {{ student.days_pending }} day{{ student.days_pending !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = 1" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ totalCount }} total)
        </div>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button 
          @click="currentPage = totalPages" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { apiUrl } from '../../utils/apiUtils'

export default {
  name: 'AssessmentTracker',
  data() {
    return {
      students: [],
      colleges: [],
      courses: [],
      sections: [],
      loading: false,
      error: null,
      searchQuery: '',
      selectedCollege: 'all',
      selectedCourse: 'all',
      selectedSection: 'all',
      selectedAssessmentType: 'all',

      // Server-side pagination
      currentPage: 1,
      itemsPerPage: 20,
      totalPages: 1,
      totalCount: 0,
      refreshInterval: null
    }
  },
  computed: {
    // Remove client-side filtering since we'll use server-side pagination
    filteredStudents() {
      return this.students
    },
    
    // Pagination computed properties
    paginatedStudents() {
      return this.students
    },
    
    totalPages() {
      return this.totalPages || 1
    },

    availableCourses() {
      if (this.selectedCollege === 'all') return []
      const coursesForCollege = this.students
        .filter(student => student.college === this.selectedCollege)
        .map(student => student.course)
        .filter(course => course && course !== 'N/A')
      return [...new Set(coursesForCollege)].sort()
    },

    availableSections() {
      if (this.selectedCourse === 'all') return []
      const sectionsForCourse = this.students
        .filter(student => 
          student.college === this.selectedCollege && 
          student.course === this.selectedCourse
        )
        .map(student => student.section)
        .filter(section => section && section !== 'N/A')
      return [...new Set(sectionsForCourse)].sort()
    }

  },
  watch: {
    // Reset to first page and reload data when filters change
    searchQuery() { 
      this.currentPage = 1
      this.loadData()
    },
    selectedCollege() { 
      this.currentPage = 1
      // Reset dependent filters when college changes
      this.selectedCourse = 'all'
      this.selectedSection = 'all'
      this.loadData()
    },
    selectedCourse() { 
      this.currentPage = 1
      // Reset section when course changes
      this.selectedSection = 'all'
      this.loadData()
    },
    selectedSection() { 
      this.currentPage = 1
      this.loadData()
    },
    selectedAssessmentType() { 
      this.currentPage = 1
      this.loadData()
    },
    currentPage() {
      this.loadData()
    }
  },
  async mounted() {
    await this.loadData()
    // Set up auto-refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadData(false) // Silent refresh
    }, 5 * 60 * 1000)
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },
  methods: {
    async loadData(showLoading = true) {
      if (showLoading) {
        this.loading = true
      }
      this.error = null

      try {
        // Performance safeguard: Add request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn('⚠️ Request taking too long, aborting...');
        }, 30000); // 30 second timeout

        // Build query parameters for server-side filtering and pagination
        const params = new URLSearchParams({
          page: this.currentPage.toString(),
          limit: this.itemsPerPage.toString()
        })

        // Add filters if they're not 'all'
        if (this.selectedCollege !== 'all') {
          params.append('college', this.selectedCollege)
        }
        if (this.selectedCourse !== 'all') {
          params.append('course', this.selectedCourse)
        }
        if (this.selectedSection !== 'all') {
          params.append('section', this.selectedSection)
        }
        if (this.selectedAssessmentType !== 'all') {
          params.append('assessment_type', this.selectedAssessmentType)
        }
        if (this.searchQuery.trim()) {
          params.append('search', this.searchQuery.trim())
        }

        const response = await fetch(apiUrl(`assessment-tracker/incomplete?${params.toString()}`), {
          credentials: 'include',
          signal: controller.signal
        })

        // Clear timeout since request completed
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`)
        }

        const data = await response.json()
        
        // Performance safeguard: Check for large datasets
        if (data.pagination?.totalCount > 5000) {
          console.warn(`⚠️ Large dataset: ${data.pagination.totalCount} total records. Consider adding filters.`)
        }
        
        // Update data with server response
        this.students = data.data || []
        this.totalCount = data.pagination?.totalCount || 0
        this.totalPages = data.pagination?.totalPages || 1
        
        // Update colleges list for filter dropdown (only on first load)
        if (this.currentPage === 1 && this.selectedCollege === 'all') {
          this.colleges = [...new Set(this.students.map(s => s.college))].sort()
        }

      } catch (error) {
        console.error('Error loading assessment tracker data:', error)
        
        // Handle different error types
        if (error.name === 'AbortError') {
          this.error = 'Request timed out. Please try again or add more filters to reduce data size.'
        } else {
          this.error = error.message || 'Failed to load assessment data'
        }
        
        // Reset data on error
        this.students = []
        this.totalCount = 0
        this.totalPages = 1
      } finally {
        this.loading = false
      }
    },
    async refreshData() {
      await this.loadData(true)
    },
    async sendReminder(student) {
      student.sending_reminder = true
      
      try {
        const response = await fetch(apiUrl('assessment-tracker/send-reminder'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            student_id: student.student_id,
            assignment_id: student.assignment_id
          })
        })

        if (!response.ok) {
          throw new Error('Failed to send reminder')
        }

        // Show success message
        this.$emit('show-toast', {
          type: 'success',
          message: `Reminder sent to ${student.student_name}`
        })

      } catch (error) {
        console.error('Error sending reminder:', error)
        this.$emit('show-toast', {
          type: 'error',
          message: `Failed to send reminder to ${student.student_name}`
        })
      } finally {
        student.sending_reminder = false
      }
    },
    viewStudentDetail(student) {
      // Emit event to parent to show student details
      this.$emit('view-student-detail', student)
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    getDaysClass(days) {
      if (days >= 7) return 'urgent'
      if (days >= 3) return 'warning'
      return 'normal'
    },

  }
}
</script>

<style scoped>
.assessment-tracker {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.tracker-header {
  margin-bottom: 30px;
}

.tracker-header h2 {
  color: var(--dark);
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.tracker-description {
  color: var(--text-light);
  font-size: 16px;
  margin: 0;
}

.tracker-controls {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-light);
  text-transform: uppercase;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 140px;
}

.refresh-btn {
  padding: 10px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 16px 20px;
  border-radius: 10px;
  text-align: center;
  min-width: 120px;
}

.stat-card.incomplete-card {
  background: linear-gradient(135deg, #00B3B0 0%, #00A3A0 100%);
}

.stat-card.incomplete-card .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.stat-card.incomplete-card .stat-number {
  color: white;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  font-weight: 500;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state i {
  font-size: 32px;
  color: var(--primary);
  margin-bottom: 16px;
}

.error-state i {
  font-size: 32px;
  color: #e74c3c;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 48px;
  color: var(--success);
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--dark);
  margin-bottom: 8px;
}

.students-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.5fr 1fr 1fr 1fr;
  background: var(--primary);
  color: white;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.header-cell {
  padding: 16px 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.header-cell:last-child {
  border-right: none;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.5fr 1fr 1fr 1fr;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-row.urgent-row {
  border-left: 4px solid #e74c3c;
  background: #fdf2f2;
}

.table-cell {
  padding: 16px 12px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
}

.table-cell:last-child {
  border-right: none;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name {
  font-weight: 500;
  color: var(--dark);
}

.student-id {
  font-size: 12px;
  color: var(--text-light);
}

.college-badge {
  background: var(--accent);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.assessment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assessment-title {
  font-weight: 500;
  color: var(--dark);
  font-size: 14px;
}

.assessment-type {
  font-size: 12px;
  color: var(--text-light);
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assigned-date {
  font-weight: 500;
  color: var(--dark);
  font-size: 14px;
}

.assigned-time {
  font-size: 12px;
  color: var(--text-light);
}

.days-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.days-badge.normal {
  background: #d4edda;
  color: #155724;
}

.days-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.days-badge.urgent {
  background: #f8d7da;
  color: #721c24;
}



.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 12px;
}

.reminder-btn {
  background: var(--primary);
  color: white;
}

.reminder-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.detail-btn {
  background: var(--accent);
  color: white;
}

.detail-btn:hover {
  background: var(--accent-dark);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--text-light);
  margin: 0 16px;
}

.course-text, .section-text {
  font-size: 14px;
  color: var(--text-dark);
  font-weight: 500;
}

.assessment-badge {
  background: var(--accent);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .table-header,
  .table-row {
    grid-template-columns: 2fr 1.2fr 1fr 1fr;
  }
  
  .course-col,
  .section-col {
    display: none;
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .summary-stats {
    justify-content: center;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 2fr 1fr 1fr;
  }
  
  .college-col,
  .course-col,
  .section-col {
    display: none;
  }
}
</style>