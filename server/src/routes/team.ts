import { Router } from 'express'
import { team } from '../data/team'

const router = Router()

// GET /api/team
router.get('/', (_req, res) => {
  res.json(team)
})

// GET /api/team/leadership
router.get('/leadership', (_req, res) => {
  res.json(team.filter((m) => m.tier === 'leadership'))
})

// GET /api/team/core
router.get('/core', (_req, res) => {
  res.json(team.filter((m) => m.tier === 'core'))
})

export default router
