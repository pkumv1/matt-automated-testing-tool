import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { ENV } from "./config";

if (!ENV.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  throw new Error("DATABASE_URL must be set");
}

console.log('🔄 Connecting to database...');
console.log('📍 Database URL format:', ENV.DATABASE_URL.replace(/:([^@]+)@/, ':****@'));

export const pool = new pg.Pool({ 
  connectionString: ENV.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    
    // Provide specific guidance based on error
    if (err.code === 'ECONNREFUSED') {
      console.error('📍 PostgreSQL is not running or not accepting connections');
      console.error('💡 Fix: sudo systemctl start postgresql');
    } else if (err.code === 'ENOTFOUND') {
      console.error('📍 Database host not found');
      console.error('💡 Fix: Check DATABASE_URL host is correct (should be localhost or 127.0.0.1)');
    } else if (err.code === '28P01') {
      console.error('📍 Authentication failed - wrong username or password');
      console.error('💡 Fix: Check username and password in DATABASE_URL');
      console.error('💡 Note: Special characters must be URL encoded (@ = %40, # = %23)');
    } else if (err.code === '3D000') {
      console.error('📍 Database does not exist');
      console.error('💡 Fix: Create database with: createdb postgres');
    }
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Test connection: psql "$DATABASE_URL"');
    console.error('2. Check .env file: cat .env | grep DATABASE_URL');
    console.error('3. Verify PostgreSQL: sudo systemctl status postgresql');
  } else {
    console.log('✅ Database connected successfully');
    
    // Check if tables exist
    client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `, (err, result) => {
      if (err) {
        console.error('❌ Failed to check tables:', err.message);
      } else if (result.rows.length === 0) {
        console.warn('⚠️  No tables found in database!');
        console.warn('💡 Run: npm run db:push to create tables');
      } else {
        console.log('✅ Found tables:', result.rows.map(r => r.tablename).join(', '));
      }
      release();
    });
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err);
});

// Log queries in development
if (ENV.NODE_ENV === 'development') {
  const originalQuery = pool.query.bind(pool);
  pool.query = function(...args: any[]) {
    console.log('🔍 SQL:', args[0]?.substring(0, 100) + (args[0]?.length > 100 ? '...' : ''));
    return originalQuery(...args);
  };
}

export const db = drizzle(pool, { schema });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Closing database connections...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});
