import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db, announcements } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const all = await db.select().from(announcements).where(eq(announcements.active, true))
  res.json(all)
})

export default router
