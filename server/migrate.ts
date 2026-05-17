import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  connect_timeout: 30,
})

async function migrate() {
  console.log('Running migrations...')
  await sql`ALTER TABLE "gallery" ADD COLUMN IF NOT EXISTS "drive_url" text`
  console.log('✓ gallery.drive_url column added')
  await sql`CREATE TABLE IF NOT EXISTS "drive_links" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "drive_url" text NOT NULL,
    "image" text,
    "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp DEFAULT now()
  )`
  console.log('✓ drive_links table ready')
  await sql.end()
  console.log('Done!')
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1) })
