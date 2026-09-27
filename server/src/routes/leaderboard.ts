import { Router } from 'express'
import { db, users } from '../db'
import { sql } from 'drizzle-orm'
import { cacheGet, cacheSet } from '../lib/cache'

const router = Router()

// GET /api/leaderboard — returns all members ordered by XP (cached for 60s)
router.get('/', async (_req, res) => {
  try {
    const cached = await cacheGet<any[]>('leaderboard:all')
    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      res.json(cached)
      return
    }

    const rows = await db
      .select({
        id:           users.id,
        name:         users.name,
        usn:          users.usn,
        xp:           users.xp,
        rank:         users.rank,
        track:        users.track,
        department:   users.department,
        year:         users.year,
        githubUrl:    users.githubUrl,
        leetcodeProfile: users.leetcodeProfile,
        leetcodeSolved: users.leetcodeSolved,
        leetcodeRating: users.leetcodeRating,
        completedChallenges: sql<number>`0`,
        streak:       sql<number>`0`,
      })
      .from(users)

    // Integrate LeetCode calculation (40% solved Q, 60% contest rating) directly into overall leaderboard XP
    const mapped = rows.map((u) => {
      const lSolved = u.leetcodeSolved ?? 0
      const lRating = u.leetcodeRating ?? 0
      const leetcodeScore = Math.floor(lSolved * 0.4 + lRating * 0.6)
      const overallXp = u.xp + leetcodeScore
      return { ...u, xp: overallXp }
    })

    // Sort descending by combined XP
    mapped.sort((a, b) => b.xp - a.xp)

    // Assign badge based on overall combined XP
    const withBadge = mapped.map((u, i) => ({
      ...u,
      position: i + 1,
      badge: u.xp >= 15000 ? 'Legendary' : u.xp >= 10000 ? 'Architect' : u.xp >= 7000 ? 'Elite' : u.xp >= 4000 ? 'Expert' : u.xp >= 1000 ? 'Senior' : 'Member',
    }))

    // Cache computed leaderboard for 60 seconds
    await cacheSet('leaderboard:all', withBadge, 60)

    res.setHeader('X-Cache', 'MISS')
    res.json(withBadge)
  } catch (err) {
    console.error('Leaderboard fetch error:', err)
    res.status(500).json({ error: 'Failed to retrieve leaderboard data' })
  }
})

export default router
