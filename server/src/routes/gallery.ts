import { Router } from 'express'
import { db, gallery } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  res.json(await db.select().from(gallery))
})

export default router
