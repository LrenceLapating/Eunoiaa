<template>
  <div class="contact-guidance-container">
    <!-- Header Section -->
    <div class="contact-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="fas fa-envelope"></i>
        </div>
        <div class="header-text">
          <h2>Contact Guidance</h2>
          <p>Send your concerns directly to your counselor</p>
        </div>
      </div>
    </div>

    <!-- Compose Section -->
    <div class="compose-section">
      <div class="compose-container">
        <!-- Email Form -->
        <div class="email-form">
          <!-- Recipients -->
          <div class="form-row">
            <label class="form-label">To:</label>
            <div class="recipient-field">
              <span class="recipient-email">gparas@uic.edu.ph</span>
              <span class="recipient-label">Guidance Counselor</span>
            </div>
          </div>

          <!-- From -->
          <div class="form-row">
            <label class="form-label">From:</label>
            <div class="sender-field">
              <span class="sender-email">{{ studentEmail }}</span>
              <span class="sender-name">{{ studentName }}</span>
            </div>
          </div>

          <!-- Subject -->
          <div class="form-row">
            <label class="form-label">Subject:</label>
            <input 
              type="text" 
              v-model="emailData.subject" 
              class="subject-input"
              placeholder="Enter subject..."
              maxlength="200"
            >
          </div>

          <!-- Message Body -->
          <div class="form-row message-row">
            <label class="form-label">Message:</label>
            <div class="message-container">
              <textarea 
                v-model="emailData.message" 
                class="message-textarea"
                placeholder="Type your message here..."
                rows="12"
                maxlength="2000"
              ></textarea>
              <div class="character-count">
                {{ emailData.message.length }}/2000 characters
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button 
              class="send-btn" 
              @click="redirectToGmail"
              :disabled="!canSend"
            >
              <i class="fas fa-external-link-alt"></i>
              Redirect to Gmail
            </button>
            <button 
              class="clear-btn" 
              @click="clearForm"
            >
              <i class="fas fa-trash"></i>
              Clear
            </button>
          </div>
        </div>

        <!-- Quick Templates -->
        <div class="templates-section">
          <h4>Quick Templates</h4>
          <div class="template-buttons">
            <button 
              class="template-btn" 
              @click="useTemplate('appointment')"
            >
              <i class="fas fa-calendar"></i>
              Request Appointment
            </button>
            <button 
              class="template-btn" 
              @click="useTemplate('concern')"
            >
              <i class="fas fa-exclamation-circle"></i>
              Share Concern
            </button>
            <button 
              class="template-btn" 
              @click="useTemplate('question')"
            >
              <i class="fas fa-question-circle"></i>
              Ask Question
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <i :class="notification.icon"></i>
        <span>{{ notification.message }}</span>
      </div>
      <button class="notification-close" @click="closeNotification">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { apiUrl } from '../../utils/apiUtils.js';

export default {
  name: 'ContactGuidance',
  props: {
    studentProfile: {
      type: Object,
      required: true
    }
  },
  mounted() {
    // Component initialization
  },
  data() {
    return {
      emailData: {
        subject: '',
        message: ''
      },
      notification: {
        show: false,
        message: '',
        type: 'success',
        icon: 'fas fa-check-circle'
      },
      templates: {
        appointment: {
          subject: 'Request for Guidance Appointment',
          message: 'Dear Counselor,\n\nI would like to request an appointment for guidance counseling. Please let me know your available schedule.\n\nThank you for your time.\n\nBest regards,'
        },
        concern: {
          subject: 'Personal Concern - Need Guidance',
          message: 'Dear Counselor,\n\nI hope this message finds you well. I am reaching out because I have some concerns that I would like to discuss with you.\n\n[Please describe your concern here]\n\nI would appreciate your guidance on this matter.\n\nThank you for your support.\n\nBest regards,'
        },
        question: {
          subject: 'Question About Academic/Personal Matter',
          message: 'Dear Counselor,\n\nI have a question regarding [topic] and would appreciate your guidance.\n\n[Please describe your question here]\n\nThank you for your time and assistance.\n\nBest regards,'
        }
      }
    };
  },
  computed: {
    studentEmail() {
      return this.studentProfile?.email || 'student@example.com';
    },
    studentName() {
      return this.studentProfile?.name || 'Student';
    },
    canSend() {
      return this.emailData.subject.trim() && this.emailData.message.trim();
    }
  },
  methods: {
    useTemplate(templateType) {
      const template = this.templates[templateType];
      if (template) {
        this.emailData.subject = template.subject;
        this.emailData.message = template.message;
      }
    },
    
    clearForm() {
      this.emailData.subject = '';
      this.emailData.message = '';
    },
    
    redirectToGmail() {
      if (!this.canSend) return;
      
      // Prepare email data
      const recipientEmail = 'gparas@uic.edu.ph';
      const rawSubject = this.emailData.subject;
      const rawBody = `From: ${this.studentName} (${this.studentEmail})\n\n${this.emailData.message}`;
      
      // Use unified approach for all devices - prioritize reliability over app detection
      this.handleUniversalGmailRedirect(recipientEmail, rawSubject, rawBody);
    },
    
    handleUniversalGmailRedirect(recipientEmail, subject, body) {
      try {
        // Method 1: Standard Gmail web compose (works on all devices)
        const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Method 2: Gmail mobile-friendly URL (fallback)
        const gmailMobileUrl = `https://mail.google.com/mail/u/0/#compose?to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Method 3: Standard mailto (universal fallback)
        const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Try primary Gmail web URL
        this.tryGmailRedirect(gmailWebUrl, gmailMobileUrl, mailtoUrl, recipientEmail, subject, body);
        
      } catch (error) {
        console.error('Gmail redirect error:', error);
        this.fallbackToMailto(recipientEmail, subject, body);
      }
    },
    
    tryGmailRedirect(primaryUrl, secondaryUrl, mailtoUrl, recipientEmail, subject, body) {
      try {
        // Try to open Gmail web interface
        const gmailWindow = window.open(primaryUrl, '_blank');
        
        if (gmailWindow) {
          // Success - show notification and clear form
          this.showNotification('Redirected to Gmail! Please send your message from there.', 'success', 'fas fa-external-link-alt');
          this.clearForm();
        } else {
          // Popup blocked or failed, try secondary method
          this.trySecondaryGmail(secondaryUrl, recipientEmail, subject, body);
        }
      } catch (error) {
        console.error('Primary Gmail redirect error:', error);
        this.trySecondaryGmail(secondaryUrl, recipientEmail, subject, body);
      }
    },
    
    trySecondaryGmail(secondaryUrl, recipientEmail, subject, body) {
      try {
        const gmailWindow = window.open(secondaryUrl, '_blank');
        
        if (gmailWindow) {
          this.showNotification('Redirected to Gmail! Please send your message from there.', 'success', 'fas fa-external-link-alt');
          this.clearForm();
        } else {
          // Both Gmail methods failed, use mailto
          this.fallbackToMailto(recipientEmail, subject, body);
        }
      } catch (error) {
        console.error('Secondary Gmail redirect error:', error);
        this.fallbackToMailto(recipientEmail, subject, body);
      }
    },
    
    fallbackToMailto(recipientEmail, subject, body) {
      try {
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Create and click mailto link
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Opened default email client. Please send your message from there.', 'success', 'fas fa-envelope');
        this.clearForm();
        
      } catch (error) {
        console.error('Mailto fallback error:', error);
        this.showNotification('Unable to open email client. Please copy the message and send it manually.', 'error', 'fas fa-exclamation-triangle');
      }
    },
    
    showNotification(message, type, icon) {
      this.notification = {
        show: true,
        message,
        type,
        icon
      };
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.closeNotification();
      }, 5000);
    },
    
    closeNotification() {
      this.notification.show = false;
    }
  }
};
</script>

<style scoped>
.contact-guidance-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

/* Header Section */
.contact-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.header-text h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.header-text p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

/* Compose Section */
.compose-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 500px;
  display: block;
}

.compose-container {
  padding: 30px;
  display: block;
  visibility: visible;
}

/* Email Form */
.email-form {
  margin-bottom: 30px;
  display: block;
  visibility: visible;
}

.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 15px;
}

.form-label {
  min-width: 80px;
  font-weight: 600;
  color: #333;
  padding-top: 8px;
  font-size: 14px;
}

.recipient-field, .sender-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.recipient-email, .sender-email {
  font-weight: 600;
  color: #667eea;
}

.recipient-label, .sender-name {
  color: #6c757d;
  font-size: 14px;
}

.subject-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.subject-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-row {
  align-items: flex-start;
}

.message-container {
  flex: 1;
  position: relative;
}

.message-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 200px;
  transition: border-color 0.3s ease;
}

.message-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.character-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #6c757d;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Action Buttons */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  margin-top: 20px;
}

.send-btn, .clear-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.clear-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.clear-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #495057;
}

/* Templates Section */
.templates-section {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.templates-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.template-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.template-btn {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  color: #6c757d;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.template-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.template-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Notification */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.notification.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
}

.notification-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .contact-guidance-container {
    max-width: 90%;
    padding: 18px;
  }
}

@media (max-width: 768px) {
  .contact-guidance-container {
    padding: 15px;
    max-width: 100%;
  }
  
  .contact-header {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .header-icon {
    font-size: 36px;
  }
  
  .header-text h2 {
    font-size: 24px;
  }
  
  .header-text p {
    font-size: 14px;
  }
  
  .compose-container {
    padding: 20px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
  }
  
  .form-label {
    min-width: auto;
    padding-top: 0;
    font-size: 13px;
  }
  
  .subject-input {
    padding: 12px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .message-textarea {
    padding: 12px;
    font-size: 16px; /* Prevents zoom on iOS */
    min-height: 150px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .send-btn, .clear-btn {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
  }
  
  .template-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .template-btn {
    justify-content: center;
    width: 100%;
    padding: 12px 16px;
  }
  
  .notification {
    left: 15px;
    right: 15px;
    min-width: auto;
    top: 15px;
  }
}

@media (max-width: 480px) {
  .contact-guidance-container {
    padding: 10px;
  }
  
  .contact-header {
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .header-text h2 {
    font-size: 20px;
  }
  
  .header-text p {
    font-size: 13px;
  }
  
  .compose-container {
    padding: 15px;
  }
  
  .message-textarea {
    min-height: 120px;
  }
  
  .send-btn, .clear-btn {
    padding: 12px 20px;
    font-size: 13px;
  }
  
  .template-btn {
    padding: 10px 14px;
    font-size: 12px;
  }
}

@media (max-width: 320px) {
  .contact-guidance-container {
    padding: 8px;
  }
  
  .contact-header {
    padding: 12px;
  }
  
  .header-text h2 {
    font-size: 18px;
  }
  
  .compose-container {
    padding: 12px;
  }
  
  .form-label {
    font-size: 12px;
  }
  
  .subject-input, .message-textarea {
    padding: 10px;
    font-size: 16px;
  }
}
</style>