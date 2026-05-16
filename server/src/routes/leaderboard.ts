import { Router } from 'express'
import { db, users } from '../db'
import { desc, sql } from 'drizzle-orm'

const router = Router()

// GET /api/leaderboard — returns all members ordered by XP (live from DB)
router.get('/', async (_req, res) => {
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
      completedChallenges: sql<number>`0`,   // placeholder – extend when challenge completions are tracked
      streak:       sql<number>`0`,           // placeholder
    })
    .from(users)
    .orderBy(desc(users.xp))

  // Assign badge based on XP
  const withBadge = rows.map((u, i) => ({
    ...u,
    position: i + 1,
    badge: u.xp >= 15000 ? 'Legendary' : u.xp >= 10000 ? 'Architect' : u.xp >= 7000 ? 'Elite' : u.xp >= 4000 ? 'Expert' : u.xp >= 1000 ? 'Senior' : 'Member',
  }))

  res.json(withBadge)
})

export default router
