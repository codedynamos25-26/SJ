import { Router } from 'express'
import { db, projects } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const all = await db.select().from(projects)
    all.sort((a, b) => b.id.localeCompare(a.id))
    res.json(all)
  } catch (err) {
    console.error('Projects fetch error:', err)
    res.json([])
  }
})

export default router
