import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import axios from 'axios'
import router from './router'
import { apiConfig } from './config/api'

// Configure axios base URL for API calls using environment variables
axios.defaults.baseURL = apiConfig.baseURL
 
createApp(App).use(router).mount('#app')