import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'challenges';`)
    console.log("Columns in 'challenges':", res.map(r => r.column_name))
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}

run()
