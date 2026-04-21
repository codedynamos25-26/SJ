import { Router } from 'express'
import { db, projects } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  res.json(await db.select().from(projects))
})

export default router
