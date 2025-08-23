<template>
  <div class="completion-container">
    <!-- Header Section -->
    <div class="completion-header">
      <div class="container">
        <!-- Success Icon -->
        <div class="success-icon">
          <div class="checkmark-circle">
            <div class="checkmark"></div>
          </div>
        </div>
        
        <h1 class="completion-title">Assessment Complete!</h1>
        <p class="completion-message">
          Thank you for completing the {{ assessmentTitle }}. Your responses have been successfully submitted and will be reviewed by our counseling team.
        </p>
      </div>
    </div>
    
    <!-- Content Section -->
    <div class="completion-content">
      <div class="container">
        <div class="completion-card">

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
        // Display exact time taken in minutes and seconds
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
        // Fallback to minutes only if seconds not available
        if (this.timeTakenMinutes < 1) {
          return 'Less than 1 minute'
        } else if (this.timeTakenMinutes === 1) {
          return '1 minute'
        } else {
          return `${this.timeTakenMinutes} minutes`
        }
      } else {
        // Fallback to estimate based on assessment type
        const minutes = this.assessmentType === '84' ? '25-30' : '15-20'
        return `${minutes} minutes`
      }
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
      const colors = ['#00b3b0', '#008b89', '#48bb78', '#f8c630', '#00d4aa']
      const size = Math.random() * 8 + 3
      const left = Math.random() * 100
      const animationDelay = Math.random() * 4
      const animationDuration = Math.random() * 4 + 3
      
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
:root {
  --primary: #00b3b0;
  --primary-dark: #008b89;
  --primary-light: #b2ebf2;
  --secondary: #f8c630;
  --success: #48bb78;
  --success-dark: #38a169;
}

.completion-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  padding: 0;
  position: relative;
  overflow: hidden;
}

.completion-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 80px 0 60px 0;
  text-align: center;
  position: relative;
  z-index: 2;
}

.completion-content {
  background: white;
  padding: 60px 0;
  position: relative;
  z-index: 2;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.completion-card {
  background: transparent;
  border-radius: 0;
  padding: 0;
  max-width: none;
  width: 100%;
  box-shadow: none;
  text-align: left;
  position: relative;
  z-index: 2;
  animation: slideUp 0.8s ease-out;
  border: none;
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
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
  animation: scaleIn 0.5s ease-out;
  box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
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
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 32px 0 24px 0;
  text-align: center;
  letter-spacing: -0.02em;
}

.completion-message {
  font-size: 1.3rem;
  color: #2d3748;
  line-height: 1.6;
  margin-bottom: 0;
  text-align: center;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.assessment-details {
  background: #f8fffe;
  border-radius: 16px;
  padding: 40px;
  margin: 60px 0;
  border: 1px solid rgba(0, 179, 176, 0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 0;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.detail-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.detail-item i {
  width: 28px;
  height: 28px;
  color: var(--primary);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin: 60px 0;
}

.next-steps h3 {
  font-size: 2rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 32px;
  text-align: left;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  padding: 32px;
  background: linear-gradient(135deg, #f8fdfd, #f0fffe);
  border-radius: 20px;
  border-left: 4px solid var(--primary);
  box-shadow: 0 4px 16px rgba(0, 179, 176, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.step-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 179, 176, 0.15);
}

.step-number {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.3rem;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(0, 179, 176, 0.3);
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
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #fff8e1, #fff3c4);
  border: 1px solid var(--secondary);
  border-radius: 16px;
  margin-bottom: 48px;
  box-shadow: 0 4px 16px rgba(248, 198, 48, 0.1);
}

.notice-icon {
  color: #e6a700;
  font-size: 1.4rem;
  flex-shrink: 0;
  margin-top: 2px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice-content h4 {
  margin: 0 0 12px 0;
  color: #b7791f;
  font-size: 1.2rem;
  font-weight: 600;
}

.notice-content p {
  margin: 0;
  color: #8b5a00;
  line-height: 1.6;
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  gap: 24px;
  justify-content: flex-start;
  margin: 50px 0;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 40px;
  border: none;
  border-radius: 14px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  min-width: 220px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  box-shadow: 0 8px 25px rgba(0, 179, 176, 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 179, 176, 0.4);
}

.btn-secondary {
  background: white;
  color: var(--primary);
  border: 2px solid var(--primary);
  box-shadow: 0 6px 16px rgba(0, 179, 176, 0.1);
}

.btn-secondary:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 179, 176, 0.3);
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
  gap: 10px;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(0, 179, 176, 0.05);
}

.contact-link:hover {
  color: var(--primary-dark);
  background: rgba(0, 179, 176, 0.1);
  transform: translateY(-1px);
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
@media (max-width: 1400px) {
  .completion-card {
    max-width: 1000px;
    padding: 50px 60px;
  }
}

@media (max-width: 1200px) {
  .completion-card {
    max-width: 900px;
    padding: 45px 50px;
  }
  
  .completion-title {
    font-size: 3.2rem;
  }
  
  .assessment-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .completion-container {
    padding: 30px 40px;
  }
  
  .completion-card {
    max-width: 800px;
    padding: 40px;
  }
  
  .completion-title {
    font-size: 2.8rem;
  }
  
  .completion-message {
    font-size: 1.3rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 20px;
  }
  
  .completion-header {
    padding: 60px 0 40px 0;
  }
  
  .completion-content {
    padding: 40px 0;
  }
  
  .completion-title {
    font-size: 2.5rem;
  }
  
  .completion-message {
    font-size: 1.1rem;
  }
  
  .assessment-details {
    padding: 24px;
    margin: 40px 0;
    grid-template-columns: 1fr;
  }
  
  .detail-item {
    padding: 16px;
    gap: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 16px;
    justify-content: stretch;
  }
  
  .btn {
    width: 100%;
    padding: 14px 24px;
    min-width: auto;
    justify-content: center;
  }
  
  .contact-methods {
    flex-direction: column;
    gap: 12px;
  }
  
  .step-item {
    padding: 20px;
    gap: 20px;
  }
  
  .next-steps h3 {
    font-size: 1.6rem;
    margin-bottom: 24px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .completion-card {
    padding: 24px 20px;
    border-radius: 16px;
  }
  
  .checkmark-circle {
    width: 100px;
    height: 100px;
  }
  
  .completion-title {
    font-size: 1.9rem;
    margin-bottom: 20px;
  }
  
  .completion-message {
    font-size: 1.1rem;
    margin-bottom: 36px;
  }
  
  .assessment-details {
    padding: 20px;
    margin-bottom: 36px;
  }
  
  .detail-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    padding: 16px;
  }
  
  .detail-item i {
    align-self: center;
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 20px;
  }
  
  .step-number {
    align-self: center;
  }
  
  .important-notice {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 20px;
  }
  
  .notice-icon {
    align-self: center;
  }
  
  .btn {
    font-size: 1rem;
    padding: 12px 20px;
  }
}
</style>