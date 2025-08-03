<template>
  <div class="assessment-history-container">
    <div class="history-header">
      <div class="header-title">
        <i class="fas fa-history"></i>
        <h2>Assessment History</h2>
        <p>View and manage past assessment distributions</p>
      </div>
      <div class="search-container">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input type="text" placeholder="Search assessments..." v-model="searchQuery" @input="filterAssessments">
        </div>
      </div>
    </div>

    <div class="history-table-container">
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
              <div class="completion-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: assessment.completion + '%', backgroundColor: getCompletionColor(assessment.completion) }"></div>
                </div>
                <span class="completion-percent">{{ assessment.completion }}%</span>
              </div>
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
export default {
  name: 'AssessmentHistory',
  data() {
    return {
      searchQuery: '',
      showDetailsModal: false,
      selectedAssessment: {},
      selectedCollege: null,
      // Assessment data - will be populated from backend
      assessments: [],
      filteredAssessments: []
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
    // Load assessment data from backend
    async loadAssessments() {
      try {
        // For now, we'll use empty array since there's no backend endpoint yet
        // TODO: Replace with actual API call when backend endpoint is available
        // const response = await fetch('http://localhost:3000/api/assessments/history');
        // if (response.ok) {
        //   const data = await response.json();
        //   this.assessments = data.assessments || [];
        // } else {
        //   console.error('Failed to load assessments from backend');
        //   this.assessments = [];
        // }
        this.assessments = []; // Empty array until backend endpoint is implemented
      } catch (error) {
        console.error('Error loading assessments:', error);
        this.assessments = [];
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
}

.header-title i {
  font-size: 20px;
  margin-right: 10px;
  color: #00B3B0;
}

.header-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 15px 0 0;
}

.header-title p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.search-container {
  width: 300px;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-box input {
  width: 100%;
  padding: 8px 15px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #00B3B0;
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