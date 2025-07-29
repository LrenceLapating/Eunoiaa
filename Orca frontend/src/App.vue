<template>
  <LandingPage v-if="currentPage === 'landing'" @navigate-to-login="currentPage = 'login'" />
  <Login v-else-if="currentPage === 'login'" @switch-to-landing="currentPage = 'landing'" @counselor-login="currentPage = 'counselor'" @student-login="currentPage = 'student'" />
  <CounselorDashboard v-else-if="currentPage === 'counselor'" @switch-to-landing="currentPage = 'landing'" />
  <StudentDashboard v-else-if="currentPage === 'student'" @switch-to-landing="currentPage = 'landing'" />
</template>

<script>
import LandingPage from './components/Main/LandingPage.vue'
import Login from './components/Main/Login.vue'
import CounselorDashboard from './components/Counselor/CounselorDashboard.vue'
import StudentDashboard from './components/Student/StudentDashboard.vue'

export default {
  name: 'App',
  components: {
    LandingPage,
    Login,
    CounselorDashboard,
    StudentDashboard
  },
  data() {
    let userType = localStorage.getItem('eunoia_user_type');
    let loggedIn = localStorage.getItem('eunoia_logged_in') === 'true';
    let currentPage = 'landing';
    if (userType === 'counselor' && loggedIn) currentPage = 'counselor';
    else if (userType === 'student') currentPage = 'student';
    return { currentPage };
  },
  mounted() {
    // Listen for login/logout events to update localStorage
    this.$on && this.$on('counselor-login', () => {
      localStorage.setItem('eunoia_logged_in', 'true');
      localStorage.setItem('eunoia_user_type', 'counselor');
      this.currentPage = 'counselor';
    });
    this.$on && this.$on('student-login', () => {
      localStorage.setItem('eunoia_user_type', 'student');
      this.currentPage = 'student';
    });
    this.$on && this.$on('switch-to-landing', () => {
      localStorage.removeItem('eunoia_logged_in');
      localStorage.removeItem('eunoia_user_type');
      this.currentPage = 'landing';
    });
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