<template>
  <div class="ai-intervention-container">
    <!-- Header Section -->
    <div class="intervention-header">
      <div class="header-title">
        <i class="fas fa-brain"></i>
        <h2>AI-Powered Intervention</h2>
        <p>Intelligent categorization and intervention recommendations for student well-being</p>
      </div>
    </div>

    <!-- Main Dashboard View -->
    <div class="dashboard-view" v-if="currentView === 'dashboard'">
      <!-- Statistics Cards -->
      <div class="stats-cards">
        <div class="stat-card at-risk" @click="navigateToStudents('at-risk')">
          <div class="card-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <h3>At Risk Students</h3>
            <div class="stat-number">{{ atRiskStudents.length }}</div>
            <p>Students with 1+ at-risk score in 6 dimensions</p>
            <div class="card-action">
              <span>View Details</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>

        <div class="stat-card moderate" @click="navigateToStudents('moderate')">
          <div class="card-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="card-content">
            <h3>Moderate Students</h3>
            <div class="stat-number">{{ moderateStudents.length }}</div>
            <p>Students with moderate and healthy scores in 6 dimensions</p>
            <div class="card-action">
              <span>View Details</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>

        <div class="stat-card healthy" @click="navigateToStudents('healthy')">
          <div class="card-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-content">
            <h3>Healthy Students</h3>
            <div class="stat-number">{{ healthyStudents.length }}</div>
            <p>Students with all healthy scores in 6 dimensions</p>
            <div class="card-action">
              <span>View Details</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Student List View -->
    <div class="student-list-view" v-if="currentView !== 'dashboard'">
      <!-- Back Button and Title -->
      <div class="list-header">
        <button class="back-button" @click="backToDashboard">
          <i class="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>
        <div class="list-title">
          <h3>{{ getViewTitle() }}</h3>
          <p>{{ getViewDescription() }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="search-container">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search by name, ID, or section..." v-model="searchQuery" @input="filterCurrentStudents">
        </div>
        
        <div class="filter-dropdowns">
          <div class="filter-dropdown">
            <select v-model="collegeFilter" @change="filterCurrentStudents">
              <option value="all">All Colleges</option>
              <option value="CCS">CCS</option>
              <option value="CN">CN</option>
              <option value="CBA">CBA</option>
              <option value="COE">COE</option>
              <option value="CAS">CAS</option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>

      <!-- Bulk Actions for Healthy Students -->
      <div class="bulk-actions" v-if="currentView === 'healthy' && filteredCurrentStudents.length > 0">
        <button class="bulk-send-btn" @click="bulkSendHealthyInterventions">
          <i class="fas fa-paper-plane"></i>
          Send All Interventions ({{ filteredCurrentStudents.length }} students)
        </button>
      </div>

      <!-- Student Table -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>College</th>
              <th>Year</th>
              <th>Section</th>
              <th>{{ getDimensionColumnTitle() }}</th>
              <th>Intervention Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, index) in filteredCurrentStudents" :key="student?.id || index" class="student-row">
              <td class="student-id-cell">{{ student?.id_number || 'N/A' }}</td>
              <td>
                <div class="student-info">
                  <span class="student-name">{{ student?.name || 'N/A' }}</span>
                </div>
              </td>
              <td>{{ student?.college || 'N/A' }}</td>
              <td>{{ student?.yearLevel || 'N/A' }}</td>
              <td>{{ student?.section || 'N/A' }}</td>
              <td>
                <div class="dimension-risk">
                  <!-- For at-risk students, show at-risk count -->
                  <span class="risk-count" v-if="currentView === 'at-risk' && hasAnyRiskDimension(student)" title="Number of at-risk dimensions">
                    {{ getAtRiskDimensionsCount(student) }}/6
                  </span>
                  <!-- For moderate students, show moderate count -->
                  <span class="moderate-count" v-if="currentView === 'moderate' && hasModerateScores(student)" title="Number of moderate dimensions">
                    {{ getModerateDimensionsCount(student) }}/6
                  </span>
                  <!-- For healthy students, show all healthy -->
                  <span class="healthy-count" v-if="currentView === 'healthy'" title="All dimensions are healthy">
                    6/6
                  </span>
                  
                  <div class="risk-scores" v-if="currentView === 'at-risk'">
                    <div 
                      v-for="(score, subscale) in (student?.subscales || {})" 
                      :key="subscale"
                      v-if="score !== undefined && score !== null && isAtRisk(score * 7)"
                      class="risk-dimension-container"
                    >
                      <div class="risk-dimension-score">
                        {{ Math.round(score * 7) }}
                        <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="risk-scores" v-if="currentView === 'moderate'">
                    <div 
                      v-for="(score, subscale) in (student?.subscales || {})" 
                      :key="subscale"
                      v-if="score !== undefined && score !== null && isModerate(score * 7)"
                      class="risk-dimension-container moderate-dimension"
                    >
                      <div class="risk-dimension-score">
                        {{ Math.round(score * 7) }}
                        <div class="hover-label">{{ formatSubscaleName(subscale) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <span v-if="currentView === 'at-risk' && !hasAnyRiskDimension(student)" class="no-risk">No At-Risk</span>
                  <span v-if="currentView === 'moderate' && !hasModerateScores(student)" class="no-risk">No Moderate</span>
                  <span v-if="currentView === 'healthy'" class="no-risk healthy-text">All Healthy</span>
                </div>
              </td>
              <td>
                <div class="intervention-status">
                  <span v-if="hasInterventionSent(student)" class="status-sent" title="Intervention sent">
                    <i class="fas fa-check-circle"></i>
                    Sent
                  </span>
                  <span v-else class="status-pending" title="Intervention not sent">
                    <i class="fas fa-clock"></i>
                    Pending
                  </span>
                </div>
              </td>
              <td>
                <button class="view-button" @click="viewStudentDetails(student)">
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
            <tr v-if="filteredCurrentStudents.length === 0" class="no-data">
              <td colspan="8">No students found in this category</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Student Intervention Modal -->
    <div class="modal" v-if="showDetailsModal" @click.self="showDetailsModal = false">
      <div class="modal-content intervention-modal">
        <div class="modal-header">
          <h3>Personalized Mental Health Intervention</h3>
          <button class="close-button" @click="showDetailsModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedStudent">
          <div class="student-details-header">
            <div class="student-profile">
              <h4>{{ selectedStudent?.name || 'N/A' }}</h4>
              <p>{{ selectedStudent?.id_number || 'N/A' }} • {{ selectedStudent?.college || 'N/A' }} • {{ selectedStudent?.section || 'N/A' }}</p>
            </div>
            <div class="assessment-summary">
              <div class="overall-score">
                <span class="score-label">Overall Score:</span>
                <span class="score-value" :class="getOverallRiskClass(selectedStudent)">{{ calculateOverallScore(selectedStudent) }}/49</span>
              </div>
            </div>
          </div>
          
          <!-- Overall Intervention -->
          <div class="intervention-section overall-intervention">
            <h4><i class="fas fa-heart"></i> Overall Mental Health Strategy</h4>
            <div class="intervention-content">
              <p>{{ getOverallIntervention(selectedStudent) }}</p>
            </div>
          </div>

          <!-- Dimension Scores and Interventions -->
          <div class="dimensions-intervention">
            <h4><i class="fas fa-brain"></i> Dimension Scores & Targeted Interventions</h4>
            <div class="dimensions-grid">
              <div 
                class="dimension-card" 
                v-for="(score, subscale) in (selectedStudent?.subscales || {})" 
                :key="subscale"
                :class="{ 'at-risk': score !== undefined && score !== null && isAtRisk(score * 7), 'moderate': score !== undefined && score !== null && isModerate(score * 7), 'healthy': score !== undefined && score !== null && isHealthy(score * 7) }"
              >
                <div class="dimension-header">
                  <span class="dimension-name">{{ formatSubscaleName(subscale) }}</span>
                  <span class="dimension-score" :class="(score !== undefined && score !== null) ? getDimensionRiskClass(score*7) : 'no-data'">
                    {{ (score !== undefined && score !== null) ? Math.round(score * 7) : 'N/A' }}/49
                  </span>
                </div>
                <div class="intervention-text" v-if="score !== undefined && score !== null">
                  <p>{{ getDimensionIntervention(subscale, score * 7) }}</p>
                </div>
                <div class="no-data-text" v-else>
                  <p>No assessment data available for this dimension.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Plan -->
          <div class="intervention-section action-plan">
            <div class="action-plan-header">
              <h4><i class="fas fa-clipboard-list"></i> Recommended Action Plan</h4>
              <button 
                class="edit-button" 
                @click="toggleEditActionPlan"
                :class="{ 'editing': isEditingActionPlan }"
              >
                <i :class="isEditingActionPlan ? 'fas fa-save' : 'fas fa-edit'"></i>
                {{ isEditingActionPlan ? 'Save' : 'Edit' }}
              </button>
            </div>
            
            <!-- Read-only view -->
            <div class="action-items" v-if="!isEditingActionPlan">
              <div class="action-item" v-for="(action, index) in editableActionPlan" :key="index">
                <i class="fas fa-check-circle"></i>
                <span>{{ action }}</span>
              </div>
            </div>
            
            <!-- Editable view -->
            <div class="action-items-editable" v-else>
              <div class="editable-action-item" v-for="(action, index) in editableActionPlan" :key="index">
                <i class="fas fa-grip-vertical drag-handle"></i>
                <textarea 
                  v-model="editableActionPlan[index]"
                  class="action-input"
                  rows="2"
                  placeholder="Enter action plan item..."
                ></textarea>
                <button class="remove-action-btn" @click="removeActionItem(index)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button class="add-action-btn" @click="addActionItem">
                <i class="fas fa-plus"></i> Add Action Item
              </button>
            </div>
            
            <!-- Send to Student Button -->
            <div class="action-plan-footer">
              <button class="send-to-student-btn" @click="sendToStudent" :disabled="isEditingActionPlan">
                <i class="fas fa-paper-plane"></i>
                Send to Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIintervention',
  props: {
    students: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      currentView: 'dashboard', // 'dashboard', 'at-risk', 'moderate', 'healthy'
      searchQuery: '',
      collegeFilter: 'all',
      showDetailsModal: false,
      selectedStudent: null,
      filteredCurrentStudents: [],
      editableActionPlan: [],
      isEditingActionPlan: false,
      sentInterventions: new Set(), // Track students who have received interventions
      ryffDimensionsList: [
        { key: 'autonomy', name: 'Autonomy' },
        { key: 'environmentalMastery', name: 'Environmental Mastery' },
        { key: 'personalGrowth', name: 'Personal Growth' },
        { key: 'positiveRelations', name: 'Positive Relations' },
        { key: 'purposeInLife', name: 'Purpose in Life' },
        { key: 'selfAcceptance', name: 'Self-Acceptance' }
      ],
      riskThresholds: {
        q1: 17, // Below or equal to this is "At Risk" (Q1)
        q4: 39  // Above or equal to this is "Healthy" (Q4)
      }
    };
  },
  computed: {
    atRiskStudents() {
      return this.students.filter(student => {
        const atRiskCount = this.getAtRiskDimensionsCount(student);
        return atRiskCount > 0;
      }).sort((a, b) => {
        // Sort by most at-risk dimensions first
        const aRisk = this.getAtRiskDimensionsCount(a);
        const bRisk = this.getAtRiskDimensionsCount(b);
        return bRisk - aRisk;
      });
    },
    moderateStudents() {
      return this.students.filter(student => {
        const atRiskCount = this.getAtRiskDimensionsCount(student);
        const hasModerate = this.hasModerateScores(student);
        // Moderate: no at-risk dimensions but has moderate scores
        return atRiskCount === 0 && hasModerate;
      });
    },
    healthyStudents() {
      return this.students.filter(student => {
        const atRiskCount = this.getAtRiskDimensionsCount(student);
        const isAllHealthy = this.isAllDimensionsHealthy(student);
        // Healthy: no at-risk dimensions and all dimensions are healthy
        return atRiskCount === 0 && isAllHealthy;
      });
    }
  },
  methods: {
    navigateToStudents(category) {
      this.currentView = category;
      this.searchQuery = '';
      this.collegeFilter = 'all';
      this.filterCurrentStudents();
    },
    backToDashboard() {
      this.currentView = 'dashboard';
    },
    getViewTitle() {
      switch(this.currentView) {
        case 'at-risk': return 'At Risk Students';
        case 'moderate': return 'Moderate Students';
        case 'healthy': return 'Healthy Students';
        default: return '';
      }
    },
    getViewDescription() {
      switch(this.currentView) {
        case 'at-risk': return 'Students with one or more at-risk dimensions requiring immediate attention';
        case 'moderate': return 'Students with moderate scores who may benefit from preventive interventions';
        case 'healthy': return 'Students with healthy scores across all dimensions';
        default: return '';
      }
    },
    filterCurrentStudents() {
      let students = [];
      
      switch(this.currentView) {
        case 'at-risk':
          students = [...this.atRiskStudents];
          break;
        case 'moderate':
          students = [...this.moderateStudents];
          break;
        case 'healthy':
          students = [...this.healthyStudents];
          break;
        default:
          students = [];
      }
      
      // Apply search filter
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        students = students.filter(student => 
          (student.name && student.name.toLowerCase().includes(query)) ||
          (student.id && student.id.toLowerCase().includes(query)) ||
          (student.section && student.section.toLowerCase().includes(query))
        );
      }
      
      // Apply college filter
      if (this.collegeFilter !== 'all') {
        students = students.filter(student => student.college === this.collegeFilter);
      }
      
      this.filteredCurrentStudents = students;
    },
    
    // Risk assessment methods
    isAtRisk(score) {
      return score <= this.riskThresholds.q1;
    },
    isHealthy(score) {
      return score >= this.riskThresholds.q4;
    },
    isModerate(score) {
      return score > this.riskThresholds.q1 && score < this.riskThresholds.q4;
    },
    hasAnyRiskDimension(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isAtRisk(student.subscales[subscale] * 7)) {
          return true;
        }
      }
      return false;
    },
    getAtRiskDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isAtRisk(student.subscales[subscale] * 7)) {
          count++;
        }
      }
      return count;
    },
    hasModerateScores(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isModerate(student.subscales[subscale] * 7)) {
          return true;
        }
      }
      return false;
    },
    getModerateDimensionsCount(student) {
      if (!student || !student.subscales) return 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && this.isModerate(student.subscales[subscale] * 7)) {
          count++;
        }
      }
      return count;
    },
    isAllDimensionsHealthy(student) {
      if (!student || !student.subscales) return false;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined && !this.isHealthy(student.subscales[subscale] * 7)) {
          return false;
        }
      }
      return true;
    },
    
    // Utility methods
    calculateOverallScore(student) {
      if (!student || !student.subscales) return 0;
      let total = 0;
      let count = 0;
      for (const subscale in student.subscales) {
        if (student.subscales[subscale] !== undefined) {
          total += student.subscales[subscale] * 7;
          count++;
        }
      }
      return count > 0 ? Math.round(total / count) : 0;
    },
    formatSubscaleName(subscale) {
      const dimension = this.ryffDimensionsList.find(d => d.key === subscale);
      return dimension ? dimension.name : subscale;
    },
    getDimensionColumnTitle() {
      switch(this.currentView) {
        case 'at-risk': return 'At-Risk Dimensions';
        case 'moderate': return 'Moderate Dimensions';
        case 'healthy': return 'Healthy Dimensions';
        default: return 'Dimension Status';
      }
    },
    getDimensionScoreColor(score) {
      if (score <= this.riskThresholds.q1) return '#f44336';  // Red for at risk
      if (score < this.riskThresholds.q4) return '#ff9800';  // Orange for moderate
      return '#4caf50';  // Green for healthy
    },
    getDimensionRiskClass(score) {
      if (score <= this.riskThresholds.q1) return 'high-risk';
      if (score < this.riskThresholds.q4) return 'medium-risk';
      return 'low-risk';
    },
    getDimensionRiskLabel(score) {
      if (score <= this.riskThresholds.q1) return 'At Risk';
      if (score < this.riskThresholds.q4) return 'Moderate';
      return 'Healthy';
    },
    viewStudentDetails(student) {
      this.selectedStudent = student;
      this.editableActionPlan = [...this.getActionPlan(student)];
      this.isEditingActionPlan = false;
      this.showDetailsModal = true;
    },
    
    // Action Plan Editing Methods
    toggleEditActionPlan() {
      if (this.isEditingActionPlan) {
        // Save changes
        this.isEditingActionPlan = false;
        this.$emit('action-plan-updated', {
          student: this.selectedStudent,
          actionPlan: this.editableActionPlan
        });
      } else {
        // Enter edit mode
        this.isEditingActionPlan = true;
      }
    },
    
    addActionItem() {
      this.editableActionPlan.push('');
    },
    
    removeActionItem(index) {
      this.editableActionPlan.splice(index, 1);
    },
    
    sendToStudent() {
      if (!this.selectedStudent || this.isEditingActionPlan) return;
      
      // Mark intervention as sent
      this.sentInterventions.add(this.selectedStudent.id);
      
      // Emit event to parent component to handle sending
      this.$emit('send-intervention', {
        student: this.selectedStudent,
        actionPlan: this.editableActionPlan,
        overallIntervention: this.getOverallIntervention(this.selectedStudent),
        dimensionInterventions: this.getDimensionInterventions(this.selectedStudent)
      });
      
      // Show success message (you can customize this)
      alert(`Intervention plan sent to ${this.selectedStudent.name}`);
      
      // Close modal
      this.showDetailsModal = false;
    },
    
    hasInterventionSent(student) {
      return this.sentInterventions.has(student?.id);
    },
    
    getDimensionInterventions(student) {
      const interventions = {};
      if (student?.subscales) {
        Object.entries(student.subscales).forEach(([subscale, score]) => {
          if (score !== undefined) {
            interventions[subscale] = this.getDimensionIntervention(subscale, score * 7);
          }
        });
      }
      return interventions;
    },
    
    bulkSendHealthyInterventions() {
      if (this.filteredCurrentStudents.length === 0) return;
      
      // Mark all students as having received interventions
      this.filteredCurrentStudents.forEach(student => {
        this.sentInterventions.add(student.id);
      });
      
      const bulkInterventions = this.filteredCurrentStudents.map(student => ({
        student: student,
        actionPlan: this.getActionPlan(student),
        overallIntervention: this.getOverallIntervention(student),
        dimensionInterventions: this.getDimensionInterventions(student)
      }));
      
      // Emit event to parent component to handle bulk sending
      this.$emit('bulk-send-interventions', {
        interventions: bulkInterventions,
        category: 'healthy',
        count: this.filteredCurrentStudents.length
      });
      
      // Show success message
      alert(`Intervention plans sent to ${this.filteredCurrentStudents.length} healthy students`);
    },
    
    // Intervention Methods
    getOverallRiskClass(student) {
      const overallScore = this.calculateOverallScore(student);
      if (overallScore <= this.riskThresholds.q1) return 'high-risk';
      if (overallScore < this.riskThresholds.q4) return 'medium-risk';
      return 'low-risk';
    },
    
    getOverallIntervention(student) {
      const overallScore = this.calculateOverallScore(student);
      const atRiskCount = this.getAtRiskDimensionsCount(student);
      
      if (atRiskCount >= 4) {
        return "Your assessment indicates significant challenges across multiple well-being dimensions. Consider scheduling regular counseling sessions, practicing daily mindfulness meditation, establishing a consistent sleep routine, and building a strong support network. Focus on small, achievable daily goals to gradually improve your overall mental health.";
      } else if (atRiskCount >= 2) {
        return "You're experiencing some challenges in key well-being areas. Try incorporating stress-reduction techniques like deep breathing exercises, maintain regular physical activity, and consider joining support groups or engaging in meaningful social activities. Setting weekly self-care goals can help improve your overall well-being.";
      } else if (atRiskCount === 1) {
        return "You're doing well overall with one area needing attention. Focus on targeted strategies for your specific challenge while maintaining your current positive habits. Regular self-reflection and maintaining work-life balance will help sustain your well-being.";
      } else if (overallScore < this.riskThresholds.q4) {
        return "You're in a good place mentally with room for growth. Continue building on your strengths through regular exercise, maintaining social connections, pursuing personal interests, and practicing gratitude. Consider setting new personal development goals to enhance your well-being further.";
      } else {
        return "Congratulations! You demonstrate exceptional psychological well-being and mental health resilience. Your scores reflect outstanding emotional maturity, strong coping skills, and excellent life satisfaction. You are thriving across all dimensions of well-being. Continue your positive practices and consider sharing your strategies with others who might benefit from your wisdom and experience.";
      }
    },
    
    getDimensionIntervention(subscale, score) {
      const interventions = {
        autonomy: {
          atRisk: "Practice assertiveness training, set personal boundaries, make independent decisions daily, and engage in activities that reflect your personal values and interests.",
          moderate: "Work on building confidence in decision-making, practice saying 'no' when needed, and explore activities that help you express your individuality.",
          healthy: "Excellent work! Your strong sense of autonomy is evident. You make confident, independent decisions and stay true to your values. Keep embracing your self-direction and consider mentoring others in developing their independence."
        },
        environmentalMastery: {
          atRisk: "Break down overwhelming tasks into smaller steps, create daily routines, practice problem-solving skills, and seek support when managing life challenges becomes difficult.",
          moderate: "Develop better organizational skills, practice time management techniques, and work on building confidence in handling daily responsibilities.",
          healthy: "Outstanding! You demonstrate excellent control over your environment and daily activities. Your organizational skills and ability to manage life's challenges are impressive strengths - keep it up!"
        },
        personalGrowth: {
          atRisk: "Set small, achievable learning goals, try new activities or hobbies, read self-development books, and consider working with a mentor or counselor to explore growth opportunities.",
          moderate: "Challenge yourself with new experiences, set personal development goals, and regularly reflect on your progress and areas for improvement.",
          healthy: "Fantastic! Your commitment to continuous learning and self-improvement is inspiring. You embrace new challenges and growth opportunities with enthusiasm - this is a wonderful strength to maintain."
        },
        positiveRelations: {
          atRisk: "Practice active listening, join social groups or clubs, work on communication skills, and consider therapy to address relationship patterns that may be causing difficulties.",
          moderate: "Focus on deepening existing relationships, practice empathy and understanding, and work on conflict resolution skills.",
          healthy: "Wonderful! You have strong, healthy relationships and excellent social skills. Your ability to connect meaningfully with others and maintain positive relationships is a valuable asset."
        },
        purposeInLife: {
          atRisk: "Explore your values and interests, volunteer for causes you care about, set meaningful short-term goals, and consider career or life counseling to help clarify your direction.",
          moderate: "Reflect on what gives your life meaning, set goals aligned with your values, and engage in activities that contribute to something larger than yourself.",
          healthy: "Excellent! You have a clear sense of direction and purpose in life. Your goals and values are well-aligned, and you find meaning in your activities - continue pursuing what matters most to you."
        },
        selfAcceptance: {
          atRisk: "Practice self-compassion exercises, challenge negative self-talk, keep a gratitude journal, and consider therapy to work on self-esteem and self-worth issues.",
          moderate: "Work on accepting your imperfections, practice positive self-talk, and focus on your strengths while acknowledging areas for growth.",
          healthy: "Great job! Your healthy self-regard and self-acceptance are admirable. You demonstrate excellent emotional maturity and self-awareness - these are wonderful qualities to celebrate and maintain."
        }
      };
      
      const dimension = interventions[subscale];
      if (!dimension) return "Continue working on this dimension with guidance from a mental health professional.";
      
      if (score <= this.riskThresholds.q1) return dimension.atRisk;
      if (score < this.riskThresholds.q4) return dimension.moderate;
      return dimension.healthy;
    },
    
    getActionPlan(student) {
      const actions = [];
      const atRiskCount = this.getAtRiskDimensionsCount(student);
      const overallScore = this.calculateOverallScore(student);
      
      // Immediate actions based on risk level
      if (atRiskCount >= 3) {
        actions.push("Schedule an appointment with a counselor within the next week");
        actions.push("Implement daily stress-reduction techniques (meditation, deep breathing)");
        actions.push("Establish a consistent sleep schedule (7-9 hours nightly)");
      } else if (atRiskCount >= 1) {
        actions.push("Consider scheduling a counseling session to address specific concerns");
        actions.push("Practice weekly self-reflection and journaling");
      }
      
      // General wellness actions
      if (overallScore < this.riskThresholds.q4) {
        actions.push("Engage in regular physical activity (30 minutes, 3-4 times per week)");
        actions.push("Connect with friends or family members regularly");
        actions.push("Set aside time for hobbies and activities you enjoy");
      }
      
      // Dimension-specific actions
      if (student?.subscales) {
        Object.entries(student.subscales).forEach(([subscale, score]) => {
          if (score !== undefined && this.isAtRisk(score * 7)) {
            switch(subscale) {
              case 'autonomy':
                actions.push("Practice making one independent decision daily");
                break;
              case 'environmentalMastery':
                actions.push("Create a daily organization system for tasks and responsibilities");
                break;
              case 'personalGrowth':
                actions.push("Set one small learning goal each week");
                break;
              case 'positiveRelations':
                actions.push("Reach out to one person in your support network weekly");
                break;
              case 'purposeInLife':
                actions.push("Spend time weekly reflecting on your values and goals");
                break;
              case 'selfAcceptance':
                actions.push("Practice daily self-compassion and positive self-talk");
                break;
            }
          }
        });
      }
      
      // Follow-up actions
      actions.push("Schedule a follow-up assessment in 4-6 weeks to track progress");
      
      return actions.slice(0, 6); // Limit to 6 most important actions
    }
  },
  watch: {
    currentView() {
      this.filterCurrentStudents();
    }
  },
  created() {
    this.filterCurrentStudents();
  }
};
</script>

<style scoped>
.ai-intervention-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Header Styles */
.intervention-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-title i {
  font-size: 2.5rem;
}

.header-title h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.header-title p {
  margin: 5px 0 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

/* Dashboard Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 5px solid;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.stat-card.at-risk {
  border-left-color: #f44336;
}

.stat-card.moderate {
  border-left-color: #ff9800;
}

.stat-card.healthy {
  border-left-color: #4caf50;
}

.card-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  opacity: 0.1;
  font-size: 4rem;
}

.stat-card.at-risk .card-icon {
  color: #f44336;
}

.stat-card.moderate .card-icon {
  color: #ff9800;
}

.stat-card.healthy .card-icon {
  color: #4caf50;
}

.card-content h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #333;
  font-weight: 600;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  margin: 10px 0;
}

.stat-card.at-risk .stat-number {
  color: #f44336;
}

.stat-card.moderate .stat-number {
  color: #ff9800;
}

.stat-card.healthy .stat-number {
  color: #4caf50;
}

.card-content p {
  margin: 10px 0;
  color: #666;
  font-size: 0.95rem;
}

.card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  color: #667eea;
  font-weight: 500;
}

/* List View Styles */
.list-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.back-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background: #5a67d8;
}

.list-title h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.list-title p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 1rem;
}

/* Filters */
.filters-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

/* Bulk Actions */
.bulk-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%);
  border-radius: 8px;
  border: 1px solid #c8e6c9;
}

.bulk-send-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.bulk-send-btn:hover {
  background: linear-gradient(135deg, #45a049 0%, #388e3c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-container i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-container input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
}

.filter-dropdowns {
  display: flex;
  gap: 15px;
}

.filter-dropdown {
  position: relative;
}

.filter-dropdown select {
  padding: 12px 40px 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
  appearance: none;
}

.filter-dropdown i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

/* Table Styles */
.data-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

.data-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.student-row:hover {
  background-color: #f8f9fa;
}

.student-id-cell {
  font-weight: 600;
  color: #667eea;
}

.student-name {
  font-weight: 500;
  color: #333;
}

/* Dimension Risk Styles */
.dimension-risk {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.risk-count {
  background: #f44336;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.risk-scores {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.risk-dimension-container {
  position: relative;
}

.risk-dimension-score {
  background: #f44336;
  color: white;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.risk-dimension-score:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.moderate-dimension .risk-dimension-score {
  background: #ff9800;
  color: white;
}

.moderate-dimension .risk-dimension-score:hover {
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.hover-label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.risk-dimension-score:hover .hover-label {
  opacity: 1;
}

.no-risk {
  color: #4caf50;
  font-weight: 500;
  font-size: 0.9rem;
}

.healthy-text {
  color: #4caf50;
  font-weight: 600;
  font-style: normal;
}

.moderate-count {
  background-color: #ffeb3b;
  color: #333;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.moderate-count:hover {
  box-shadow: 0 2px 4px rgba(255, 235, 59, 0.3);
}

.healthy-count {
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.healthy-count:hover {
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

/* Action Button */
.view-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.view-button:hover {
  background: #5a67d8;
}

.no-data {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 30px;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.intervention-modal {
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-button {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255,255,255,0.3);
}

.modal-body {
  padding: 25px;
}

.student-details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.student-profile h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.3rem;
}

.student-profile p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.assessment-summary {
  display: flex;
  align-items: center;
}

.overall-score {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 8px;
}

.score-label {
  font-weight: 600;
  color: #555;
}

.score-value {
  font-weight: bold;
  font-size: 1.2rem;
  padding: 4px 12px;
  border-radius: 6px;
}

.score-value.high-risk {
  background: #ffebee;
  color: #c62828;
}

.score-value.medium-risk {
  background: #fff3e0;
  color: #ef6c00;
}

.score-value.low-risk {
  background: #e8f5e8;
  color: #2e7d32;
}

/* Intervention Sections */
.intervention-section {
  margin-bottom: 30px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.overall-intervention {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #bbdefb;
}

.intervention-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
  padding: 20px 20px 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.intervention-content {
  padding: 0 20px 20px 20px;
}

.intervention-content p {
  margin: 0;
  color: #555;
  line-height: 1.6;
  font-size: 1rem;
}

/* Dimensions Grid */
.dimensions-intervention {
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 20px 20px 20px;
}

.dimension-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.dimension-card:hover {
  transform: translateY(-2px);
}

.dimension-card.at-risk {
  border-left-color: #f44336;
  background: linear-gradient(135deg, #ffebee 0%, #fff 100%);
}

.dimension-card.moderate {
  border-left-color: #ff9800;
  background: linear-gradient(135deg, #fff3e0 0%, #fff 100%);
}

.dimension-card.healthy {
  border-left-color: #4caf50;
  background: linear-gradient(135deg, #e8f5e8 0%, #fff 100%);
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dimension-name {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.dimension-score {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.dimension-score.high-risk {
  background: #ffcdd2;
  color: #c62828;
}

.dimension-score.medium-risk {
  background: #ffe0b2;
  color: #ef6c00;
}

.dimension-score.low-risk {
  background: #c8e6c9;
  color: #2e7d32;
}

.dimension-score.no-data {
  background: #f5f5f5;
  color: #757575;
}

.intervention-text p {
  margin: 0;
  color: #555;
  line-height: 1.5;
  font-size: 0.9rem;
}

.no-data-text p {
  margin: 0;
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
}

/* Action Plan */
.action-plan {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%);
  border: 1px solid #c8e6c9;
}

.action-plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
}

.action-plan-header h4 {
  margin: 0;
  color: #2e7d32;
  font-size: 1.1rem;
}

.edit-button {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-button:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.edit-button.editing {
  background: #2196f3;
}

.edit-button.editing:hover {
  background: #1976d2;
}

.action-items {
  padding: 0 20px 20px 20px;
}

.action-items-editable {
  padding: 0 20px 10px 20px;
}

.editable-action-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.drag-handle {
  color: #999;
  cursor: grab;
  margin-top: 8px;
}

.action-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 40px;
}

.action-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.remove-action-btn {
  background: #f44336;
  color: white;
  border: none;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.3s ease;
}

.remove-action-btn:hover {
  background: #d32f2f;
}

.add-action-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.add-action-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.action-plan-footer {
  padding: 15px 20px 20px 20px;
  border-top: 1px solid #e0e0e0;
  background: rgba(255, 255, 255, 0.5);
}

.send-to-student-btn {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.send-to-student-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.send-to-student-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
}

.action-item:last-child {
  margin-bottom: 0;
}

.action-item i {
  color: #4caf50;
  margin-top: 2px;
  flex-shrink: 0;
}

.action-item span {
  color: #333;
  line-height: 1.4;
  font-size: 0.95rem;
}

/* Intervention Status Styles */
.intervention-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-sent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4caf50;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-sent i {
  font-size: 0.9rem;
}

.status-pending {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff9800;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-pending i {
  font-size: 0.9rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-dropdowns {
    justify-content: stretch;
  }
  
  .filter-dropdown {
    flex: 1;
  }
  
  .student-details-header {
    flex-direction: column;
  }
  
  .subscale-grid {
    grid-template-columns: 1fr;
  }
}
</style>