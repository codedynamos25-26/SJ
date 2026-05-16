import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "team_members" DROP COLUMN IF EXISTS "skills";`)
    await db.execute(sql`ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "instagram_url" text;`)
    await db.execute(sql`ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "linkedin_url" text;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamp;`)
    console.log("Migration script complete")
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}

run()
