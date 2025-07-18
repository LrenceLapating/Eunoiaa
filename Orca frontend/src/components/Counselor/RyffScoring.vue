<template>
  <div class="ryff-scoring-container">
    <div class="scoring-header">
      <div class="header-title">
        <i class="fas fa-calculator"></i>
        <h2>Ryff Scale Automated Scoring</h2>
        <p>View automatically scored assessments and monitor student well-being</p>
      </div>
    </div>

    <!-- Risk Filter Indicator -->
    <div class="risk-filter-indicator" v-if="selectedDimension">
      <div class="indicator-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Showing <strong>only</strong> students at risk for <strong>{{ selectedDimension }}</strong> 
          <span v-if="selectedCollege !== 'all'">in <strong>{{ selectedCollege }}</strong></span>
        </span>
        <button class="clear-filter-btn" @click="clearRiskFilters">
          <i class="fas fa-times"></i> Clear Filter
        </button>
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
      <div class="tab-option" :class="{ 'active': currentView === 'college' }" @click="currentView = 'college'">
        <div class="radio-circle">
          <div class="radio-inner" v-if="currentView === 'college'"></div>
        </div>
        <span>College Summary</span>
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
          <select v-model="collegeFilter">
            <option value="all">All Colleges</option>
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
            <option value="BSIT2B">BSIT2BB</option>
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
            <th>College</th>
            <th>Section</th>
            <th class="sortable" @click="sortBy('submissionDate')">
              Submission Date
              <i class="fas fa-sort"></i>
            </th>
            <th class="sortable" @click="sortBy('overallScore')">
              Overall Score
              <i class="fas fa-sort"></i>
            </th>
            <th>Dimension Risk</th>
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
            <td>{{ student.college }}</td>
            <td>{{ student.section }}</td>
            <td>{{ student.submissionDate }}</td>
            <td>
              <span class="score">{{ calculateOverallScore(student) }}</span>
            </td>
            <td>
              <div class="dimension-risk">
                <span class="risk-count" v-if="hasAnyRiskDimension(student)" title="Number of at-risk dimensions">
                  {{ getAtRiskDimensionsCount(student) }}/6
                </span>
                <div class="risk-scores">
                  <div 
                    v-for="(score, subscale) in student.subscales" 
                    :key="subscale"
                    v-if="isAtRisk(score * 7)"
                    class="risk-dimension-container"
                  >
                    <div class="risk-dimension-score">
                      {{ Math.round(score * 7) }}
                      <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                    </div>
                  </div>
                </div>
                <span v-if="!hasAnyRiskDimension(student)" class="no-risk">No Risk</span>
              </div>
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
              <p>{{ selectedStudent.id }} • {{ selectedStudent.college }} • {{ selectedStudent.section }}</p>
            </div>
            <div class="assessment-info">
              <div class="info-item">
                <span class="info-label">Submission Date:</span>
                <span class="info-value">{{ selectedStudent.submissionDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Overall Score:</span>
                <span class="info-value score">{{ calculateOverallScore(selectedStudent) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">At-Risk Dimensions:</span>
                <span v-if="hasAnyRiskDimension(selectedStudent)" class="risk-badge high-risk">
                  {{ getAtRiskDimensionsCount(selectedStudent) }} Dimension(s)
                </span>
                <span v-else class="risk-badge low-risk">None</span>
              </div>
            </div>
          </div>
          
          <div class="subscale-scores">
            <h4>Subscale Scores</h4>
            <div class="subscale-grid">
              <div 
                class="subscale-item" 
                v-for="(score, subscale) in selectedStudent.subscales" 
                :key="subscale"
                :class="{ 'at-risk': isAtRisk(score * 7) }"
              >
                <div class="subscale-header">
                  <span class="subscale-name">{{ formatSubscaleName(subscale) }}</span>
                  <span class="subscale-score">{{ Math.round(score * 7) }}/49</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: (score*7/49*100) + '%', backgroundColor: getDimensionScoreColor(score*7) }"
                  ></div>
                </div>
                <div class="risk-status">
                  <span :class="getDimensionRiskClass(score*7)">
                    {{ getDimensionRiskLabel(score*7) }}
                  </span>
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
  props: {
    selectedDimension: {
      type: String,
      default: null
    },
    selectedCollege: {
      type: String,
      default: 'all'
    }
  },
  data() {
    return {
      currentView: 'student',
      searchQuery: '',
      collegeFilter: 'all',
      sectionFilter: 'all',
      riskLevelFilter: 'all',
      sortField: 'submissionDate',
      sortDirection: 'desc',
      showDetailsModal: false,
      selectedStudent: null,
      // Use the same student data as in the dashboard
      students: [
        {
          id: 'ST12347',
          name: 'Mike Johnson',
          college: 'CCS',
          section: 'BSIT1A',
          submissionDate: '2024-06-08',
          subscales: {
            autonomy: 2.4, // Scaled to 7-49: 17 (at risk)
            environmentalMastery: 5.0, // 35 (definitely not at risk)
            personalGrowth: 3.5, // 25
            positiveRelations: 3.1, // 22
            purposeInLife: 3.4, // 24
            selfAcceptance: 2.9  // 20
          }
        },
        {
          id: 'ST12348',
          name: 'Sarah Williams',
          college: 'CCS',
          section: 'BSCS3A',
          submissionDate: '2024-06-07',
          subscales: {
            autonomy: 2.0, // 14 (at risk)
            environmentalMastery: 5.0, // 35 (definitely not at risk)
            personalGrowth: 3.0, // 21
            positiveRelations: 2.0, // 14 (at risk)
            purposeInLife: 2.6, // 18 (at risk)
            selfAcceptance: 2.9  // 20
          }
        },
        {
          id: 'ST12353',
          name: 'Kevin Wong',
          college: 'CCS',
          section: 'BSIT3A',
          submissionDate: '2024-06-02',
          subscales: {
            autonomy: 2.4, // 17 (at risk)
            environmentalMastery: 2.0, // 14 (definitely at risk) - only this CCS student is at risk for EM
            personalGrowth: 2.9, // 20
            positiveRelations: 2.5, // 18 (at risk)
            purposeInLife: 2.5, // 18 (at risk)
            selfAcceptance: 2.4  // 17 (at risk)
          }
        },
        {
          id: 'ST12351',
          name: 'Robert Brown',
          college: 'COE',
          section: 'BSCE3B',
          submissionDate: '2024-06-04',
          subscales: {
            autonomy: 2.3, // 16 (at risk)
            environmentalMastery: 3.5, // 25
            personalGrowth: 3.4, // 24
            positiveRelations: 3.3, // 23
            purposeInLife: 2.3, // 16 (at risk)
            selfAcceptance: 3.4  // 24
          }
        },
        {
          id: 'ST12355',
          name: 'Sophia Garcia',
          college: 'CAS',
          section: 'BSPS2B',
          submissionDate: '2024-06-03',
          subscales: {
            autonomy: 2.2, // 15 (at risk)
            environmentalMastery: 3.4, // 24
            personalGrowth: 2.4, // 17 (at risk)
            positiveRelations: 3.4, // 24
            purposeInLife: 3.2, // 22
            selfAcceptance: 3.4  // 24
          }
        },
        {
          id: 'ST12356',
          name: 'Alex Thompson',
          college: 'CBA',
          section: 'BSBA3A',
          submissionDate: '2024-06-02',
          subscales: {
            autonomy: 3.3, // 23
            environmentalMastery: 2.2, // 15 (at risk)
            personalGrowth: 3.2, // 22
            positiveRelations: 3.4, // 24
            purposeInLife: 3.3, // 23
            selfAcceptance: 2.3  // 16 (at risk)
          }
        },
        {
          id: 'ST12354',
          name: 'Jessica Martin',
          college: 'CN',
          section: 'BSCS2B',
          submissionDate: '2024-06-01',
          subscales: {
            autonomy: 3.5, // 25
            environmentalMastery: 2.3, // 16 (at risk)
            personalGrowth: 3.5, // 25
            positiveRelations: 2.4, // 17 (at risk)
            purposeInLife: 3.6, // 25
            selfAcceptance: 2.2  // 15 (at risk)
          }
        }
      ],
      filteredStudents: [],
      // Use the same risk threshold as the dashboard
      riskThresholds: {
        q1: 17, // Below or equal to this is "At Risk" (Q1)
        q4: 39  // Above or equal to this is "Healthy" (Q4)
      }
    };
  },
  created() {
    // Apply filters from props if they exist
    if (this.selectedDimension || this.selectedCollege !== 'all') {
      this.collegeFilter = this.selectedCollege;
      
      // Debug: Log Environmental Mastery scores for all students
      if (this.selectedDimension === 'Environmental Mastery') {
        console.log('Environmental Mastery scores:');
        this.students.forEach(student => {
          const score = student.subscales.environmentalMastery * 7;
          console.log(`${student.name} (${student.college}): ${score} - At risk: ${score <= this.riskThresholds.q1}`);
        });
        
        // Additional debug: Log the risk threshold
        console.log(`Risk threshold for Environmental Mastery: ${this.riskThresholds.q1}`);
        
        // Verify which students would be filtered
        const filteredStudents = this.students.filter(student => {
          const score = student.subscales.environmentalMastery * 7;
          return student.college === 'CCS' && score <= this.riskThresholds.q1;
        });
        
        console.log(`CCS students at risk for Environmental Mastery:`, 
          filteredStudents.map(s => `${s.name} (${s.id})`));
      }
      
      this.filterByDimensionAndCollege();
    } else {
      this.filterStudents();
    }
  },
  methods: {
    // Calculate overall score as sum of all dimension scores (scaled from 0-5 to 7-49)
    calculateOverallScore(student) {
      let total = 0;
      for (const subscale in student.subscales) {
        total += Math.round(student.subscales[subscale] * 7);
      }
      return total;
    },
    
    // Check if a dimension score is at risk (in Q1)
    isAtRisk(score) {
      return score <= this.riskThresholds.q1;
    },
    
    // Check if student has any at-risk dimensions
    hasAnyRiskDimension(student) {
      for (const subscale in student.subscales) {
        if (this.isAtRisk(student.subscales[subscale] * 7)) {
          return true;
        }
      }
      return false;
    },
    
    // Get count of at-risk dimensions
    getAtRiskDimensionsCount(student) {
      let count = 0;
      for (const subscale in student.subscales) {
        if (this.isAtRisk(student.subscales[subscale] * 7)) {
          count++;
        }
      }
      return count;
    },
    
    // Get color based on dimension score
    getDimensionScoreColor(score) {
      if (score <= this.riskThresholds.q1) return '#f44336';  // Red for at risk (Q1)
      if (score < this.riskThresholds.q4) return '#ff9800';  // Orange for moderate (Q2-Q3)
      return '#4caf50';  // Green for healthy (Q4)
    },
    
    // Get risk class for styling
    getDimensionRiskClass(score) {
      if (score <= this.riskThresholds.q1) return 'high-risk';
      if (score < this.riskThresholds.q4) return 'medium-risk';
      return 'low-risk';
    },
    
    // Get risk label based on score
    getDimensionRiskLabel(score) {
      if (score <= this.riskThresholds.q1) return 'AT RISK';
      if (score < this.riskThresholds.q4) return 'MODERATE';
      return 'HEALTHY';
    },
    
    filterStudents() {
      let result = [...this.students];
      
      // Apply college filter
      if (this.collegeFilter !== 'all') {
        result = result.filter(student => student.college === this.collegeFilter);
      }
      
      // Apply section filter
      if (this.sectionFilter !== 'all') {
        result = result.filter(student => student.section === this.sectionFilter);
      }
      
      // Apply risk level filter - now based on having at-risk dimensions
      if (this.riskLevelFilter !== 'all') {
        if (this.riskLevelFilter === 'High Risk') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            return atRiskCount >= 3; // High risk if 3+ dimensions are at risk
          });
        } else if (this.riskLevelFilter === 'Medium Risk') {
          result = result.filter(student => {
            const atRiskCount = this.getAtRiskDimensionsCount(student);
            return atRiskCount > 0 && atRiskCount < 3; // Medium risk if 1-2 dimensions are at risk
          });
        } else if (this.riskLevelFilter === 'Low Risk') {
          result = result.filter(student => !this.hasAnyRiskDimension(student));
        }
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
          comparison = this.calculateOverallScore(a) - this.calculateOverallScore(b);
        } else if (this.sortField === 'submissionDate') {
          comparison = new Date(a.submissionDate) - new Date(b.submissionDate);
        }
        
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
      
      this.filteredStudents = result;
    },
    
    // Update filterByDimensionAndCollege to use props
    filterByDimensionAndCollege() {
      // Reset other filters
      this.sectionFilter = 'all';
      this.riskLevelFilter = 'all';
      this.searchQuery = '';
      
      console.log(`Filtering by dimension: ${this.selectedDimension}, college: ${this.collegeFilter}`);
      console.log(`Risk threshold: ${this.riskThresholds.q1}`);
      
      // Apply filters
      let result = [...this.students];
      
      // Filter by college if specified
      if (this.collegeFilter !== 'all') {
        result = result.filter(student => student.college === this.collegeFilter);
        console.log(`After college filter (${this.collegeFilter}): ${result.length} students`);
      }
      
      // Filter by dimension if specified
      if (this.selectedDimension) {
        // Map from dashboard dimension names to student data property names
        const dimensionMapping = {
          'Autonomy': 'autonomy',
          'Environmental Mastery': 'environmentalMastery',
          'Personal Growth': 'personalGrowth',
          'Positive Relations': 'positiveRelations',
          'Purpose in Life': 'purposeInLife',
          'Self-Acceptance': 'selfAcceptance'
        };
        
        const subscaleKey = dimensionMapping[this.selectedDimension];
        
        if (subscaleKey) {
          console.log(`Filtering by dimension: ${this.selectedDimension} (${subscaleKey})`);
          
          // Filter students who are at risk for this specific dimension only
          result = result.filter(student => {
            // Check if this specific dimension is at risk
            const score = student.subscales[subscaleKey] * 7; // Scale to 7-49 range
            const isAtRisk = score <= this.riskThresholds.q1;
            
            console.log(`${student.name} (${student.id}): ${subscaleKey} score = ${score}, at risk: ${isAtRisk}`);
            
            return isAtRisk;
          });
          
          // Log the filtered students for debugging
          console.log(`After dimension filter: ${result.length} students at risk for ${this.selectedDimension}`);
          console.log(`Students at risk for ${this.selectedDimension} in ${this.collegeFilter}:`, 
            result.map(s => `${s.name} (${s.id})`));
        }
      }
      
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
    formatSubscaleName(subscale) {
      if (subscale === 'autonomy') return 'Autonomy';
      if (subscale === 'environmentalMastery') return 'Environmental Mastery';
      if (subscale === 'personalGrowth') return 'Personal Growth';
      if (subscale === 'positiveRelations') return 'Positive Relations';
      if (subscale === 'purposeInLife') return 'Purpose in Life';
      if (subscale === 'selfAcceptance') return 'Self-Acceptance';
      
      // Fallback to the original formatting logic
      const formatted = subscale.replace(/([A-Z])/g, ' $1').trim();
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },
    viewStudentDetails(student) {
      this.selectedStudent = student;
      this.showDetailsModal = true;
    },
    // Reset filters
    resetFilters() {
      this.collegeFilter = 'all';
      this.sectionFilter = 'all';
      this.riskLevelFilter = 'all';
      this.selectedDimension = null;
      this.searchQuery = '';
      this.filterStudents();
    },
    // Add method to clear risk filters
    clearRiskFilters() {
      this.$emit('clear-risk-filters');
      this.collegeFilter = 'all';
      this.filterStudents();
    }
  },
  watch: {
    collegeFilter() {
      this.filterStudents();
    },
    sectionFilter() {
      this.filterStudents();
    },
    riskLevelFilter() {
      this.filterStudents();
    },
    selectedDimension() {
      this.filterByDimensionAndCollege();
    },
    selectedCollege() {
      this.collegeFilter = this.selectedCollege;
      this.filterByDimensionAndCollege();
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

/* Add styles for the dimension risk column */
.dimension-risk {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.risk-count {
  font-weight: 600;
  color: #f44336;
  font-size: 13px;
  background-color: #ffebee;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 3px;
}

.risk-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.risk-dimension-container {
  position: relative;
  display: inline-block;
  margin: 2px;
}

.risk-dimension-score {
  display: inline-block;
  padding: 3px 6px;
  background-color: #ffebee;
  color: #f44336;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(244, 67, 54, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.risk-dimension-container:hover .risk-dimension-score {
  background-color: #f44336;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.hover-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 100;
}

.hover-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

.risk-dimension-score:hover .hover-label {
  opacity: 1;
  visibility: visible;
}

/* Remove unused tooltip styles */
:global(.custom-tooltip),
:global(.custom-tooltip::after),
:global(.show-tooltip),
.dimension-name-tooltip,
.dimension-name-tooltip::after,
.risk-dimension-container:hover .dimension-name-tooltip {
  display: none;
}

.no-risk {
  color: #4caf50;
  font-size: 12px;
  font-weight: 500;
}

/* Add styles for subscale risk indicators */
.subscale-item.at-risk {
  background-color: rgba(244, 67, 54, 0.05);
  border-left: 3px solid #f44336;
  padding-left: 12px;
  border-radius: 4px;
}

.risk-status {
  margin-top: 5px;
  font-size: 11px;
  font-weight: 500;
}

.risk-status .high-risk {
  color: #f44336;
}

.risk-status .medium-risk {
  color: #ff9800;
}

.risk-status .low-risk {
  color: #4caf50;
}

/* Risk Filter Indicator */
.risk-filter-indicator {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.indicator-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.indicator-content i {
  color: #856404;
  font-size: 18px;
  margin-right: 10px;
}

.indicator-content span {
  color: #856404;
  flex-grow: 1;
}

.clear-filter-btn {
  background-color: transparent;
  border: 1px solid #856404;
  color: #856404;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-filter-btn:hover {
  background-color: #856404;
  color: white;
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