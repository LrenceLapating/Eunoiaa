import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import axios from 'axios'
import router from './router'

// Configure axios base URL
// Let apiUtils handle the /api prefix to avoid duplication
if (process.env.NODE_ENV === 'development') {
  // In development, use empty baseURL since apiUtils adds /api
  axios.defaults.baseURL = ''
} else {
  // In production, use the base URL without /api suffix
  const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000'
  axios.defaults.baseURL = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl
}
 
createApp(App).use(router).mount('#app')