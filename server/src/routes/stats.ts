import { Router } from 'express'
import { sql } from 'drizzle-orm'
import { db, users, events, challenges, projects } from '../db'
import { cacheGet, cacheSet } from '../lib/cache'

const router = Router()

// Public home stats endpoint (cached for 180s)
router.get('/home', async (_req, res): Promise<void> => {
  try {
    const cached = await cacheGet<Record<string, number>>('stats:home')
    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      res.json(cached)
      return
    }

    const [{ totalUsers }]      = await db.select({ totalUsers:      sql<number>`count(*)` }).from(users)
    const [{ totalEvents }]     = await db.select({ totalEvents:     sql<number>`count(*)` }).from(events)
    const [{ totalChallenges }] = await db.select({ totalChallenges: sql<number>`count(*)` }).from(challenges)
    const [{ totalProjects }]   = await db.select({ totalProjects:   sql<number>`count(*)` }).from(projects)

    const payload = {
      totalUsers: Number(totalUsers || 0),
      totalEvents: Number(totalEvents || 0),
      totalChallenges: Number(totalChallenges || 0),
      totalProjects: Number(totalProjects || 0),
    }

    await cacheSet('stats:home', payload, 180)

    res.setHeader('X-Cache', 'MISS')
    res.json(payload)
  } catch (err) {
    console.error('Stats error:', err)
    // Return safe default fallback instead of 500 error to keep home page healthy
    res.json({
      totalUsers: 0,
      totalEvents: 0,
      totalChallenges: 0,
      totalProjects: 0,
    })
  }
})

export default router

