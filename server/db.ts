import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { ENV } from "./config";

neonConfig.webSocketConstructor = ws;

// Use the configured DATABASE_URL from ENV which ensures dotenv is loaded
if (!ENV.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: ENV.DATABASE_URL });
export const db = drizzle({ client: pool, schema });