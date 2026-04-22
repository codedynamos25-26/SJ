import { db } from './src/db/index'
import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

async function reset() {
  const client = postgres(process.env.DATABASE_URL!)
  await client`DROP SCHEMA public CASCADE;`
  await client`CREATE SCHEMA public;`
  console.log('reset')
  process.exit(0)
}
reset()
