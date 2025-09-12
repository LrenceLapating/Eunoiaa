const Redis = require('ioredis');
const { config } = require('./environment');

// Enhanced Redis configuration for maximum resilience
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  maxRetriesPerRequest: null, // Unlimited retries to prevent connection drops
  retryDelayOnFailover: config.redis.retryDelayOnFailover,
  enableReadyCheck: true,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: null,
  keepAlive: 30000,
  family: 4, // Force IPv4
  // Reconnection strategy
  reconnectOnError: (err) => {
    console.log('Redis reconnectOnError:', err.message);
    return err.message.includes('READONLY') || err.message.includes('ECONNRESET');
  }
};

// Create Redis client
const redis = new Redis(redisConfig);

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis ready for operations');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
  // Enhanced error logging with context
  if (error.code === 'ECONNREFUSED') {
    console.warn('⚠️ Redis server unavailable - operating in fallback mode');
  } else if (error.code === 'ENOTFOUND') {
    console.warn('⚠️ Redis host not found - check configuration');
  } else {
    console.error('❌ Redis error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
  }
  // Don't exit process - allow app to continue without Redis
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Cache helper functions
class CacheManager {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 3600; // 1 hour default TTL
  }

  // Enhanced Redis availability check
  isAvailable() {
    return this.redis.status === 'ready' || this.redis.status === 'connecting';
  }
  
  // Check if Redis is truly ready for operations
  isReady() {
    return this.redis.status === 'ready';
  }

  // Get cached data with enhanced error handling
  async get(key) {
    try {
      if (!this.isReady()) {
        console.warn(`Redis not ready for GET ${key} - returning null`);
        return null;
      }
      
      const data = await Promise.race([
        this.redis.get(key),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis GET timeout')), 3000)
        )
      ]);
      
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', {
        key,
        error: error.message,
        redisStatus: this.redis.status
      });
      return null; // Fail gracefully
    }
  }

  // Set cached data with enhanced error handling
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isReady()) {
        console.warn(`Redis not ready for SET ${key} - skipping cache`);
        return false;
      }
      
      await Promise.race([
        this.redis.setex(key, ttl, JSON.stringify(value)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis SET timeout')), 3000)
        )
      ]);
      
      return true;
    } catch (error) {
      console.error('Redis SET error:', {
        key,
        error: error.message,
        redisStatus: this.redis.status
      });
      return false; // Fail gracefully
    }
  }

  // Delete cached data
  async del(key) {
    try {
      if (!this.isAvailable()) return false;
      
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      if (!this.isAvailable()) return false;
      
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis CLEAR PATTERN error:', error.message);
      return false;
    }
  }

  // Session-specific methods
  async getSession(sessionToken) {
    return await this.get(`session:${sessionToken}`);
  }

  async setSession(sessionToken, sessionData, ttl = 86400) { // 24 hours
    return await this.set(`session:${sessionToken}`, sessionData, ttl);
  }

  async deleteSession(sessionToken) {
    return await this.del(`session:${sessionToken}`);
  }

  // Query cache methods
  async getCachedQuery(queryKey) {
    return await this.get(`query:${queryKey}`);
  }

  async setCachedQuery(queryKey, queryResult, ttl = 1800) { // 30 minutes
    return await this.set(`query:${queryKey}`, queryResult, ttl);
  }

  // College scores cache
  async getCachedCollegeScores(college, assessmentType) {
    return await this.get(`college_scores:${college}:${assessmentType}`);
  }

  async setCachedCollegeScores(college, assessmentType, scores, ttl = 3600) { // 1 hour
    return await this.set(`college_scores:${college}:${assessmentType}`, scores, ttl);
  }

  async clearCollegeScoresCache(college = '*') {
    return await this.clearPattern(`college_scores:${college}:*`);
  }
}

// Test Redis connection
const testRedisConnection = async () => {
  try {
    await redis.ping();
    console.log('✅ Redis connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    return false;
  }
};

// Create cache manager instance
const cacheManager = new CacheManager();

module.exports = {
  redis,
  cacheManager,
  testRedisConnection
};