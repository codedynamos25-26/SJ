import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "external_url" text;`)
    console.log("Migration script complete")
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}

run()
