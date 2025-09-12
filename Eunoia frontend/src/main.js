import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import axios from 'axios'
import router from './router'

// Configure axios to use environment variable for API base URL
axios.defaults.baseURL = (process.env.VUE_APP_API_URL || 'http://localhost:3000/api').replace('/api', '')
 
createApp(App).use(router).mount('#app')