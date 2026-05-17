import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db, announcements } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const all = await db.select().from(announcements).where(eq(announcements.active, true))
  all.sort((a, b) => b.id.localeCompare(a.id))
  res.json(all)
})

export default router
