import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { db, events, userEnrolledEvents, users } from '../db'
import { authenticate, optionalAuth } from '../middleware/auth'

const router = Router()

// GET /api/events
router.get('/', async (_req, res) => {
  const allEvents = await db.select().from(events)
  res.json(allEvents)
})

// GET /api/events/:id — enriched with enrolledByMe when authenticated
router.get('/:id', optionalAuth, async (req, res): Promise<void> => {
  const [event] = await db.select().from(events).where(eq(events.id, req.params.id))
  if (!event) {
    res.status(404).json({ error: 'Event not found' })
    return
  }

  let enrolledByMe = false
  if (req.user) {
    const [row] = await db.select().from(userEnrolledEvents)
      .where(and(eq(userEnrolledEvents.userId, req.user.userId), eq(userEnrolledEvents.eventId, event.id)))
    enrolledByMe = !!row
  }

  res.json({ ...event, enrolledByMe })
})

// POST /api/events/:id/rsvp — requires auth
router.post('/:id/rsvp', authenticate, async (req, res): Promise<void> => {
  const [event] = await db.select().from(events).where(eq(events.id, req.params.id))
  if (!event) { res.status(404).json({ error: 'Event not found' }); return }
  if (event.slots === 0) { res.status(409).json({ error: 'No slots available' }); return }

  const [alreadyEnrolled] = await db.select().from(userEnrolledEvents)
    .where(and(eq(userEnrolledEvents.userId, req.user!.userId), eq(userEnrolledEvents.eventId, event.id)))
  if (alreadyEnrolled) { res.status(409).json({ error: 'Already enrolled' }); return }

  await db.insert(userEnrolledEvents).values({ userId: req.user!.userId, eventId: event.id })
  await db.update(events).set({ slots: event.slots - 1 }).where(eq(events.id, event.id))

  res.json({ message: 'RSVP confirmed', eventId: event.id })
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

  res.json({ message: 'RSVP cancelled', eventId: event.id })
})

export default router
