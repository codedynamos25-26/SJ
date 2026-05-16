import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    console.log("Starting manual migrations...")
    
    // Add semester to users
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "semester" text;`)
    console.log("✓ Added semester to users")

    // Add instagram and linkedin to team_members
    await db.execute(sql`ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "instagram_url" text;`)
    await db.execute(sql`ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "linkedin_url" text;`)
    console.log("✓ Added social links to team_members")

    console.log("All manual migrations complete.")
  } catch (err) {
    console.error("Migration failed:", err)
  }
  process.exit(0)
}

run()
