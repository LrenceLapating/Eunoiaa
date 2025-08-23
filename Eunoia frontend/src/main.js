import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import axios from 'axios'

// Configure axios base URL for API calls
axios.defaults.baseURL = 'http://localhost:3000'
 
createApp(App).mount('#app')