import { Router } from 'express'
import { db, teamMembers } from '../db'

const router = Router()

// GET /api/team
router.get('/', async (_req, res) => {
  const all = await db.select().from(teamMembers)
  res.json(all)
})

export default router
