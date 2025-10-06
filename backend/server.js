const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database and Redis for graceful shutdown
const { closeConnections, testConnection } = require('./config/database');
const { redis } = require('./config/redis');
const logger = require('./config/logger');

const accountRoutes = require('./routes/accounts');
const { router: authRoutes } = require('./routes/auth');
const bulkAssessmentRoutes = require('./routes/bulkAssessments');
const individualAssessmentRoutes = require('./routes/individualAssessments');
const studentAssessmentRoutes = require('./routes/studentAssessments');
const counselorAssessmentRoutes = require('./routes/counselorAssessments');
const dataCleanupRoutes = require('./routes/dataCleanup');
const studentInterventionRoutes = require('./routes/studentInterventions');
const counselorInterventionRoutes = require('./routes/counselorInterventions');
const counselorManagementRoutes = require('./routes/counselorManagement');
const aiInterventionRoutes = require('./routes/aiInterventions');
const riskAlertsRoutes = require('./routes/riskAlerts');
const yearlyTrendsRoutes = require('./routes/yearlyTrends');
const demographicTrendsRoutes = require('./routes/demographicTrends');
const academicSettingsRoutes = require('./routes/academicSettings');
const assessmentTrackerRoutes = require('./routes/assessmentTracker');
const contactGuidanceRoutes = require('./routes/contactGuidance');
const { supabase } = require('./config/database');
const { SessionManager } = require('./middleware/sessionManager');
const autoInterventionService = require('./services/autoInterventionService');

const app = express();
const PORT = process.env.PORT || 3000;
const sessionManager = new SessionManager();

// Store cleanup interval reference for proper cleanup
let sessionCleanupInterval = null;

// Memory monitoring
const monitorMemory = () => {
  const usage = process.memoryUsage();
  const mbUsage = {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024)
  };
  
  // Log memory usage every 5 minutes
  logger.info(`Memory Usage: RSS=${mbUsage.rss}MB, Heap=${mbUsage.heapUsed}/${mbUsage.heapTotal}MB, External=${mbUsage.external}MB`);
  
  // Warn if memory usage is high
  if (mbUsage.heapUsed > 500) {
    logger.warn(`High memory usage detected: ${mbUsage.heapUsed}MB heap used`);
  }
};

// Critical Error Handlers - PREVENTS CRASHES
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Promise Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  
  // Don't exit process - log and continue
  console.error('❌ Unhandled Promise Rejection detected - Server continuing...');
});

process.on('uncaughtException', (error) => {
  logger.error('🚨 Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  console.error('❌ Uncaught Exception detected - Attempting graceful shutdown...');
  
  // Attempt graceful shutdown
  gracefulShutdown('uncaughtException');
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    // Clear intervals
    if (sessionCleanupInterval) {
      clearInterval(sessionCleanupInterval);
      console.log('✅ Session cleanup interval cleared');
    }
    
    // Close database connections
    await closeConnections();
    
    // Close Redis connection
    if (redis && redis.status === 'ready') {
      await redis.quit();
      console.log('✅ Redis connection closed');
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start memory monitoring
setInterval(monitorMemory, 5 * 60 * 1000); // Every 5 minutes

// Security middleware
app.use(helmet());
// CORS configuration for multiple environments
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://eunoiaafrontend.vercel.app',
  'https://eunoiaafrontend-ncib1j5iv-lrencelapatings-projects.vercel.app',
  // Add common Vercel deployment patterns
  'https://eunoia-frontend.vercel.app',
  'https://eunoia.vercel.app',
  // Allow any Vercel preview deployments for this project (more flexible pattern)
  /^https:\/\/eunoiaafrontend.*\.vercel\.app$/,
  // Allow any deployment with the project owner pattern
  /^https:\/\/.*-lrencelapatings-projects\.vercel\.app$/,
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed list or matches regex patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Increased from 100 to 300 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// iOS Safari cache prevention middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  
  // Add cache-control headers for all API requests
  if (req.path.startsWith('/api/')) {
    // Prevent caching for API requests, especially on iOS
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });
    
    // Define authentication-dependent endpoints that need special iOS handling
    const authDependentPaths = [
      '/api/auth/',
      '/api/accounts/',
      '/api/demographic-trends/',
      '/api/counselor-assessments/',
      '/api/student-assessments/',
      '/api/counselor-interventions/',
      '/api/student-interventions/',
      '/api/ai-interventions/',
      '/api/risk-alerts/',
      '/api/yearly-trends/',
      '/api/academic-settings/',
      '/api/assessment-tracker/',
      '/api/counselor-management/',
      '/api/bulk-assessments/',
      '/api/individual-assessments/',
      '/api/data-cleanup/',
      '/api/student/'
    ];
    
    // Check if current path is authentication-dependent
    const isAuthDependent = authDependentPaths.some(path => req.path.startsWith(path));
    
    // iOS-specific headers (exclude auth-dependent endpoints to prevent cookie interference)
    if (isIOS && !isAuthDependent) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
        'Vary': 'User-Agent, Accept-Encoding',
        'X-iOS-Request': 'true',
        'X-Timestamp': Date.now().toString()
      });
    }
    
    // Debug logging for iOS requests
    if (isIOS) {
      console.log(`🍎 iOS Request: ${req.method} ${req.path} - Auth-dependent: ${isAuthDependent} - ${userAgent.substring(0, 50)}...`);
    }
  }
  
  next();
});

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bulk-assessments', bulkAssessmentRoutes);
app.use('/api/individual-assessments', individualAssessmentRoutes);
app.use('/api/student-assessments', studentAssessmentRoutes);
app.use('/api/counselor-assessments', counselorAssessmentRoutes);
app.use('/api/data-cleanup', dataCleanupRoutes);
app.use('/api/student-interventions', studentInterventionRoutes);
app.use('/api/counselor-interventions', counselorInterventionRoutes);
app.use('/api/counselor-management', counselorManagementRoutes);
app.use('/api/ai-interventions', aiInterventionRoutes);
app.use('/api/risk-alerts', riskAlertsRoutes);
app.use('/api/yearly-trends', yearlyTrendsRoutes);
app.use('/api/demographic-trends', demographicTrendsRoutes);
app.use('/api/academic-settings', academicSettingsRoutes);
app.use('/api/assessment-tracker', assessmentTrackerRoutes);
app.use('/api/student', contactGuidanceRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Session cleanup job - runs every hour (with proper cleanup reference)
sessionCleanupInterval = setInterval(async () => {
  try {
    await sessionManager.cleanupExpiredSessions();
    console.log('🧹 Session cleanup completed');
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    logger.logError(error, 'Session cleanup job');
  }
}, 60 * 60 * 1000); // 1 hour

// Store server reference for graceful shutdown
let server;

server = app.listen(PORT, async () => {
  console.log(`🚀 EUNOIA Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`🔐 Session-based authentication enabled`);
  console.log(`🧹 Session cleanup job scheduled every hour`);
  console.log(`🛡️ Crash prevention handlers enabled`);
  console.log(`📊 Memory monitoring active`);
  
  // Test database connection before initializing services
  console.log('🔍 Testing database connection...');
  try {
    await testConnection();
    console.log('✅ Database connection verified');
  } catch (dbError) {
    console.error('❌ Database connection failed:', dbError.message);
    console.warn('⚠️ Services will start but may have limited functionality');
  }

  // Initialize auto intervention service for automatic AI intervention generation
  console.log(`🤖 AI Intervention Service: Automatic mode enabled`);
  
  try {
    await autoInterventionService.initialize();
    console.log('✅ Auto intervention service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize auto intervention service:', error);
    logger.logError(error, 'Auto intervention service initialization');
  }
  
  // Log initial memory usage
  monitorMemory();
});

module.exports = app;