import { Router } from 'express'
import { leaderboard } from '../data/leaderboard'

const router = Router()

// GET /api/leaderboard?season=Season+3+%E2%80%94+2026
router.get('/', (req, res): void => {
  const season = (req.query.season as string) ?? 'Season 3 — 2026'
  const data = leaderboard[season]
  if (!data) {
    res.status(404).json({ error: 'Season not found', available: Object.keys(leaderboard) })
    return
  }
  res.json({ season, entries: data })
})

// GET /api/leaderboard/seasons
router.get('/seasons', (_req, res) => {
  res.json(Object.keys(leaderboard))
})

export default router
