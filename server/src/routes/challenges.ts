import { Router } from 'express'
import { eq, and, sql } from 'drizzle-orm'
import { db, challenges, userActiveChallenges, users } from '../db'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

const isLegacyChallengeSchemaError = (error: unknown) => {
  const message = (error as { message?: string })?.message?.toLowerCase() ?? ''
  return message.includes('requirements') || message.includes('timeline') || message.includes('prizes')
}

const checkExpiration = (c: any) => {
  if (c.endsAt && new Date(c.endsAt) < new Date()) {
    return { ...c, status: 'Closed' }
  }
  return c
}

// GET /api/challenges
router.get('/', optionalAuth, async (req, res) => {
  try {
    const all = await db.select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp: challenges.xp,
      pool: challenges.pool,
      completions: challenges.completions,
      tags: challenges.tags,
      description: challenges.description,
      requirements: challenges.requirements,
      timeline: challenges.timeline,
      prizes: challenges.prizes,
      status: challenges.status,
      endsAt: challenges.endsAt,
      externalUrl: challenges.externalUrl,
      participants: sql<number>`cast(count(${userActiveChallenges.userId}) as integer)`,
      enrolledByMe: req.user
        ? sql<boolean>`EXISTS(SELECT 1 FROM ${userActiveChallenges} WHERE ${userActiveChallenges.challengeId} = ${challenges.id} AND ${userActiveChallenges.userId} = ${req.user.userId})`
        : sql<boolean>`false`
    })
    .from(challenges)
    .leftJoin(userActiveChallenges, eq(challenges.id, userActiveChallenges.challengeId))
    .groupBy(challenges.id)

    res.json(all.map(checkExpiration))
  } catch (error) {
    if (!isLegacyChallengeSchemaError(error)) throw error

    const all = await db.select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp: challenges.xp,
      pool: challenges.pool,
      completions: challenges.completions,
      tags: challenges.tags,
      description: challenges.description,
      status: challenges.status,
      endsAt: challenges.endsAt,
      externalUrl: challenges.externalUrl,
      participants: sql<number>`cast(count(${userActiveChallenges.userId}) as integer)`,
      enrolledByMe: req.user
        ? sql<boolean>`EXISTS(SELECT 1 FROM ${userActiveChallenges} WHERE ${userActiveChallenges.challengeId} = ${challenges.id} AND ${userActiveChallenges.userId} = ${req.user.userId})`
        : sql<boolean>`false`
    })
    .from(challenges)
    .leftJoin(userActiveChallenges, eq(challenges.id, userActiveChallenges.challengeId))
    .groupBy(challenges.id)

    res.json(all.map((item) => checkExpiration({ ...item, requirements: [], timeline: [], prizes: [] })))
  }
})

// GET /api/challenges/:id — enriched with enrolledByMe
router.get('/:id', optionalAuth, async (req, res): Promise<void> => {
  let row:
    | {
        id: string
        title: string
        difficulty: string
        xp: number
        pool: number
        completions: number
        tags: string[]
        description: string
        requirements: string[]
        timeline: string[]
        prizes: string[]
        status: string
        endsAt: Date | null
        externalUrl: string | null
        participants: number
      }
    | undefined

  try {
    ;[row] = await db.select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp: challenges.xp,
      pool: challenges.pool,
      completions: challenges.completions,
      tags: challenges.tags,
      description: challenges.description,
      requirements: challenges.requirements,
      timeline: challenges.timeline,
      prizes: challenges.prizes,
      status: challenges.status,
      endsAt: challenges.endsAt,
      externalUrl: challenges.externalUrl,
      participants: sql<number>`cast(count(${userActiveChallenges.userId}) as integer)`
    })
    .from(challenges)
    .leftJoin(userActiveChallenges, eq(challenges.id, userActiveChallenges.challengeId))
    .where(eq(challenges.id, req.params.id))
    .groupBy(challenges.id)
  } catch (error) {
    if (!isLegacyChallengeSchemaError(error)) throw error
    const [legacyRow] = await db.select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp: challenges.xp,
      pool: challenges.pool,
      completions: challenges.completions,
      tags: challenges.tags,
      description: challenges.description,
      status: challenges.status,
      endsAt: challenges.endsAt,
      externalUrl: challenges.externalUrl,
      participants: sql<number>`cast(count(${userActiveChallenges.userId}) as integer)`
    })
    .from(challenges)
    .leftJoin(userActiveChallenges, eq(challenges.id, userActiveChallenges.challengeId))
    .where(eq(challenges.id, req.params.id))
    .groupBy(challenges.id)

    row = legacyRow ? { ...legacyRow, requirements: [], timeline: [], prizes: [] } : undefined
  }

  if (!row) { res.status(404).json({ error: 'Challenge not found' }); return }

  const challenge = checkExpiration(row)
  let enrolledByMe = false
  if (req.user) {
    const [enrollRow] = await db.select().from(userActiveChallenges)
      .where(and(eq(userActiveChallenges.userId, req.user.userId), eq(userActiveChallenges.challengeId, challenge.id)))
    enrolledByMe = !!enrollRow
  }

  // Fetch winners if Closed
  let winners: Array<{ id: string; name: string; position: number | null; awardXp: number }> = []
  if (challenge.status === 'Closed') {
    winners = await db.select({
      id: users.id, name: users.name, position: userActiveChallenges.position, awardXp: userActiveChallenges.awardXp
    }).from(userActiveChallenges)
      .innerJoin(users, eq(userActiveChallenges.userId, users.id))
      .where(and(eq(userActiveChallenges.challengeId, challenge.id), sql`${userActiveChallenges.position} IS NOT NULL`))
      .orderBy(userActiveChallenges.position)
  }

  res.json({ ...challenge, enrolledByMe, winners })
})

// POST /api/challenges/:id/enroll
router.post('/:id/enroll', authenticate, async (req, res): Promise<void> => {
  const [row] = await db.select({
    id: challenges.id,
    status: challenges.status,
    endsAt: challenges.endsAt,
    enrollmentXp: challenges.enrollmentXp,
  }).from(challenges).where(eq(challenges.id, req.params.id))
  if (!row) { res.status(404).json({ error: 'Challenge not found' }); return }

  const challenge = checkExpiration(row)
  if (challenge.status !== 'Open') { res.status(409).json({ error: 'This challenge is no longer accepting participants' }); return }

  const [already] = await db.select().from(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, req.user!.userId), eq(userActiveChallenges.challengeId, challenge.id)))
  if (already) { res.status(409).json({ error: 'Already enrolled' }); return }

  await db.insert(userActiveChallenges).values({ userId: req.user!.userId, challengeId: challenge.id })
  await db.update(challenges).set({ participants: sql`${challenges.participants} + 1` }).where(eq(challenges.id, challenge.id))

  if (challenge.enrollmentXp > 0) {
    await db.update(users).set({ xp: sql`${users.xp} + ${challenge.enrollmentXp}` }).where(eq(users.id, req.user!.userId))
  }

  res.json({ message: 'Enrolled', challengeId: challenge.id, xpAwarded: challenge.enrollmentXp })
})

// DELETE /api/challenges/:id/enroll — withdraw
router.delete('/:id/enroll', authenticate, async (req, res): Promise<void> => {
  const [row] = await db.select({
    id: challenges.id,
    enrollmentXp: challenges.enrollmentXp
  }).from(challenges).where(eq(challenges.id, req.params.id))
  if (!row) { res.status(404).json({ error: 'Challenge not found' }); return }

  const [enrolled] = await db.select().from(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, req.user!.userId), eq(userActiveChallenges.challengeId, row.id)))
  if (!enrolled) { res.status(409).json({ error: 'Not enrolled' }); return }

  await db.delete(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, req.user!.userId), eq(userActiveChallenges.challengeId, row.id)))
  await db.update(challenges).set({ participants: sql`GREATEST(${challenges.participants} - 1, 0)` }).where(eq(challenges.id, row.id))

  if (row.enrollmentXp > 0) {
    await db.update(users).set({ xp: sql`GREATEST(${users.xp} - ${row.enrollmentXp}, 0)` }).where(eq(users.id, req.user!.userId))
  }

  res.json({ message: 'Withdrawn', challengeId: row.id, xpDeducted: row.enrollmentXp })
})

export default router
