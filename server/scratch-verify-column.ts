import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    const res = await db.execute(sql`SELECT external_url FROM challenges LIMIT 1;`)
    console.log("Success! Column 'external_url' is accessible.")
  } catch (err) {
    console.error("ERROR: Column 'external_url' is NOT accessible:", err)
  }
  process.exit(0)
}

run()
