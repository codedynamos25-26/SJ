import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db, users, events, challenges, userEnrolledEvents, userActiveChallenges } from '../db'
import { authenticate } from '../middleware/auth'

const router = Router()

const rankThresholds: Record<string, { next: string; threshold: number }> = {
  Member:    { next: 'Senior',    threshold: 5000 },
  Senior:    { next: 'Expert',    threshold: 8000 },
  Expert:    { next: 'Elite',     threshold: 12000 },
  Elite:     { next: 'Architect', threshold: 15000 },
  Architect: { next: 'Legendary', threshold: 20000 },
  Legendary: { next: 'Legendary', threshold: 20000 },
}

router.get('/', authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId))
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  // Enrolled events — join through the join table
  const enrolledRows = await db
    .select({ event: events })
    .from(userEnrolledEvents)
    .innerJoin(events, eq(userEnrolledEvents.eventId, events.id))
    .where(eq(userEnrolledEvents.userId, user.id))

  const enrolledEvents = enrolledRows.map(r => r.event)

  // Active challenges with per-user progress
  const challengeRows = await db
    .select({ challenge: challenges, progress: userActiveChallenges.progress })
    .from(userActiveChallenges)
    .innerJoin(challenges, eq(userActiveChallenges.challengeId, challenges.id))
    .where(eq(userActiveChallenges.userId, user.id))

  const activeChallenges = challengeRows.map(r => ({ ...r.challenge, progress: r.progress }))

  const activity = [
    { time: '2 HRS AGO', text: `Submitted solution for "${activeChallenges[0]?.title ?? 'challenge'}" — score 72/100`, accent: '#d3ef57' },
    { time: '1 DAY AGO', text: `Registered for ${enrolledEvents[0]?.title ?? 'an event'}`, accent: '#dbb8ff' },
    { time: '2 DAYS AGO', text: 'Earned badge: Hot Streak (7 consecutive days)', accent: '#74facb' },
    { time: '3 DAYS AGO', text: 'Completed "Graph Weaver" challenge — 950 XP awarded', accent: '#d3ef57' },
  ]

  const rankInfo = rankThresholds[user.badge] ?? { next: user.badge, threshold: user.xp }

  res.json({
    user: { id: user.id, name: user.name, email: user.email, xp: user.xp, rank: user.rank, badge: user.badge, challenges: user.challenges, streak: user.streak, track: user.track },
    rankProgress: {
      current: user.badge,
      next: rankInfo.next,
      xp: user.xp,
      threshold: rankInfo.threshold,
      percent: Math.min(Math.round((user.xp / rankInfo.threshold) * 100), 100),
    },
    enrolledEvents,
    activeChallenges,
    activity,
  })
})

export default router
