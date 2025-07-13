import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "@shared/schema";
import { ENV } from "./config";

// Use the configured DATABASE_URL from ENV which ensures dotenv is loaded
if (!ENV.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a standard PostgreSQL pool
export const pool = new pg.Pool({ 
  connectionString: ENV.DATABASE_URL,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring database client:', err.stack);
  } else {
    console.log('✅ Database connection successful');
    release();
  }
});

export const db = drizzle(pool, { schema });
