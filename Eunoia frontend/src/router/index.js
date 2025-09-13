import { createRouter, createWebHistory } from 'vue-router'
import LandingPageDesktop from '../components/Main/LandingPageDesktop.vue'
import LandingPageMobile from '../components/Main/LandingPageMobile.vue'
import Login from '../components/Main/Login.vue'
import deviceDetection from '../utils/deviceDetection.js'
import StudentDashboard from '../components/Student/StudentDashboard.vue'
import CounselorDashboard from '../components/Counselor/CounselorDashboard.vue'

// Import all counselor components
import AIintervention from '../components/Counselor/AIintervention.vue'
import AccountManagement from '../components/Counselor/AccountManagement.vue'
import AssessmentHistory from '../components/Counselor/AssessmentHistory.vue'
import AutoReminders from '../components/Counselor/AutoReminders.vue'
import BulkAssessment from '../components/Counselor/BulkAssessment.vue'
import CollegeDetail from '../components/Counselor/CollegeDetail.vue'
import CollegeFilter from '../components/Counselor/CollegeFilter.vue'
import CollegeHistoryDetail from '../components/Counselor/CollegeHistoryDetail.vue'
import CollegeView from '../components/Counselor/CollegeView.vue'
import Reports from '../components/Counselor/Reports.vue'
import RyffScoring from '../components/Counselor/RyffScoring.vue'
import SavedVersions from '../components/Counselor/SavedVersions.vue'
import Settings from '../components/Counselor/Settings.vue'
import YearlyTrendAnalysis from '../components/Counselor/YearlyTrendAnalysis.vue'

import authService from '../services/authService.js'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => {
      // Detect device type and return appropriate component
      if (deviceDetection.isMobile()) {
        return LandingPageMobile;
      } else {
        return LandingPageDesktop;
      }
    }
  },
  {
    path: '/desktop',
    name: 'LandingDesktop',
    component: LandingPageDesktop
  },
  {
    path: '/mobile',
    name: 'LandingMobile',
    component: LandingPageMobile
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/student-dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/student',
    redirect: '/student-dashboard'
  },
  {
    path: '/counselor',
    component: CounselorDashboard,
    meta: { requiresAuth: true, role: 'counselor' },
    children: [
      {
        path: '',
        name: 'CounselorDashboard',
        component: { 
          template: `
            <div>
              <!-- This will show the dashboard content from the parent component -->
            </div>
          `
        },
        meta: { view: 'dashboard' }
      },
      {
        path: 'bulk-assessment',
        name: 'BulkAssessment',
        component: BulkAssessment,
        meta: { view: 'bulkAssessment' }
      },
      {
        path: 'auto-reminders',
        name: 'AutoReminders',
        component: AutoReminders,
        meta: { view: 'autoReminders' }
      },
      {
        path: 'ryff-scoring',
        name: 'RyffScoring',
        component: RyffScoring,
        meta: { view: 'ryffScoring' }
      },
      {
        path: 'college-summary',
        name: 'CollegeSummary',
        component: CollegeView,
        meta: { view: 'guidance' }
      },
      {
        path: 'college-detail/:collegeId?',
        name: 'CollegeDetail',
        component: CollegeDetail,
        meta: { view: 'collegeDetail' }
      },
      {
        path: 'college-history/:collegeId/:assessmentName?',
        name: 'CollegeHistoryDetail',
        component: CollegeHistoryDetail,
        meta: { view: 'collegeHistoryDetail' },
        props: route => ({
          collegeName: decodeURIComponent(route.params.collegeId),
          assessmentName: route.params.assessmentName ? decodeURIComponent(route.params.assessmentName) : null,
          assessmentType: route.query.assessmentType || '42-item'
        })
      },
      {
        path: 'ai-intervention',
        name: 'AIIntervention',
        component: AIintervention,
        meta: { view: 'intervention' }
      },
      {
        path: 'account-management',
        name: 'AccountManagement',
        component: AccountManagement,
        meta: { view: 'status' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: Reports,
        meta: { view: 'reports' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { view: 'settings' }
      },
      {
        path: 'assessment-history',
        name: 'AssessmentHistory',
        component: AssessmentHistory,
        meta: { view: 'assessmentHistory' }
      },
      {
        path: 'yearly-trend-analysis',
        name: 'YearlyTrendAnalysis',
        component: YearlyTrendAnalysis,
        meta: { view: 'yearlyTrendAnalysis' }
      },
      {
        path: 'saved-versions',
        name: 'SavedVersions',
        component: SavedVersions,
        meta: { view: 'savedVersions' }
      },
      {
        path: 'college-filter',
        name: 'CollegeFilter',
        component: CollegeFilter,
        meta: { view: 'collegeFilter' }
      }
    ]
  },
  // Catch-all route for 404 errors - must be last
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1 style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;">404</h1>
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Page Not Found</h2>
          <p style="color: #7f8c8d; margin-bottom: 30px;">The page you're looking for doesn't exist.</p>
          <button @click="$router.push('/')" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">Go Home</button>
        </div>
      `
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    // Check if we already have auth state to avoid unnecessary API calls
    const currentAuthState = authService.getAuthState();
    
    if (currentAuthState.isAuthenticated) {
      // User is already authenticated, just check role
      if (to.meta.role && currentAuthState.userType !== to.meta.role) {
        next('/');
      } else {
        next();
      }
    } else {
      // Need to check auth status from server
      const authStatus = await authService.checkAuthStatus();
      if (!authStatus.isAuthenticated) {
        next('/login');
      } else if (to.meta.role && authStatus.userType !== to.meta.role) {
        next('/');
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

export default router;