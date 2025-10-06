<template>
  <div class="completion-container">
    <!-- Main Content -->
    <div class="completion-content">
      <div class="container">
        <div class="completion-card">
          <!-- Success Icon -->
          <div class="success-icon">
            <div class="logo-circle">
              <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="completion-logo">
            </div>
          </div>
          
          <h1 class="completion-title">Assessment Complete!</h1>
          <p class="completion-message">
            Thank you for completing the {{ assessmentTitle }}. Your responses have been successfully submitted and will be reviewed by our counseling team.
          </p>

          <!-- Assessment Summary -->
          <div class="assessment-summary">
            <div class="summary-item">
              <i class="fas fa-clipboard-check"></i>
              <div class="summary-content">
                <span class="summary-label">Assessment Type</span>
                <span class="summary-value">{{ assessmentTitle }}</span>
              </div>
            </div>
            
            <div class="summary-item">
              <i class="fas fa-calendar-alt"></i>
              <div class="summary-content">
                <span class="summary-label">Completed On</span>
                <span class="summary-value">{{ formatDate(new Date()) }}</span>
              </div>
            </div>
            
            <div class="summary-item">
              <i class="fas fa-clock"></i>
              <div class="summary-content">
                <span class="summary-label">Time Taken</span>
                <span class="summary-value">{{ estimatedTime }}</span>
              </div>
            </div>
          </div>

          <!-- What's Next -->
          <div class="next-info">
            <h3>What's Next?</h3>
            <p>Your responses will be reviewed by our counseling team. If any follow-up is needed, you'll be contacted directly.</p>
          </div>

          <!-- Action Button -->
          <div class="action-section">
            <button class="btn btn-primary" @click="returnToDashboard">
              <i class="fas fa-home"></i>
              Return to Dashboard
            </button>
          </div>

          <!-- Support Contact -->
          <div class="support-info">
            <p class="support-text">Questions? Contact our counseling team</p>
            <div class="contact-methods">
              <a href="mailto:counseling@university.edu" class="contact-link">
                <i class="fas fa-envelope"></i>
                counseling@university.edu
              </a>
              <a href="tel:+1234567890" class="contact-link">
                <i class="fas fa-phone"></i>
                (123) 456-7890
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssessmentComplete',
  props: {
    assessmentType: {
      type: String,
      default: '42',
      validator: value => ['42', '84'].includes(value)
    },
    timeTakenMinutes: {
      type: Number,
      default: null
    },
    timeTakenSeconds: {
      type: Number,
      default: null
    },
    assignedAssessmentId: {
      type: String,
      default: null
    }
  },
  computed: {
    assessmentTitle() {
      return `Ryff Psychological Well-being Scale (${this.assessmentType}-Item Version)`
    },
    estimatedTime() {
      if (this.timeTakenSeconds !== null && this.timeTakenSeconds !== undefined) {
        const totalSeconds = this.timeTakenSeconds
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        
        if (minutes === 0) {
          return `${seconds} second${seconds !== 1 ? 's' : ''}`
        } else if (seconds === 0) {
          return `${minutes} minute${minutes !== 1 ? 's' : ''}`
        } else {
          return `${minutes} min ${seconds} sec`
        }
      } else if (this.timeTakenMinutes !== null && this.timeTakenMinutes !== undefined) {
        if (this.timeTakenMinutes < 1) {
          return 'Less than 1 minute'
        } else if (this.timeTakenMinutes === 1) {
          return '1 minute'
        } else {
          return `${this.timeTakenMinutes} minutes`
        }
      } else {
        const minutes = this.assessmentType === '84' ? '25-30' : '15-20'
        return `${minutes} minutes`
      }
    }
  },
  mounted() {
    this.animateCompletion()
  },
  methods: {
    formatDate(date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    returnToDashboard() {
      this.$emit('return-to-dashboard')
    },
    
    animateCompletion() {
      setTimeout(() => {
        const checkmark = document.querySelector('.checkmark')
        if (checkmark) {
          checkmark.style.animation = 'checkmark 0.6s ease-in-out'
        }
      }, 500)
    }
  }
}
</script>

<style scoped>
:root {
  --primary: #00b3b0;
  --primary-dark: #008b89;
  --success: #48bb78;
  --success-dark: #38a169;
  --text-primary: #2d3748;
  --text-secondary: #718096;
  --bg-light: #f8fffe;
}

.completion-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.completion-content {
  width: 100%;
  max-width: 600px;
}

.container {
  width: 100%;
}

.completion-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-icon {
  margin-bottom: 32px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  animation: scaleIn 0.5s ease-out;
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
  padding: 16px;
}

.completion-logo {
  width: 48px;
  height: 48px;
  filter: brightness(0) invert(1);
  opacity: 0;
  animation: logoFadeIn 0.8s ease-out 0.3s forwards;
}

@keyframes logoFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}



.completion-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
}

.completion-message {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 40px;
}

.assessment-summary {
  background: var(--bg-light);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.summary-item i {
  width: 24px;
  height: 24px;
  color: var(--primary);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-content {
  flex: 1;
}

.summary-label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 2px;
}

.summary-value {
  display: block;
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
}

.next-info {
  margin-bottom: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #f0fffe, #e6fffd);
  border-radius: 16px;
  border-left: 4px solid var(--primary);
}

.next-info h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.next-info p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.action-section {
  margin-bottom: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  box-shadow: 0 8px 25px rgba(0, 179, 176, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0, 179, 176, 0.4);
}

.support-info {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.support-text {
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.contact-methods {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(0, 179, 176, 0.05);
  font-size: 0.9rem;
}

.contact-link:hover {
  color: var(--primary-dark);
  background: rgba(0, 179, 176, 0.1);
  transform: translateY(-1px);
}

/* Mobile Responsive Design */
@media (max-width: 768px) {
  .completion-container {
    padding: 16px;
  }
  
  .completion-card {
    padding: 32px 24px;
    border-radius: 20px;
  }
  
  .completion-title {
    font-size: 2rem;
  }
  
  .completion-message {
    font-size: 1rem;
    margin-bottom: 32px;
  }
  
  .assessment-summary {
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .summary-item {
    gap: 12px;
  }
  
  .next-info {
    padding: 20px;
    margin-bottom: 32px;
  }
  
  .next-info h3 {
    font-size: 1.2rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
  }
  
  .contact-methods {
    flex-direction: column;
    gap: 12px;
  }
  
  .contact-link {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .completion-card {
    padding: 24px 20px;
  }
  
  .checkmark-circle {
    width: 70px;
    height: 70px;
  }
  
  .completion-title {
    font-size: 1.8rem;
    margin-bottom: 12px;
  }
  
  .completion-message {
    font-size: 0.95rem;
    margin-bottom: 28px;
  }
  
  .assessment-summary {
    padding: 20px;
    gap: 16px;
  }
  
  .summary-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .next-info {
    padding: 16px;
    text-align: center;
  }
  
  .btn {
    font-size: 1rem;
    padding: 12px 20px;
  }
}
</style>