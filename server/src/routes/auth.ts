import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, users } from '../db'
import { signToken, authenticate } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = bcrypt.compareSync(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role as 'member' | 'admin' })

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, xp: user.xp, rank: user.rank, challenges: user.challenges, streak: user.streak, badge: user.badge, track: user.track },
  })
})

// POST /api/auth/signup
router.post('/signup', async (req, res): Promise<void> => {
  const { email, name, password, track } = req.body as { email?: string; name?: string; password?: string; track?: string }

  if (!email || !name || !password || !track) {
    res.status(400).json({ error: 'All fields are required' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' })
    return
  }

  const [allUsers] = await db.select({ count: users.id }).from(users)
  const id = `u${Date.now()}`

  const [newUser] = await db.insert(users).values({
    id,
    email: email.toLowerCase(),
    name,
    role: 'member',
    passwordHash: bcrypt.hashSync(password, 10),
    xp: 0,
    rank: 0,
    challenges: 0,
    streak: 0,
    badge: 'Member',
    track,
  }).returning()

  const token = signToken({ userId: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role as 'member' | 'admin' })

  res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, xp: newUser.xp, rank: newUser.rank, challenges: newUser.challenges, streak: newUser.streak, badge: newUser.badge, track: newUser.track },
  })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId))
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, xp: user.xp, rank: user.rank, challenges: user.challenges, streak: user.streak, badge: user.badge, track: user.track, createdAt: user.createdAt })
})

export default router
