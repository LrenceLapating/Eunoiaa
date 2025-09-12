const path = require('path');
const fs = require('fs');

/**
 * Environment Configuration Manager
 * Handles loading and validating environment variables for different environments
 */
class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.loadEnvironmentVariables();
    this.validateRequiredVariables();
  }

  /**
   * Load environment variables from appropriate .env file
   */
  loadEnvironmentVariables() {
    const envFiles = [
      `.env.${this.env}.local`,
      `.env.${this.env}`,
      '.env.local',
      '.env'
    ];

    for (const envFile of envFiles) {
      const envPath = path.resolve(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log(`Loaded environment from: ${envFile}`);
        break;
      }
    }
  }

  /**
   * Validate that all required environment variables are present
   */
  validateRequiredVariables() {
    const required = {
      development: [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'JWT_SECRET',
        'OPENROUTER_API_KEY'
      ],
      production: [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET',
        'REDIS_HOST',
        'CORS_ORIGIN',
        'OPENROUTER_API_KEY'
      ],
      test: [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'JWT_SECRET'
      ]
    };

    const requiredVars = required[this.env] || required.development;
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * Get configuration object with all environment variables
   */
  getConfig() {
    return {
      // Environment
      NODE_ENV: this.env,
      PORT: parseInt(process.env.PORT) || 3000,
      
      // Database
      database: {
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        pool: {
          min: parseInt(process.env.DB_POOL_MIN) || 2,
          max: parseInt(process.env.DB_POOL_MAX) || 10,
          idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
          connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 10000
        }
      },
      
      // Redis
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 1000,
        enabled: this.env === 'production' || process.env.REDIS_ENABLED === 'true'
      },
      
      // Security
      security: {
        jwtSecret: process.env.JWT_SECRET,
        sessionDuration: parseInt(process.env.SESSION_DURATION) || 24 * 60 * 60 * 1000,
        refreshThreshold: parseInt(process.env.REFRESH_THRESHOLD) || 2 * 60 * 60 * 1000,
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      },
      
      // Logging
      logging: {
        level: process.env.LOG_LEVEL || (this.env === 'production' ? 'info' : 'debug'),
        maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
        maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5
      },
      
      // Caching
      cache: {
        ttl: {
          default: parseInt(process.env.CACHE_TTL_DEFAULT) || 300,
          sessions: parseInt(process.env.CACHE_TTL_SESSIONS) || 86400,
          queries: parseInt(process.env.CACHE_TTL_QUERIES) || 600,
          collegeScores: parseInt(process.env.CACHE_TTL_COLLEGE_SCORES) || 3600
        }
      },
      
      // Monitoring
      monitoring: {
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
        metricsEnabled: process.env.METRICS_ENABLED === 'true',
        apmEnabled: process.env.APM_ENABLED === 'true'
      },
      
      // File Upload
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
        allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
      },
      
      // API
      api: {
        timeout: parseInt(process.env.API_TIMEOUT) || 30000,
        retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3
      },
      
      // AI Service
      ai: {
        openrouterApiKey: process.env.OPENROUTER_API_KEY,
        openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        modelName: process.env.AI_MODEL_NAME || 'mistralai/mistral-7b-instruct',
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1500
      }
    };
  }

  /**
   * Check if running in production
   */
  isProduction() {
    return this.env === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment() {
    return this.env === 'development';
  }

  /**
   * Check if running in test environment
   */
  isTest() {
    return this.env === 'test';
  }
}

// Create singleton instance
const envConfig = new EnvironmentConfig();
const config = envConfig.getConfig();

module.exports = {
  config,
  envConfig,
  isProduction: envConfig.isProduction(),
  isDevelopment: envConfig.isDevelopment(),
  isTest: envConfig.isTest()
};