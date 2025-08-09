<template>
  <div class="completion-container">
    <div class="completion-card">
      <!-- Success Icon -->
      <div class="success-icon">
        <div class="checkmark-circle">
          <div class="checkmark"></div>
        </div>
      </div>

      <!-- Completion Message -->
      <div class="completion-content">
        <h1 class="completion-title">Assessment Complete!</h1>
        <p class="completion-message">
          Thank you for completing the {{ assessmentTitle }}. Your responses have been successfully submitted and will be reviewed by our counseling team.
        </p>

        <!-- Assessment Details -->
        <div class="assessment-details">
          <div class="detail-item">
            <i class="fas fa-clipboard-check"></i>
            <div class="detail-content">
              <span class="detail-label">Assessment Type</span>
              <span class="detail-value">{{ assessmentTitle }}</span>
            </div>
          </div>
          
          <div class="detail-item">
            <i class="fas fa-calendar-alt"></i>
            <div class="detail-content">
              <span class="detail-label">Completed On</span>
              <span class="detail-value">{{ formatDate(new Date()) }}</span>
            </div>
          </div>
          
          <div class="detail-item">
            <i class="fas fa-clock"></i>
            <div class="detail-content">
              <span class="detail-label">Time Taken</span>
              <span class="detail-value">{{ estimatedTime }}</span>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
          <h3>What Happens Next?</h3>
          <div class="steps-list">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>Processing</h4>
                <p>Your responses are being analyzed using validated psychological assessment methods.</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>Review</h4>
                <p>A qualified counselor will review your results and identify any areas that may need attention.</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>Follow-up</h4>
                <p>If needed, you'll be contacted for additional support or counseling sessions.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Notice -->
        <div class="important-notice">
          <div class="notice-icon">
            <i class="fas fa-info-circle"></i>
          </div>
          <div class="notice-content">
            <h4>Confidentiality Notice</h4>
            <p>
              Your assessment responses are confidential and will only be accessed by authorized counseling staff. 
              All data is stored securely and handled in accordance with privacy regulations.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn btn-primary" @click="returnToDashboard">
            <i class="fas fa-home"></i>
            Return to Dashboard
          </button>
          
          <button class="btn btn-secondary" @click="viewResources">
            <i class="fas fa-book-open"></i>
            View Wellness Resources
          </button>
        </div>

        <!-- Support Contact -->
        <div class="support-contact">
          <p class="support-text">
            If you have any questions or concerns, please don't hesitate to contact our counseling team.
          </p>
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

    <!-- Floating Particles Animation -->
    <div class="particles">
      <div class="particle" v-for="n in 20" :key="n" :style="getParticleStyle(n)"></div>
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
    }
  },
  computed: {
    assessmentTitle() {
      return `Ryff Psychological Well-being Scale (${this.assessmentType}-Item Version)`
    },
    estimatedTime() {
      // Estimate based on assessment type
      const minutes = this.assessmentType === '84' ? '25-30' : '15-20'
      return `${minutes} minutes`
    }
  },
  mounted() {
    // Add completion animation
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
    
    viewResources() {
      // For now, show an alert since we don't have a resources page
      alert('Wellness resources feature coming soon!')
    },
    
    animateCompletion() {
      // Animate the checkmark
      setTimeout(() => {
        const checkmark = document.querySelector('.checkmark')
        if (checkmark) {
          checkmark.style.animation = 'checkmark 0.6s ease-in-out'
        }
      }, 500)
    },
    
    getParticleStyle(index) {
      const colors = ['#667eea', '#764ba2', '#48bb78', '#ed8936', '#9f7aea']
      const size = Math.random() * 6 + 2
      const left = Math.random() * 100
      const animationDelay = Math.random() * 3
      const animationDuration = Math.random() * 3 + 2
      
      return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        backgroundColor: colors[index % colors.length],
        animationDelay: `${animationDelay}s`,
        animationDuration: `${animationDuration}s`
      }
    }
  }
}
</script>

<style scoped>
.completion-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.completion-card {
  background: white;
  border-radius: 20px;
  padding: 50px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
  position: relative;
  z-index: 2;
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-icon {
  margin-bottom: 30px;
}

.checkmark-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #48bb78, #38a169);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.checkmark {
  width: 30px;
  height: 15px;
  border: 4px solid white;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg);
  opacity: 0;
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: rotate(-45deg) scale(0);
  }
  50% {
    opacity: 1;
    transform: rotate(-45deg) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: rotate(-45deg) scale(1);
  }
}

.completion-content {
  text-align: left;
}

.completion-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
  text-align: center;
}

.completion-message {
  font-size: 1.2rem;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 40px;
  text-align: center;
}

.assessment-details {
  background: #f7fafc;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item i {
  width: 20px;
  color: #667eea;
  font-size: 1.2rem;
}

.detail-content {
  flex: 1;
}

.detail-label {
  display: block;
  font-size: 0.9rem;
  color: #718096;
  font-weight: 500;
  margin-bottom: 2px;
}

.detail-value {
  display: block;
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 600;
}

.next-steps {
  margin-bottom: 40px;
}

.next-steps h3 {
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 25px;
  font-weight: 600;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f7fafc;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.step-content p {
  margin: 0;
  color: #4a5568;
  line-height: 1.5;
}

.important-notice {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: #fffbeb;
  border: 1px solid #f6e05e;
  border-radius: 12px;
  margin-bottom: 40px;
}

.notice-icon {
  color: #d69e2e;
  font-size: 1.3rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-content h4 {
  margin: 0 0 8px 0;
  color: #744210;
  font-size: 1.1rem;
  font-weight: 600;
}

.notice-content p {
  margin: 0;
  color: #744210;
  line-height: 1.5;
  font-size: 0.95rem;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 40px;
}

.btn {
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
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.support-contact {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid #e2e8f0;
}

.support-text {
  color: #718096;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.contact-methods {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.contact-link:hover {
  color: #5a67d8;
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  animation: float linear infinite;
}

@keyframes float {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-10px) rotate(360deg);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .completion-card {
    padding: 30px 25px;
    margin: 10px;
  }
  
  .completion-title {
    font-size: 2rem;
  }
  
  .completion-message {
    font-size: 1.1rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .contact-methods {
    flex-direction: column;
    gap: 15px;
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .step-number {
    align-self: center;
  }
}

@media (max-width: 480px) {
  .completion-card {
    padding: 25px 20px;
  }
  
  .checkmark-circle {
    width: 80px;
    height: 80px;
  }
  
  .completion-title {
    font-size: 1.8rem;
  }
  
  .important-notice {
    flex-direction: column;
    text-align: center;
  }
  
  .notice-icon {
    align-self: center;
  }
}
</style>