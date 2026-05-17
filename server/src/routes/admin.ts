import { Router } from 'express'
import { eq, sql, and } from 'drizzle-orm'
import { db, users, events, challenges, projects, gallery, announcements, teamMembers, userActiveChallenges, userEnrolledEvents } from '../db'
import { authenticate, adminOnly } from '../middleware/auth'
import type { Event, Challenge, Project, GalleryPhoto } from '../types'

interface Announcement { id: string; text: string; active: boolean }

interface DriveFolderImage {
  id: string
  name: string
  url: string
}

const isLegacyChallengeSchemaError = (error: unknown) => {
  const message = (error as { message?: string })?.message?.toLowerCase() ?? ''
  return message.includes('requirements') || message.includes('timeline') || message.includes('prizes')
}

const toCommaArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean)
  }
  return []
}

const toLineArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
  }
  return []
}

const toScheduleArray = (value: unknown): string[] => {
  const entries = Array.isArray(value) ? value : typeof value === 'string' ? toLineArray(value) : []
  return entries
    .map((entry) => {
      if (typeof entry !== 'string') {
        const time = String((entry as { time?: unknown }).time ?? '').trim()
        const activity = String((entry as { activity?: unknown }).activity ?? '').trim()
        if (!time && !activity) return ''
        if (!time || !activity) return `${time}${activity}`.trim()
        return `${time}|${activity}`
      }

      const line = entry.trim()
      if (!line) return ''

      const dividerIndex = line.indexOf('|')
      if (dividerIndex === -1) return line

      const time = line.slice(0, dividerIndex).trim()
      const activity = line.slice(dividerIndex + 1).trim()
      if (!time || !activity) return line

      return `${time}|${activity}`
    })
    .filter(Boolean)
}

const toNullableDate = (value: unknown): Date | null => {
  if (value == null || value === '') return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

const inferPlatformFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  const lower = url.toLowerCase()
  if (lower.includes('hackerrank')) return 'HackerRank'
  if (lower.includes('github')) return 'GitHub'
  if (lower.includes('leetcode')) return 'LeetCode'
  if (lower.includes('codechef')) return 'CodeChef'
  if (lower.includes('meet.google')) return 'Google Meet'
  if (lower.includes('zoom')) return 'Zoom'
  if (lower.includes('teams.microsoft')) return 'MS Teams'
  if (lower.includes('discord')) return 'Discord'
  return 'External Platform'
}

const extractDriveFolderId = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const directMatch = trimmed.match(/drive\.google\.com\/(?:drive\/u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/)
  if (directMatch?.[1]) return directMatch[1]

  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (queryMatch?.[1]) return queryMatch[1]

  return null
}

const extractDriveFileIdsFromHtml = (html: string): string[] => {
  const ids = new Set<string>()

  const filePathMatches = html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]{10,})/g)
  for (const match of filePathMatches) {
    if (match[1]) ids.add(match[1])
  }

  const queryIdMatches = html.matchAll(/(?:[?&]|\\u003d)id(?:=|\\u003d)([a-zA-Z0-9_-]{10,})/g)
  for (const match of queryIdMatches) {
    if (match[1]) ids.add(match[1])
  }

  return Array.from(ids)
}

const getDriveApiImages = async (folderId: string, apiKey: string): Promise<DriveFolderImage[]> => {
  const images: DriveFolderImage[] = []
  let nextPageToken: string | undefined

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken,files(id,name,mimeType)',
      pageSize: '1000',
      key: apiKey,
    })

    if (nextPageToken) params.set('pageToken', nextPageToken)

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Drive API error: ${response.status}`)
    }

    const payload = await response.json() as {
      nextPageToken?: string
      files?: Array<{ id: string; name?: string; mimeType?: string }>
    }

    for (const file of payload.files ?? []) {
      if (!file?.id) continue
      images.push({
        id: file.id,
        name: file.name ?? 'Drive Image',
        url: `https://lh3.googleusercontent.com/d/${file.id}`,
      })
    }

    nextPageToken = payload.nextPageToken
  } while (nextPageToken)

  return images
}

const getDriveScrapedImages = async (folderId: string): Promise<DriveFolderImage[]> => {
  const sources = [
    `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
    `https://drive.google.com/drive/folders/${folderId}`,
  ]

  const ids = new Set<string>()

  for (const source of sources) {
    try {
      const response = await fetch(source)
      if (!response.ok) continue
      const html = await response.text()
      for (const id of extractDriveFileIdsFromHtml(html)) {
        if (id !== folderId) ids.add(id)
      }
    } catch {
      // Continue trying other source pages.
    }
  }

  return Array.from(ids).map((id, index) => ({
    id,
    name: `Drive Image ${index + 1}`,
    url: `https://lh3.googleusercontent.com/d/${id}`,
  }))
}

const getDriveFolderImages = async (folderId: string): Promise<DriveFolderImage[]> => {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY?.trim()

  if (apiKey) {
    try {
      const apiImages = await getDriveApiImages(folderId, apiKey)
      if (apiImages.length > 0) return apiImages
    } catch {
      // Fall back to scraping when API key is misconfigured or blocked.
    }
  }

  return getDriveScrapedImages(folderId)
}

const applyExpirationStatus = <T extends { endsAt?: Date | string | null; status: string }>(item: T) => {
  if (item.endsAt && new Date(item.endsAt) < new Date()) {
    return { ...item, status: 'Closed', closedByTime: true }
  }
  return { ...item, closedByTime: false }
}

const router = Router()
router.use(authenticate, adminOnly)

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  const [{ totalMembers }] = await db.select({ totalMembers: sql<number>`count(*)` }).from(users)
  const [{ totalEvents }] = await db.select({ totalEvents: sql<number>`count(*)` }).from(events)
  const [{ activeEvents }] = await db.select({ activeEvents: sql<number>`count(*)` }).from(events).where(sql`${events.status} != 'Full'`)
  const [{ totalChallenges }] = await db.select({ totalChallenges: sql<number>`count(*)` }).from(challenges)
  const [{ totalProjects }] = await db.select({ totalProjects: sql<number>`count(*)` }).from(projects)
  const [{ totalXp }] = await db.select({ totalXp: sql<number>`coalesce(sum(${users.xp}), 0)` }).from(users)

  res.json({ totalMembers, activeEvents, totalEvents, totalChallenges, totalProjects, totalXpAwarded: totalXp })
})

// ── Members ────────────────────────────────────────────────────────────────
router.get('/members', async (_req, res) => {
  const all = await db.select({
    id: users.id, email: users.email, name: users.name, role: users.role,
    xp: users.xp, rank: users.rank, track: users.track,
    usn: users.usn, department: users.department, year: users.year, githubUrl: users.githubUrl,
    createdAt: users.createdAt,
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

// Admin awards XP to a member (controls leaderboard ranking)
router.patch('/members/:id/xp', async (req, res): Promise<void> => {
  const { xp } = req.body as { xp?: number }
  if (xp == null || typeof xp !== 'number') { res.status(400).json({ error: 'xp must be a number' }); return }
  const [updated] = await db.update(users).set({ xp }).where(eq(users.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'User not found' }); return }
  res.json({ id: updated.id, xp: updated.xp })
})

router.delete('/members/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(users).where(eq(users.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'User not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Announcements CRUD ───────────────────────────────────────────────────────
router.get('/announcements', async (_req, res) => {
  res.json(await db.select().from(announcements).orderBy(announcements.createdAt))
})

router.post('/announcements', async (req, res): Promise<void> => {
  const { text } = req.body as { text: string }
  if (!text) { res.status(400).json({ error: 'text is required' }); return }
  const [ann] = await db.insert(announcements).values({ id: `ann${Date.now()}`, text }).returning()
  res.status(201).json(ann)
})

router.patch('/announcements/:id', async (req, res): Promise<void> => {
  const fields = req.body as Partial<Announcement>
  const [updated] = await db.update(announcements).set(fields).where(eq(announcements.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'Announcement not found' }); return }
  res.json(updated)
})

router.delete('/announcements/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(announcements).where(eq(announcements.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Announcement not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Team CRUD ──────────────────────────────────────────────────────────────
router.get('/team', async (_req, res) => {
  res.json(await db.select().from(teamMembers))
})

router.post('/team', async (req, res): Promise<void> => {
  const { name, role, dept, instagramUrl, linkedinUrl, tier, image } = req.body
  if (!name || !role || !dept) { res.status(400).json({ error: 'name, role, dept are required' }); return }
  const [member] = await db.insert(teamMembers).values({
    id: `tm${Date.now()}`, name, role, dept, instagramUrl: instagramUrl ?? null, linkedinUrl: linkedinUrl ?? null, tier: tier ?? 'Core', image: image ?? null
  }).returning()
  res.status(201).json(member)
})

router.patch('/team/:id', async (req, res): Promise<void> => {
  const [updated] = await db.update(teamMembers).set(req.body).where(eq(teamMembers.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'Team member not found' }); return }
  res.json(updated)
})

router.delete('/team/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(teamMembers).where(eq(teamMembers.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Team member not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Events CRUD ────────────────────────────────────────────────────────────
router.get('/events', async (_req, res) => {
  const all = await db.select().from(events)
  res.json(all.map(applyExpirationStatus))
})

router.get('/events/:id/participants', async (req, res) => {
  const all = await db.select({
    id: users.id, name: users.name, email: users.email, usn: users.usn,
    position: userEnrolledEvents.position,
    awardXp: userEnrolledEvents.awardXp,
  }).from(userEnrolledEvents)
    .innerJoin(users, eq(userEnrolledEvents.userId, users.id))
    .where(eq(userEnrolledEvents.eventId, req.params.id))
  res.json(all)
})

router.post('/events', async (req, res): Promise<void> => {
  const { type, date, title, description, slots, total, status, location, accent, image, enrollmentXp, endsAt, benefits, schedule, requirements, externalUrl } = req.body as Partial<Event>
  if (!type || !date || !title || !description || slots == null || total == null) {
    res.status(400).json({ error: 'type, date, title, description, slots, total are required' }); return
  }
  const [ev] = await db.insert(events).values({
    id: `ev${Date.now()}`, type, date, title, description,
    slots: Number(slots || 0), total: Number(total || 0),
    status: status ?? 'Open', location: location ?? 'TBD',
    accent: accent ?? '#d3ef57', image: image ?? null,
    enrollmentXp: Number(enrollmentXp ?? 0),
    endsAt: toNullableDate(endsAt),
    benefits: toCommaArray(benefits),
    schedule: toScheduleArray(schedule),
    requirements: toCommaArray(requirements),
    externalUrl: externalUrl ?? null,
    platform: inferPlatformFromUrl(externalUrl),
  }).returning()
  res.status(201).json(ev)
})

router.patch('/events/:id', async (req, res): Promise<void> => {
  const input = req.body as Record<string, unknown>
  const fields: Record<string, unknown> = {}

  if ('type' in input) fields.type = input.type
  if ('date' in input) fields.date = input.date
  if ('title' in input) fields.title = input.title
  if ('description' in input) fields.description = input.description
  if ('status' in input) fields.status = input.status
  if ('location' in input) fields.location = input.location
  if ('accent' in input) fields.accent = input.accent
  if ('image' in input) fields.image = input.image
  if ('slots' in input) fields.slots = Number(input.slots || 0)
  if ('total' in input) fields.total = Number(input.total || 0)
  if ('enrollmentXp' in input) fields.enrollmentXp = Number(input.enrollmentXp || 0)
  if ('endsAt' in input) fields.endsAt = toNullableDate(input.endsAt)
  if ('benefits' in input) fields.benefits = toCommaArray(input.benefits)
  if ('requirements' in input) fields.requirements = toCommaArray(input.requirements)
  if ('schedule' in input) fields.schedule = toScheduleArray(input.schedule)
  if ('externalUrl' in input) {
    fields.externalUrl = input.externalUrl
    fields.platform = inferPlatformFromUrl(input.externalUrl as string)
  }

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
  try {
    const all = await db.select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp: challenges.xp,
      pool: challenges.pool,
      completions: challenges.completions,
      participants: challenges.participants,
      tags: challenges.tags,
      description: challenges.description,
      requirements: challenges.requirements,
      timeline: challenges.timeline,
      prizes: challenges.prizes,
      status: challenges.status,
      enrollmentXp: challenges.enrollmentXp,
      endsAt: challenges.endsAt,
    }).from(challenges)
    res.json(all.map(applyExpirationStatus))
  } catch (error) {
    if (!isLegacyChallengeSchemaError(error)) throw error
    const all = await db.select({
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
    }).from(challenges)
    res.json(all.map((item) => applyExpirationStatus({ ...item, requirements: [], timeline: [], prizes: [] })))
  }
})

router.get('/challenges/:id/participants', async (req, res) => {
  const all = await db.select({
    id: users.id, name: users.name, email: users.email, usn: users.usn,
    verified: userActiveChallenges.verified,
    position: userActiveChallenges.position,
    awardXp: userActiveChallenges.awardXp,
  }).from(userActiveChallenges)
    .innerJoin(users, eq(userActiveChallenges.userId, users.id))
    .where(eq(userActiveChallenges.challengeId, req.params.id))
  res.json(all)
})

router.post('/challenges', async (req, res): Promise<void> => {
  const { title, difficulty, xp, pool, tags, description, requirements, timeline, prizes, status, enrollmentXp, endsAt, externalUrl } = req.body as Partial<Challenge>
  if (!title || !difficulty || xp == null || pool == null || !description) {
    res.status(400).json({ error: 'title, difficulty, xp, pool, description are required' }); return
  }
  let ch
  try {
    ;[ch] = await db.insert(challenges).values({
      id: `ch${Date.now()}`, title,
      difficulty: difficulty as Challenge['difficulty'],
      xp: Number(xp || 0), pool: Number(pool || 0),
      completions: 0, participants: 0,
      tags: toCommaArray(tags), description,
      requirements: toCommaArray(requirements),
      timeline: toLineArray(timeline),
      prizes: toLineArray(prizes),
      status: status ?? 'Open',
      enrollmentXp: Number(enrollmentXp ?? 0),
      endsAt: toNullableDate(endsAt),
      externalUrl: externalUrl ?? null,
    }).returning()
  } catch (error) {
    if (!isLegacyChallengeSchemaError(error)) throw error
      ;[ch] = await db.insert(challenges).values({
        id: `ch${Date.now()}`, title,
        difficulty: difficulty as Challenge['difficulty'],
        xp: Number(xp || 0), pool: Number(pool || 0),
        completions: 0, participants: 0,
        tags: toCommaArray(tags), description,
        status: status ?? 'Open',
        enrollmentXp: Number(enrollmentXp ?? 0),
        endsAt: toNullableDate(endsAt),
        externalUrl: externalUrl ?? null,
      }).returning()
    ch = { ...ch, requirements: [], timeline: [], prizes: [] }
  }
  res.status(201).json(ch)
})

router.patch('/challenges/:id', async (req, res): Promise<void> => {
  const input = req.body as Record<string, unknown>
  const fields: Record<string, unknown> = {}

  if ('title' in input) fields.title = input.title
  if ('difficulty' in input) fields.difficulty = input.difficulty
  if ('description' in input) fields.description = input.description
  if ('status' in input) fields.status = input.status
  if ('xp' in input) fields.xp = Number(input.xp || 0)
  if ('pool' in input) fields.pool = Number(input.pool || 0)
  if ('enrollmentXp' in input) fields.enrollmentXp = Number(input.enrollmentXp || 0)
  if ('endsAt' in input) fields.endsAt = toNullableDate(input.endsAt)
  if ('tags' in input) fields.tags = toCommaArray(input.tags)
  if ('requirements' in input) fields.requirements = toCommaArray(input.requirements)
  if ('timeline' in input) fields.timeline = toLineArray(input.timeline)
  if ('prizes' in input) fields.prizes = toLineArray(input.prizes)
  if ('externalUrl' in input) fields.externalUrl = input.externalUrl

  let updated
  try {
    ;[updated] = await db.update(challenges).set(fields).where(eq(challenges.id, req.params.id)).returning()
  } catch (error) {
    if (!isLegacyChallengeSchemaError(error)) throw error
    const legacyFields = { ...fields }
    delete legacyFields.requirements
    delete legacyFields.timeline
    delete legacyFields.prizes
      ;[updated] = await db.update(challenges).set(legacyFields).where(eq(challenges.id, req.params.id)).returning()
    if (updated) updated = { ...updated, requirements: [], timeline: [], prizes: [] }
  }
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
  const { tag, year, label, span, img, driveUrl } = req.body as {
    tag?: string; year?: string; label?: string; span?: string; img?: string; driveUrl?: string
  }
  const imageInput = typeof img === 'string' ? img.trim() : ''

  if (!tag || !year || !label) {
    res.status(400).json({ error: 'tag, year, label are required' }); return
  }

  // Drive link card: needs an img (thumbnail) + driveUrl
  if (driveUrl) {
    if (!imageInput) { res.status(400).json({ error: 'img (thumbnail) is required for Drive link cards' }); return }
    const [photo] = await db.insert(gallery).values({
      id: `g${Date.now()}`, tag, year, label, span: span ?? '', img: imageInput, driveUrl
    }).returning()
    res.status(201).json(photo); return
  }

  // Regular image upload
  if (!imageInput) { res.status(400).json({ error: 'img is required' }); return }
  const [photo] = await db.insert(gallery).values({
    id: `g${Date.now()}`, tag, year, label, span: span ?? '', img: imageInput, driveUrl: null
  }).returning()
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
  const { title, description, status, tech, stars, forks, img, githubUrl } = req.body as Partial<Project> & { githubUrl?: string }
  if (!title || !description || !status) {
    res.status(400).json({ error: 'title, description, status are required' }); return
  }

  // Auto-fetch stars & forks from GitHub if URL given
  let finalStars = Number(stars ?? 0)
  let finalForks = Number(forks ?? 0)
  if (githubUrl) {
    try {
      const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (match) {
        const ghRes = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}`, {
          headers: { 'User-Agent': 'code-dynamos-app' }
        })
        if (ghRes.ok) {
          const ghData = await ghRes.json() as { stargazers_count: number; forks_count: number }
          finalStars = ghData.stargazers_count ?? finalStars
          finalForks = ghData.forks_count ?? finalForks
        }
      }
    } catch { /* use provided values */ }
  }

  const [proj] = await db.insert(projects).values({
    id: `p${Date.now()}`, title, description,
    status: status as Project['status'],
    tech: tech ?? [], stars: finalStars, forks: finalForks,
    img: img ?? '', githubUrl: githubUrl ?? null,
  }).returning()
  res.status(201).json(proj)
})

router.patch('/projects/:id', async (req, res): Promise<void> => {
  const body = req.body as Partial<Project> & { githubUrl?: string }

  // Auto-refresh stars & forks if a githubUrl is present
  if (body.githubUrl) {
    try {
      const match = body.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (match) {
        const ghRes = await fetch(`https://api.github.com/repos/${match[1]}/${match[2]}`, {
          headers: { 'User-Agent': 'code-dynamos-app' }
        })
        if (ghRes.ok) {
          const ghData = await ghRes.json() as { stargazers_count: number; forks_count: number }
          body.stars = ghData.stargazers_count
          body.forks = ghData.forks_count
        }
      }
    } catch { /* keep existing values */ }
  }

  const [updated] = await db.update(projects).set(body).where(eq(projects.id, req.params.id)).returning()
  if (!updated) { res.status(404).json({ error: 'Project not found' }); return }
  res.json(updated)
})

router.delete('/projects/:id', async (req, res): Promise<void> => {
  const [deleted] = await db.delete(projects).where(eq(projects.id, req.params.id)).returning()
  if (!deleted) { res.status(404).json({ error: 'Project not found' }); return }
  res.json({ message: 'Deleted' })
})

// ── Winners & Verifications ────────────────────────────────────────────────
router.post('/challenges/:id/winners', async (req, res): Promise<void> => {
  const { winners } = req.body as { winners: { userId: string; position: number; awardXp: number }[] }
  if (!winners || !Array.isArray(winners)) { res.status(400).json({ error: 'winners array is required' }); return }

  const challengeId = req.params.id
  for (const w of winners) {
    const [existing] = await db.select().from(userActiveChallenges)
      .where(and(eq(userActiveChallenges.userId, w.userId), eq(userActiveChallenges.challengeId, challengeId)))

    const oldXp = existing?.awardXp || 0
    const diff = w.awardXp - oldXp

    await db.update(userActiveChallenges)
      .set({ position: w.position, awardXp: w.awardXp, verified: true, completed: true })
      .where(and(eq(userActiveChallenges.userId, w.userId), eq(userActiveChallenges.challengeId, challengeId)))

    if (diff !== 0) {
      await db.update(users)
        .set({ xp: sql`${users.xp} + ${diff}` })
        .where(eq(users.id, w.userId))
    }
  }
  res.json({ message: 'Winners assigned and XP awarded' })
})

router.post('/events/:id/winners', async (req, res): Promise<void> => {
  const { winners } = req.body as { winners: { userId: string; position: number; awardXp: number }[] }
  if (!winners || !Array.isArray(winners)) { res.status(400).json({ error: 'winners array is required' }); return }

  const eventId = req.params.id
  for (const w of winners) {
    const [existing] = await db.select().from(userEnrolledEvents)
      .where(and(eq(userEnrolledEvents.userId, w.userId), eq(userEnrolledEvents.eventId, eventId)))

    const oldXp = existing?.awardXp || 0
    const diff = w.awardXp - oldXp

    await db.update(userEnrolledEvents)
      .set({ position: w.position, awardXp: w.awardXp })
      .where(and(eq(userEnrolledEvents.userId, w.userId), eq(userEnrolledEvents.eventId, eventId)))

    if (diff !== 0) {
      await db.update(users)
        .set({ xp: sql`${users.xp} + ${diff}` })
        .where(eq(users.id, w.userId))
    }
  }
  res.json({ message: 'Event winners assigned and XP awarded' })
})

router.post('/challenges/verify', async (req, res): Promise<void> => {
  const { userId, challengeId } = req.body as { userId: string; challengeId: string }
  if (!userId || !challengeId) { res.status(400).json({ error: 'userId and challengeId are required' }); return }

  const [enrollment] = await db.select().from(userActiveChallenges)
    .where(and(eq(userActiveChallenges.userId, userId), eq(userActiveChallenges.challengeId, challengeId)))

  if (!enrollment) { res.status(404).json({ error: 'Enrollment not found' }); return }
  if (enrollment.verified) { res.status(400).json({ error: 'Already verified' }); return }

  const [challenge] = await db.select({ id: challenges.id, xp: challenges.xp }).from(challenges).where(eq(challenges.id, challengeId))
  if (!challenge) { res.status(404).json({ error: 'Challenge not found' }); return }

  await db.update(userActiveChallenges)
    .set({ verified: true, completed: true })
    .where(and(eq(userActiveChallenges.userId, userId), eq(userActiveChallenges.challengeId, challengeId)))

  await db.update(users)
    .set({ xp: sql`${users.xp} + ${challenge.xp}` })
    .where(eq(users.id, userId))

  await db.update(challenges)
    .set({ completions: sql`${challenges.completions} + 1` })
    .where(eq(challenges.id, challengeId))

  res.json({ message: 'Challenge verified and XP awarded' })
})

export default router
