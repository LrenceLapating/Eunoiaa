<template>
  <LandingPage v-if="currentPage === 'landing'" @navigate-to-login="currentPage = 'login'" />
  <Login v-else-if="currentPage === 'login'" @switch-to-landing="currentPage = 'landing'" @counselor-login="currentPage = 'counselor'" />
  <CounselorDashboard v-else-if="currentPage === 'counselor'" @switch-to-landing="currentPage = 'landing'" />
</template>

<script>
import LandingPage from './components/LandingPage.vue'
import Login from './components/Login.vue'
import CounselorDashboard from './components/CounselorDashboard.vue'

export default {
  name: 'App',
  components: {
    LandingPage,
    Login,
    CounselorDashboard
  },
  data() {
    return {
      currentPage: 'landing'
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
  --dim-5: #f44336;
  --dim-6: #607d8b;
}
</style> 