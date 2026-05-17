import { Router } from 'express'
import { eq, and, sql } from 'drizzle-orm'
import { db, events, userEnrolledEvents, users } from '../db'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

const checkExpiration = (e: any) => {
  if (e.endsAt && new Date(e.endsAt) < new Date()) {
    return { ...e, status: 'Closed' }
  }
  if (e.slots === 0 && e.status !== 'Closed') {
    return { ...e, status: 'Full' }
  }
  return e
}

// GET /api/events
router.get('/', optionalAuth, async (req, res) => {
  const allEvents = await db.select().from(events)
  const processed = allEvents.map(checkExpiration)
  
  if (req.user) {
    const enrolledIds = await db
      .select({ eventId: userEnrolledEvents.eventId })
      .from(userEnrolledEvents)
      .where(eq(userEnrolledEvents.userId, req.user.userId))
    
    const enrolledSet = new Set(enrolledIds.map(e => e.eventId))
    const enriched = processed.map(e => ({ ...e, enrolledByMe: enrolledSet.has(e.id) }))
    res.json(enriched)
    return
  }

  res.json(processed.map(e => ({ ...e, enrolledByMe: false })))
})

// GET /api/events/:id — enriched with enrolledByMe when authenticated
router.get('/:id', optionalAuth, async (req, res): Promise<void> => {
  const [row] = await db.select().from(events).where(eq(events.id, req.params.id))
  if (!row) { res.status(404).json({ error: 'Event not found' }); return }

  const event = checkExpiration(row)
  let enrolledByMe = false
  if (req.user) {
    const [enrollRow] = await db.select().from(userEnrolledEvents)
      .where(and(eq(userEnrolledEvents.userId, req.user.userId), eq(userEnrolledEvents.eventId, event.id)))
    enrolledByMe = !!enrollRow
  }

  // Fetch winners if Closed
  let winners: Array<{ id: string; name: string; position: number | null; awardXp: number }> = []
  if (event.status === 'Closed') {
    winners = await db.select({
      id: users.id, name: users.name, position: userEnrolledEvents.position, awardXp: userEnrolledEvents.awardXp
    }).from(userEnrolledEvents)
      .innerJoin(users, eq(userEnrolledEvents.userId, users.id))
      .where(and(eq(userEnrolledEvents.eventId, event.id), sql`${userEnrolledEvents.position} IS NOT NULL`))
      .orderBy(userEnrolledEvents.position)
  }

  res.json({ ...event, enrolledByMe, winners })
})

// POST /api/events/:id/rsvp — requires auth
router.post('/:id/rsvp', authenticate, async (req, res): Promise<void> => {
  const [row] = await db.select().from(events).where(eq(events.id, req.params.id))
  if (!row) { res.status(404).json({ error: 'Event not found' }); return }

  const event = checkExpiration(row)
  if (event.status !== 'Open') { res.status(409).json({ error: 'Registration for this event is closed' }); return }
  if (event.slots === 0) { res.status(409).json({ error: 'No slots available' }); return }

  const [alreadyEnrolled] = await db.select().from(userEnrolledEvents)
    .where(and(eq(userEnrolledEvents.userId, req.user!.userId), eq(userEnrolledEvents.eventId, event.id)))
  if (alreadyEnrolled) { res.status(409).json({ error: 'Already enrolled' }); return }

  await db.insert(userEnrolledEvents).values({ userId: req.user!.userId, eventId: event.id })
  await db.update(events).set({ slots: event.slots - 1 }).where(eq(events.id, event.id))
  
  if (event.enrollmentXp > 0) {
    await db.update(users).set({ xp: sql`${users.xp} + ${event.enrollmentXp}` }).where(eq(users.id, req.user!.userId))
  }

  res.json({ message: 'RSVP confirmed', eventId: event.id, xpAwarded: event.enrollmentXp })
})

// DELETE /api/events/:id/rsvp — cancel RSVP
router.delete('/:id/rsvp', authenticate, async (req, res): Promise<void> => {
  const [event] = await db.select().from(events).where(eq(events.id, req.params.id))
  if (!event) { res.status(404).json({ error: 'Event not found' }); return }

  const [enrolled] = await db.select().from(userEnrolledEvents)
    .where(and(eq(userEnrolledEvents.userId, req.user!.userId), eq(userEnrolledEvents.eventId, event.id)))
  if (!enrolled) { res.status(409).json({ error: 'Not enrolled' }); return }

  await db.delete(userEnrolledEvents)
    .where(and(eq(userEnrolledEvents.userId, req.user!.userId), eq(userEnrolledEvents.eventId, event.id)))
  await db.update(events).set({ slots: event.slots + 1 }).where(eq(events.id, event.id))

  if (event.enrollmentXp > 0) {
    await db.update(users).set({ xp: sql`GREATEST(${users.xp} - ${event.enrollmentXp}, 0)` }).where(eq(users.id, req.user!.userId))
  }

  res.json({ message: 'RSVP cancelled', eventId: event.id, xpDeducted: event.enrollmentXp })
})

export default router
