import { Router } from 'express'
import { db, gallery } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const all = await db.select().from(gallery)
  all.sort((a, b) => b.id.localeCompare(a.id))
  res.json(all)
})

export default router
