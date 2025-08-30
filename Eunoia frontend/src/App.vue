<template>
  <div v-if="isLoading" class="loading-screen">
    <div class="loading-container">
      <!-- Gmail-style rotating logo -->
      <div class="logo-container">
        <img src="@/assets/eunoia-logo.svg" alt="EUNOIA Logo" class="rotating-logo">
      </div>
    </div>
  </div>
  <router-view v-else />
</template>

<script>
// Remove component imports as they'll be handled in routes
import authService from './services/authService'

export default {
  name: 'App',
  data() {
    return { 
      isLoading: true
    };
  },
  async mounted() {
    try {
      const authState = await authService.initialize();
      
      if (authState.userType === 'student') {
        this.$router.push('/student');
      } else if (authState.userType === 'counselor') {
        this.$router.push('/counselor');
      } else {
        this.$router.push('/');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.$router.push('/');
    } finally {
      this.isLoading = false;
    }

    window.addEventListener('auth-event', this.handleAuthEvent);
  },
  beforeUnmount() {
    window.removeEventListener('auth-event', this.handleAuthEvent);
  },
  methods: {
    handleAuthEvent(event) {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'student-login':
          this.$router.push('/student');
          break;
        case 'counselor-login':
          this.$router.push('/counselor');
          break;
        case 'logout':
        case 'session-expired':
          this.$router.push('/');
          break;
        default:
          break;
      }
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

:root {
  --primary: #00b3b0;
  --primary-dark: #009491;
  --secondary: #f8c630;
  --accent: #ff6b6b;
  --light: #ffffff;
  --dark: #1a2e35;
  --gray: #f7f9fa;
  --text: #546e7a;
  --text-light: #78909c;
  --border-radius: 8px;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --dim-1: #4caf50;
  --dim-2: #2196f3;
  --dim-3: #9c27b0;
  --dim-4: #ff9800;
}

/* Loading Screen Styles */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Logo Container - Gmail size */
.logo-container {
  width: 64px;
  height: 64px;
}

/* Zooming Logo - Gmail style */
.rotating-logo {
  width: 100%;
  height: 100%;
  animation: gmailZoom 1.5s ease-in-out infinite;
}

@keyframes gmailZoom {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
</style>