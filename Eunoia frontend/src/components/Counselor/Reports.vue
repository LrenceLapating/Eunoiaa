<template>
  <div class="reports-container">
    <!-- Header -->
    <div class="reports-header">
      <div class="header-icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <div class="header-content">
        <h1>Generate Reports</h1>
        <p>Generate and export individual or department well-being reports</p>
      </div>
    </div>

    <!-- Report Type Selection -->
    <div class="report-type-section">
      <h3>Report Type</h3>
      <div class="report-type-cards">
        <!-- Individual Report Card -->
        <div class="report-type-card" 
             :class="{ active: selectedReportType === 'individual' }"
             @click="selectReportType('individual')">
          <div class="card-icon">
            <i class="fas fa-user"></i>
          </div>
          <div class="card-content">
            <h4>Individual Report</h4>
            <p>Detailed well-being report for a specific person</p>
          </div>
          <div class="card-checkbox">
            <i class="fas fa-check" v-if="selectedReportType === 'individual'"></i>
          </div>
        </div>

        <!-- Department Summary Card -->
        <div class="report-type-card" 
             :class="{ active: selectedReportType === 'department' }"
             @click="selectReportType('department')">
          <div class="card-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="card-content">
            <h4>Department Summary</h4>
            <p>Department-wide well-being overview</p>
          </div>
          <div class="card-checkbox">
            <i class="fas fa-check" v-if="selectedReportType === 'department'"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Individual Report Section -->
    <div v-if="selectedReportType === 'individual'" class="report-config-section">
      <h3>Individual Report Configuration</h3>
      
      <!-- Student Search -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              v-model="studentSearchQuery" 
              placeholder="Search by student name or ID..."
              class="search-input"
              @input="filterStudents"
            />
          </div>
        </div>
        
        <!-- Student Results -->
        <div v-if="studentSearchQuery && filteredStudents.length > 0" class="search-results">
          <div v-for="student in filteredStudents" 
               :key="student.id" 
               class="student-result-item"
               @click="selectStudent(student)">
            <div class="student-info">
              <div class="student-name">{{ student.name }}</div>
              <div class="student-details">ID: {{ student.id }} | {{ student.college }} - {{ student.section }}</div>
            </div>
            <div class="student-status">
              <span class="status-badge completed">Completed</span>
            </div>
          </div>
        </div>
        
        <!-- No Results -->
        <div v-if="studentSearchQuery && filteredStudents.length === 0" class="no-results">
          <i class="fas fa-search"></i>
          <p>No students found matching "{{ studentSearchQuery }}"</p>
        </div>
      </div>

      <!-- Selected Student -->
      <div v-if="selectedStudent" class="selected-student-section">
        <h4>Selected Student</h4>
        <div class="selected-student-card">
          <div class="student-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="student-details">
            <h5>{{ selectedStudent.name }}</h5>
            <p>ID: {{ selectedStudent.id }} | {{ selectedStudent.college }} - {{ selectedStudent.section }}</p>
            <p>Last Assessment: {{ selectedStudent.submissionDate }}</p>
          </div>
          <button class="remove-student-btn" @click="clearSelectedStudent">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Department Report Section -->
    <div v-if="selectedReportType === 'department'" class="report-config-section">
      <h3>Department Report Configuration</h3>
      
      <!-- College Selection -->
      <div class="college-selection-section">
        <h4>Select Colleges</h4>
        <div class="college-checkboxes">
          <div v-for="college in availableColleges" 
               :key="college.code" 
               class="college-checkbox-item">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :value="college.code" 
                v-model="selectedColleges"
              />
              <span class="checkmark"></span>
              <span class="college-label">
                <strong>{{ college.code }}</strong> - {{ college.name }}
                <small>({{ college.studentCount }} students)</small>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Year Level Selection -->
      <div class="year-level-section">
        <h4>Select Year Levels</h4>
        <div class="year-level-checkboxes">
          <div v-for="year in availableYearLevels" 
               :key="year" 
               class="year-checkbox-item">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :value="year" 
                v-model="selectedYearLevels"
              />
              <span class="checkmark"></span>
              <span class="year-label">{{ year }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Assessment Selection for Individual Report -->
    <div v-if="selectedReportType === 'individual' && selectedStudent" class="assessment-selection-section">
      <h3>Select Assessments to Include</h3>
      <div class="assessment-history">
        <div 
          v-for="assessment in getStudentAssessments(selectedStudent.id)" 
          :key="assessment.id"
          class="assessment-item"
        >
          <label class="assessment-checkbox">
            <input 
              type="checkbox" 
              :value="assessment.id"
              v-model="selectedAssessments"
            >
            <span class="checkmark"></span>
            <div class="assessment-info">
              <div class="assessment-title">Assessment #{{ assessment.number }}</div>
              <div class="assessment-date">{{ formatDate(assessment.date) }}</div>
              <div class="assessment-score">Score: {{ assessment.score }}/120</div>
            </div>
          </label>
        </div>
        <div v-if="getStudentAssessments(selectedStudent.id).length === 0" class="no-assessments">
          No assessment history found for this student.
        </div>
      </div>
    </div>

    <!-- Assessment Period Selection for Department Report -->
    <div v-if="selectedReportType === 'department'" class="assessment-periods-section">
      <h3>Select Assessment Periods</h3>
      <div class="assessment-periods">
        <div 
          v-for="period in assessmentPeriods" 
          :key="period.id"
          class="period-item"
        >
          <label class="period-checkbox">
            <input 
              type="checkbox" 
              :value="period.id"
              v-model="selectedPeriods"
            >
            <span class="checkmark"></span>
            <div class="period-info">
              <div class="period-title">{{ period.name }}</div>
              <div class="period-date">{{ period.dateRange }}</div>
              <div class="period-participants">{{ period.participants }} participants</div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Export Format Section -->
    <div v-if="selectedReportType" class="export-format-section">
      <h3>Export Format</h3>
      <div class="format-option">
        <div class="format-card active">
          <div class="format-icon">
            <i class="fas fa-file-pdf"></i>
          </div>
          <span>PDF</span>
        </div>
      </div>
    </div>

    <!-- Generate Button -->
    <div v-if="selectedReportType" class="generate-section">
      <button class="generate-btn" 
              @click="generateReport" 
              :disabled="!canGenerateReport"
              :class="{ disabled: !canGenerateReport }">
        <i class="fas fa-download"></i>
        Generate & Download PDF
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Reports',
  props: {
    students: {
      type: Array,
      default: () => []
    },
    preSelectedStudent: {
      type: Object,
      default: null
    },
    preSelectedReportType: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      selectedReportType: '',
      studentSearchQuery: '',
      filteredStudents: [],
      selectedStudent: null,
      selectedColleges: [],
      selectedYearLevels: [],
      selectedAssessments: [],
      selectedPeriods: [],
      assessmentPeriods: [
        {
          id: 1,
          name: 'First Semester Assessment',
          dateRange: 'August 2024 - December 2024',
          participants: 1250
        },
        {
          id: 2,
          name: 'Second Semester Assessment',
          dateRange: 'January 2025 - May 2025',
          participants: 1180
        },
        {
          id: 3,
          name: 'Summer Assessment',
          dateRange: 'June 2024 - July 2024',
          participants: 450
        }
      ],
      availableColleges: [],
      availableYearLevels: ['1st Year', '2nd Year', '3rd Year', '4th Year']
    };
  },
  computed: {
    canGenerateReport() {
      if (this.selectedReportType === 'individual') {
        return this.selectedStudent !== null && this.selectedAssessments.length > 0;
      } else if (this.selectedReportType === 'department') {
        return this.selectedColleges.length > 0 && this.selectedYearLevels.length > 0 && this.selectedPeriods.length > 0;
      }
      return false;
    }
  },
  created() {
    // Handle pre-selected data from navigation
    if (this.preSelectedStudent && this.preSelectedReportType) {
      console.log('Pre-selecting student for report:', this.preSelectedStudent);
      
      // Set report type
      this.selectedReportType = this.preSelectedReportType;
      
      // Set selected student
      this.selectedStudent = this.preSelectedStudent;
      
      // Auto-select all available assessments for the student
      const studentAssessments = this.getStudentAssessments(this.preSelectedStudent.id);
      this.selectedAssessments = studentAssessments.map(assessment => assessment.id);
      
      console.log('Auto-selected assessments:', this.selectedAssessments);
    }
    
    // Populate available colleges from student data
    this.populateAvailableColleges();
  },
  methods: {
    selectReportType(type) {
      this.selectedReportType = type;
      // Reset selections when changing report type
      this.selectedStudent = null;
      this.selectedColleges = [];
      this.selectedYearLevels = [];
      this.studentSearchQuery = '';
      this.filteredStudents = [];
    },
    
    filterStudents() {
      if (!this.studentSearchQuery.trim()) {
        this.filteredStudents = [];
        return;
      }
      
      const query = this.studentSearchQuery.toLowerCase();
      this.filteredStudents = this.students.filter(student => 
        student.name.toLowerCase().includes(query) || 
        student.id.toLowerCase().includes(query)
      ).slice(0, 5); // Limit to 5 results
    },
    
    selectStudent(student) {
      this.selectedStudent = student;
      this.studentSearchQuery = '';
      this.filteredStudents = [];
      this.selectedAssessments = []; // Reset assessments when changing student
    },
    
    clearSelectedStudent() {
      this.selectedStudent = null;
      this.selectedAssessments = [];
    },
    
    getStudentAssessments(studentId) {
      // Find the student and return their assessment history
      const student = this.students.find(s => s.id === studentId);
      if (student && student.assessmentHistory) {
        return student.assessmentHistory.map((assessment, index) => ({
          id: index + 1,
          number: index + 1,
          date: assessment.submissionDate,
          score: Math.round(this.calculateAssessmentScore(assessment) * 7) // Convert to 7-49 scale
        }));
      }
      return [];
    },
    
    calculateAssessmentScore(assessment) {
      if (!assessment.subscales) return 0;
      const subscales = assessment.subscales;
      const total = Object.values(subscales).reduce((sum, score) => sum + score, 0);
      return total / Object.keys(subscales).length; // Average score
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
    generateReport() {
      if (!this.canGenerateReport) return;
      
      if (this.selectedReportType === 'individual') {
        this.generateIndividualReport();
      } else if (this.selectedReportType === 'department') {
        this.generateDepartmentReport();
      }
    },
    
    generateIndividualReport() {
      // Simulate PDF generation
      console.log('Generating individual report for:', this.selectedStudent);
      console.log('Selected assessments:', this.selectedAssessments);
      
      // Show success message
      const assessmentCount = this.selectedAssessments.length;
      this.$emit('show-notification', {
        type: 'success',
        message: `Individual report for ${this.selectedStudent.name} with ${assessmentCount} assessments is being generated...`
      });
      
      // Simulate download after delay
      setTimeout(() => {
        this.downloadPDF(`${this.selectedStudent.name}_WellbeingReport_${assessmentCount}_assessments.pdf`);
      }, 2000);
    },
    
    generateDepartmentReport() {
      // Simulate PDF generation
      console.log('Generating department report for colleges:', this.selectedColleges);
      console.log('Year levels:', this.selectedYearLevels);
      console.log('Selected periods:', this.selectedPeriods);
      
      // Show success message
      const periodCount = this.selectedPeriods.length;
      this.$emit('show-notification', {
        type: 'success',
        message: `Department report for ${this.selectedColleges.join(', ')} with ${periodCount} periods is being generated...`
      });
      
      // Simulate download after delay
      setTimeout(() => {
        const collegeNames = this.selectedColleges.join('_');
        this.downloadPDF(`DepartmentReport_${collegeNames}_${periodCount}_periods.pdf`);
      }, 2000);
    },
    
    populateAvailableColleges() {
      // Extract unique colleges from student data
      const collegeMap = new Map();
      
      this.students.forEach(student => {
        if (student.college) {
          const collegeCode = student.college;
          if (collegeMap.has(collegeCode)) {
            collegeMap.get(collegeCode).studentCount++;
          } else {
            // Map college codes to full names
            const collegeNames = {
              'CCS': 'College of Computer Studies',
              'CN': 'College of Nursing', 
              'COE': 'College of Engineering',
              'CBA': 'College of Business Administration',
              'CAS': 'College of Arts and Sciences'
            };
            
            collegeMap.set(collegeCode, {
              code: collegeCode,
              name: collegeNames[collegeCode] || collegeCode,
              studentCount: 1
            });
          }
        }
      });
      
      this.availableColleges = Array.from(collegeMap.values());
    },
    
    downloadPDF(filename) {
      // Simulate PDF download
      const link = document.createElement('a');
      link.href = '#'; // In real implementation, this would be the PDF blob URL
      link.download = filename;
      link.click();
      
      this.$emit('show-notification', {
        type: 'success',
        message: `Report downloaded: ${filename}`
      });
    }
  },
  watch: {
    // Watch for changes in preSelectedStudent prop
    preSelectedStudent: {
      handler(newStudent) {
        if (newStudent && this.preSelectedReportType) {
          console.log('Pre-selected student changed:', newStudent);
          
          // Set report type
          this.selectedReportType = this.preSelectedReportType;
          
          // Set selected student
          this.selectedStudent = newStudent;
          
          // Auto-select all available assessments for the student
          const studentAssessments = this.getStudentAssessments(newStudent.id);
          this.selectedAssessments = studentAssessments.map(assessment => assessment.id);
          
          console.log('Auto-selected assessments:', this.selectedAssessments);
        }
      },
      immediate: false
    },
    // Watch for changes in students prop
    students: {
      handler() {
        this.populateAvailableColleges();
      },
      immediate: true
    }
  }
};
</script>

<style scoped>
.reports-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #00b3b0, #00a8a5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.header-icon i {
  font-size: 24px;
  color: white;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 5px 0;
}

.header-content p {
  color: #718096;
  margin: 0;
  font-size: 16px;
}

.report-type-section {
  margin-bottom: 30px;
}

.report-type-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 15px;
}

.report-type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.report-type-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
}

.report-type-card:hover {
  border-color: #00b3b0;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.1);
}

.report-type-card.active {
  border-color: #00b3b0;
  background: rgba(0, 179, 176, 0.05);
}

.card-icon {
  width: 50px;
  height: 50px;
  background: #f7fafc;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.report-type-card.active .card-icon {
  background: rgba(0, 179, 176, 0.1);
  color: #00b3b0;
}

.card-icon i {
  font-size: 20px;
  color: #718096;
}

.report-type-card.active .card-icon i {
  color: #00b3b0;
}

.card-content {
  flex: 1;
}

.card-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 5px 0;
}

.card-content p {
  color: #718096;
  margin: 0;
  font-size: 14px;
}

.card-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.report-type-card.active .card-checkbox {
  background: #00b3b0;
  border-color: #00b3b0;
}

.card-checkbox i {
  font-size: 12px;
  color: white;
}

.report-config-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.report-config-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
}

.search-section {
  margin-bottom: 20px;
}

.search-container {
  position: relative;
}

.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #00b3b0;
}

.search-results {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 5px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.student-result-item {
  padding: 15px;
  border-bottom: 1px solid #f7fafc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;
}

.student-result-item:hover {
  background: #f7fafc;
}

.student-result-item:last-child {
  border-bottom: none;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 3px;
}

.student-details {
  font-size: 14px;
  color: #718096;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #a0aec0;
}

.no-results i {
  font-size: 24px;
  margin-bottom: 10px;
}

.selected-student-section {
  margin-top: 20px;
}

.selected-student-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
}

.selected-student-card {
  background: rgba(0, 179, 176, 0.05);
  border: 1px solid rgba(0, 179, 176, 0.2);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
}

.student-avatar {
  width: 50px;
  height: 50px;
  background: #00b3b0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.student-avatar i {
  font-size: 24px;
  color: white;
}

.selected-student-card .student-details {
  flex: 1;
}

.selected-student-card h5 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 5px 0;
}

.selected-student-card p {
  font-size: 14px;
  color: #718096;
  margin: 2px 0;
}

.remove-student-btn {
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.remove-student-btn:hover {
  background: rgba(229, 62, 62, 0.1);
}

.college-selection-section,
.year-level-section {
  margin-bottom: 25px;
}

.college-selection-section h4,
.year-level-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 15px;
}

.college-checkboxes,
.year-level-checkboxes {
  display: grid;
  gap: 10px;
}

.college-checkboxes {
  grid-template-columns: 1fr;
}

.year-level-checkboxes {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.checkbox-container:hover {
  background: #f7fafc;
}

.checkbox-container input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.checkbox-container input[type="checkbox"]:checked + .checkmark {
  background: #00b3b0;
  border-color: #00b3b0;
}

.checkbox-container input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.college-label,
.year-label {
  font-size: 14px;
  color: #2d3748;
}

.college-label small {
  color: #718096;
  display: block;
  margin-top: 2px;
}

.assessment-selection-section,
.assessment-periods-section,
.export-format-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.assessment-selection-section h3,
.assessment-periods-section h3,
.export-format-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
}

.assessment-history,
.assessment-periods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assessment-item,
.period-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.assessment-item:hover,
.period-item:hover {
  border-color: #00b3b0;
  box-shadow: 0 2px 8px rgba(0, 179, 176, 0.1);
}

.assessment-checkbox,
.period-checkbox {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  width: 100%;
}

.assessment-checkbox input[type="checkbox"],
.period-checkbox input[type="checkbox"] {
  display: none;
}

.assessment-checkbox .checkmark,
.period-checkbox .checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.assessment-checkbox input[type="checkbox"]:checked + .checkmark,
.period-checkbox input[type="checkbox"]:checked + .checkmark {
  background: #00b3b0;
  border-color: #00b3b0;
}

.assessment-checkbox input[type="checkbox"]:checked + .checkmark::after,
  .period-checkbox input[type="checkbox"]:checked + .checkmark::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }

  .assessment-score {
    font-weight: 500;
    color: #00b3b0;
  }

  .period-participants {
    font-weight: 500;
    color: #00b3b0;
  }

.assessment-info,
.period-info {
  flex: 1;
}

.assessment-title,
.period-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.assessment-date,
.assessment-score,
.period-date,
.period-participants {
  font-size: 14px;
  color: #718096;
  margin-bottom: 2px;
}

.no-assessments {
  text-align: center;
  padding: 40px 20px;
  color: #a0aec0;
  font-style: italic;
}

.format-option {
  display: flex;
  gap: 15px;
}

.format-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.format-card.active {
  border-color: #00b3b0;
  background: rgba(0, 179, 176, 0.05);
}

.format-icon i {
  font-size: 20px;
  color: #e53e3e;
}

.format-card span {
  font-weight: 500;
  color: #2d3748;
}

.generate-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.generate-btn {
  background: linear-gradient(135deg, #00b3b0, #00a8a5);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.generate-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 179, 176, 0.3);
}

.generate-btn.disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.generate-btn i {
  font-size: 16px;
}

@media (max-width: 768px) {
  .report-type-cards {
    grid-template-columns: 1fr;
  }
  
  .assessment-history,
  .assessment-periods {
    gap: 10px;
  }
  
  .assessment-checkbox,
  .period-checkbox {
    padding: 12px;
  }
  
  .year-level-checkboxes {
    grid-template-columns: 1fr 1fr;
  }
}
</style>