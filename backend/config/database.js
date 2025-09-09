const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const { cacheManager } = require('./redis');
const { config } = require('./environment');

// PostgreSQL connection pool for optimized database operations
const pool = new Pool({
  connectionString: config.database.supabaseUrl?.replace('https://', 'postgresql://postgres:') + '?sslmode=require',
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.pool.connectionTimeoutMillis
});

// Pool event handlers
pool.on('connect', (client) => {
  console.log('✅ New database client connected');
});

pool.on('error', (err, client) => {
  console.error('❌ Database pool error:', err.message);
});

pool.on('remove', (client) => {
  console.log('🔄 Database client removed from pool');
});

// Create Supabase client for frontend/auth operations (with RLS)
const supabaseFrontend = createClient(config.database.supabaseUrl, config.database.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Create Supabase client for backend operations (bypasses RLS)
const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Enhanced database query function with caching
const cachedQuery = async (queryKey, queryFn, ttl = 1800) => {
  try {
    // Try to get from cache first
    const cachedResult = await cacheManager.getCachedQuery(queryKey);
    if (cachedResult) {
      console.log(`📦 Cache hit for query: ${queryKey}`);
      return cachedResult;
    }

    // Execute query if not in cache
    console.log(`🔍 Cache miss for query: ${queryKey}`);
    const result = await queryFn();
    
    // Cache the result
    await cacheManager.setCachedQuery(queryKey, result, ttl);
    
    return result;
  } catch (error) {
    console.error('❌ Cached query error:', error.message);
    throw error;
  }
};

// Test connection function (enhanced with pool testing)
const testConnection = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabaseFrontend
      .from('students')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    // Test PostgreSQL pool connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connections successful (Supabase + Pool)');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Graceful shutdown function
const closeConnections = async () => {
  try {
    await pool.end();
    console.log('✅ Database pool closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

module.exports = {
  supabase,
  supabaseAdmin: supabase, // Alias for backward compatibility
  supabaseFrontend,
  pool,
  cachedQuery,
  testConnection,
  closeConnections
};