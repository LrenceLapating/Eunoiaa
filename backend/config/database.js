const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const { cacheManager } = require('./redis');
const { config } = require('./environment');

// Enhanced PostgreSQL connection pool with resilience
let pool = null;

// Only create pool if SUPABASE_URL is properly configured
if (config.database.supabaseUrl && config.database.supabaseUrl !== 'https://your-project-id.supabase.co') {
  try {
    const connectionString = config.database.supabaseUrl.replace('https://', 'postgresql://postgres:') + '?sslmode=require';
    pool = new Pool({
      connectionString,
      min: config.database.pool.min || 2, // Maintain minimum connections
      max: config.database.pool.max,
      idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.pool.connectionTimeoutMillis,
      // Enhanced error handling
      allowExitOnIdle: false,
      // Connection validation
      query_timeout: 30000,
      statement_timeout: 30000,
      // Retry configuration
      acquireTimeoutMillis: 60000
    });
  } catch (error) {
    console.error('❌ Failed to create database pool:', error.message);
    console.warn('⚠️ Database pool not initialized. Please check your SUPABASE_URL configuration.');
  }
} else {
  console.warn('⚠️ SUPABASE_URL not configured. Database pool not initialized.');
  console.log('💡 Please copy .env.example to .env and configure your Supabase credentials.');
}

// Pool event handlers
if (pool) {
  pool.on('connect', (client) => {
    console.log('✅ New database client connected');
  });

  pool.on('error', (err, client) => {
  console.error('❌ Database pool error:', {
    error: err.message,
    code: err.code,
    severity: err.severity,
    detail: err.detail,
    hint: err.hint,
    position: err.position,
    internalPosition: err.internalPosition,
    internalQuery: err.internalQuery,
    where: err.where,
    schema: err.schema,
    table: err.table,
    column: err.column,
    dataType: err.dataType,
    constraint: err.constraint,
    file: err.file,
    line: err.line,
    routine: err.routine
  });
  
  // Handle specific error types
  if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
    console.warn('⚠️ Database connection lost - will attempt reconnection');
  } else if (err.code === '57P01') {
    console.warn('⚠️ Database server shutdown - will attempt reconnection');
  } else if (err.code === '53300') {
    console.error('❌ Too many database connections - consider increasing pool size');
  }
  
  // Don't exit the process - let pool handle reconnection
  });

  pool.on('remove', (client) => {
    console.log('🔄 Database client removed from pool');
  });
}

// Create Supabase clients only if properly configured
let supabaseFrontend = null;
let supabase = null;

if (config.database.supabaseUrl && 
    config.database.supabaseAnonKey && 
    config.database.supabaseUrl !== 'https://your-project-id.supabase.co') {
  
  try {
    // Create Supabase client for frontend/auth operations (with RLS)
    supabaseFrontend = createClient(config.database.supabaseUrl, config.database.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    // Create Supabase client for backend operations (bypasses RLS)
    if (config.database.supabaseServiceRoleKey) {
      supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });
    } else {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not configured. Backend operations may be limited.');
    }
  } catch (error) {
    console.error('❌ Failed to create Supabase clients:', error.message);
  }
} else {
  console.warn('⚠️ Supabase configuration incomplete. Please check your environment variables.');
}

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

// Enhanced database connection testing with retry logic
const testConnection = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Test Supabase connection
      const { data, error } = await supabaseFrontend
        .from('students')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying Supabase connection in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return false;
      }
      
      // Test PostgreSQL pool connection
      const client = await pool.connect();
      const result = await client.query('SELECT NOW(), version()');
      client.release();
      
      console.log('✅ Database connections successful:', {
        timestamp: result.rows[0].now,
        version: result.rows[0].version.split(' ')[0],
        attempt: attempt
      });
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, {
        error: error.message,
        code: error.code,
        severity: error.severity
      });
      
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

// Enhanced graceful shutdown with timeout
const closeConnections = async (timeout = 10000) => {
  console.log('🔄 Closing database connections...');
  try {
    // Get current pool stats
    const totalCount = pool.totalCount;
    const idleCount = pool.idleCount;
    const waitingCount = pool.waitingCount;
    
    console.log('📊 Pool stats before shutdown:', {
      total: totalCount,
      idle: idleCount,
      waiting: waitingCount,
      active: totalCount - idleCount
    });
    
    // Set a timeout for shutdown
    const shutdownPromise = pool.end();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database shutdown timeout')), timeout)
    );
    
    await Promise.race([shutdownPromise, timeoutPromise]);
    console.log('✅ Database pool closed gracefully');
  } catch (error) {
    console.error('❌ Error during database shutdown:', {
      error: error.message,
      code: error.code
    });
    // Force close if graceful shutdown fails
    try {
      await pool.end();
      console.log('✅ Database connections force closed');
    } catch (forceError) {
      console.error('❌ Failed to force close database:', forceError.message);
    }
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