import { Router } from 'express'
import { sql } from 'drizzle-orm'
import { db, users, events, challenges, projects } from '../db'

const router = Router()

// Public home stats endpoint
router.get('/home', async (_req, res): Promise<void> => {
  try {
    const [{ totalUsers }]      = await db.select({ totalUsers:      sql<number>`count(*)` }).from(users)
    const [{ totalEvents }]     = await db.select({ totalEvents:     sql<number>`count(*)` }).from(events)
    const [{ totalChallenges }] = await db.select({ totalChallenges: sql<number>`count(*)` }).from(challenges)
    const [{ totalProjects }]   = await db.select({ totalProjects:   sql<number>`count(*)` }).from(projects)

    res.json({ totalUsers, totalEvents, totalChallenges, totalProjects })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
