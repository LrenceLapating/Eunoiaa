const { supabase } = require('../config/database');
const { cacheManager } = require('../config/redis');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Session Manager for EUNOIA System
 * Handles database-based session management replacing localStorage
 */
class SessionManager {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a refresh token
   */
  generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new session in the database with Redis caching
   */
  async createSession(userId, userType, ipAddress = null, userAgent = null) {
    try {
      const sessionToken = this.generateSessionToken();
      const refreshToken = this.generateRefreshToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          user_type: userType,
          session_token: sessionToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        logger.logError(new Error('Session creation failed'), `User: ${userId}, Type: ${userType}`);
        throw new Error('Failed to create session');
      }

      // Cache session data in Redis for faster access
      const sessionData = {
        id: data.id,
        user_id: userId,
        user_type: userType,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
        last_accessed: new Date().toISOString()
      };
      
      await cacheManager.setSession(sessionToken, sessionData, Math.floor(this.SESSION_DURATION / 1000));

      return {
        sessionId: data.id,
        sessionToken,
        refreshToken,
        expiresAt
      };
    } catch (error) {
      logger.logError(error, `createSession - User: ${userId}, Type: ${userType}`);
      throw error;
    }
  }

  /**
   * Validate and retrieve session with Redis caching fallback to database
   */
  async validateSession(sessionToken) {
    try {
      // Try Redis cache first
      let session = await cacheManager.getSession(sessionToken);
      
      if (!session) {
        // Fallback to database if not in cache
        const { data: dbSession, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .single();

        if (error || !dbSession) {
          return null;
        }
        
        session = dbSession;
        
        // Cache the session for future requests
        const ttl = Math.floor((new Date(session.expires_at) - new Date()) / 1000);
        if (ttl > 0) {
          await cacheManager.setSession(sessionToken, session, ttl);
        }
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      
      if (now > expiresAt) {
        // Session expired, deactivate it
        await this.deactivateSession(sessionToken);
        return null;
      }

      // Update last accessed time in database (async, don't wait)
      supabase
        .from('user_sessions')
        .update({ last_accessed: now.toISOString() })
        .eq('session_token', sessionToken);

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh session if needed with Redis cache update
   */
  async refreshSessionIfNeeded(session) {
    try {
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      // If session expires within refresh threshold, extend it
      if (timeUntilExpiry < this.REFRESH_THRESHOLD) {
        const newExpiresAt = new Date(now.getTime() + this.SESSION_DURATION);
        
        const { error } = await supabase
          .from('user_sessions')
          .update({ 
            expires_at: newExpiresAt.toISOString(),
            last_accessed: now.toISOString()
          })
          .eq('session_token', session.session_token);

        if (!error) {
          session.expires_at = newExpiresAt.toISOString();
          session.last_accessed = now.toISOString();
          
          // Update Redis cache with new expiration
          await cacheManager.setSession(
            session.session_token, 
            session, 
            Math.floor(this.SESSION_DURATION / 1000)
          );
        }
      }

      return session;
    } catch (error) {
      logger.logError(error, `refreshSessionIfNeeded - Token: ${session?.session_token}`);
      return session;
    }
  }

  /**
   * Deactivate a session and clear from Redis cache
   */
  async deactivateSession(sessionToken) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          last_accessed: new Date().toISOString()
        })
        .eq('session_token', sessionToken);

      if (error) {
        logger.logError(new Error('Session deactivation failed'), `Token: ${sessionToken}`);
        return false;
      }

      // Remove from Redis cache
      await cacheManager.deleteSession(sessionToken);

      return true;
    } catch (error) {
      logger.logError(error, `deactivateSession - Token: ${sessionToken}`);
      return false;
    }
  }

  /**
   * Deactivate all sessions for a user
   */
  async deactivateAllUserSessions(userId, userType) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          last_accessed: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('user_type', userType);

      if (error) {
        console.error('Deactivate all sessions error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Deactivate all sessions error:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions() {
    try {
      const now = new Date();
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .lt('expires_at', now.toISOString())
        .eq('is_active', true);

      if (error) {
        console.error('Session cleanup error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return false;
    }
  }

  /**
   * Log user activity
   */
  async logActivity(userId, userType, action, details = null, ipAddress = null, userAgent = null) {
    try {
      // Only log important actions to prevent database overload
      const importantActions = ['login', 'logout', 'password_change', 'assessment_submit'];
      
      if (!importantActions.includes(action)) {
        return; // Skip logging for frequent API access calls
      }

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          user_type: userType,
          action: action,
          details: details,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) {
        console.error('Activity logging error:', error);
      }
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }
}

// Middleware function to verify session
const verifySession = async (req, res, next) => {
  try {
    const sessionManager = new SessionManager();
    
    // Get session token from cookie or Authorization header
    let sessionToken = req.cookies?.sessionToken;
    
    if (!sessionToken) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.replace('Bearer ', '');
      }
    }

    if (!sessionToken) {
      console.log('❌ No session token found in cookies or headers for:', req.path);
      return res.status(401).json({ error: 'No session token provided' });
    }

    console.log('🔍 Validating session token for:', req.path, 'Token:', sessionToken.substring(0, 10) + '...');

    // Validate session
    const session = await sessionManager.validateSession(sessionToken);
    
    if (!session) {
      console.log('❌ Session validation failed for token:', sessionToken.substring(0, 10) + '...');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    console.log('✅ Session valid for user:', session.user_id, 'type:', session.user_type);

    // Refresh session if needed
    const refreshedSession = await sessionManager.refreshSessionIfNeeded(session);
    
    // Add session info to request
    req.session = refreshedSession;
    req.user = {
      id: session.user_id,
      type: session.user_type
    };

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Log activity (only for important actions to prevent spam)
    const importantActions = ['login', 'logout', 'password_change', 'assessment_submit'];
    const action = req.path.includes('login') ? 'login' : 
                  req.path.includes('logout') ? 'logout' :
                  req.path.includes('password') ? 'password_change' :
                  req.path.includes('submit') ? 'assessment_submit' : 'api_access';
    
    if (importantActions.includes(action)) {
      await sessionManager.logActivity(
        session.user_id,
        session.user_type,
        action,
        { endpoint: req.path, method: req.method },
        ipAddress,
        userAgent
      );
    }

    next();
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
};

// Middleware specifically for student routes
const verifyStudentSession = async (req, res, next) => {
  await verifySession(req, res, () => {
    console.log('🎓 Checking student access for user:', req.user.id, 'type:', req.user.type);
    if (req.user.type !== 'student') {
      console.log('❌ Access denied - user type is:', req.user.type, 'but student required');
      return res.status(403).json({ error: 'Student access required' });
    }
    console.log('✅ Student access granted for user:', req.user.id);
    next();
  });
};

// Middleware specifically for counselor routes
const verifyCounselorSession = async (req, res, next) => {
  await verifySession(req, res, () => {
    if (req.user.type !== 'counselor') {
      return res.status(403).json({ error: 'Counselor access required' });
    }
    next();
  });
};

module.exports = {
  SessionManager,
  verifySession,
  verifyStudentSession,
  verifyCounselorSession
};