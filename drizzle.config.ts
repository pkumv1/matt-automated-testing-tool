import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') });

// Defer the check to runtime instead of module load time
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Please check your .env file.");
    // Return a dummy URL for build time - actual connection will fail but build will succeed
    return "postgresql://localhost:5432/postgres";
  }
  return url;
};

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
