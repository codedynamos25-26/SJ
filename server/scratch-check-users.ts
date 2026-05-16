import { db, users } from './src/db/index.js'

async function run() {
  try {
    const all = await db.select().from(users)
    console.log("Users in DB:", all.map(u => u.email))
  } catch (err) {
    console.error(err)
  }
  process.exit(0)
}

run()
