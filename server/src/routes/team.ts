import { Router } from 'express'
import { db, teamMembers } from '../db'

const router = Router()

// GET /api/team
router.get('/', async (_req, res) => {
  try {
    const all = await db.select().from(teamMembers)
    res.json(all)
  } catch (err) {
    console.error('Team fetch error:', err)
    res.json([])
  }
})

export default router
