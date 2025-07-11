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
          <img src="https://via.placeholder.com/32x32/00b3b0/ffffff?text=O" alt="ORCA Logo">
          <h1>ORCA</h1>
        </div>
        
        <h2>Welcome back</h2>
        <p>Sign in to access your ORCA dashboard and continue your psychological well-being journey.</p>
        
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
            <label for="email">Email Address</label>
            <input type="email" id="email" v-model="email" placeholder="Enter your email" required>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" placeholder="Enter your password" required>
          </div>
          
          <div class="remember-forgot">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="rememberMe">
              <label for="remember">Remember me</label>
            </div>
            <a href="#" class="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" class="login-button">Sign In</button>
        </form>
        
        <div class="login-footer">
          <p>Don't have an account? <a href="#">Contact your administrator</a></p>
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
            <span>Positive Relations</span>
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
            <img src="https://via.placeholder.com/120x120/00b3b0/ffffff?text=ORCA" alt="ORCA">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      showNotification: false,
      notificationMessage: ''
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
    handleSubmit() {
      // Here you would typically handle authentication
      console.log('Login attempt with:', this.email);
      
      // Temporary counselor login check
      if (this.email === 'counselor@orca.edu' && this.password === 'counselor123') {
        // Redirect to counselor dashboard
        this.$emit('counselor-login');
      } else if (this.email && this.password) {
        // For student/employee login (to be implemented)
        console.log('Regular user login attempt');
        // Show notification instead of alert
        this.notificationMessage = 'Login functionality will be available in future updates. Try counselor@orca.edu / counselor123 for demo access.';
        this.showNotification = true;
      }
    },
    goToLanding() {
      this.$emit('switch-to-landing');
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
}

.login-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 179, 176, 0.3);
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
  background: white;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  animation: pulse-shadow 2s infinite;
}

.logo-animation img {
  width: 80%;
  height: auto;
  animation: scale-pulse 2s infinite alternate;
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
    min-height: 300px;
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
</style> 