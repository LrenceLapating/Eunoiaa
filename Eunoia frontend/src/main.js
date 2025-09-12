import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import axios from 'axios'
import router from './router'

// Configure axios base URL for API calls - uses environment variable for production
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3000'
 
createApp(App).use(router).mount('#app')