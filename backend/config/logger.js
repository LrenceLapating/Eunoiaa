const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  // Do not exit on handled exceptions
  exitOnError: false
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Helper functions for common logging patterns
logger.logError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };
  logger.error(JSON.stringify(errorInfo));
};

logger.logActivity = (userId, userType, action, details = null, ipAddress = null) => {
  const activityInfo = {
    userId,
    userType,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  };
  logger.info(`User Activity: ${JSON.stringify(activityInfo)}`);
};

logger.logPerformance = (operation, duration, details = null) => {
  const perfInfo = {
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString()
  };
  logger.info(`Performance: ${JSON.stringify(perfInfo)}`);
};

logger.logSecurity = (event, userId = null, ipAddress = null, details = null) => {
  const securityInfo = {
    event,
    userId,
    ipAddress,
    details,
    timestamp: new Date().toISOString()
  };
  logger.warn(`Security Event: ${JSON.stringify(securityInfo)}`);
};

module.exports = logger;