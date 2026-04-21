import { Router } from 'express'
import { eq, and, sql } from 'drizzle-orm'
import { db, challenges, userActiveChallenges } from '../db'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

// GET /api/challenges
router.get('/', async (_req, res) => {
  const all = await db.select().from(challenges)
  res.json(all)
})

// GET /api/challenges/:id — enriched with enrolledByMe
router.get('/:id', optionalAuth, async (req, res): Promise<void> => {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, req.params.id))
  if (!challenge) { res.status(404).json({ error: 'Challenge not found' }); return }

  let enrolledByMe = false
  if (req.user) {
    const [row] = await db.select().from(userActiveChallenges)
      .where(and(eq(userActiveChallenges.userId, req.user.userId), eq(userActiveChallenges.challengeId, challenge.id)))
    enrolledByMe = !!row
  }

  res.json({ ...challenge, enrolledByMe })
})

// POST /api/challenges/:id/enroll
router.post('/:id/enroll', authenticate, async (req, res): Promise<void> => {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, req.params.id))
  if (!challenge) { res.status(404).json({ error: 'Challenge not found' }); return }

  const [already] = await db.select().from(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, req.user!.userId), eq(userActiveChallenges.challengeId, challenge.id)))
  if (already) { res.status(409).json({ error: 'Already enrolled' }); return }

  await db.insert(userActiveChallenges).values({ userId: req.user!.userId, challengeId: challenge.id })
  await db.update(challenges).set({ participants: sql`${challenges.participants} + 1` }).where(eq(challenges.id, challenge.id))

  res.json({ message: 'Enrolled', challengeId: challenge.id })
})

// DELETE /api/challenges/:id/enroll — withdraw
router.delete('/:id/enroll', authenticate, async (req, res): Promise<void> => {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, req.params.id))
  if (!challenge) { res.status(404).json({ error: 'Challenge not found' }); return }

  const [enrolled] = await db.select().from(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, req.user!.userId), eq(userActiveChallenges.challengeId, challenge.id)))
  if (!enrolled) { res.status(409).json({ error: 'Not enrolled' }); return }

  await db.delete(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, req.user!.userId), eq(userActiveChallenges.challengeId, challenge.id)))
  await db.update(challenges).set({ participants: sql`GREATEST(${challenges.participants} - 1, 0)` }).where(eq(challenges.id, challenge.id))

  res.json({ message: 'Withdrawn', challengeId: challenge.id })
})

export default router
