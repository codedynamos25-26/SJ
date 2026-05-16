import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { db, users } from '../db'
import { signToken, authenticate } from '../middleware/auth'

// Lazy-initialize Resend so the server doesn't crash if the key is missing at startup
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set in environment variables')
  return new Resend(key)
}

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
    user: { id: user.id, email: user.email, name: user.name, role: user.role, xp: user.xp, rank: user.rank, usn: user.usn, department: user.department, year: user.year, semester: user.semester, githubUrl: user.githubUrl, leetcodeProfile: user.leetcodeProfile, leetcodeSolved: user.leetcodeSolved, track: user.track },
  })
})

// POST /api/auth/signup
router.post('/signup', async (req, res): Promise<void> => {
  const { email, name, password, track, usn, department, year, semester } = req.body as {
    email?: string
    name?: string
    password?: string
    track?: string
    usn?: string
    department?: string
    year?: string
    semester?: string
  }

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
    usn: usn ?? null,
    department: department ?? null,
    year: year ?? null,
    semester: semester ?? null,
    xp: 0,
    rank: 0,
    track,
  }).returning()

  const token = signToken({ userId: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role as 'member' | 'admin' })

  res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, xp: newUser.xp, rank: newUser.rank, usn: newUser.usn, department: newUser.department, year: newUser.year, semester: newUser.semester, githubUrl: newUser.githubUrl, leetcodeProfile: newUser.leetcodeProfile, leetcodeSolved: newUser.leetcodeSolved, track: newUser.track },
  })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId))
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, xp: user.xp, rank: user.rank, usn: user.usn, department: user.department, year: user.year, githubUrl: user.githubUrl, leetcodeProfile: user.leetcodeProfile, leetcodeSolved: user.leetcodeSolved, track: user.track, createdAt: user.createdAt })
})


// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res): Promise<void> => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const emailStr = String(email).toLowerCase()
    const [user] = await db.select().from(users).where(eq(users.email, emailStr))
    if (!user) {
      res.json({ message: 'If an account exists, a reset link was sent.' })
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000)

    await db.update(users).set({ resetToken, resetTokenExpiry }).where(eq(users.id, user.id))

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

    if (process.env.RESEND_API_KEY) {
      try {
        const { error: resendError } = await getResend().emails.send({
          from: 'Code Dynamos <onboarding@resend.dev>',
          to: 'codedynamos25@gmail.com', // Must match Resend verified sender until domain is verified
          subject: `Password Reset Request for ${user.email}`,
          html: `
            <h2>Password Reset Request</h2>
            <p><strong>User:</strong> ${user.name} (${user.email})</p>
            <p>They requested a password reset. Forward this link to them, or copy and send it:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 1 hour.</p>
            <hr/>
            <p><small>Once you verify a domain at resend.com/domains, emails will go directly to users.</small></p>
          `,
        })
        if (resendError) {
          console.error('Resend error:', resendError)
          res.status(500).json({ error: 'Failed to send email. Please contact support.' })
          return
        }
      } catch (err) {
        console.error('Failed to send email via Resend:', err)
        res.status(500).json({ error: 'Failed to send email. Please contact support.' })
        return
      }
    } else {
      console.log(`\n[MOCK EMAIL] Reset Link: ${resetUrl}\n`)
    }

    res.json({ message: 'If an account exists, a reset link was sent.' })
  } catch (error) {
    console.error('Error in forgot-password:', error)
    res.status(500).json({ error: 'Internal server error while processing request' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res): Promise<void> => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required' })
    return
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.resetToken, token))
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: 'Invalid or expired reset token' })
    return
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10)
  await db.update(users).set({ passwordHash, resetToken: null, resetTokenExpiry: null }).where(eq(users.id, user.id))

  res.json({ message: 'Password has been reset successfully' })
})

export default router
