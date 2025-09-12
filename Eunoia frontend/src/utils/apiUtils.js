/**
 * Utility functions for API URL construction
 * Handles both local and production environments safely
 */

/**
 * Constructs a complete API URL by intelligently handling the /api prefix
 * @param {string} endpoint - The API endpoint (e.g., 'accounts/colleges', 'auth/login')
 * @param {string} baseUrl - The base API URL from environment or default
 * @returns {string} - Complete API URL
 */
export function buildApiUrl(endpoint, baseUrl = null) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // In development, use the proxy setup (just /api prefix)
  // The vue.config.js proxy will handle forwarding /api/* to the backend
  if (process.env.NODE_ENV === 'development') {
    return `/api/${cleanEndpoint}`;
  }
  
  // In production, construct full URL
  const apiBaseUrl = baseUrl || process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
  
  // Ensure we don't double up on /api
  if (apiBaseUrl.endsWith('/api')) {
    // Base URL already includes /api, just append the endpoint
    return `${apiBaseUrl}/${cleanEndpoint}`;
  } else {
    // Base URL doesn't include /api, add it
    return `${apiBaseUrl}/api/${cleanEndpoint}`;
  }
}

/**
 * Creates an API URL builder function with a preset base URL
 * @param {string} baseUrl - The base API URL
 * @returns {function} - Function that takes an endpoint and returns complete URL
 */
export function createApiUrlBuilder(baseUrl) {
  return (endpoint) => buildApiUrl(endpoint, baseUrl);
}

/**
 * Default API URL builder using environment configuration
 */
export const apiUrl = (endpoint) => buildApiUrl(endpoint);