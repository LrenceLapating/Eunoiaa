const logger = require('../config/logger');
const { config } = require('../config/environment');

/**
 * Performance Monitoring Middleware
 * Tracks response times, memory usage, and other performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errors: 0,
      memoryUsage: []
    };
    
    this.slowRequestThreshold = 1000; // 1 second
    this.memoryCheckInterval = 30000; // 30 seconds
    
    if (config.monitoring.metricsEnabled) {
      this.startMemoryMonitoring();
    }
  }

  /**
   * Express middleware for performance tracking
   */
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      // Track request start
      req.performanceStart = startTime;
      
      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endMemory = process.memoryUsage();
        
        // Update metrics
        this.updateMetrics(req, res, responseTime, startMemory, endMemory);
        
        // Log performance data
        this.logPerformance(req, res, responseTime);
        
        // Call original end method
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Update performance metrics
   */
  updateMetrics(req, res, responseTime, startMemory, endMemory) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requests;
    
    if (responseTime > this.slowRequestThreshold) {
      this.metrics.slowRequests++;
    }
    
    if (res.statusCode >= 400) {
      this.metrics.errors++;
    }
    
    // Track memory usage difference
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };
    
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      diff: memoryDiff,
      current: endMemory
    });
    
    // Keep only last 100 memory measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  /**
   * Log performance data
   */
  logPerformance(req, res, responseTime) {
    const performanceData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };
    
    // Log slow requests as warnings
    if (responseTime > this.slowRequestThreshold) {
      logger.warn(`Slow Request: ${JSON.stringify(performanceData)}`);
    } else {
      logger.logPerformance(
        `${req.method} ${req.originalUrl}`,
        responseTime,
        {
          statusCode: res.statusCode,
          ip: performanceData.ip
        }
      );
    }
  }

  /**
   * Start monitoring memory usage
   */
  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memoryMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      logger.info(`Memory Usage: ${JSON.stringify(memoryMB)} MB`);
      
      // Alert if memory usage is high
      if (memoryMB.heapUsed > 500) { // 500MB threshold
        logger.warn(`High memory usage detected: ${memoryMB.heapUsed}MB`);
      }
    }, this.memoryCheckInterval);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const currentMemory = process.memoryUsage();
    
    return {
      ...this.metrics,
      currentMemory: {
        rss: Math.round(currentMemory.rss / 1024 / 1024),
        heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024),
        external: Math.round(currentMemory.external / 1024 / 1024)
      },
      uptime: process.uptime(),
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0,
      slowRequestRate: this.metrics.requests > 0 ? (this.metrics.slowRequests / this.metrics.requests * 100).toFixed(2) : 0
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errors: 0,
      memoryUsage: []
    };
  }

  /**
   * Health check endpoint data
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const isHealthy = (
      metrics.errorRate < 5 && // Less than 5% error rate
      metrics.slowRequestRate < 10 && // Less than 10% slow requests
      metrics.currentMemory.heapUsed < 1000 // Less than 1GB memory usage
    );
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      metrics: {
        requests: metrics.requests,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        errorRate: `${metrics.errorRate}%`,
        slowRequestRate: `${metrics.slowRequestRate}%`,
        memoryUsage: `${metrics.currentMemory.heapUsed}MB`,
        uptime: `${Math.round(metrics.uptime)}s`
      }
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Rate limiting middleware
 */
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs = config.security.rateLimitWindow, max = config.security.rateLimitMaxRequests) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.logSecurity('Rate limit exceeded', null, req.ip, {
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

module.exports = {
  performanceMonitor,
  trackRequest: performanceMonitor.trackRequest.bind(performanceMonitor),
  getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
  getHealthStatus: performanceMonitor.getHealthStatus.bind(performanceMonitor),
  resetMetrics: performanceMonitor.resetMetrics.bind(performanceMonitor),
  createRateLimit
};