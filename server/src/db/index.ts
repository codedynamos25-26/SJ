import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const isCloudDb = process.env.DATABASE_URL.includes('render.com') ||
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('ssl=true')

const client = postgres(process.env.DATABASE_URL, {
  ssl: (process.env.NODE_ENV === 'production' || isCloudDb) ? 'require' : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
})
export const db = drizzle(client, { schema })

export * from './schema'

