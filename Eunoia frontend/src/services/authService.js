/**
 * Authentication Service for EUNOIA System
 * Handles session-based authentication replacing localStorage
 */
import { apiUrl } from '../utils/apiUtils.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userType = null;
    this.isAuthenticated = false;
  }

  /**
   * Student login
   */
  async loginStudent(username, password) {
    try {
      const response = await fetch(apiUrl('auth/student/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Set authentication state immediately
        this.currentUser = data.student;
        this.userType = 'student';
        this.isAuthenticated = true;
        
        // iOS Safari fix: Add small delay to ensure cookie is properly set
        const userAgent = navigator.userAgent || '';
        const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
        
        if (isIOSSafari) {
          // Wait 100ms for iOS Safari to properly set the cookie
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Emit login event after state is set and cookie is ready
        this.emitAuthEvent('student-login', data.student);
        
        return {
          success: true,
          user: data.student,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Student login error:', error);
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  /**
   * Counselor login
   */
  async loginCounselor(email, password) {
    try {
      const response = await fetch(apiUrl('auth/counselor/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Set authentication state immediately
        this.currentUser = data.counselor;
        this.userType = 'counselor';
        this.isAuthenticated = true;
        
        // iOS Safari fix: Add small delay to ensure cookie is properly set
        const userAgent = navigator.userAgent || '';
        const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
        
        if (isIOSSafari) {
          // Wait 100ms for iOS Safari to properly set the cookie
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Emit login event after state is set and cookie is ready
        this.emitAuthEvent('counselor-login', data.counselor);
        
        return {
          success: true,
          user: data.counselor,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Counselor login error:', error);
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await fetch(apiUrl('auth/logout'), {
        method: 'POST',
        credentials: 'include'
      });

      // Clear local state regardless of response
      this.currentUser = null;
      this.userType = null;
      this.isAuthenticated = false;
      
      // Emit logout event
      this.emitAuthEvent('logout');
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear local state even if request fails
      this.currentUser = null;
      this.userType = null;
      this.isAuthenticated = false;
      
      this.emitAuthEvent('logout');
      
      return {
        success: true,
        message: 'Logged out (offline)'
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile() {
    try {
      const endpoint = this.userType === 'student' ? 'student/profile' : 'counselor/profile';
      
      const response = await fetch(apiUrl(`auth/${endpoint}`), {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.student || data.counselor;
        
        this.currentUser = user;
        return {
          success: true,
          user: user
        };
      } else if (response.status === 401) {
        // Session expired
        this.handleSessionExpired();
        return {
          success: false,
          error: 'Session expired'
        };
      } else {
        return {
          success: false,
          error: 'Failed to fetch profile'
        };
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  /**
   * Check if user is authenticated by validating session
   */
  async checkAuthStatus() {
    try {
      // If userType is not set, try to determine it first (similar to initialize)
      if (!this.userType) {
        const studentResult = await fetch(apiUrl('auth/student/profile'), {
          method: 'GET',
          credentials: 'include'
        });

        if (studentResult.ok) {
          const data = await studentResult.json();
          this.currentUser = data.student;
          this.userType = 'student';
          this.isAuthenticated = true;
          return {
            isAuthenticated: true,
            user: data.student,
            userType: 'student'
          };
        }

        const counselorResult = await fetch(apiUrl('auth/counselor/profile'), {
          method: 'GET',
          credentials: 'include'
        });

        if (counselorResult.ok) {
          const data = await counselorResult.json();
          this.currentUser = data.counselor;
          this.userType = 'counselor';
          this.isAuthenticated = true;
          return {
            isAuthenticated: true,
            user: data.counselor,
            userType: 'counselor'
          };
        }

        // No valid session found
        this.isAuthenticated = false;
        return {
          isAuthenticated: false
        };
      }
      
      // If userType is already set, use the existing method
      const result = await this.getCurrentUserProfile();
      
      if (result.success) {
        this.isAuthenticated = true;
        return {
          isAuthenticated: true,
          user: result.user,
          userType: this.userType
        };
      } else {
        this.isAuthenticated = false;
        return {
          isAuthenticated: false
        };
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      this.isAuthenticated = false;
      return {
        isAuthenticated: false
      };
    }
  }

  /**
   * Handle session expiration
   */
  handleSessionExpired() {
    this.currentUser = null;
    this.userType = null;
    this.isAuthenticated = false;
    
    // Emit session expired event
    this.emitAuthEvent('session-expired');
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401) {
        this.handleSessionExpired();
        throw new Error('Session expired');
      }

      return response;
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  }

  /**
   * Change student password
   */
  async changeStudentPassword(username, currentPassword, newPassword) {
    try {
      const response = await fetch(apiUrl('auth/student/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, currentPassword, newPassword })
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  /**
   * Emit authentication events for components to listen to
   */
  emitAuthEvent(eventType, data = null) {
    const event = new CustomEvent('auth-event', {
      detail: {
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Get current authentication state
   */
  getAuthState() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
      userType: this.userType
    };
  }

  /**
   * Initialize auth service - check for existing session
   */
  async initialize() {
    try {
      // Try to determine user type from a session validation endpoint
      const studentResult = await fetch(apiUrl('auth/student/profile'), {
        method: 'GET',
        credentials: 'include'
      });

      if (studentResult.ok) {
        const data = await studentResult.json();
        this.currentUser = data.student;
        this.userType = 'student';
        this.isAuthenticated = true;
        return { userType: 'student', user: data.student };
      }

      const counselorResult = await fetch(apiUrl('auth/counselor/profile'), {
        method: 'GET',
        credentials: 'include'
      });

      if (counselorResult.ok) {
        const data = await counselorResult.json();
        this.currentUser = data.counselor;
        this.userType = 'counselor';
        this.isAuthenticated = true;
        return { userType: 'counselor', user: data.counselor };
      }

      // No valid session found
      return { userType: null, user: null };
    } catch (error) {
      console.error('Auth initialization error:', error);
      return { userType: null, user: null };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;