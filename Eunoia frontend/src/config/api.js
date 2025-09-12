/**
 * Centralized API Configuration for EUNOIA Frontend
 * This ensures all API calls use the correct environment-based URL
 */

// Get the API base URL from environment variables
// Falls back to localhost for development if not set
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';

// Remove '/api' suffix if it exists since we'll add it in individual calls
const BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * API Configuration object
 */
export const apiConfig = {
  // Base URL without /api suffix
  baseURL: BASE_URL,
  
  // Full API URL with /api suffix
  apiURL: `${BASE_URL}/api`,
  
  // Helper method to build API endpoints
  endpoint(path) {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.apiURL}/${cleanPath}`;
  },
  
  // Helper method for non-API endpoints (like file downloads)
  url(path) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseURL}/${cleanPath}`;
  }
};

/**
 * Default fetch options with credentials for session-based auth
 */
export const defaultFetchOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Helper function for making API calls with proper error handling
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise} - Fetch response
 */
export async function apiCall(endpoint, options = {}) {
  const url = apiConfig.endpoint(endpoint);
  const mergedOptions = {
    ...defaultFetchOptions,
    ...options,
    headers: {
      ...defaultFetchOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    return response;
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error;
  }
}

export default apiConfig;