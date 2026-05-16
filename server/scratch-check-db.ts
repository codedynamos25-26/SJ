import { db } from './src/db/index.js'
import { sql } from 'drizzle-orm'

async function run() {
  try {
    const res = await db.execute(sql`SELECT current_database(), current_user;`)
    console.log("Connected to:", res[0])
    
    const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`)
    console.log("Tables in DB:", tables.map(t => t.table_name))
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}

run()
