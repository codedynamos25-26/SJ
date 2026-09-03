import express from 'express' // v2
import cors from 'cors'
import helmet from 'helmet'
import dns from 'dns'
import cookieParser from 'cookie-parser'

// Force Node 18+ to prefer IPv4 for DNS resolution.
// This fixes ENETUNREACH errors for smtp.gmail.com on Render.
dns.setDefaultResultOrder('ipv4first')

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
import { db, users, pingDb } from './db'
import { eq, isNotNull, sql } from 'drizzle-orm'

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Anti-Suspension & Health Check Endpoint
const handleHealthCheck = async (req: express.Request, res: express.Response) => {
  const checkDb = req.query.db === 'true' || req.query.deep === 'true'
  let dbStatus = 'untested'

  if (checkDb) {
    const isDbAlive = await pingDb()
    dbStatus = isDbAlive ? 'connected' : 'degraded'
  }

  const memoryUsage = process.memoryUsage()
  res.json({
    status: dbStatus === 'degraded' ? 'degraded' : 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db: dbStatus,
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
  })
}

app.get('/health', handleHealthCheck)
app.get('/api/health', handleHealthCheck)

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

// Global Error Handling Middleware to prevent server crashes
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

const fetchLeetCodeStats = async (username: string) => {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
        }
      }
      userContestRanking(username: $username) { rating }
    }
  `

  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'CodeDynamosBot/1.0',
      'Referer': 'https://leetcode.com/',
    },
    body: JSON.stringify({ query, variables: { username } }),
  })

  if (!response.ok) throw new Error(`LeetCode fetch failed: ${response.status}`)
  const payload = await response.json() as {
    data?: {
      matchedUser?: {
        submitStatsGlobal?: { acSubmissionNum?: Array<{ difficulty: string; count: number }> }
      }
      userContestRanking?: { rating?: number }
    }
  }

  const stats = payload.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? []
  const totalSolved = stats.find((s) => s.difficulty === 'All')?.count ?? 0
  const contestRating = payload.data?.userContestRanking?.rating ?? 0

  return { totalSolved, contestRating }
}

const refreshLeetCodeProfiles = async () => {
  const rows = await db
    .select({ id: users.id, leetcodeProfile: users.leetcodeProfile })
    .from(users)
    .where(isNotNull(users.leetcodeProfile))

  for (const row of rows) {
    try {
      const { totalSolved, contestRating } = await fetchLeetCodeStats(row.leetcodeProfile as string)
      await db
        .update(users)
        .set({
          leetcodeSolved: Math.max(0, Math.floor(totalSolved)),
          leetcodeRating: Math.max(0, Math.floor(contestRating)),
        })
        .where(eq(users.id, row.id))
    } catch (err) {
      console.error(`LeetCode refresh failed for ${row.leetcodeProfile}:`, err)
    }
  }
}

app.listen(PORT, async () => {
  // Fast Batched Auto-migration for production DB stability (1 roundtrip instead of 18)
  try {
    await db.execute(sql`
      DO $$ 
      BEGIN
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "semester" text;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamp;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcode_rating" integer DEFAULT 0;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcode_solved" integer DEFAULT 0;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcode_url" text;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_url" text;
        ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "instagram_url" text;
        ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "linkedin_url" text;
        ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_url" text;
        ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "platform" text;
        ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "ends_at" timestamp;
        ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "enrollment_xp" integer DEFAULT 0;
        ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "external_url" text;
        ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "ends_at" timestamp;
        ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "enrollment_xp" integer DEFAULT 0;
        ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "participants" integer DEFAULT 0;
        ALTER TABLE "gallery" ADD COLUMN IF NOT EXISTS "drive_url" text;
      END $$;
    `)
    console.log("✓ Database auto-migration complete (batched)")
  } catch (err) {
    console.error("Auto-migration skipped or failed:", err)
  }

  console.log(`\n🚀  Code Dynamos API running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health`)
  console.log(`   Auth:   POST /api/auth/login | POST /api/auth/signup`)
  console.log(`   Admin:  GET  /api/admin/stats  (requires admin token)\n`)

  // 1. Keep-alive database connection ping (every 4 minutes)
  // Keeps Neon DB compute warm and prevents serverless sleep mode
  setInterval(async () => {
    const ok = await pingDb()
    if (!ok) {
      console.warn('⚠️ DB ping failed - retrying connection...')
    }
  }, 1000 * 60 * 4)

  // 2. Anti-Suspension Server Self-Pinger (every 10 minutes)
  // Keeps Render Web Service alive by generating inbound HTTP traffic
  const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || `http://127.0.0.1:${PORT}`
  setInterval(async () => {
    try {
      const pingEndpoint = `${targetUrl.replace(/\/$/, '')}/api/health`
      const res = await fetch(pingEndpoint)
      if (res.ok) {
        console.log(`[KeepAlive] Server self-ping successful: ${pingEndpoint}`)
      }
    } catch (err) {
      console.warn('[KeepAlive] Server self-ping warning:', err instanceof Error ? err.message : err)
    }
  }, 1000 * 60 * 10)

  // Refresh LeetCode profiles on startup after a 10s delay (prevents boot blocking)
  setTimeout(() => {
    refreshLeetCodeProfiles().catch((err) => console.error('LeetCode refresh failed:', err))
  }, 10000)

  setInterval(() => {
    refreshLeetCodeProfiles().catch((err) => console.error('LeetCode refresh failed:', err))
  }, 1000 * 60 * 60 * 48)
})

// Uncaught exception and rejection handlers to prevent process crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception caught:', err)
})

