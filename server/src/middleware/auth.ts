import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_in_production'

export const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' })
    return
  }
  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Does not fail if no token — just attaches user if present
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload
      req.user = decoded
    } catch {
      // ignore invalid token — just proceed without user
    }
  }
  next()
}

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
