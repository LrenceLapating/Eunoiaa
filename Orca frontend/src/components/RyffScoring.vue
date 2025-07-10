<template>
  <div class="ryff-scoring-container">
    <div class="scoring-header">
      <div class="header-title">
        <i class="fas fa-calculator"></i>
        <h2>Ryff Scale Automated Scoring</h2>
        <p>View automatically scored assessments and monitor student well-being</p>
      </div>
    </div>

    <!-- View Selection Tabs -->
    <div class="view-tabs">
      <div class="tab-option" :class="{ 'active': currentView === 'student' }" @click="currentView = 'student'">
        <div class="radio-circle">
          <div class="radio-inner" v-if="currentView === 'student'"></div>
        </div>
        <span>Student View</span>
      </div>
      <div class="tab-option" :class="{ 'active': currentView === 'department' }" @click="currentView = 'department'">
        <div class="radio-circle">
          <div class="radio-inner" v-if="currentView === 'department'"></div>
        </div>
        <span>Department Summary</span>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="filters-row">
      <div class="search-container">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search by name, ID, or section..." v-model="searchQuery" @input="filterStudents">
      </div>
      
      <div class="filter-dropdowns">
        <div class="filter-dropdown">
          <select v-model="departmentFilter">
            <option value="all">All Departments</option>
            <option value="CCS">CCS</option>
            <option value="CN">CN</option>
            <option value="CBA">CBA</option>
            <option value="COE">COE</option>
            <option value="CAS">CAS</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
        
        <div class="filter-dropdown">
          <select v-model="sectionFilter">
            <option value="all">All Sections</option>
            <option value="BSIT1A">BSIT1A</option>
            <option value="BSCS3A">BSCS3A</option>
            <option value="BSIT3A">BSIT3A</option>
            <option value="BSIT2B">BSIT2B</option>
            <option value="BSCS2B">BSCS2B</option>
            <option value="BSCS1A">BSCS1A</option>
            <option value="BSCS2A">BSCS2A</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
        
        <div class="filter-dropdown">
          <select v-model="riskLevelFilter">
            <option value="all">All Levels</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Low Risk">Low Risk</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>
    </div>

    <!-- Student Data Table -->
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Department</th>
            <th>Section</th>
            <th class="sortable" @click="sortBy('submissionDate')">
              Submission Date
              <i class="fas fa-sort"></i>
            </th>
            <th class="sortable" @click="sortBy('overallScore')">
              Overall Score
              <i class="fas fa-sort"></i>
            </th>
            <th>Risk Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.id" class="student-row">
            <td>
              <div class="student-info">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-id">{{ student.id }}</span>
              </div>
            </td>
            <td>{{ student.department }}</td>
            <td>{{ student.section }}</td>
            <td>{{ student.submissionDate }}</td>
            <td>
              <span class="score">{{ student.overallScore }}</span>
            </td>
            <td>
              <span class="risk-badge" :class="getRiskClass(student.riskLevel)">
                {{ student.riskLevel }}
              </span>
            </td>
            <td>
              <button class="view-button" @click="viewStudentDetails(student)">
                <i class="fas fa-eye"></i> View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Student Details Modal -->
    <div class="modal" v-if="showDetailsModal" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Student Assessment Details</h3>
          <button class="close-button" @click="showDetailsModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedStudent">
          <div class="student-details-header">
            <div class="student-profile">
              <h4>{{ selectedStudent.name }}</h4>
              <p>{{ selectedStudent.id }} • {{ selectedStudent.department }} • {{ selectedStudent.section }}</p>
            </div>
            <div class="assessment-info">
              <div class="info-item">
                <span class="info-label">Submission Date:</span>
                <span class="info-value">{{ selectedStudent.submissionDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Overall Score:</span>
                <span class="info-value score">{{ selectedStudent.overallScore }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Risk Level:</span>
                <span class="risk-badge" :class="getRiskClass(selectedStudent.riskLevel)">
                  {{ selectedStudent.riskLevel }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="subscale-scores">
            <h4>Subscale Scores</h4>
            <div class="subscale-grid">
              <div class="subscale-item" v-for="(score, subscale) in selectedStudent.subscales" :key="subscale">
                <div class="subscale-header">
                  <span class="subscale-name">{{ formatSubscaleName(subscale) }}</span>
                  <span class="subscale-score">{{ score }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (score/5*100) + '%', backgroundColor: getScoreColor(score) }"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="action-buttons">
            <button class="action-btn print-btn">
              <i class="fas fa-print"></i> Print Report
            </button>
            <button class="action-btn contact-btn">
              <i class="fas fa-envelope"></i> Contact Student
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RyffScoring',
  data() {
    return {
      currentView: 'student',
      searchQuery: '',
      departmentFilter: 'all',
      sectionFilter: 'all',
      riskLevelFilter: 'all',
      sortField: 'submissionDate',
      sortDirection: 'desc',
      showDetailsModal: false,
      selectedStudent: null,
      students: [
        {
          id: 'ST12347',
          name: 'Mike Johnson',
          department: 'CCS',
          section: 'BSIT1A',
          submissionDate: '2024-06-08',
          overallScore: 64,
          riskLevel: 'High Risk',
          subscales: {
            autonomy: 3.2,
            environmentalMastery: 2.8,
            personalGrowth: 3.5,
            positiveRelations: 3.1,
            purposeInLife: 3.4,
            selfAcceptance: 2.9
          }
        },
        {
          id: 'ST12348',
          name: 'Sarah Williams',
          department: 'CCS',
          section: 'BSCS3A',
          submissionDate: '2024-06-07',
          overallScore: 55,
          riskLevel: 'High Risk',
          subscales: {
            autonomy: 2.7,
            environmentalMastery: 2.5,
            personalGrowth: 3.0,
            positiveRelations: 2.8,
            purposeInLife: 2.6,
            selfAcceptance: 2.9
          }
        },
        {
          id: 'ST12353',
          name: 'Kevin Wong',
          department: 'CCS',
          section: 'BSIT3A',
          submissionDate: '2024-06-02',
          overallScore: 50,
          riskLevel: 'High Risk',
          subscales: {
            autonomy: 2.4,
            environmentalMastery: 2.3,
            personalGrowth: 2.9,
            positiveRelations: 2.5,
            purposeInLife: 2.5,
            selfAcceptance: 2.4
          }
        },
        {
          id: 'ST12346',
          name: 'John Doe',
          department: 'CCS',
          section: 'BSIT3A',
          submissionDate: '2024-06-10',
          overallScore: 58,
          riskLevel: 'Medium Risk',
          subscales: {
            autonomy: 3.1,
            environmentalMastery: 2.9,
            personalGrowth: 3.0,
            positiveRelations: 2.7,
            purposeInLife: 3.2,
            selfAcceptance: 2.9
          }
        },
        {
          id: 'ST12344',
          name: 'Jane Smith',
          department: 'CCS',
          section: 'BSCS2B',
          submissionDate: '2024-06-09',
          overallScore: 67,
          riskLevel: 'Medium Risk',
          subscales: {
            autonomy: 3.5,
            environmentalMastery: 3.3,
            personalGrowth: 3.2,
            positiveRelations: 3.4,
            purposeInLife: 3.4,
            selfAcceptance: 3.2
          }
        },
        {
          id: 'ST12351',
          name: 'Robert Brown',
          department: 'COE',
          section: 'BSCE3B',
          submissionDate: '2024-06-04',
          overallScore: 68,
          riskLevel: 'Medium Risk',
          subscales: {
            autonomy: 3.4,
            environmentalMastery: 3.5,
            personalGrowth: 3.4,
            positiveRelations: 3.3,
            purposeInLife: 3.5,
            selfAcceptance: 3.4
          }
        },
        {
          id: 'ST12355',
          name: 'Sophia Garcia',
          department: 'CAS',
          section: 'BSPS2B',
          submissionDate: '2024-06-03',
          overallScore: 67,
          riskLevel: 'Medium Risk',
          subscales: {
            autonomy: 3.3,
            environmentalMastery: 3.4,
            personalGrowth: 3.3,
            positiveRelations: 3.4,
            purposeInLife: 3.2,
            selfAcceptance: 3.4
          }
        },
        {
          id: 'ST12356',
          name: 'Alex Thompson',
          department: 'CBA',
          section: 'BSBA3A',
          submissionDate: '2024-06-02',
          overallScore: 65,
          riskLevel: 'Medium Risk',
          subscales: {
            autonomy: 3.3,
            environmentalMastery: 3.2,
            personalGrowth: 3.2,
            positiveRelations: 3.4,
            purposeInLife: 3.3,
            selfAcceptance: 3.1
          }
        },
        {
          id: 'ST12354',
          name: 'Jessica Martin',
          department: 'CN',
          section: 'BSCS2B',
          submissionDate: '2024-06-01',
          overallScore: 69,
          riskLevel: 'Medium Risk',
          subscales: {
            autonomy: 3.5,
            environmentalMastery: 3.4,
            personalGrowth: 3.5,
            positiveRelations: 3.4,
            purposeInLife: 3.6,
            selfAcceptance: 3.5
          }
        },
        {
          id: 'ST12349',
          name: 'David Lee',
          department: 'CCS',
          section: 'BSIT2B',
          submissionDate: '2024-06-06',
          overallScore: 76,
          riskLevel: 'Low Risk',
          subscales: {
            autonomy: 3.8,
            environmentalMastery: 3.9,
            personalGrowth: 3.7,
            positiveRelations: 3.8,
            purposeInLife: 3.8,
            selfAcceptance: 3.8
          }
        },
        {
          id: 'ST12350',
          name: 'Emily Chen',
          department: 'CCS',
          section: 'BSCS1A',
          submissionDate: '2024-06-05',
          overallScore: 71,
          riskLevel: 'Low Risk',
          subscales: {
            autonomy: 3.6,
            environmentalMastery: 3.5,
            personalGrowth: 3.6,
            positiveRelations: 3.5,
            purposeInLife: 3.6,
            selfAcceptance: 3.7
          }
        },
        {
          id: 'ST12352',
          name: 'Lisa Rodriguez',
          department: 'COE',
          section: 'BSCE2A',
          submissionDate: '2024-06-03',
          overallScore: 80,
          riskLevel: 'Low Risk',
          subscales: {
            autonomy: 4.0,
            environmentalMastery: 4.1,
            personalGrowth: 3.9,
            positiveRelations: 4.0,
            purposeInLife: 4.1,
            selfAcceptance: 3.9
          }
        }
      ],
      filteredStudents: []
    };
  },
  created() {
    this.filterStudents();
  },
  methods: {
    filterStudents() {
      let result = [...this.students];
      
      // Apply department filter
      if (this.departmentFilter !== 'all') {
        result = result.filter(student => student.department === this.departmentFilter);
      }
      
      // Apply section filter
      if (this.sectionFilter !== 'all') {
        result = result.filter(student => student.section === this.sectionFilter);
      }
      
      // Apply risk level filter
      if (this.riskLevelFilter !== 'all') {
        result = result.filter(student => student.riskLevel === this.riskLevelFilter);
      }
      
      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(student => 
          student.name.toLowerCase().includes(query) || 
          student.id.toLowerCase().includes(query) || 
          student.section.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      result.sort((a, b) => {
        let comparison = 0;
        
        if (this.sortField === 'overallScore') {
          comparison = a.overallScore - b.overallScore;
        } else if (this.sortField === 'submissionDate') {
          comparison = new Date(a.submissionDate) - new Date(b.submissionDate);
        }
        
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
      
      this.filteredStudents = result;
    },
    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'desc';
      }
      this.filterStudents();
    },
    getRiskClass(riskLevel) {
      if (riskLevel === 'High Risk') return 'high-risk';
      if (riskLevel === 'Medium Risk') return 'medium-risk';
      return 'low-risk';
    },
    getScoreColor(score) {
      if (score < 3.0) return '#f44336';  // Red for low scores
      if (score < 3.5) return '#ff9800';  // Orange for medium scores
      return '#4caf50';  // Green for high scores
    },
    formatSubscaleName(subscale) {
      const formatted = subscale.replace(/([A-Z])/g, ' $1').trim();
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    viewStudentDetails(student) {
      this.selectedStudent = student;
      this.showDetailsModal = true;
    }
  },
  watch: {
    departmentFilter() {
      this.filterStudents();
    },
    sectionFilter() {
      this.filterStudents();
    },
    riskLevelFilter() {
      this.filterStudents();
    }
  }
};
</script>

<style scoped>
.ryff-scoring-container {
  background-color: #f5f5f5;
  padding: 20px;
}

.scoring-header {
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

/* View Tabs */
.view-tabs {
  display: flex;
  margin-bottom: 20px;
}

.tab-option {
  display: flex;
  align-items: center;
  margin-right: 30px;
  cursor: pointer;
  user-select: none;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #ccc;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-option.active .radio-circle {
  border-color: #00B3B0;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00B3B0;
}

.tab-option span {
  font-size: 14px;
  color: #555;
}

.tab-option.active span {
  font-weight: 500;
  color: #333;
}

/* Filters Row */
.filters-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-container input {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-dropdowns {
  display: flex;
  gap: 10px;
}

.filter-dropdown {
  position: relative;
}

.filter-dropdown select {
  appearance: none;
  padding: 10px 35px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
}

.filter-dropdown i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Data Table */
.data-table-container {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f9f9f9;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.data-table th.sortable {
  cursor: pointer;
}

.data-table th.sortable:hover {
  background-color: #f0f0f0;
}

.data-table th i {
  margin-left: 5px;
  font-size: 12px;
  color: #999;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #444;
}

.student-row:hover {
  background-color: #f9f9f9;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 500;
  color: #333;
}

.student-id {
  font-size: 12px;
  color: #777;
  margin-top: 3px;
}

.score {
  font-weight: 500;
  color: #333;
}

.risk-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.risk-badge.high-risk {
  background-color: #ffebee;
  color: #f44336;
}

.risk-badge.medium-risk {
  background-color: #e3f2fd;
  color: #2196f3;
}

.risk-badge.low-risk {
  background-color: #e8f5e9;
  color: #4caf50;
}

.view-button {
  background-color: transparent;
  border: 1px solid #ddd;
  color: #555;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.view-button:hover {
  background-color: #f0f0f0;
  border-color: #ccc;
}

.view-button i {
  font-size: 12px;
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
  border-radius: 6px;
  width: 700px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #777;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.student-details-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
}

.student-profile h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
}

.student-profile p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.assessment-info {
  text-align: right;
}

.info-item {
  margin-bottom: 5px;
}

.info-label {
  font-weight: 500;
  color: #555;
  margin-right: 5px;
}

.info-value {
  color: #333;
}

.subscale-scores h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.subscale-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.subscale-item {
  margin-bottom: 10px;
}

.subscale-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.subscale-name {
  font-size: 14px;
  color: #555;
}

.subscale-score {
  font-weight: 500;
  color: #333;
}

.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 30px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.print-btn:hover {
  background-color: #e0e0e0;
}

.contact-btn {
  background-color: #00B3B0;
  color: white;
  border: none;
}

.contact-btn:hover {
  background-color: #009e9b;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-container {
    width: 100%;
  }
  
  .filter-dropdowns {
    width: 100%;
  }
  
  .filter-dropdown select {
    width: 100%;
  }
  
  .student-details-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .assessment-info {
    text-align: left;
  }
  
  .subscale-grid {
    grid-template-columns: 1fr;
  }
}
</style> 