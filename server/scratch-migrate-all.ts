import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    console.log("Starting FINAL manual migrations...")
    
    // Challenges table
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "external_url" text;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "ends_at" timestamp;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "enrollment_xp" integer DEFAULT 0;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "participants" integer DEFAULT 0;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "requirements" text[] DEFAULT '{}';`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "timeline" text[] DEFAULT '{}';`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "prizes" text[] DEFAULT '{}';`)
    console.log("✓ Updated challenges table")

    // Events table
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_url" text;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "platform" text;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "ends_at" timestamp;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "enrollment_xp" integer DEFAULT 0;`)
    console.log("✓ Updated events table")

    console.log("All manual migrations complete.")
  } catch (err) {
    console.error("Migration failed:", err)
  }
  process.exit(0)
}

run()
