import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRouter from './routes/auth'
import eventsRouter from './routes/events'
import challengesRouter from './routes/challenges'
import teamRouter from './routes/team'
import projectsRouter from './routes/projects'
import galleryRouter from './routes/gallery'
import leaderboardRouter from './routes/leaderboard'
import dashboardRouter from './routes/dashboard'
import adminRouter from './routes/admin'
import announcementsRouter from './routes/announcements'
import userRouter from './routes/user'
import statsRouter from './routes/stats'
import { db } from './db'
import { sql } from 'drizzle-orm'

const app = express()
const PORT = process.env.PORT ?? 4000

// Security + parsing
app.use(helmet({
  crossOriginResourcePolicy: false,
}))

// In dev, allow all origins. In production, restrict to the Vercel frontend URL.
app.use(cors({ 
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// Routes
app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/challenges', challengesRouter)
app.use('/api/team', teamRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/gallery', galleryRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/admin', adminRouter)
app.use('/api/announcements', announcementsRouter)
app.use('/api/user', userRouter)
app.use('/api/stats', statsRouter)

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.listen(PORT, async () => {
  // Auto-migration for production DB stability
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "semester" text;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamp;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcode_rating" integer DEFAULT 0;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcode_solved" integer DEFAULT 0;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcode_url" text;`)
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_url" text;`)
    await db.execute(sql`ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "instagram_url" text;`)
    await db.execute(sql`ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "linkedin_url" text;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_url" text;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "platform" text;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "ends_at" timestamp;`)
    await db.execute(sql`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "enrollment_xp" integer DEFAULT 0;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "external_url" text;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "ends_at" timestamp;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "enrollment_xp" integer DEFAULT 0;`)
    await db.execute(sql`ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "participants" integer DEFAULT 0;`)
    console.log("✓ Database auto-migration complete")
  } catch (err) {
    console.error("Auto-migration skipped or failed:", err)
  }

  console.log(`\n🚀  Code Dynamos API running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Auth:   POST /api/auth/login | POST /api/auth/signup`)
  console.log(`   Admin:  GET  /api/admin/stats  (requires admin token)\n`)
})
