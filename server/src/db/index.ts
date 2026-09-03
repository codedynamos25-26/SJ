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
  max: 5,
  idle_timeout: 15,
  connect_timeout: 15,
  max_lifetime: 60 * 5, // Recycle connections every 5 minutes
  prepare: false,
  onnotice: () => {}, // Suppress notice spam
})

export const db = drizzle(client, { schema })

/**
 * Lightweight DB health ping to keep Neon DB serverless compute alive
 * and verify database connectivity.
 */
export const pingDb = async (): Promise<boolean> => {
  try {
    const result = await client`SELECT 1 as alive`
    return Array.isArray(result) && result.length > 0
  } catch (err) {
    console.error('Database ping error:', err instanceof Error ? err.message : err)
    return false
  }
}

export * from './schema'


