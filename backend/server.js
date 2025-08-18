const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const accountRoutes = require('./routes/accounts');
const { router: authRoutes } = require('./routes/auth');
const bulkAssessmentRoutes = require('./routes/bulkAssessments');
const studentAssessmentRoutes = require('./routes/studentAssessments');
const counselorAssessmentRoutes = require('./routes/counselorAssessments');
const dataCleanupRoutes = require('./routes/dataCleanup');
const studentInterventionRoutes = require('./routes/studentInterventions');
const counselorInterventionRoutes = require('./routes/counselorInterventions');
const counselorManagementRoutes = require('./routes/counselorManagement');
const aiInterventionRoutes = require('./routes/aiInterventions');
const { supabase } = require('./config/database');
const { SessionManager } = require('./middleware/sessionManager');
const autoInterventionService = require('./services/autoInterventionService');

const app = express();
const PORT = process.env.PORT || 3000;
const sessionManager = new SessionManager();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bulk-assessments', bulkAssessmentRoutes);
app.use('/api/student-assessments', studentAssessmentRoutes);
app.use('/api/counselor-assessments', counselorAssessmentRoutes);
app.use('/api/data-cleanup', dataCleanupRoutes);
app.use('/api/student-interventions', studentInterventionRoutes);
app.use('/api/counselor-interventions', counselorInterventionRoutes);
app.use('/api/counselor-management', counselorManagementRoutes);
app.use('/api/ai-interventions', aiInterventionRoutes);

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

// Session cleanup job - runs every hour
setInterval(async () => {
  try {
    await sessionManager.cleanupExpiredSessions();
    console.log('🧹 Session cleanup completed');
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
  }
}, 60 * 60 * 1000); // 1 hour

app.listen(PORT, async () => {
  console.log(`🚀 EUNOIA Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`🔐 Session-based authentication enabled`);
  console.log(`🧹 Session cleanup job scheduled every hour`);
  
  // Initialize auto intervention service for automatic AI intervention generation
  console.log(`🤖 AI Intervention Service: Automatic mode enabled`);
  
  try {
    await autoInterventionService.initialize();
    console.log('✅ Auto intervention service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize auto intervention service:', error);
  }
});

module.exports = app;