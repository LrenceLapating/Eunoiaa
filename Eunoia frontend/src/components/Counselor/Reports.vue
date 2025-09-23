<template>
  <div class="reports-container">
    <!-- Header -->
    <div class="reports-header">
      <div class="header-icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <div class="header-content">
        <h1>Generate Reports</h1>
        <p>Generate and export individual or college well-being reports</p>
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

        <!-- College Summary Card -->
        <div class="report-type-card" 
             :class="{ active: selectedReportType === 'college' }"
             @click="selectReportType('college')">
          <div class="card-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="card-content">
            <h4>College Summary</h4>
            <p>College-wide well-being overview</p>
          </div>
          <div class="card-checkbox">
            <i class="fas fa-check" v-if="selectedReportType === 'college'"></i>
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
        
        <!-- Loading Historical Students -->
        <div v-if="isLoadingHistoricalStudents" class="loading-indicator">
          <i class="fas fa-spinner fa-spin"></i>
          Loading historical students...
        </div>
        
        <!-- Student Results -->
        <div v-if="studentSearchQuery && filteredStudents.length > 0" class="search-results">
          <div v-for="student in filteredStudents" 
               :key="student.id" 
               class="student-result-item"
               @click="selectStudent(student)">
            <div class="student-info">
              <div class="student-name">
                {{ student.name }}
                <span v-if="student.isHistorical" class="historical-badge">Historical</span>
              </div>
              <div class="student-details">ID: {{ student.id_number || student.id }} | {{ student.college }} - {{ student.section }}</div>
            </div>
            <div class="student-status">
              <span class="status-badge" :class="student.isHistorical ? 'historical' : 'completed'">
                {{ student.isHistorical ? 'Historical' : 'Current' }}
              </span>
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
            <p>ID: {{ selectedStudent.id_number || selectedStudent.id }} | {{ selectedStudent.college }} - {{ selectedStudent.section }}</p>
            <p>Last Assessment: {{ selectedStudent.submissionDate }}</p>
          </div>
          <button class="remove-student-btn" @click="clearSelectedStudent">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- College Report Section -->
    <div v-if="selectedReportType === 'college'" class="report-config-section">
      <h3>College Report Configuration</h3>
      
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
              :checked="selectedAssessments.includes(String(assessment.id))"
              @change="toggleAssessmentSelection(assessment.id, $event)"
            >
            <span class="checkmark"></span>
            <div class="assessment-info">
              <div class="assessment-title">
                Assessment #{{ assessment.number }}
                <span v-if="assessment.isArchived" class="archived-badge">Archived</span>
              </div>
              <div class="assessment-details">
                <div class="assessment-date">{{ formatDate(assessment.date) }}</div>
                <div class="assessment-type">{{ assessment.assessmentType }} Assessment</div>
              </div>
              <div class="assessment-metrics">
                <div class="assessment-score">Score: {{ assessment.score }}/{{ getMaxScore(assessment.assessmentType) }}</div>
                <div class="risk-level" :class="getRiskLevelClass(assessment.riskLevel)">
                  {{ assessment.riskLevel || 'Unknown' }}
                </div>
              </div>
            </div>
          </label>
        </div>
        <div v-if="getStudentAssessments(selectedStudent.id).length === 0" class="no-assessments">
          No assessment history found for this student.
        </div>
      </div>
    </div>

    <!-- Assessment Period Selection for College Report -->
    <div v-if="selectedReportType === 'college'" class="assessment-periods-section">
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
import authService from '@/services/authService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiUrl } from '../../utils/apiUtils';

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
      
      selectedReportType: 'individual',
      studentSearchQuery: '',
      filteredStudents: [],
      selectedStudent: null,
      allStudents: [], // Combined current + historical students
      isLoadingHistoricalStudents: false,
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
      availableYearLevels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      collegesFromBackend: [], // Store colleges fetched from backend
      studentAssessmentHistory: [] // Store fetched assessment history for selected student
    };
  },
  computed: {
    canGenerateReport() {
      const reportType = this.selectedReportType;
      const student = this.selectedStudent;
      
      if (reportType === 'individual') {
        return student !== null;
      } else if (reportType === 'college') {
        return this.selectedColleges.length > 0 && this.selectedYearLevels.length > 0 && this.selectedPeriods.length > 0;
      }
      return false;
    },
    $authService() {
      return authService;
    }
  },
  watch: {
    selectedAssessments: {
      handler(newVal, oldVal) {
        console.log('selectedAssessments watcher triggered:', {
          oldVal,
          newVal,
          canGenerateReport: this.canGenerateReport
        });
      },
      deep: true
    },
    selectedStudent(newVal, oldVal) {
      console.log('selectedStudent watcher triggered:', {
        oldVal: oldVal?.name || null,
        newVal: newVal?.name || null,
        canGenerateReport: this.canGenerateReport
      });
    },
    selectedReportType(newVal, oldVal) {
      console.log('selectedReportType watcher triggered:', {
        oldVal,
        newVal,
        canGenerateReport: this.canGenerateReport
      });
    }
  },
  async created() {
    // Load colleges from backend first
    await this.loadCollegesFromBackend();
    
    // Load historical students and combine with current students
    await this.fetchHistoricalStudents();
    
    // Handle pre-selected data from navigation
    if (this.preSelectedStudent && this.preSelectedReportType) {
      // Pre-select student for report generation
      
      // Set report type
      this.selectedReportType = this.preSelectedReportType;
      
      // Set selected student
      this.selectedStudent = this.preSelectedStudent;
      
      // Auto-select all available assessments for the student
      const studentAssessments = this.getStudentAssessments(this.preSelectedStudent.id);
      this.selectedAssessments = studentAssessments.map(assessment => assessment.id);
      
      // Auto-select student assessments
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
      this.filteredStudents = this.allStudents.filter(student => 
        student.name.toLowerCase().includes(query) || 
        student.id.toLowerCase().includes(query) ||
        (student.id_number && student.id_number.toLowerCase().includes(query))
      ).slice(0, 10); // Increased limit to show more results since we have more students
    },
    
    async selectStudent(student) {
      this.selectedStudent = student;
      this.studentSearchQuery = '';
      this.filteredStudents = [];
      this.selectedAssessments = []; // Reset assessments when changing student
      
      // Fetch assessment history for the selected student
      if (student.isHistorical) {
        // For historical students, fetch their historical assessment data
        await this.fetchHistoricalStudentAssessments(student.id);
      } else {
        // For current students, use the regular assessment history endpoint
        await this.fetchStudentAssessmentHistory(student.id);
      }
    },
    
    clearSelectedStudent() {
      this.selectedStudent = null;
      this.selectedAssessments = [];
      this.studentAssessmentHistory = [];
    },
    
    async fetchStudentAssessmentHistory(studentId) {
      try {
        console.log(`Fetching assessment history for student ID: ${studentId}`);
        
        const response = await fetch(apiUrl(`counselor-assessments/student/${studentId}/history?includeArchived=true`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const apiResponse = await response.json();
          console.log('Fetched student assessment history:', apiResponse);
          
          if (apiResponse.success && apiResponse.data) {
            this.studentAssessmentHistory = apiResponse.data.assessments || [];
            console.log(`Found ${this.studentAssessmentHistory.length} assessments for student`);
            console.log('Assessment history data:', this.studentAssessmentHistory);
            
            // Force reactivity update
            this.$forceUpdate();
          } else {
            console.error('Invalid API response structure:', apiResponse);
            this.studentAssessmentHistory = [];
          }
        } else {
          console.error('Failed to fetch student assessment history:', response.statusText);
          this.studentAssessmentHistory = [];
        }
      } catch (error) {
        console.error('Error fetching student assessment history:', error);
        this.studentAssessmentHistory = [];
      }
    },
    
    async fetchHistoricalStudentAssessments(studentId) {
      try {
        console.log(`Fetching historical assessment data for student ID: ${studentId}`);
        
        // Try to use the existing student history endpoint first
        // This might fail if the student is not in the current students table
        const response = await fetch(apiUrl(`counselor-assessments/student/${studentId}/history?includeArchived=true`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const apiResponse = await response.json();
          console.log('Fetched historical assessment data:', apiResponse);
          
          if (apiResponse.success && apiResponse.data) {
            this.studentAssessmentHistory = apiResponse.data.assessments || [];
            console.log(`Found ${this.studentAssessmentHistory.length} historical assessments for student`);
            console.log('Historical assessment data:', this.studentAssessmentHistory);
            
            // Force reactivity update
            this.$forceUpdate();
          } else {
            console.error('Invalid API response structure:', apiResponse);
            this.studentAssessmentHistory = [];
          }
        } else if (response.status === 404) {
          // Student not found in current students table, this is expected for historical students
          console.log('Student not found in current students table, this is expected for historical students');
          // For now, we'll set empty history. In a future update, we can implement a dedicated historical endpoint
          this.studentAssessmentHistory = [];
        } else {
          console.error('Failed to fetch historical assessment data:', response.statusText);
          this.studentAssessmentHistory = [];
        }
      } catch (error) {
        console.error('Error fetching historical assessment data:', error);
        this.studentAssessmentHistory = [];
      }
    },
    
    async fetchHistoricalStudents() {
      try {
        this.isLoadingHistoricalStudents = true;
        console.log('Fetching historical students...');
        
        const response = await fetch(apiUrl('accounts/history?limit=1000'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const apiResponse = await response.json();
          console.log('Fetched historical students:', apiResponse);
          
          if (apiResponse.students) {
            // Mark historical students to distinguish them
            const historicalStudents = apiResponse.students.map(student => ({
              ...student,
              isHistorical: true,
              displayName: `${student.name} (Historical)`,
              originalName: student.name
            }));
            
            // Combine current students with historical students
            this.allStudents = [
              ...this.students.map(student => ({ ...student, isHistorical: false })),
              ...historicalStudents
            ];
            
            console.log(`Combined ${this.students.length} current students with ${historicalStudents.length} historical students`);
          } else {
            console.error('Invalid API response structure:', apiResponse);
            this.allStudents = [...this.students.map(student => ({ ...student, isHistorical: false }))];
          }
        } else {
          console.error('Failed to fetch historical students:', response.statusText);
          this.allStudents = [...this.students.map(student => ({ ...student, isHistorical: false }))];
        }
      } catch (error) {
        console.error('Error fetching historical students:', error);
        this.allStudents = [...this.students.map(student => ({ ...student, isHistorical: false }))];
      } finally {
        this.isLoadingHistoricalStudents = false;
      }
    },
    
    getStudentAssessments(studentId) {
      // Return the fetched assessment history for the selected student
      if (this.selectedStudent && this.selectedStudent.id === studentId) {
        const assessments = this.studentAssessmentHistory.map((assessment, index) => ({
          id: String(assessment.id), // Ensure ID is a string for v-model binding
          number: assessment.assessmentNumber || (index + 1),
          date: assessment.displayDate || assessment.completedAt,
          score: assessment.overallScore,
          assessmentType: assessment.assessmentType,
          riskLevel: assessment.riskLevel,
          isArchived: assessment.isArchived,
          originalData: assessment // Store original data for report generation
        }));
        console.log('getStudentAssessments returning:', assessments);
        console.log('Assessment IDs:', assessments.map(a => a.id));
        return assessments;
      }
      
      // Fallback for legacy data or when no history is loaded
      const student = this.students.find(s => s.id === studentId);
      if (student && student.assessmentHistory) {
        return student.assessmentHistory.map((assessment, index) => ({
          id: index + 1,
          number: index + 1,
          date: assessment.submissionDate,
          score: Math.round(this.calculateAssessmentScore(assessment)),
          assessmentType: '42-item',
          riskLevel: 'Unknown',
          isArchived: false,
          originalData: assessment
        }));
      }
      return [];
    },
    
    calculateAssessmentScore(assessment) {
      if (!assessment) return 0;
      // Return the overall_score directly from the database
      return assessment.overallScore || 0;
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    },
    
    getMaxScore(assessmentType) {
      // Return max score based on assessment type
      if (assessmentType === '84-item') {
        return 504; // 84 items × 6 points max
      } else {
        return 252; // 42 items × 6 points max
      }
    },
    
    getRiskLevelClass(riskLevel) {
      if (!riskLevel) return 'unknown';
      
      const level = riskLevel.toLowerCase();
      if (level.includes('at risk') || level.includes('high')) {
        return 'high-risk';
      } else if (level.includes('moderate')) {
        return 'moderate-risk';
      } else if (level.includes('healthy') || level.includes('low')) {
        return 'low-risk';
      }
      return 'unknown';
    },
    
    toggleAssessmentSelection(assessmentId, event) {
        const id = String(assessmentId);
        const isChecked = event.target.checked;
        
        console.log('Toggling assessment selection for ID:', id);
        console.log('Checkbox checked:', isChecked);
        console.log('Current selectedReportType:', this.selectedReportType);
        console.log('Current selectedStudent:', this.selectedStudent);
        console.log('selectedAssessments before:', JSON.stringify(this.selectedAssessments));
        console.log('selectedAssessments array length before:', this.selectedAssessments.length);
        
        if (isChecked) {
          if (!this.selectedAssessments.includes(id)) {
            // Vue 3 compatible array mutation
            this.selectedAssessments.push(id);
            console.log('Added ID to array:', id);
          } else {
            console.log('ID already in array:', id);
          }
        } else {
          const index = this.selectedAssessments.indexOf(id);
          if (index > -1) {
            // Vue 3 compatible array mutation
            this.selectedAssessments.splice(index, 1);
            console.log('Removed ID from array:', id);
          }
        }
        
        console.log('selectedAssessments after:', JSON.stringify(this.selectedAssessments));
        console.log('selectedAssessments array length after:', this.selectedAssessments.length);
        
        // Immediately check the computed property
        console.log('canGenerateReport (immediate):', this.canGenerateReport);
        
        // Also check in nextTick
        this.$nextTick(() => {
          console.log('canGenerateReport (nextTick):', this.canGenerateReport);
        });
      },
    
    generateReport() {
      if (!this.canGenerateReport) return;
      
      if (this.selectedReportType === 'individual') {
        this.generateIndividualReport();
      } else if (this.selectedReportType === 'college') {
        this.generateCollegeReport();
      }
    },
    
    async generateIndividualReport() {
      try {
        // Show loading notification
        this.$emit('show-notification', {
          type: 'info',
          message: `Generating individual report for ${this.selectedStudent.name}...`
        });
        
        // Fetch student assessment data
        const response = await fetch(apiUrl(`counselor-assessments/student/${this.selectedStudent.id}/history?includeArchived=true`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch assessment data: ${response.statusText}`);
        }
        
        const apiResponse = await response.json();
        const allAssessments = apiResponse.data?.assessments || [];
        
        if (allAssessments.length === 0) {
          throw new Error('No assessment data found for this student');
        }
        
        // Filter assessments based on selected ones
        const selectedAssessments = allAssessments.filter(assessment => 
          this.selectedAssessments.includes(String(assessment.id))
        );
        
        if (selectedAssessments.length === 0) {
          throw new Error('No selected assessments found. Please select at least one assessment.');
        }
        
        // Generate PDF using jsPDF
        await this.createPDFReport(apiResponse.data.student, selectedAssessments);
        
        // Show success message
        this.$emit('show-notification', {
          type: 'success',
          message: `Report downloaded: ${apiResponse.data.student.name}_WellbeingReport.pdf`
        });
        
      } catch (error) {
        console.error('Error generating PDF report:', error);
        this.$emit('show-notification', {
          type: 'error',
          message: `Failed to generate PDF report: ${error.message}`
        });
      }
    },
    
    async createPDFReport(student, assessments) {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Student Assessment Details', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Student Information
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(student.name, 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const assessmentTypes = [...new Set(assessments.map(a => a.assessmentType))];
      pdf.text(`${student.idNumber || 'N/A'} • ${student.college || 'N/A'} • ${assessmentTypes.join(', ')} Assessment(s)`, 20, yPosition);
      yPosition += 15;
      
      // Process each selected assessment
      assessments.forEach((assessment, assessmentIndex) => {
        // Check if we need a new page for each assessment (except the first)
        if (assessmentIndex > 0) {
          pdf.addPage();
          yPosition = 20;
          
          // Add assessment header
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Assessment #${assessmentIndex + 1}`, 20, yPosition);
          yPosition += 15;
        }
        
        // Assessment Summary Box
        pdf.setFillColor(248, 249, 250);
        pdf.rect(15, yPosition - 5, 180, 35, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(15, yPosition - 5, 180, 35, 'S');
        
        // Assessment details
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const submissionDate = assessment.completedAt ? 
          new Date(assessment.completedAt).toLocaleDateString() : 'N/A';
        pdf.text(`Submission Date: ${submissionDate}`, 20, yPosition + 5);
        
        const overallScore = assessment.overallScore || 'N/A';
        const riskLevel = assessment.riskLevel || 'N/A';
        pdf.text(`Overall Score: ${overallScore}`, 20, yPosition + 15);
        pdf.text(`Assessment Type: ${assessment.assessmentType}`, 20, yPosition + 25);
        
        // Risk level with color coding
        let riskColor = [0, 0, 0]; // Default black
        if (riskLevel === 'High Risk') riskColor = [231, 76, 60]; // Red
        else if (riskLevel === 'Moderate Risk') riskColor = [243, 156, 18]; // Orange
        else if (riskLevel === 'Low Risk') riskColor = [39, 174, 96]; // Green
        
        pdf.setTextColor(...riskColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Risk Level: ${riskLevel}`, 120, yPosition + 15);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        yPosition += 50;
        
        // Subscale Scores for this assessment
         if (assessment.scores) {
           let scores;
           try {
             scores = typeof assessment.scores === 'string' ? 
               JSON.parse(assessment.scores) : assessment.scores;
             console.log('Parsed scores for PDF:', scores);
             console.log('Available score keys:', Object.keys(scores));
           } catch (e) {
             console.error('Error parsing scores:', e);
             scores = null;
           }
          
          if (scores && typeof scores === 'object') {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Subscale Scores - Assessment #${assessmentIndex + 1}`, 20, yPosition);
            yPosition += 15;
            
            // Define subscales with proper key mapping
            const subscales = [
              { key: 'autonomy', name: 'Autonomy' },
              { key: 'environmental_mastery', name: 'Environmental Mastery' },
              { key: 'personal_growth', name: 'Personal Growth' },
              { key: 'positive_relations', name: 'Positive Relations' },
              { key: 'purpose_in_life', name: 'Purpose in Life' },
              { key: 'self_acceptance', name: 'Self Acceptance' }
            ];
            
            const maxScore = assessment.assessmentTypeRaw === '42-item' ? 42 : 84;
            
            // Table header
            pdf.setFillColor(52, 73, 94); // Dark blue header
            pdf.rect(15, yPosition, 180, 12, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Dimension', 20, yPosition + 8);
            pdf.text('Score', 80, yPosition + 8);
            pdf.text('Percentage', 110, yPosition + 8);
            pdf.text('Status', 150, yPosition + 8);
            pdf.text('Visual', 175, yPosition + 8);
            
            yPosition += 12;
            pdf.setTextColor(0, 0, 0);
            
            subscales.forEach((subscale, index) => {
              const score = scores[subscale.key] || 'N/A';
              const percentage = score !== 'N/A' ? ((score / maxScore) * 100).toFixed(1) : 'N/A';
              
              // Determine health status and color
              let healthStatus = 'Unknown';
              let statusColor = [128, 128, 128]; // Gray
              let barColor = [200, 200, 200]; // Light gray
              
              if (score !== 'N/A') {
                if (percentage >= 70) {
                  healthStatus = 'Healthy';
                  statusColor = [39, 174, 96]; // Green
                  barColor = [39, 174, 96];
                } else if (percentage >= 50) {
                  healthStatus = 'Moderate';
                  statusColor = [243, 156, 18]; // Orange
                  barColor = [243, 156, 18];
                } else {
                  healthStatus = 'At Risk';
                  statusColor = [231, 76, 60]; // Red
                  barColor = [231, 76, 60];
                }
              }
              
              // Alternating row colors
              if (index % 2 === 0) {
                pdf.setFillColor(248, 249, 250);
                pdf.rect(15, yPosition, 180, 10, 'F');
              }
              
              // Row border
              pdf.setDrawColor(220, 220, 220);
              pdf.rect(15, yPosition, 180, 10, 'S');
              
              // Text content
              pdf.setFontSize(9);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(0, 0, 0);
              pdf.text(subscale.name, 20, yPosition + 6);
              pdf.text(score.toString(), 80, yPosition + 6);
              pdf.text(percentage !== 'N/A' ? `${percentage}%` : 'N/A', 110, yPosition + 6);
              
              pdf.setTextColor(...statusColor);
              pdf.setFont('helvetica', 'bold');
              pdf.text(healthStatus, 150, yPosition + 6);
              
              // Visual bar indicator
              if (percentage !== 'N/A') {
                const barWidth = (percentage / 100) * 15;
                pdf.setFillColor(...barColor);
                pdf.rect(175, yPosition + 2, barWidth, 6, 'F');
                pdf.setDrawColor(150, 150, 150);
                pdf.rect(175, yPosition + 2, 15, 6, 'S');
              }
              
              yPosition += 10;
            });
            
            yPosition += 15;
          }
        }
      });
      
      // Assessment History Summary
      if (assessments.length > 1) {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Assessment History Summary', 20, yPosition);
        yPosition += 15;
        
        // Table header
        pdf.setFillColor(52, 73, 94);
        pdf.rect(15, yPosition, 180, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('#', 20, yPosition + 8);
        pdf.text('Date', 35, yPosition + 8);
        pdf.text('Type', 80, yPosition + 8);
        pdf.text('Overall Score', 120, yPosition + 8);
        pdf.text('Risk Level', 160, yPosition + 8);
        
        yPosition += 12;
        pdf.setTextColor(0, 0, 0);
        
        // Assessment rows
        assessments.forEach((assessment, index) => {
          // Alternating row colors
          if (index % 2 === 0) {
            pdf.setFillColor(248, 249, 250);
            pdf.rect(15, yPosition, 180, 10, 'F');
          }
          
          // Row border
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(15, yPosition, 180, 10, 'S');
          
          // Content
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          const assessmentNumber = index + 1;
          const date = assessment.completedAt ? 
            new Date(assessment.completedAt).toLocaleDateString() : 'N/A';
          const type = assessment.assessmentType || 'N/A';
          const score = assessment.overallScore || 'N/A';
          const risk = assessment.riskLevel || 'N/A';
          
          pdf.text(assessmentNumber.toString(), 20, yPosition + 6);
          pdf.text(date, 35, yPosition + 6);
          pdf.text(type, 80, yPosition + 6);
          pdf.text(score.toString(), 120, yPosition + 6);
          
          // Risk level with color
          let riskColor = [0, 0, 0];
          if (risk === 'High Risk') riskColor = [231, 76, 60];
          else if (risk === 'Moderate Risk') riskColor = [243, 156, 18];
          else if (risk === 'Low Risk') riskColor = [39, 174, 96];
          
          pdf.setTextColor(...riskColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(risk, 160, yPosition + 6);
          
          yPosition += 10;
        });
        
        yPosition += 15;
      }
      
      // Professional Footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, pageHeight - 25, 195, pageHeight - 25);
        
        // Footer content
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        
        // Left side - System info
        pdf.text('EUNOIA - Psychological Well-Being Assessment System', 20, pageHeight - 18);
        pdf.text('Confidential Report - For Professional Use Only', 20, pageHeight - 12);
        
        // Right side - Page and date info
        const rightText = `Page ${i} of ${pageCount}`;
        const dateText = `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour12: false })}`;
        
        pdf.text(rightText, 195 - pdf.getTextWidth(rightText), pageHeight - 18);
        pdf.text(dateText, 195 - pdf.getTextWidth(dateText), pageHeight - 12);
        
        // Warning text
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        const warningText = 'This report contains sensitive psychological assessment data. Handle with appropriate confidentiality.';
        const warningWidth = pdf.getTextWidth(warningText);
        pdf.text(warningText, (210 - warningWidth) / 2, pageHeight - 6);
      }
      
      // Download the PDF
      pdf.save(`${student.name}_WellbeingReport.pdf`);
    },
    
    getRiskLevelColor(riskLevel) {
      switch (riskLevel?.toLowerCase()) {
        case 'low':
        case 'healthy':
          return { r: 76, g: 175, b: 80 }; // Green
        case 'moderate':
          return { r: 255, g: 152, b: 0 }; // Orange
        case 'high':
        case 'at risk':
          return { r: 244, g: 67, b: 54 }; // Red
        default:
          return { r: 0, g: 0, b: 0 }; // Black
      }
    },
    
    getDimensionHealthStatus(score, maxScore) {
      const percentage = (score / maxScore) * 100;
      if (percentage >= 70) return 'healthy';
      if (percentage >= 50) return 'moderate';
      return 'at risk';
    },
    
    getHealthStatusColor(status) {
      switch (status?.toLowerCase()) {
        case 'healthy':
          return { r: 76, g: 175, b: 80 }; // Green
        case 'moderate':
          return { r: 255, g: 152, b: 0 }; // Orange
        case 'at risk':
          return { r: 244, g: 67, b: 54 }; // Red
        default:
          return { r: 0, g: 0, b: 0 }; // Black
      }
    },
    
    getAtRiskDimensions(scores, maxScore) {
      const dimensions = ['autonomy', 'environmental_mastery', 'personal_growth', 'positive_relations', 'purpose_in_life', 'self_acceptance'];
      return dimensions.filter(dim => {
        const score = scores[dim] || 0;
        const percentage = (score / maxScore) * 100;
        return percentage < 70; // Consider moderate and at-risk as "at-risk"
      });
    },
    
    generateCollegeReport() {
      // Simulate PDF generation
      // Generate college-wide report
      
      // Show success message
      const periodCount = this.selectedPeriods.length;
      this.$emit('show-notification', {
        type: 'success',
        message: `College report for ${this.selectedColleges.join(', ')} with ${periodCount} periods is being generated...`
      });
      
      // Simulate download after delay
      setTimeout(() => {
        const collegeNames = this.selectedColleges.join('_');
        this.downloadPDF(`CollegeReport_${collegeNames}_${periodCount}_periods.pdf`);
      }, 2000);
    },
    
    async loadCollegesFromBackend() {
      try {
        const response = await fetch(apiUrl('/accounts/colleges'));
        if (response.ok) {
          const data = await response.json();
          this.collegesFromBackend = data.colleges.map(college => ({
            name: college.name,
            studentCount: college.totalUsers
          }));
        } else {
          console.error('Failed to load colleges from backend');
        }
      } catch (error) {
        console.error('Error loading colleges:', error);
      }
    },
    
    populateAvailableColleges() {
      // Use colleges from backend if available, otherwise extract from student data
      if (this.collegesFromBackend.length > 0) {
        // Use backend colleges and count students from current student data
        const collegeMap = new Map();
        
        // Initialize with backend colleges
        this.collegesFromBackend.forEach(college => {
          collegeMap.set(college.name, {
            code: this.generateCollegeCode(college.name),
            name: college.name,
            studentCount: 0
          });
        });
        
        // Count students from current data
        this.students.forEach(student => {
          if (student.college) {
            // Try to match by college name or code
            const matchingCollege = Array.from(collegeMap.values()).find(college => 
              college.name === student.college || college.code === student.college
            );
            if (matchingCollege) {
              collegeMap.get(matchingCollege.name).studentCount++;
            }
          }
        });
        
        this.availableColleges = Array.from(collegeMap.values());
      } else {
        // Fallback to extracting from student data with hardcoded mappings
        const collegeMap = new Map();
        
        this.students.forEach(student => {
          if (student.college) {
            const collegeCode = student.college;
            if (collegeMap.has(collegeCode)) {
              collegeMap.get(collegeCode).studentCount++;
            } else {
              // Map college codes to full names (fallback)
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
      }
    },
    
    generateCollegeCode(collegeName) {
      // Generate a code from college name for backward compatibility
      const words = collegeName.split(' ');
      if (words.length === 1) {
        return words[0].substring(0, 3).toUpperCase();
      }
      return words.map(word => word.charAt(0)).join('').toUpperCase();
    }
  },
  watch: {
    // Watch for changes in preSelectedStudent prop
    preSelectedStudent: {
      handler(newStudent) {
        if (newStudent && this.preSelectedReportType) {
          // Handle pre-selected student change
          
          // Set report type
          this.selectedReportType = this.preSelectedReportType;
          
          // Set selected student
          this.selectedStudent = newStudent;
          
          // Auto-select all available assessments for the student
          const studentAssessments = this.getStudentAssessments(newStudent.id);
          this.selectedAssessments = studentAssessments.map(assessment => assessment.id);
          
          // Auto-select available assessments
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.archived-badge {
  background: #ed8936;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.assessment-details {
  display: flex;
  gap: 15px;
  margin-bottom: 4px;
}

.assessment-metrics {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assessment-date,
.assessment-type,
.period-date,
.period-participants {
  font-size: 14px;
  color: #718096;
}

.assessment-score {
  font-size: 14px;
  font-weight: 500;
  color: #00b3b0;
}

.risk-level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.risk-level.high-risk {
  background: #fed7d7;
  color: #c53030;
}

.risk-level.moderate-risk {
  background: #feebc8;
  color: #dd6b20;
}

.risk-level.low-risk {
  background: #c6f6d5;
  color: #38a169;
}

.risk-level.unknown {
  background: #e2e8f0;
  color: #718096;
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