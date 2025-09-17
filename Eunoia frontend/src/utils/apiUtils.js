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
  
  // Always use relative URLs with /api prefix when served from same domain
  // This works both in development (with proxy) and production (served from backend)
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