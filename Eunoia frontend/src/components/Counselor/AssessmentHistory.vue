<template>
  <div class="assessment-history-container">
    <div class="history-header">
      <div class="header-title">
        <i class="fas fa-history"></i>
        <h2>Assessment History</h2>
        <p>View and manage past assessment distributions</p>
      </div>
      <div class="search-container">
        <div class="filter-dropdown">
          <select v-model="assessmentTypeFilter" @change="onAssessmentTypeChange" class="assessment-type-filter">
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
    <div v-if="isLoading" class="loading-container">
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
            <th>Target Group</th>
            <th>Date</th>
            <th>Recipients</th>
            <th>Completion</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(assessment, index) in filteredAssessments" :key="index" 
              class="assessment-row">
            <td>{{ assessment.name }}</td>
            <td>{{ assessment.targetGroup }}</td>
            <td>{{ assessment.date }}</td>
            <td>{{ assessment.recipients }}</td>
            <td>
              <span class="completion-ratio">{{ assessment.totalCompleted }}/{{ assessment.recipients }}</span>
            </td>
            <td>
              <div class="actions-container">
                <button class="action-button view-button" @click="viewAssessment(assessment)">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination Controls -->
      <div v-if="pagination.totalPages > 1" class="pagination-container">
        <div class="pagination">
          <button 
            @click="previousPage()"
            :disabled="pagination.currentPage === 1"
            class="pagination-button"
          >
            <i class="fas fa-chevron-left"></i> Previous
          </button>
          
          <span class="pagination-info">
            Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
            ({{ pagination.totalItems }} total items)
          </span>
          
          <button 
            @click="nextPage()"
            :disabled="pagination.currentPage === pagination.totalPages"
            class="pagination-button"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Assessment Details Modal -->
    <div class="modal" v-if="showDetailsModal" @click.self="showDetailsModal = false">
      <div class="modal-content details-modal">
        <div class="modal-header">
          <h3>Assessment Details</h3>
          <button class="close-button" @click="showDetailsModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="details-subtitle">Viewing details for {{ selectedAssessment.name }}</p>
          
          <div class="details-grid">
            <div class="details-item">
              <div class="details-label">Assessment Name:</div>
              <div class="details-value">{{ selectedAssessment.name }}</div>
            </div>
            
            <div class="details-item">
              <div class="details-label">Date Sent:</div>
              <div class="details-value">{{ selectedAssessment.date }}</div>
            </div>
            
            <div class="details-item full-width">
              <div class="details-label">Target Groups:</div>
              <div class="target-groups-tags">
                <span 
                  v-for="(college, idx) in selectedAssessment.colleges" 
                  :key="college.code"
                  :class="{ 'active': selectedCollege === college.code || (!selectedCollege && idx === 0) }"
                  @click="selectCollege(college.code)">
                  {{ college.name }}
                </span>
              </div>
            </div>
            
            <div class="details-item">
              <div class="details-label">Recipients:</div>
              <div class="details-value">{{ currentDeptData.recipients }} people</div>
            </div>
            
            <div class="details-item">
              <div class="details-label">Completion Rate:</div>
              <div class="details-value">{{ currentDeptData.completion }}%</div>
            </div>
            
            <div class="details-item">
              <div class="details-label">Completed:</div>
              <div class="details-value">{{ currentDeptData.completed }} of {{ currentDeptData.recipients }}</div>
            </div>
            
            <div class="details-item">
              <div class="details-label">Incomplete:</div>
              <div class="details-value">{{ currentDeptData.incomplete }} of {{ currentDeptData.recipients }}</div>
            </div>
            
            <div class="details-item full-width">
              <div class="details-label">Completion Progress</div>
              <div class="progress-container">
                <div class="progress-bar-detailed">
                  <div class="progress-fill-detailed" :style="{ width: currentDeptData.completion + '%' }"></div>
                </div>
                <div class="progress-markers">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="close-btn" @click="showDetailsModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiUrl } from '../../utils/apiUtils.js';

export default {
  name: 'AssessmentHistory',
  data() {
    return {
      // API configuration - uses environment variable for production
      
      searchQuery: '',
      assessmentTypeFilter: '',
      showDetailsModal: false,
      selectedAssessment: {},
      selectedCollege: null,
      // Assessment data - will be populated from backend
      assessments: [],
      filteredAssessments: [],
      // Loading state
      isLoading: false,
      // Pagination data
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      }
    };
  },
  computed: {
    currentDeptData() {
      if (!this.selectedAssessment.id) {
        return { 
          recipients: 0, 
          completion: 0, 
          completed: 0, 
          incomplete: 0 
        };
      }
      
      // If a specific college is selected
      if (this.selectedCollege) {
        const college = this.selectedAssessment.colleges.find(c => c.code === this.selectedCollege);
        if (college) {
          return {
            recipients: college.recipients,
            completion: college.completion,
            completed: college.completed,
            incomplete: college.incomplete
          };
        }
      }
      
      // Default to all colleges (overall data)
      return {
        recipients: this.selectedAssessment.recipients,
        completion: this.selectedAssessment.completion,
        completed: this.selectedAssessment.totalCompleted || 0,
        incomplete: this.selectedAssessment.totalIncomplete || 0
      };
    }
  },
  async created() {
    await this.loadAssessments();
    this.filteredAssessments = [...this.assessments];
  },
  methods: {
    // Load assessment data from backend with pagination
    async loadAssessments() {
      this.isLoading = true;
      try {
        // Build URL with pagination and filter parameters
        const params = new URLSearchParams({
          page: this.pagination.currentPage,
          limit: this.pagination.itemsPerPage
        });
        
        if (this.assessmentTypeFilter) {
          params.append('assessment_type', this.assessmentTypeFilter);
        }
        
        const url = apiUrl(`bulk-assessments/history?${params.toString()}`);
        
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include' // Include session cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform backend data to match frontend expectations
            this.assessments = (data.data || []).map(assessment => ({
              id: assessment.id,
              name: assessment.assessment_name,
              targetGroup: Array.isArray(assessment.target_colleges) 
                ? assessment.target_colleges.join(', ') 
                : assessment.target_colleges || 'All Students',
              date: this.formatDateShort(assessment.created_at),
              recipients: assessment.total_assigned || 0,
              completion: assessment.completion_percentage || 0,
              // Keep original data for details modal
              colleges: Array.isArray(assessment.target_colleges) 
                ? assessment.target_colleges.map(college => ({ 
                    code: college.toLowerCase().replace(/\s+/g, '_'), 
                    name: college,
                    recipients: Math.floor(assessment.total_assigned / assessment.target_colleges.length),
                    completion: assessment.completion_percentage,
                    completed: Math.floor(assessment.total_completed / assessment.target_colleges.length),
                    incomplete: Math.floor((assessment.total_assigned - assessment.total_completed) / assessment.target_colleges.length)
                  })) 
                : [],
              totalCompleted: assessment.total_completed || 0,
              totalIncomplete: (assessment.total_assigned || 0) - (assessment.total_completed || 0)
            }));
            
            // Update pagination info from backend response
            if (data.pagination) {
              this.pagination = {
                currentPage: data.pagination.currentPage,
                totalPages: data.pagination.totalPages,
                totalItems: data.pagination.totalItems,
                itemsPerPage: data.pagination.itemsPerPage
              };
            }
            
            // Update filteredAssessments to reflect the backend filtering
            this.filteredAssessments = [...this.assessments];
          } else {
            console.error('Failed to load assessments:', data.message);
            this.assessments = [];
            this.filteredAssessments = [];
          }
        } else {
          console.error('Failed to load assessments from backend');
          this.assessments = [];
          this.filteredAssessments = [];
        }
      } catch (error) {
        console.error('Error loading assessments:', error);
        this.assessments = [];
        this.filteredAssessments = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    filterAssessments() {
      if (!this.searchQuery) {
        this.filteredAssessments = [...this.assessments];
      } else {
        const query = this.searchQuery.toLowerCase();
        this.filteredAssessments = this.assessments.filter(assessment => {
          return assessment.name.toLowerCase().includes(query) ||
                 assessment.targetGroup.toLowerCase().includes(query) ||
                 assessment.date.includes(query);
        });
      }
    },
    
    // Pagination methods
    changePage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.currentPage = page;
        this.loadAssessments();
      }
    },
    
    previousPage() {
      if (this.pagination.currentPage > 1) {
        this.changePage(this.pagination.currentPage - 1);
      }
    },
    
    nextPage() {
      if (this.pagination.currentPage < this.pagination.totalPages) {
        this.changePage(this.pagination.currentPage + 1);
      }
    },
    
    // Handle assessment type filter changes
    onAssessmentTypeChange() {
      this.pagination.currentPage = 1; // Reset to first page
      this.loadAssessments();
    },
    getCompletionColor(completion) {
      if (completion >= 90) return '#4CAF50';  // Green
      if (completion >= 75) return '#00B3B0';  // Primary color
      if (completion >= 50) return '#FFC107';  // Amber
      return '#F44336';  // Red
    },
    viewAssessment(assessment) {
      this.selectedAssessment = { ...assessment };
      this.selectedCollege = null; // Reset to show overall data initially
      this.showDetailsModal = true;
    },
    selectCollege(collegeCode) {
      this.selectedCollege = collegeCode;
    },
    
    // Format date to DD-MM-YYYY
    formatDateShort(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }
};
</script>

<style scoped>
.assessment-history-container {
  background-color: #f5f5f5;
  padding: 20px;
  min-height: 100%;
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
  margin-bottom: 20px;
  border-radius: 8px 8px 0 0;
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
  border-color: rgba(255, 255, 255, 0.5);
}

.assessment-type-filter option {
  background-color: white;
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
  border-color: rgba(255, 255, 255, 0.5);
}

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

.actions-container {
  display: flex;
  justify-content: center;
}

.action-button {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: #555;
}

.view-button:hover {
  background-color: #f0f0f0;
  color: #00B3B0;
}

/* Modal styles */
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
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  text-align: right;
}

.close-btn {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.close-btn:hover {
  background-color: #eee;
}

/* Assessment Details Specific Styles */
.details-subtitle {
  color: #666;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 14px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.details-item {
  margin-bottom: 5px;
}

.full-width {
  grid-column: 1 / -1;
}

.details-label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
}

.details-value {
  color: #333;
  font-size: 15px;
}

.target-groups-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.dept-tag {
  background-color: #2c3e50;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dept-tag:hover {
  opacity: 0.9;
}

.dept-tag.active {
  background-color: #00B3B0;
}

.progress-container {
  margin-top: 10px;
}

.progress-bar-detailed {
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill-detailed {
  height: 100%;
  background-color: #00B3B0;
  border-radius: 5px;
}

.progress-markers {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #777;
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

/* Pagination Styles */
.pagination-container {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.pagination-button {
  background-color: #00B3B0;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-button:hover:not(:disabled) {
  background-color: #009a97;
}

.pagination-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  text-align: center;
}

@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .search-container {
    width: 100%;
  }

  .history-table {
    display: block;
    overflow-x: auto;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>