const Redis = require('ioredis');
const { config } = require('./environment');

// Redis configuration from environment
const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  retryDelayOnFailover: config.redis.retryDelayOnFailover,
  enableReadyCheck: true,
  lazyConnect: true
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

  // Check if Redis is available
  isAvailable() {
    return this.redis.status === 'ready';
  }

  // Get cached data
  async get(key) {
    try {
      if (!this.isAvailable()) return null;
      
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null; // Fail gracefully
    }
  }

  // Set cached data
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return false;
      
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
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