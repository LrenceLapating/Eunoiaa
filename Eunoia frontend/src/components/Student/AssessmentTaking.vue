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
        positiveRelations: 'Positive Relations',
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.exit-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #4a5568;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 10000;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.exit-btn:active {
  transform: scale(0.95);
}

.assessment-header {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
}

.assessment-info {
  flex: 1;
}

.assessment-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 10px 0;
  line-height: 1.2;
}

.assessment-description {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
  line-height: 1.5;
}

.progress-section {
  min-width: 300px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-text {
  font-size: 1rem;
  color: #4a5568;
  font-weight: 500;
}

.progress-percentage {
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.scale-reference {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.scale-reference h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
}

.scale-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.scale-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.scale-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9rem;
}

.scale-label {
  font-size: 0.95rem;
  color: #4a5568;
  font-weight: 500;
}

.question-section {
  margin-bottom: 30px;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.question-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #667eea;
  background: #edf2f7;
  padding: 8px 16px;
  border-radius: 20px;
}

.dimension-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
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
  font-size: 1.3rem;
  line-height: 1.6;
  color: #2d3748;
  margin-bottom: 35px;
  font-weight: 500;
}

.response-options {
  margin-top: 30px;
}

.rating-scale {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 15px;
}

.rating-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 10px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.rating-option:hover {
  border-color: #667eea;
  background: #f0f4ff;
  transform: translateY(-2px);
}

.rating-option.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.rating-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.rating-option.selected .rating-circle {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.rating-label {
  font-size: 0.85rem;
  text-align: center;
  font-weight: 500;
  line-height: 1.3;
}

.navigation-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.prev-btn {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.prev-btn:hover:not(:disabled) {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.next-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.submit-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.question-indicator {
  flex: 1;
  display: flex;
  justify-content: center;
}

.indicator-dots {
  display: flex;
  gap: 6px;
  max-width: 400px;
  flex-wrap: wrap;
  justify-content: center;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator-dot.answered {
  background: #48bb78;
}

.indicator-dot.unanswered {
  background: #e2e8f0;
}

.indicator-dot.current {
  background: #667eea;
  transform: scale(1.5);
}

.completion-summary {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.summary-card h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 1.3rem;
  text-align: center;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .assessment-container {
    padding: 15px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .progress-section {
    min-width: auto;
    width: 100%;
  }
  
  .assessment-title {
    font-size: 1.8rem;
  }
  
  .question-card {
    padding: 25px;
  }
  
  .question-text {
    font-size: 1.1rem;
  }
  
  .rating-scale {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .rating-option {
    padding: 15px 8px;
  }
  
  .nav-buttons {
    flex-direction: column;
    gap: 15px;
  }
  
  .nav-btn {
    width: 100%;
  }
  
  .question-indicator {
    order: -1;
    margin-bottom: 15px;
  }
  
  .scale-items {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .rating-scale {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .question-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>