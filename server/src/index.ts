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

const app = express()
const PORT = process.env.PORT ?? 4000

// Security + parsing
app.use(helmet())

// In dev, allow all origins. In production, restrict to the Vercel frontend URL.
// Clean the URL to avoid CORS mismatch due to trailing slashes
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.replace(/\/+$/, '')]
  : true  // allow all in dev


app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

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

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.listen(PORT, () => {
  console.log(`\n🚀  Code Dynamos API running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Auth:   POST /api/auth/login | POST /api/auth/signup`)
  console.log(`   Admin:  GET  /api/admin/stats  (requires admin token)\n`)
})
