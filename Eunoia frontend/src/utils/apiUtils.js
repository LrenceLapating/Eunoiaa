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
  
  // In production, use the backend URL from environment variables
  if (process.env.NODE_ENV === 'production') {
    const backendUrl = process.env.VUE_APP_API_URL || process.env.VUE_APP_BACKEND_URL;
    if (backendUrl) {
      // Remove trailing slash and add /api prefix
      const cleanBaseUrl = backendUrl.replace(/\/$/, '');
      return `${cleanBaseUrl}/api/${cleanEndpoint}`;
    }
    // Fallback to relative URL if no backend URL is configured
    console.warn('No backend URL configured for production. Using relative URLs.');
  }
  
  // Development: use relative URLs with /api prefix (works with proxy)
  return `/api/${cleanEndpoint}`;
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