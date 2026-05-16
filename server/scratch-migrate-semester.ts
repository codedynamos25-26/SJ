import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "semester" text;`)
    console.log("Migration script complete: added semester to users")
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}

run()
