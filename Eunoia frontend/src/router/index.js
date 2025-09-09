import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../components/Main/LandingPage.vue'
import Login from '../components/Main/Login.vue'
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
    component: LandingPage
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
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const authStatus = await authService.checkAuthStatus();
    if (!authStatus.isAuthenticated) {
      next('/login');
    } else if (to.meta.role && authStatus.userType !== to.meta.role) {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;