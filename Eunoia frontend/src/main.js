import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import axios from 'axios'
import router from './router'

// iOS Safari cache prevention
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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

// iOS-specific axios configuration
if (isIOS) {
  // Add cache-busting headers for iOS Safari
  axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  axios.defaults.headers.common['Pragma'] = 'no-cache';
  axios.defaults.headers.common['Expires'] = '0';
  axios.defaults.headers.common['X-iOS-Client'] = 'true';
  
  // Add timestamp to prevent caching
  axios.interceptors.request.use(config => {
    if (config.url && !config.url.includes('timestamp=')) {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url += `${separator}timestamp=${Date.now()}`;
    }
    return config;
  });
  
  console.log('🍎 iOS Safari detected - Cache prevention enabled');
}

createApp(App).use(router).mount('#app')