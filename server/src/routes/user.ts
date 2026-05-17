import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db, users } from '../db'
import { authenticate } from '../middleware/auth'

const router = Router()
router.use(authenticate)

const parseLeetCodeUsername = (input: string): string => {
  const value = input.trim()
  if (!value) return ''

  if (value.includes('leetcode.com')) {
    const match = value.match(/leetcode\.com\/(u|profile)\/([^/?#]+)/i)
    if (match?.[2]) return match[2]
    const fallback = value.replace(/^https?:\/\//i, '').split('/').filter(Boolean)
    return fallback[fallback.length - 1] ?? ''
  }

  return value.replace(/^@/, '')
}

router.post('/leetcode', async (req, res): Promise<void> => {
  const { username } = req.body as { username?: string }
  if (!username) {
    res.status(400).json({ error: 'username or profile link is required' })
    return
  }

  const parsed = parseLeetCodeUsername(username)
  if (!parsed) {
    res.status(400).json({ error: 'Invalid LeetCode profile input' })
    return
  }

  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
    }
  `

  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username: parsed } }),
  })

  if (!response.ok) {
    res.status(502).json({ error: 'Failed to reach LeetCode service' })
    return
  }

  const payload = await response.json() as {
    data?: {
      matchedUser?: {
        username: string
        profile?: { ranking?: number }
        submitStatsGlobal?: {
          acSubmissionNum?: Array<{ difficulty: string; count: number }>
        }
      }
    }
    errors?: Array<{ message?: string }>
  }

  const userData = payload.data?.matchedUser
  if (!userData) {
    res.status(404).json({ error: payload.errors?.[0]?.message ?? 'LeetCode profile not found' })
    return
  }

  const stats = userData.submitStatsGlobal?.acSubmissionNum ?? []
  const getCount = (difficulty: string) => stats.find((s) => s.difficulty === difficulty)?.count ?? 0

  const totalSolved = getCount('All')
  const easyCount = getCount('Easy')
  const mediumCount = getCount('Medium')
  const hardCount = getCount('Hard')
  const ranking = userData.profile?.ranking ?? 0

  res.json({
    username: userData.username,
    totalSolved,
    easyCount,
    mediumCount,
    hardCount,
    ranking,
  })
})

router.put('/profile', async (req, res): Promise<void> => {
  const { githubUrl, leetcodeProfile, leetcodeSolved, year, semester, track } = req.body as {
    githubUrl?: string
    leetcodeProfile?: string
    leetcodeSolved?: number
    year?: string
    semester?: string
    track?: string
  }

  const updates: Partial<typeof users.$inferInsert> = {}

  if (typeof githubUrl === 'string') updates.githubUrl = githubUrl
  if (typeof leetcodeProfile === 'string') updates.leetcodeProfile = parseLeetCodeUsername(leetcodeProfile)
  if (typeof leetcodeSolved === 'number') updates.leetcodeSolved = Math.max(0, Math.floor(leetcodeSolved))
  if (typeof year === 'string') updates.year = year.trim()
  if (typeof semester === 'string') updates.semester = semester.trim()
  if (typeof track === 'string') updates.track = track.trim()

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid profile fields provided' })
    return
  }

  try {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, req.user!.userId)).returning()
    if (!updated) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      xp: updated.xp,
      rank: updated.rank,
      usn: updated.usn,
      department: updated.department,
      year: updated.year,
      semester: updated.semester,
      githubUrl: updated.githubUrl,
      leetcodeProfile: updated.leetcodeProfile,
      leetcodeSolved: updated.leetcodeSolved,
      track: updated.track,
    })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'This LeetCode profile is already connected to another operator.' })
      return
    }
    console.error('Profile update error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
