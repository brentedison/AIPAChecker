import { db } from "./db";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

// This script will create all tables based on our schema
async function main() {
  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations completed!");
}

main().catch((err) => {
  console.error("Error during migration:", err);
  process.exit(1);
});