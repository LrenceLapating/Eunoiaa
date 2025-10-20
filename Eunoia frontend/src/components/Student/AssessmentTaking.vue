<template>
  <div class="assessment-container fullscreen-assessment">
    <!-- Exit Button - Hidden as requested -->
    <!-- <button class="exit-btn" @click="exitAssessment" title="Return to Dashboard">
      <i class="fas fa-times"></i>
    </button> -->
    
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
    <!-- <div class="scale-reference">
      <h3>Rating Scale:</h3>
      <div class="scale-items">
        <div v-for="(label, value) in questionnaire.instructions.scale" :key="value" class="scale-item">
          <span class="scale-number">{{ value }}</span>
          <span class="scale-label">{{ label }}</span>
        </div>
      </div>
    </div> -->

    <!-- Question Section -->
    <div class="question-section">
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">Q{{ currentQuestionIndex + 1 }}</span>
          <!-- Show dimension info for testing - Question Number (1-84), Dimension Name, and ID -->
          <div class="dimension-info">
            <span class="question-order">Question {{ currentQuestion.id }}</span>
            <span class="dimension-name">{{ currentQuestionDimension }}</span>
            <span class="question-id">ID: {{ currentQuestion.id }}</span>
          </div>
        </div>
        
        <div class="question-text">
          {{ currentQuestion.text }}
        </div>

        <div class="response-options">
          <div class="rating-scale">
            <div 
              v-for="option in 6" 
              :key="option"
              :data-value="option"
              class="rating-option"
              :class="{ 'selected': responses[currentQuestion.id] === option }"
              @click="selectResponse(option, $event)"
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
          @click="nextQuestion"
        >
          Next
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <button 
          v-else
          class="nav-btn submit-btn"
          :disabled="!isAssessmentComplete"
          @click="submitAssessment()"
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

    <!-- Animated Emoji Component -->
    <AnimatedEmoji ref="animatedEmoji" />

    <!-- Custom Submission Confirmation Modal -->
    <div v-if="showSubmissionModal" class="modal-overlay" @click="closeSubmissionModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-check-circle"></i>
            Submit Assessment
          </h3>
        </div>
        
        <div class="modal-body">
          <div v-if="unansweredQuestions > 0" class="warning-section">
            <div class="warning-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="warning-content">
              <p class="warning-title">Incomplete Assessment</p>
              <p class="warning-message">
                You have <strong>{{ unansweredQuestions }}</strong> unanswered question{{ unansweredQuestions > 1 ? 's' : '' }}.
              </p>
              <p class="warning-note">
                Are you sure you want to submit your assessment with incomplete answers?
              </p>
            </div>
          </div>
          
          <div v-else class="success-section">
            <div class="success-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="success-content">
              <p class="success-title">Assessment Complete</p>
              <p class="success-message">
                All {{ totalQuestions }} questions have been answered.
              </p>
              <p class="success-note">
                Are you ready to submit your assessment? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeSubmissionModal">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button class="modal-btn confirm-btn" @click="confirmSubmission" :class="{ 'warning': unansweredQuestions > 0 }">
            <i class="fas fa-paper-plane"></i>
            {{ unansweredQuestions > 0 ? 'Submit Anyway' : 'Submit Assessment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ryff42ItemQuestionnaire } from '@/assets/ryff42ItemQuestionnaire'
import { ryff84ItemQuestionnaire } from '@/assets/ryff84ItemQuestionnaire'
import { ryff84ItemQuestionnaireOrdered } from '@/assets/ryff84ItemQuestionnaireOrdered'
import { ryff42ItemQuestionnaireOrdered } from '@/assets/ryff42ItemQuestionnaireOrdered'
import authService from '@/services/authService'
import { apiUrl } from '@/utils/apiUtils.js'
import AnimatedEmoji from './AnimatedEmoji.vue'

export default {
  name: 'AssessmentTaking',
  components: {
    AnimatedEmoji
  },
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
      startTime: null,
      questionStartTimes: {},
      isSubmitting: false,
      showCompletionSummary: false,
      showSubmissionModal: false, // For custom submission confirmation modal
      autoSaveInterval: null,
      saveProgressTimeout: null, // For debounced saving
      emojiId: 1
    }
  },
  computed: {
    questionnaire() {
      // For testing: Use original sequential order for 84-item (Q1=ID1, Q2=ID2, etc.)
      if (this.assessmentType === '84') {
        return ryff84ItemQuestionnaire
      } else {
        return ryff42ItemQuestionnaireOrdered
      }
      
      const baseQuestionnaire = this.assessmentType === '84' ? ryff84ItemQuestionnaire : ryff42ItemQuestionnaire
      
      // Create a copy and shuffle the items for each student (only for 42-item)
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
    },
    // Get dimension display name
    currentQuestionDimension() {
      const dimension = this.currentQuestion.dimension
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
    // Get question number within the dimension (based on original order, not shuffled)
    currentQuestionNumberInDimension() {
      const currentDimension = this.currentQuestion.dimension
      const originalQuestionnaire = this.assessmentType === '84' ? ryff84ItemQuestionnaire : ryff42ItemQuestionnaire
      const questionsInSameDimension = originalQuestionnaire.items
        .filter(item => item.dimension === currentDimension)
        .sort((a, b) => a.id - b.id) // Sort by original ID order
      const currentQuestionIndex = questionsInSameDimension.findIndex(item => item.id === this.currentQuestion.id)
      return currentQuestionIndex + 1
    },
    // Get total questions in current dimension
    totalQuestionsInDimension() {
      const currentDimension = this.currentQuestion.dimension
      const originalQuestionnaire = this.assessmentType === '84' ? ryff84ItemQuestionnaire : ryff42ItemQuestionnaire
      return originalQuestionnaire.items.filter(item => item.dimension === currentDimension).length
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
    
    // Add keyboard event listener for number keys 1-6
    document.addEventListener('keydown', this.handleKeyboardInput)
  },
  beforeUnmount() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
    
    // Clear debounced save timeout
    if (this.saveProgressTimeout) {
      clearTimeout(this.saveProgressTimeout)
    }
    
    this.saveProgress()
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeyboardInput)
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
    
    selectResponse(value, event) {
      this.responses[this.currentQuestion.id] = value
      
      // Debounced auto-save to prevent excessive API calls
      this.debouncedSaveProgress()
      
      // Trigger emoji animation at click position
      if (this.$refs.animatedEmoji && event) {
        const rect = event.currentTarget.getBoundingClientRect()
        const clickX = rect.left + rect.width / 2
        const clickY = rect.top + rect.height / 2
        this.$refs.animatedEmoji.triggerEmoji(value, clickX, clickY)
      }
      
      // Auto-advance to next question immediately
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.nextQuestion()
      } else {
        this.showCompletionSummary = true
      }
    },
    
    // Debounced save function to prevent excessive API calls
    debouncedSaveProgress() {
      if (this.saveProgressTimeout) {
        clearTimeout(this.saveProgressTimeout)
      }
      
      this.saveProgressTimeout = setTimeout(() => {
        this.saveProgress()
      }, 1000) // Save after 1 second of inactivity
    },
    
    handleKeyboardInput(event) {
      // Only handle keyboard input if not in an input field or textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }
      
      // Handle number keys 1-6 for answer selection
      const keyPressed = event.key
      if (keyPressed >= '1' && keyPressed <= '6') {
        event.preventDefault()
        const answerValue = parseInt(keyPressed)
        
        // Optimized DOM query - cache the selector
        const optionButton = document.querySelector(`[data-value="${answerValue}"]`)
        if (optionButton && this.$refs.animatedEmoji) {
          const rect = optionButton.getBoundingClientRect()
          const clickX = rect.left + rect.width / 2
          const clickY = rect.top + rect.height / 2
          this.$refs.animatedEmoji.triggerEmoji(answerValue, clickX, clickY)
        }
        
        this.selectResponse(answerValue)
      }
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
    async submitAssessment() {
      // Show custom modal instead of browser confirm
      this.showSubmissionModal = true
    },
    
    closeSubmissionModal() {
      this.showSubmissionModal = false
    },
    
    async confirmSubmission() {
      this.showSubmissionModal = false
      this.isSubmitting = true
      
      try {
        // Calculate total time taken in minutes
        const endTime = new Date()
        const timeTakenSeconds = Math.round((endTime - this.startTime) / 1000)
        const timeTakenMinutes = Math.max(1, Math.round(timeTakenSeconds / 60)) // Ensure at least 1 minute
        
        // Calculate time spent on each question
        const questionTimes = {}
        Object.keys(this.questionStartTimes).forEach(questionId => {
          const questionStartTime = this.questionStartTimes[questionId]
          if (questionStartTime) {
            questionTimes[questionId] = Math.round((endTime - questionStartTime) / 1000) // in seconds
          }
        })
        
        const submissionData = {
          responses: this.responses,
          timeTakenMinutes: timeTakenMinutes,
          questionTimes: questionTimes,
          startTime: this.startTime.toISOString(),
          endTime: endTime.toISOString()
        }
        
        console.log('Submitting assessment with timing data:', {
          timeTakenMinutes,
          totalQuestions: Object.keys(this.responses).length,
          unansweredQuestions: this.unansweredQuestions
        })
        
        const response = await fetch(apiUrl(`student-assessments/submit/${this.assignedAssessmentId}`), {
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
            await fetch(apiUrl(`student-assessments/progress/${this.assignedAssessmentId}`), {
              method: 'DELETE',
              credentials: 'include'
            })
          } catch (error) {
            console.error('Error clearing progress:', error)
          }
          
          // Emit assessment completion event to parent with timing data
          this.$emit('assessment-complete', {
            assessmentType: this.assessmentType,
            assignedAssessmentId: this.assignedAssessmentId,
            timeTakenMinutes: timeTakenMinutes,
            timeTakenSeconds: timeTakenSeconds,
            questionTimes: questionTimes,
            startTime: this.startTime.toISOString(),
            endTime: endTime.toISOString()
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to submit assessment')
        }
      } catch (error) {
        console.error('Error submitting assessment:', error)
        
        // More detailed error handling
        let errorMessage = 'There was an error submitting your assessment. '
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += 'Please check your internet connection and try again.'
        } else if (error.message.includes('timeout')) {
          errorMessage += 'The request timed out. Please try again.'
        } else {
          errorMessage += 'Please try again or contact support if the problem persists.'
        }
        
        alert(errorMessage)
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
      
      // Safety check: validate responses data
      if (typeof this.responses !== 'object' || this.responses === null) {
        console.error('Invalid responses data structure')
        return
      }
      
      try {
        const progressData = {
          currentQuestionIndex: Math.max(0, Math.min(this.currentQuestionIndex, this.totalQuestions - 1)),
          responses: this.sanitizeResponses(this.responses),
          startTime: this.startTime,
          assessmentType: `ryff_${this.assessmentType}`
        }
        
        console.log('Saving progress for assignment ID:', this.assignedAssessmentId)
        console.log('Progress data:', progressData)
        
        const response = await fetch(apiUrl(`student-assessments/progress/${this.assignedAssessmentId}`), {
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
        // Don't show alert for save errors to avoid disrupting user experience
      }
    },
    
    // Sanitize responses to ensure data integrity
    sanitizeResponses(responses) {
      const sanitized = {}
      
      Object.keys(responses).forEach(questionId => {
        const response = responses[questionId]
        
        // Validate response is a number between 1-6
        if (typeof response === 'number' && response >= 1 && response <= 6 && Number.isInteger(response)) {
          sanitized[questionId] = response
        } else {
          console.warn(`Invalid response for question ${questionId}:`, response)
        }
      })
      
      return sanitized
    },
    
    // Safe question navigation with bounds checking
    goToQuestion(index) {
      if (typeof index !== 'number' || index < 0 || index >= this.totalQuestions) {
        console.warn('Invalid question index:', index)
        return
      }
      
      this.currentQuestionIndex = index
      this.questionStartTimes[this.currentQuestion.id] = new Date()
    },
    async loadProgress() {
      if (!this.assignedAssessmentId) {
        console.warn('Cannot load progress: no assignedAssessmentId')
        return
      }
      
      try {
        console.log('Loading progress for assignment ID:', this.assignedAssessmentId)
        
        const response = await fetch(apiUrl(`student-assessments/progress/${this.assignedAssessmentId}`), {
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
  align-items: flex-start; /* Align items to the top */
  max-width: 1200px; /* Limit content width */
  margin: 0 auto; /* Center the content */
  gap: 20px; /* Add gap between assessment info and progress */
}

.assessment-info {
  flex-grow: 1;
  /* margin-right: 20px; Removed as gap handles spacing */
}

.assessment-title {
  font-size: 2.2rem; /* Slightly larger font size */
  font-weight: 700;
  color: #212529;
  margin: 0 0 10px 0; /* Adjusted margin */
  line-height: 1.2;
}

.assessment-description {
  font-size: 1.05rem; /* Slightly larger font size */
  color: #6c757d;
  margin: 0;
  line-height: 1.6;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* Align progress text and bar to the right */
  min-width: 180px; /* Ensure progress section has enough space */
  text-align: right; /* Align text within progress section to the right */
}

.progress-info {
  display: flex;
  gap: 8px;
  font-size: 0.95rem; /* Slightly larger font size */
  color: #495057;
  margin-bottom: 8px;
}

.progress-percentage {
  font-weight: 600;
  color: #0d6efd;
}

.progress-bar {
  width: 150px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #0d6efd, #00bfff);
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
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

.dimension-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.question-order {
  font-size: 0.875rem;
  font-weight: 600;
  color: #28a745;
  letter-spacing: 0.5px;
}

.dimension-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0d6efd;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-id {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.dimension-question-number {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}



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
  background: #fff3cd;
  border-color: #ffc107;
  position: relative;
  animation: pulse-warning 2s infinite;
}

.indicator-dot.unanswered::after {
  content: '!';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 6px;
  font-weight: bold;
  color: #856404;
}

@keyframes pulse-warning {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
  }
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

/* Custom Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}
  
  .modal-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
  }
  
  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 24px;
    text-align: center;
  }
  
  .modal-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  
  .modal-title i {
    font-size: 1.75rem;
  }
  
  .modal-body {
    padding: 32px 24px;
  }
  
  .warning-section, .success-section {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  
  .warning-icon, .success-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .warning-icon {
    background: #fef3cd;
    color: #856404;
  }
  
  .success-icon {
    background: #d1ecf1;
    color: #0c5460;
  }
  
  .warning-content, .success-content {
    flex: 1;
  }
  
  .warning-title, .success-title {
    margin: 0 0 8px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }
  
  .warning-message, .success-message {
    margin: 0 0 12px 0;
    font-size: 1rem;
    color: #555;
    line-height: 1.5;
  }
  
  .warning-note, .success-note {
    margin: 0;
    font-size: 0.95rem;
    color: #666;
    line-height: 1.4;
  }
  
  .modal-footer {
    padding: 20px 24px;
    background: #f8f9fa;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    border-top: 1px solid #e9ecef;
  }
  
  .modal-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    min-width: 120px;
    justify-content: center;
  }
  
  .cancel-btn {
    background: #6c757d;
    color: white;
  }
  
  .cancel-btn:hover {
    background: #5a6268;
    transform: translateY(-1px);
  }
  
  .confirm-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
  }
  
  .confirm-btn:hover {
    background: linear-gradient(135deg, #218838 0%, #1ea080 100%);
    transform: translateY(-1px);
  }
  
  .confirm-btn.warning {
    background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
  }
  
  .confirm-btn.warning:hover {
    background: linear-gradient(135deg, #c82333 0%, #e8650e 100%);
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Responsive Modal Styles */
  @media (max-width: 768px) {
    .assessment-header {
      padding: 16px 20px;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }

    .assessment-title {
      font-size: 1.8rem;
      margin-bottom: 8px;
    }

    .assessment-description {
      font-size: 0.95rem;
    }

    .progress-section {
      width: 100%;
      align-items: flex-start;
      text-align: left;
    }

    .progress-info {
      width: 100%;
      justify-content: space-between;
    }

    .progress-bar {
      width: 100%;
    }

    .question-card {
      padding: 20px;
    }

    .question-text {
      font-size: 1.05rem;
    }

    .rating-scale {
      max-width: 100%;
    }

    .rating-option {
      padding: 10px 5px;
    }

    .nav-buttons {
      flex-wrap: wrap;
      justify-content: center;
    }

    .nav-btn {
      flex: 1 1 auto;
      min-width: 100px;
    }

    .question-indicator {
      flex: none;
      width: 100%;
      margin-top: 15px;
    }

    .indicator-dots {
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .warning-section, .success-section {
      flex-direction: column;
      text-align: center;
    }
    
    .warning-icon, .success-icon {
      align-self: center;
    }

    .rating-scale {
      flex-wrap: wrap;
      justify-content: center;
    }

    .rating-option {
      flex: 0 0 45%; /* Allow two options per row with some spacing */
      max-width: 45%;
      padding: 10px 5px;
    }

    .rating-label {
      font-size: 0.65rem;
    }

    .nav-buttons {
      flex-direction: column;
    }

    .nav-btn {
      width: 100%;
      min-width: unset;
    }
  }
  
  @media (max-width: 480px) {
    .modal-body {
      padding: 24px 20px;
    }
    
    .modal-footer {
      padding: 16px 20px;
      flex-direction: column;
    }
    
    .modal-btn {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .modal-body {
      padding: 24px 20px;
    }
    
    .modal-footer {
      padding: 16px 20px;
      flex-direction: column;
    }
    
    .modal-btn {
      width: 100%;
    }
  }


@media (max-width: 480px) {
    .assessment-header {
      padding: 12px 16px;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .assessment-title {
      font-size: 1.5rem;
      margin-bottom: 5px;
    }

    .assessment-description {
      font-size: 0.875rem;
    }

    .progress-section {
      width: 100%;
      align-items: flex-start;
      text-align: left;
    }

    .progress-info {
      font-size: 0.8rem;
      width: 100%;
      justify-content: space-between;
    }

    .progress-bar {
      width: 100%;
    }

    .question-card {
      padding: 16px;
    }

    .question-text {
      font-size: 1rem;
    }

    .question-number {
      width: 28px;
      height: 28px;
      font-size: 0.75rem;
    }

    .navigation-section {
      padding: 16px;
    }

    .indicator-dots {
      gap: 4px;
    }

    .indicator-dot {
      width: 6px;
      height: 6px;
    }

    .completion-summary {
      padding: 24px 16px;
    }

    .summary-card h3 {
      font-size: 1.1rem;
    }

    .summary-stats {
      flex-direction: column;
      gap: 10px;
    }

    .stat-item {
      min-width: unset;
      width: 100%;
      padding: 12px;
    }

    .stat-number {
      font-size: 1.3rem;
    }

    .stat-label {
      font-size: 0.7rem;
    }

    .question-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }
</style>