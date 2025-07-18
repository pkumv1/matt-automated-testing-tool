import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { ENV } from "./config";
import { logger } from './logger';

if (!ENV.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  throw new Error("DATABASE_URL must be set");
}

const sanitizedUrl = ENV.DATABASE_URL.replace(/:([^@]+)@/, ':****@');
logger.info('🔄 Initializing database connection pool', {
  url: sanitizedUrl,
  poolConfig: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  }
}, 'DATABASE_INIT');

export const pool = new pg.Pool({ 
  connectionString: ENV.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Type for PostgreSQL errors
interface PgError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

// Test connection on startup
logger.info('🔌 Testing database connection...', {}, 'DATABASE_TEST');
pool.connect((err: PgError | null, client, release) => {
  if (err) {
    logger.logError('❌ Database connection failed', err, 'DATABASE_ERROR');
    
    // Provide specific guidance based on error
    const errorMessages = {
      'ECONNREFUSED': {
        message: 'PostgreSQL is not running or not accepting connections',
        fix: 'sudo systemctl start postgresql'
      },
      'ENOTFOUND': {
        message: 'Database host not found',
        fix: 'Check DATABASE_URL host is correct (should be localhost or 127.0.0.1)'
      },
      '28P01': {
        message: 'Authentication failed - wrong username or password',
        fix: 'Check username and password in DATABASE_URL'
      },
      '3D000': {
        message: 'Database does not exist',
        fix: 'Create database with: createdb postgres'
      }
    };

    const errorInfo = errorMessages[err.code as keyof typeof errorMessages];
    if (errorInfo) {
      logger.error(`📍 ${errorInfo.message}`, { 
        code: err.code,
        fix: errorInfo.fix
      }, 'DATABASE_ERROR');
    }
    
    logger.error('🔧 Troubleshooting steps:', {
      steps: [
        'Test connection: psql "$DATABASE_URL"',
        'Check .env file: cat .env | grep DATABASE_URL',
        'Verify PostgreSQL: sudo systemctl status postgresql'
      ]
    }, 'DATABASE_TROUBLESHOOTING');
  } else {
    logger.info('✅ Database connected successfully', {
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    }, 'DATABASE_SUCCESS');
    
    // Check if tables exist
    client!.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `, (err, result) => {
      if (err) {
        logger.error('❌ Failed to check tables', { error: err.message }, 'DATABASE_TABLES');
      } else if (result.rows.length === 0) {
        logger.warn('⚠️  No tables found in database!', {
          suggestion: 'Run: npm run db:push to create tables'
        }, 'DATABASE_TABLES');
      } else {
        const tables = result.rows.map(r => r.tablename);
        logger.info('✅ Database schema verified', {
          tableCount: tables.length,
          tables: tables
        }, 'DATABASE_TABLES');
      }
      release();
    });
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

// Log queries in development - FIXED VERSION
if (ENV.NODE_ENV === 'development') {
  const originalQuery = pool.query.bind(pool);
  pool.query = function(...args: any[]): any {
    // Handle different query formats
    let queryText = 'Unknown query';
    
    if (typeof args[0] === 'string') {
      // Simple string query
      queryText = args[0];
    } else if (args[0] && typeof args[0] === 'object') {
      // Query object format
      if (args[0].text) {
        queryText = args[0].text;
      } else if (args[0].sql) {
        queryText = args[0].sql;
      }
    }
    
    // Only log if we have a valid query string
    if (typeof queryText === 'string') {
      console.log('🔍 SQL:', queryText.substring(0, 100) + (queryText.length > 100 ? '...' : ''));
    }
    
    return originalQuery(...args);
  };
}

export const db = drizzle(pool, { schema });

// Add health check function
export async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time, current_database() as database');
      return {
        status: 'healthy',
        details: {
          connected: true,
          time: result.rows[0].time,
          database: result.rows[0].database,
          poolSize: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingClients: pool.waitingCount
        }
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    return {
      status: 'error',
      details: {
        connected: false,
        error: error.message,
        code: error.code
      }
    };
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Closing database connections...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});
