<template>
  <div class="login-container">
    <div class="floating-shapes">
      <div class="shape-login shape-1"></div>
      <div class="shape-login shape-2"></div>
      <div class="shape-login shape-3"></div>
    </div>
    
    <a @click="goToLanding" class="back-to-home">
      <i class="fas fa-arrow-left"></i> Back to Home
    </a>
    
    <div class="login-left fade-in">
      <div class="login-form">
        <div class="logo" style="margin-bottom: 30px;">
          <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="logo-svg" style="height: 100px; width: 60px;">
          <h1>EUNOIA</h1>
        </div>
        
        <h2>Welcome back</h2>
        <p>Sign in to access your EUNOIA dashboard and continue your psychological well-being journey.</p>
        
        <form @submit.prevent="handleSubmit">
          <div class="notification" v-if="showNotification">
            <div class="notification-content">
              <i class="fas fa-info-circle"></i>
              <span>{{ notificationMessage }}</span>
            </div>
            <button type="button" class="close-notification" @click="showNotification = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="form-group">
            <label for="username">ID Number or Email</label>
            <input type="text" id="username" v-model="email" placeholder="Enter your Student ID or Email" required autocomplete="username">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input-wrapper">
              <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" placeholder="Enter your password" required autocomplete="current-password">
              <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          
          </div>
          
          <div class="remember-forgot">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="rememberMe">
              <label for="remember">Remember me</label>
            </div>
            <a href="#" class="forgot-password" @click.prevent="showForgotPasswordModal = true">Forgot password?</a>
          </div>
          
          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">Sign In</span>
            <span v-else class="loading-content">
              <i class="fas fa-spinner fa-spin"></i>
              Signing In...
            </span>
          </button>
        </form>
        
        <div class="login-footer">
       
        </div>
      </div>
    </div>
    
    <div class="login-right">
      <div class="login-graphic slide-in-right">
        <div class="animated-background">
          <div class="wave wave1"></div>
          <div class="wave wave2"></div>
          <div class="wave wave3"></div>
          <div class="wave wave4"></div>
        </div>
        <div class="floating-elements">
          <div class="floating-item item1">
            <i class="fas fa-user"></i>
            <span>Self-Acceptance</span>
          </div>
          <div class="floating-item item2">
            <i class="fas fa-users"></i>
            <span>Positive Relations with Others</span>
          </div>
          <div class="floating-item item3">
            <i class="fas fa-brain"></i>
            <span>Autonomy</span>
          </div>
          <div class="floating-item item4">
            <i class="fas fa-globe"></i>
            <span>Environmental Mastery</span>
          </div>
          <div class="floating-item item5">
            <i class="fas fa-bullseye"></i>
            <span>Purpose in Life</span>
          </div>
          <div class="floating-item item6">
            <i class="fas fa-seedling"></i>
            <span>Personal Growth</span>
          </div>
        </div>
        <div class="logo-container">
          <div class="logo-animation">
            <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="main-logo">
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot Password Modal -->
  <div v-if="showForgotPasswordModal" class="modal-overlay" @click="closeForgotPasswordModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Reset Password</h3>
        <button class="close-button" @click="closeForgotPasswordModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>Enter your email address and we'll send you a temporary password.</p>
        <form @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="forgot-email">Email Address</label>
            <input 
              type="email" 
              id="forgot-email" 
              v-model="forgotPasswordEmail" 
              placeholder="Enter your email address" 
              required
              :disabled="isSendingEmail"
            >
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-button" @click="closeForgotPasswordModal" :disabled="isSendingEmail">
              Cancel
            </button>
            <button type="submit" class="send-button" :disabled="isSendingEmail">
              <span v-if="!isSendingEmail">Send</span>
              <span v-else class="loading-content">
                <i class="fas fa-spinner fa-spin"></i>
                Sending...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import authService from '@/services/authService'
import { apiUrl } from '@/utils/apiUtils'

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      showNotification: false,
      notificationMessage: '',
      showPassword: false,
      isLoading: false,
      showForgotPasswordModal: false,
      forgotPasswordEmail: '',
      isSendingEmail: false
    }
  },
  mounted() {
    // Add visible class to elements with animation classes after a short delay
    setTimeout(() => {
      document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        el.classList.add('visible');
      });
    }, 100);
  },
  methods: {
    async handleSubmit() {
      this.isLoading = true;
      this.showNotification = false;
      
      // Login attempt validation
      
      try {
        // Try student login first
        const studentResult = await authService.loginStudent(this.email, this.password);
        
        if (studentResult.success) {
          this.notificationMessage = studentResult.message || 'Student login successful! Welcome back.';
          this.showNotification = true;
          setTimeout(() => {
            this.$emit('student-login');
          }, 1500);
          return;
        }
        
        // If student login fails, try counselor login
        const counselorResult = await authService.loginCounselor(this.email, this.password);
        
        if (counselorResult.success) {
          this.notificationMessage = counselorResult.message || 'Counselor login successful!';
          this.showNotification = true;
          setTimeout(() => {
            this.$emit('counselor-login');
          }, 1500);
          return;
        }
        
        // If both fail, show error
        this.notificationMessage = counselorResult.error || 'Invalid credentials. Please check your username and password.';
        this.showNotification = true;
        
      } catch (error) {
        console.error('Login error:', error);
        this.notificationMessage = 'Network error. Please check if the server is running and try again.';
        this.showNotification = true;
      } finally {
        this.isLoading = false;
      }
    },
    goToLanding() {
      this.$router.push('/');
    },
    closeForgotPasswordModal() {
      this.showForgotPasswordModal = false;
      this.forgotPasswordEmail = '';
      this.isSendingEmail = false;
    },
    async handleForgotPassword() {
      this.isSendingEmail = true;
      this.showNotification = false;
      
      try {
        const response = await fetch(apiUrl('auth/forgot-password'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: this.forgotPasswordEmail
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          this.notificationMessage = result.message || 'Password reset email sent successfully!';
          this.showNotification = true;
          this.closeForgotPasswordModal();
        } else {
          this.notificationMessage = result.error || 'Failed to send password reset email.';
          this.showNotification = true;
        }
      } catch (error) {
        console.error('Forgot password error:', error);
        this.notificationMessage = 'Network error. Please try again.';
        this.showNotification = true;
      } finally {
        this.isSendingEmail = false;
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  background-color: var(--gray);
  position: relative;
  overflow: hidden;
}

.login-left {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.login-right {
  flex: 1;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-form {
  max-width: 400px;
  width: 100%;
}

.login-form h2 {
  font-size: 32px;
  margin-bottom: 10px;
  color: var(--dark);
}

.login-form p {
  margin-bottom: 30px;
  color: var(--text);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--dark);
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e1e5e8;
  border-radius: var(--border-radius);
  font-size: 15px;
  transition: all 0.3s;
}

.form-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 179, 176, 0.2);
  outline: none;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 45px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.password-toggle:hover {
  background-color: #f0f0f0;
  color: #333;
}

.password-hint {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  margin-bottom: 0;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  margin-right: 8px;
}

.forgot-password {
  color: var(--primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 14px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-button:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 179, 176, 0.3);
}

.login-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-content i {
  font-size: 14px;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 14px;
}

.login-footer a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

.back-to-home {
  position: absolute;
  top: 20px;
  left: 20px;
  color: var(--text);
  background-color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.back-to-home:hover {
  color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.back-to-home i {
  margin-right: 8px;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.shape-login {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background-color: var(--dim-1);
  top: -100px;
  left: -100px;
  animation: float-slow 20s infinite alternate;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background-color: var(--dim-2);
  bottom: -80px;
  right: 10%;
  animation: float-slow 15s infinite alternate-reverse;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background-color: var(--dim-3);
  top: 20%;
  right: -50px;
  animation: float-slow 18s infinite alternate;
}

.login-graphic {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 5;
}

.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.wave {
  position: absolute;
  width: 200%;
  height: 200%;
  opacity: 0.5;
  border-radius: 40%;
}

.wave1 {
  background: rgba(255, 255, 255, 0.1);
  bottom: -10%;
  left: -50%;
  animation: wave 20s linear infinite;
}

.wave2 {
  background: rgba(255, 255, 255, 0.15);
  bottom: -15%;
  left: -45%;
  animation: wave 15s linear infinite;
}

.wave3 {
  background: rgba(255, 255, 255, 0.1);
  bottom: -20%;
  left: -40%;
  animation: wave 18s linear infinite reverse;
}

.wave4 {
  background: rgba(255, 255, 255, 0.05);
  bottom: -25%;
  left: -35%;
  animation: wave 25s linear infinite;
}

@keyframes wave {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.floating-item {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(30px);
  opacity: 0;
  animation: float-in 0.8s forwards, float 5s infinite ease-in-out;
}

.floating-item i {
  font-size: 20px;
  margin-right: 10px;
}

.floating-item span {
  font-size: 14px;
  font-weight: 500;
  color: var(--dark);
}

.item1 {
  top: 15%;
  left: 10%;
  animation-delay: 0.2s, 1s;
}

.item2 {
  top: 30%;
  right: 10%;
  animation-delay: 0.4s, 2s;
}

.item3 {
  top: 50%;
  left: 15%;
  animation-delay: 0.6s, 1.5s;
}

.item4 {
  top: 65%;
  right: 15%;
  animation-delay: 0.8s, 2.5s;
}

.item5 {
  top: 80%;
  left: 20%;
  animation-delay: 1s, 3s;
}

.item6 {
  top: 20%;
  left: 50%;
  animation-delay: 1.2s, 2s;
}

.item1 i { color: var(--dim-1); }
.item2 i { color: var(--dim-2); }
.item3 i { color: var(--dim-3); }
.item4 i { color: var(--dim-4); }
.item5 i { color: var(--dim-5); }
.item6 i { color: var(--dim-6); }

@keyframes float-in {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

.logo-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.logo-animation {
  background: transparent;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scale-pulse 2s infinite alternate;
}

.logo-animation img {
  width: 80%;
  height: auto;
  animation: scale-pulse 2s infinite alternate;
}

.main-logo {
  width: 100%;
  height: auto;
  filter: brightness(1.1);
}

@keyframes pulse-shadow {
  0% {
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.3);
  }
  100% {
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  }
}

@keyframes scale-pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.05);
  }
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

.slide-in-left {
  opacity: 0;
  transform: translateX(-50px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.slide-in-left.visible {
  opacity: 1;
  transform: translateX(0);
}

.slide-in-right {
  opacity: 0;
  transform: translateX(50px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.slide-in-right.visible {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    padding: 40px 20px;
  }
  
  .login-right {
    min-height: 400px;
  }
}

@media (max-width: 576px) {
  .login-form {
    max-width: 100%;
  }
  
  .login-left {
    padding: 30px 15px;
  }
  
  .login-right {
    display: none;
  }
}

.notification {
  background-color: rgba(0, 179, 176, 0.1);
  border-left: 4px solid var(--primary);
  padding: 12px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-content {
  display: flex;
  align-items: center;
}

.notification-content i {
  color: var(--primary);
  margin-right: 10px;
  font-size: 16px;
}

.notification-content span {
  font-size: 14px;
  color: var(--text);
}

.close-notification {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.close-notification:hover {
  color: var(--text);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 24px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  color: var(--text);
  font-size: 20px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-light);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: var(--text);
}

.modal-body {
  padding: 0 24px 24px 24px;
}

.modal-body p {
  margin: 0 0 20px 0;
  color: var(--text-light);
  font-size: 14px;
  line-height: 1.5;
}

.modal-body .form-group {
  margin-bottom: 20px;
}

.modal-body .form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-weight: 500;
  font-size: 14px;
}

.modal-body .form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.modal-body .form-group input:focus {
  outline: none;
  border-color: var(--primary);
}

.modal-body .form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-button, .send-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 80px;
}

.cancel-button {
  background-color: #f8f9fa;
  color: var(--text);
  border: 1px solid #e1e5e9;
}

.cancel-button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.send-button {
  background-color: var(--primary);
  color: white;
}

.send-button:hover:not(:disabled) {
  background-color: #00a8a5;
}

.cancel-button:disabled, .send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-content i {
  font-size: 12px;
}
</style>