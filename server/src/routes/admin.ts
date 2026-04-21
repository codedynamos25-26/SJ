import { Router } from 'express'
import { eq, sql } from 'drizzle-orm'
import { db, users, events, challenges, projects, gallery } from '../db'
import { authenticate, adminOnly } from '../middleware/auth'
import type { Event, Challenge, Project, GalleryPhoto } from '../types'

const router = Router()
router.use(authenticate, adminOnly)

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  const [{ totalMembers }]   = await db.select({ totalMembers:   sql<number>`count(*)` }).from(users)
  const [{ totalEvents }]    = await db.select({ totalEvents:    sql<number>`count(*)` }).from(events)
  const [{ activeEvents }]   = await db.select({ activeEvents:   sql<number>`count(*)` }).from(events).where(sql`${events.status} != 'Full'`)
  const [{ totalChallenges }]= await db.select({ totalChallenges:sql<number>`count(*)` }).from(challenges)
  const [{ totalProjects }]  = await db.select({ totalProjects:  sql<number>`count(*)` }).from(projects)
  const [{ totalXp }]        = await db.select({ totalXp:        sql<number>`coalesce(sum(${users.xp}), 0)` }).from(users)

  res.json({ totalMembers, activeEvents, totalEvents, totalChallenges, totalProjects, totalXpAwarded: totalXp })
})

// ── Members ────────────────────────────────────────────────────────────────
router.get('/members', async (_req, res) => {
  const all = await db.select({
    id: users.id, email: users.email, name: users.name, role: users.role,
    xp: users.xp, rank: users.rank, badge: users.badge, track: users.track,
    streak: users.streak, challenges: users.challenges, createdAt: users.createdAt,
  }).from(users)
  res.json(all)
})

router.patch('/members/:id/role', async (req, res): Promise<void> => {
  const { role } = req.body as { role?: 'member' | 'admin' }
  if (role !== 'member' && role !== 'admin') { res.status(400).json({ error: 'Role must be "member" or "admin"' }); return }
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'User not found' }); return }
  res.json({ id: updated.id, role: updated.role })
})

// ── Events CRUD ────────────────────────────────────────────────────────────
router.get('/events', async (_req, res) => {
  res.json(await db.select().from(events))
})

router.post('/events', async (req, res): Promise<void> => {
  const { type, date, title, description, slots, total, status, location, accent, image } = req.body as Partial<Event>
  if (!type || !date || !title || !description || slots == null || total == null) {
    res.status(400).json({ error: 'type, date, title, description, slots, total are required' }); return
  }
  const [ev] = await db.insert(events).values({
    id: `ev${Date.now()}`, type, date, title, description,
    slots: Number(slots), total: Number(total),
    status: status ?? 'Open', location: location ?? 'TBD',
    accent: accent ?? '#d3ef57', image: image ?? null,
  }).returning()
  res.status(201).json(ev)
})

router.patch('/events/:id', async (req, res): Promise<void> => {
  const fields = req.body as Partial<Event>
  const [updated] = await db.update(events).set(fields).where(eq(events.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'Event not found' }); return }
  res.json(updated)
})

router.delete('/events/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(events).where(eq(events.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Event not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Challenges CRUD ────────────────────────────────────────────────────────
router.get('/challenges', async (_req, res) => {
  res.json(await db.select().from(challenges))
})

router.post('/challenges', async (req, res): Promise<void> => {
  const { title, difficulty, xp, pool, tags, description } = req.body as Partial<Challenge>
  if (!title || !difficulty || xp == null || pool == null || !description) {
    res.status(400).json({ error: 'title, difficulty, xp, pool, description are required' }); return
  }
  const [ch] = await db.insert(challenges).values({
    id: `ch${Date.now()}`, title,
    difficulty: difficulty as Challenge['difficulty'],
    xp: Number(xp), pool: Number(pool),
    completions: 0, participants: 0,
    tags: tags ?? [], description,
  }).returning()
  res.status(201).json(ch)
})

router.patch('/challenges/:id', async (req, res): Promise<void> => {
  const fields = req.body as Partial<Challenge>
  const [updated] = await db.update(challenges).set(fields).where(eq(challenges.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'Challenge not found' }); return }
  res.json(updated)
})

router.delete('/challenges/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(challenges).where(eq(challenges.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Challenge not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Gallery CRUD ───────────────────────────────────────────────────────────
router.get('/gallery', async (_req, res) => {
  res.json(await db.select().from(gallery))
})

router.post('/gallery', async (req, res): Promise<void> => {
  const { tag, year, label, span, img } = req.body as Partial<GalleryPhoto>
  if (!tag || !year || !label || !img) {
    res.status(400).json({ error: 'tag, year, label, img are required' }); return
  }
  const [photo] = await db.insert(gallery).values({ id: `g${Date.now()}`, tag, year, label, span: span ?? '', img }).returning()
  res.status(201).json(photo)
})

router.delete('/gallery/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(gallery).where(eq(gallery.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Photo not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Projects CRUD ──────────────────────────────────────────────────────────
router.get('/projects', async (_req, res) => {
  res.json(await db.select().from(projects))
})

router.post('/projects', async (req, res): Promise<void> => {
  const { title, description, status, tech, stars, forks, img } = req.body as Partial<Project>
  if (!title || !description || !status) {
    res.status(400).json({ error: 'title, description, status are required' }); return
  }
  const [proj] = await db.insert(projects).values({
    id: `p${Date.now()}`, title, description,
    status: status as Project['status'],
    tech: tech ?? [], stars: Number(stars ?? 0), forks: Number(forks ?? 0), img: img ?? '',
  }).returning()
  res.status(201).json(proj)
})

router.patch('/projects/:id', async (req, res): Promise<void> => {
  const fields = req.body as Partial<Project>
  const [updated] = await db.update(projects).set(fields).where(eq(projects.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'Project not found' }); return }
  res.json(updated)
})

router.delete('/projects/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(projects).where(eq(projects.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Project not found' }); return }
  res.json({ message: 'Deleted' })
})

export default router
