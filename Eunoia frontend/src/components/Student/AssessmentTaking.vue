<template>
  <div class="assessment-container fullscreen-assessment">
    <!-- Exit Button -->
    <button class="exit-btn" @click="exitAssessment" title="Return to Dashboard">
      <i class="fas fa-times"></i>
    </button>
    
    <!-- Header Section -->
    <div class="assessment-header">
      <div class="header-content">
        <div class="assessment-info">
          <h1 class="assessment-title">{{ questionnaire.instructions.title }}</h1>
          <p class="assessment-description">{{ questionnaire.instructions.description }}</p>
        </div>
        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}</span>
            <span class="progress-percentage">{{ Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: ((currentQuestionIndex + 1) / totalQuestions) * 100 + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scale Reference -->
    <div class="scale-reference">
      <h3>Rating Scale:</h3>
      <div class="scale-items">
        <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="scale-item">
          <span class="scale-number">{{ value }}</span>
          <span class="scale-label">{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- Question Section -->
    <div class="question-section">
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">Q{{ currentQuestion.id }}</span>
          <span class="dimension-badge" :class="getDimensionClass(currentQuestion.dimension)">
            {{ formatDimensionName(currentQuestion.dimension) }}
          </span>
        </div>
        
        <div class="question-text">
          {{ currentQuestion.text }}
        </div>

        <div class="response-options">
          <div class="rating-scale">
            <div 
              v-for="option in 6" 
              :key="option"
              class="rating-option"
              :class="{ 'selected': responses[currentQuestion.id] === option }"
              @click="selectResponse(option)"
            >
              <div class="rating-circle">
                <span class="rating-number">{{ option }}</span>
              </div>
              <div class="rating-label">{{ questionnaire.instructions.scale[option] }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Section -->
    <div class="navigation-section">
      <div class="nav-buttons">
        <button 
          class="nav-btn prev-btn"
          :disabled="currentQuestionIndex === 0"
          @click="previousQuestion"
        >
          <i class="fas fa-chevron-left"></i>
          Previous
        </button>
        
        <div class="question-indicator">
          <div class="indicator-dots">
            <div 
              v-for="(question, index) in questionnaire.items" 
              :key="question.id"
              class="indicator-dot"
              :class="{
                'current': index === currentQuestionIndex,
                'answered': responses[question.id] !== undefined,
                'unanswered': responses[question.id] === undefined
              }"
              @click="goToQuestion(index)"
            ></div>
          </div>
        </div>

        <button 
          v-if="currentQuestionIndex < totalQuestions - 1"
          class="nav-btn next-btn"
          :disabled="!responses[currentQuestion.id]"
          @click="nextQuestion"
        >
          Next
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <button 
          v-else
          class="nav-btn submit-btn"
          :disabled="!isAssessmentComplete"
          @click="submitAssessment"
        >
          <i class="fas fa-check"></i>
          Submit Assessment
        </button>
      </div>
    </div>

    <!-- Completion Summary -->
    <div v-if="showCompletionSummary" class="completion-summary">
      <div class="summary-card">
        <h3>Assessment Progress</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-number">{{ answeredQuestions }}</span>
            <span class="stat-label">Answered</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ unansweredQuestions }}</span>
            <span class="stat-label">Remaining</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ Math.round((answeredQuestions / totalQuestions) * 100) }}%</span>
            <span class="stat-label">Complete</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isSubmitting" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Submitting your assessment...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ryff42ItemQuestionnaire } from '@/assets/ryff42ItemQuestionnaire'
import { ryff84ItemQuestionnaire } from '@/assets/ryff84ItemQuestionnaire'
import authService from '@/services/authService'

export default {
  name: 'AssessmentTaking',
  props: {
    assessmentType: {
      type: String,
      default: '42',
      validator: value => ['42', '84'].includes(value)
    },
    assignedAssessmentId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      currentQuestionIndex: 0,
      responses: {},
      isSubmitting: false,
      showCompletionSummary: false,
      startTime: null,
      questionStartTimes: {}
    }
  },
  computed: {
    questionnaire() {
      const baseQuestionnaire = this.assessmentType === '84' ? ryff84ItemQuestionnaire : ryff42ItemQuestionnaire
      
      // Create a copy and shuffle the items for each student
      const shuffledQuestionnaire = {
        ...baseQuestionnaire,
        items: this.shuffleArray([...baseQuestionnaire.items])
      }
      
      return shuffledQuestionnaire
    },
    totalQuestions() {
      return this.questionnaire.items.length
    },
    currentQuestion() {
      return this.questionnaire.items[this.currentQuestionIndex]
    },
    answeredQuestions() {
      return Object.keys(this.responses).length
    },
    unansweredQuestions() {
      return this.totalQuestions - this.answeredQuestions
    },
    isAssessmentComplete() {
      return this.answeredQuestions === this.totalQuestions
    }
  },
  async mounted() {
    console.log('AssessmentTaking mounted with props:', {
      assessmentType: this.assessmentType,
      assignedAssessmentId: this.assignedAssessmentId
    })
    
    if (!this.assignedAssessmentId) {
      console.error('No assignedAssessmentId provided to AssessmentTaking component')
      alert('Error: No assessment ID provided. Please return to dashboard and try again.')
      this.$emit('return-to-dashboard')
      return
    }
    
    this.startTime = new Date()
    this.questionStartTimes[this.currentQuestion.id] = new Date()
    
    // Auto-save progress every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveProgress()
    }, 30000)
    
    // Load any existing progress
    await this.loadProgress()
  },
  beforeUnmount() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
    this.saveProgress()
  },
  methods: {
    // Fisher-Yates shuffle algorithm to randomize question order
    shuffleArray(array) {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    },
    
    selectResponse(value) {
      this.responses[this.currentQuestion.id] = value
      
      // Auto-advance to next question after a short delay
      setTimeout(() => {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
          this.nextQuestion()
        } else {
          this.showCompletionSummary = true
        }
      }, 500)
    },
    
    nextQuestion() {
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.currentQuestionIndex++
        this.questionStartTimes[this.currentQuestion.id] = new Date()
      }
    },
    
    previousQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
        this.questionStartTimes[this.currentQuestion.id] = new Date()
      }
    },
    
    goToQuestion(index) {
      this.currentQuestionIndex = index
      this.questionStartTimes[this.currentQuestion.id] = new Date()
    },
    
    async submitAssessment() {
      if (!this.isAssessmentComplete) {
        alert('Please answer all questions before submitting.')
        return
      }
      
      this.isSubmitting = true
      
      try {
        const submissionData = {
          responses: this.responses
        }
        
        const response = await fetch(`http://localhost:3000/api/student-assessments/submit/${this.assignedAssessmentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(submissionData)
        })
        
        if (response.ok) {
          // Clear saved progress from database
          try {
            await fetch(`http://localhost:3000/api/student-assessments/progress/${this.assignedAssessmentId}`, {
              method: 'DELETE',
              credentials: 'include'
            })
          } catch (error) {
            console.error('Error clearing progress:', error)
          }
          
          // Emit assessment completion event to parent
          this.$emit('assessment-complete', {
            assessmentType: this.assessmentType,
            assignedAssessmentId: this.assignedAssessmentId
          })
        } else {
          throw new Error('Failed to submit assessment')
        }
      } catch (error) {
        console.error('Error submitting assessment:', error)
        alert('There was an error submitting your assessment. Please try again.')
      } finally {
        this.isSubmitting = false
      }
    },
    
    exitAssessment() {
      if (confirm('Are you sure you want to exit the assessment? Your progress will be saved.')) {
        this.saveProgress()
        this.$emit('return-to-dashboard')
      }
    },
    
    async saveProgress() {
      if (!this.assignedAssessmentId) {
        console.warn('Cannot save progress: no assignedAssessmentId')
        return
      }
      
      try {
        const progressData = {
          currentQuestionIndex: this.currentQuestionIndex,
          responses: this.responses,
          startTime: this.startTime,
          assessmentType: `ryff_${this.assessmentType}`
        }
        
        console.log('Saving progress for assignment ID:', this.assignedAssessmentId)
        console.log('Progress data:', progressData)
        
        const response = await fetch(`http://localhost:3000/api/student-assessments/progress/${this.assignedAssessmentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(progressData)
        })
        
        if (!response.ok) {
          console.error('Save progress failed:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        } else {
          console.log('Progress saved successfully')
        }
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    },
    
    async loadProgress() {
      if (!this.assignedAssessmentId) {
        console.warn('Cannot load progress: no assignedAssessmentId')
        return
      }
      
      try {
        console.log('Loading progress for assignment ID:', this.assignedAssessmentId)
        
        const response = await fetch(`http://localhost:3000/api/student-assessments/progress/${this.assignedAssessmentId}`, {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Progress loaded:', result)
          if (result.success && result.data) {
            const progressData = result.data
            this.currentQuestionIndex = progressData.current_question_index || 0
            this.responses = progressData.responses || {}
            this.startTime = new Date(progressData.start_time) || new Date()
            console.log('Progress restored - Question:', this.currentQuestionIndex, 'Responses:', Object.keys(this.responses).length)
          } else {
            console.log('No existing progress found')
          }
        } else {
          console.error('Load progress failed:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }
    },
    
    formatDimensionName(dimension) {
      const dimensionNames = {
        autonomy: 'Autonomy',
        environmentalMastery: 'Environmental Mastery',
        personalGrowth: 'Personal Growth',
        positiveRelations: 'Positive Relations with Others',
        purposeInLife: 'Purpose in Life',
        selfAcceptance: 'Self-Acceptance'
      }
      return dimensionNames[dimension] || dimension
    },
    
    getDimensionClass(dimension) {
      const classMap = {
        autonomy: 'dimension-autonomy',
        environmentalMastery: 'dimension-environmental',
        personalGrowth: 'dimension-growth',
        positiveRelations: 'dimension-relations',
        purposeInLife: 'dimension-purpose',
        selfAcceptance: 'dimension-acceptance'
      }
      return classMap[dimension] || 'dimension-default'
    }
  }
}
</script>

<style scoped>
.assessment-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.fullscreen-assessment {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 0;
  box-sizing: border-box;
}

.exit-btn {
  position: fixed;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6c757d;
  transition: all 0.2s ease;
  z-index: 10000;
}

.exit-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.exit-btn:active {
  transform: none;
}

.assessment-header {
  background: #ffffff;
  border-bottom: 1px solid #dee2e6;
  padding: 20px 24px;
  margin-bottom: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.assessment-info {
  flex: 1;
}

.assessment-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.assessment-description {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.4;
}

.progress-section {
  min-width: 250px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 0.875rem;
  color: #495057;
  font-weight: 500;
}

.progress-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0d6efd;
}

.progress-bar {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0d6efd;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.scale-reference {
  background: #ffffff;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
  padding: 16px 24px;
  margin-bottom: 0;
}

.scale-reference h3 {
  margin: 0 0 12px 0;
  color: #212529;
  font-size: 1rem;
  font-weight: 600;
}

.scale-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.scale-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  font-size: 0.875rem;
}

.scale-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #0d6efd;
  color: white;
  border-radius: 3px;
  font-weight: 600;
  font-size: 0.75rem;
}

.scale-label {
  font-size: 0.875rem;
  color: #495057;
  font-weight: 500;
}

.question-section {
  margin-bottom: 30px;
}

.question-card {
  background: #ffffff;
  border: 1px solid #dee2e6;
  padding: 24px;
  margin-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.question-number {
  background: #0d6efd;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.dimension-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dimension-autonomy { background: #fed7d7; color: #c53030; }
.dimension-environmental { background: #c6f6d5; color: #2f855a; }
.dimension-growth { background: #bee3f8; color: #2b6cb0; }
.dimension-relations { background: #fbb6ce; color: #b83280; }
.dimension-purpose { background: #faf089; color: #744210; }
.dimension-acceptance { background: #d6bcfa; color: #553c9a; }

.question-text {
  font-size: 1.1rem;
  line-height: 1.5;
  color: #212529;
  margin-bottom: 24px;
  font-weight: 500;
}

.response-options {
  margin-top: 24px;
}

.rating-scale {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  max-width: 500px;
  margin: 0 auto;
}

.rating-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
}

.rating-option:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.rating-option.selected {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.rating-circle {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: #ffffff;
  border: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: #495057;
  transition: all 0.2s ease;
}

.rating-option.selected .rating-circle {
  background: #ffffff;
  color: #0d6efd;
  border-color: #ffffff;
}

.rating-option.selected .rating-label {
  color: #ffffff;
  font-weight: 600;
}

.rating-label {
  font-size: 0.75rem;
  text-align: center;
  font-weight: 500;
  color: #6c757d;
  line-height: 1.3;
  transition: all 0.2s ease;
}

.navigation-section {
  background: #ffffff;
  border-top: 1px solid #dee2e6;
  padding: 20px 24px;
  margin-top: 0;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
  background: #ffffff;
  color: #495057;
}

.prev-btn {
  background: #ffffff;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.prev-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.next-btn {
  background: #0d6efd;
  color: #ffffff;
  border: 1px solid #0d6efd;
}

.next-btn:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0b5ed7;
}

.submit-btn {
  background: #198754;
  color: #ffffff;
  border: 1px solid #198754;
}

.submit-btn:hover:not(:disabled) {
  background: #157347;
  border-color: #157347;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa !important;
  border-color: #dee2e6 !important;
  color: #6c757d !important;
}

.question-indicator {
  flex: 1;
  display: flex;
  justify-content: center;
}

.indicator-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;
}

.indicator-dot.answered {
  background: #198754;
  border-color: #198754;
}

.indicator-dot.unanswered {
  background: #e9ecef;
  border-color: #dee2e6;
}

.indicator-dot.current {
  background: #0d6efd;
  border-color: #0d6efd;
  transform: scale(1.2);
}

.indicator-dot:hover {
  transform: scale(1.1);
}

.completion-summary {
  background: #ffffff;
  border: 1px solid #dee2e6;
  padding: 32px;
  margin-top: 20px;
  text-align: center;
}

.summary-card h3 {
  margin: 0 0 20px 0;
  color: #212529;
  font-size: 1.3rem;
  text-align: center;
  font-weight: 600;
}

.summary-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  min-width: 80px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0d6efd;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(248, 249, 250, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: #ffffff;
  padding: 32px;
  border-radius: 4px;
  text-align: center;
  border: 1px solid #dee2e6;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .assessment-container {
    padding: 0;
  }

  .fullscreen-assessment {
    padding: 0;
  }

  .assessment-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .progress-section {
    min-width: auto;
    width: 100%;
  }

  .assessment-title {
    font-size: 1.25rem;
  }

  .question-card {
    padding: 20px;
  }

  .question-text {
    font-size: 1rem;
  }

  .rating-scale {
    flex-direction: column;
    gap: 8px;
    max-width: 300px;
  }

  .rating-option {
    flex-direction: row;
    justify-content: flex-start;
    padding: 10px 12px;
  }

  .rating-circle {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }

  .rating-label {
    font-size: 0.875rem;
    text-align: left;
  }

  .navigation-section {
    padding: 16px 20px;
  }

  .nav-buttons {
    gap: 12px;
  }

  .nav-btn {
    padding: 8px 16px;
    font-size: 0.875rem;
    min-width: 100px;
  }

  .question-indicator {
    padding: 12px 20px;
  }

  .scale-items {
    flex-direction: column;
    gap: 8px;
  }

  .scale-item {
    padding: 6px 10px;
  }

  .summary-stats {
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .assessment-header {
    padding: 12px 16px;
  }

  .assessment-title {
    font-size: 1.125rem;
  }

  .assessment-description {
    font-size: 0.875rem;
  }

  .question-card {
    padding: 16px;
  }

  .question-text {
    font-size: 0.9rem;
  }

  .rating-option {
    padding: 8px 10px;
  }

  .rating-circle {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .rating-label {
    font-size: 0.75rem;
  }

  .navigation-section {
    padding: 12px 16px;
  }

  .nav-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
    min-width: 80px;
  }

  .scale-reference {
    padding: 12px 16px;
  }

  .question-indicator {
    padding: 10px 16px;
  }

  .stat-item {
    padding: 10px;
  }

  .stat-number {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .question-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>