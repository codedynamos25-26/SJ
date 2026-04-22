import { Router } from 'express'
import { eq, sql } from 'drizzle-orm'
import { db, users, events, challenges, userEnrolledEvents, userActiveChallenges, projects } from '../db'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public home stats endpoint
router.get('/stats/home', async (_req, res): Promise<void> => {
  const [{ totalUsers }]      = await db.select({ totalUsers:      sql<number>`count(*)` }).from(users)
  const [{ totalEvents }]     = await db.select({ totalEvents:     sql<number>`count(*)` }).from(events)
  const [{ totalChallenges }] = await db.select({ totalChallenges: sql<number>`count(*)` }).from(challenges)
  const [{ totalProjects }]   = await db.select({ totalProjects:   sql<number>`count(*)` }).from(projects)

  res.json({ totalUsers, totalEvents, totalChallenges, totalProjects })
})

router.get('/', authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId))
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  // Calculate live global rank based on XP
  const [{ rankCount }] = await db
    .select({ rankCount: sql<number>`count(*) + 1` })
    .from(users)
    .where(sql`${users.xp} > ${user.xp}`)

  const liveRank = Number(rankCount)

  // Enrolled events — join through the join table
  const enrolledRows = await db
    .select({ event: events, enrolledAt: userEnrolledEvents.enrolledAt })
    .from(userEnrolledEvents)
    .innerJoin(events, eq(userEnrolledEvents.eventId, events.id))
    .where(eq(userEnrolledEvents.userId, user.id))

  const enrolledEvents = enrolledRows.map(r => r.event)

  // Active challenges with per-user progress
  const challengeRows = await db
    .select({
      challenge: {
        id: challenges.id,
        title: challenges.title,
        difficulty: challenges.difficulty,
        xp: challenges.xp,
        pool: challenges.pool,
        completions: challenges.completions,
        participants: challenges.participants,
        tags: challenges.tags,
        description: challenges.description,
        status: challenges.status,
        enrollmentXp: challenges.enrollmentXp,
        endsAt: challenges.endsAt,
      },
      verified: userActiveChallenges.verified,
      enrolledAt: userActiveChallenges.enrolledAt,
    })
    .from(userActiveChallenges)
    .innerJoin(challenges, eq(userActiveChallenges.challengeId, challenges.id))
    .where(eq(userActiveChallenges.userId, user.id))

  const activeChallenges = challengeRows.map(r => ({ ...r.challenge, verified: r.verified }))

  // Compute Recent Activity Dynamically
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'JUST NOW'
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (days > 0) return `${days} DAY${days > 1 ? 'S' : ''} AGO`
    if (hrs > 0) return `${hrs} HR${hrs > 1 ? 'S' : ''} AGO`
    if (mins > 0) return `${mins} MIN${mins > 1 ? 'S' : ''} AGO`
    return 'JUST NOW'
  }

  const allActivityRaw = [
    ...enrolledRows.map(r => ({
      timeRaw: r.enrolledAt,
      time: formatTimeAgo(r.enrolledAt),
      text: `Registered for "${r.event.title}"`,
      accent: '#dbb8ff'
    })),
    ...challengeRows.map(r => ({
      timeRaw: r.enrolledAt,
      time: formatTimeAgo(r.enrolledAt),
      text: r.verified ? `Completed challenge "${r.challenge.title}"` : `Began challenge "${r.challenge.title}"`,
      accent: '#d3ef57'
    }))
  ]

  // Sort by most recent
  allActivityRaw.sort((a, b) => {
    const timeA = a.timeRaw ? new Date(a.timeRaw).getTime() : 0
    const timeB = b.timeRaw ? new Date(b.timeRaw).getTime() : 0
    return timeB - timeA
  })

  // Take top 3 recent activities
  const activity = allActivityRaw.slice(0, 3).map(({ time, text, accent }) => ({ time, text, accent }))

  res.json({
    user: { id: user.id, name: user.name, email: user.email, xp: user.xp, rank: liveRank, usn: user.usn, department: user.department, year: user.year, githubUrl: user.githubUrl, leetcodeProfile: user.leetcodeProfile, leetcodeSolved: user.leetcodeSolved, track: user.track },
    enrolledEvents,
    activeChallenges,
    activity,
  })
})

export default router
