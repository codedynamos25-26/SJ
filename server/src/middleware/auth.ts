import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'

const getJwtSecret = (): string => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL SECURITY WARNING: JWT_SECRET environment variable is not defined!')
  }
  return 'dev_secret_change_in_production_codedynamos_secure_key_2026'
}

const JWT_SECRET = getJwtSecret()

export const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '24h', algorithm: 'HS256' })

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  let token = req.cookies?.token
  const header = req.headers.authorization
  if (!token && header?.startsWith('Bearer ')) {
    token = header.slice(7)
  }
  if (!token) {
    res.status(401).json({ error: 'Missing or malformed Authorization token' })
    return
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Does not fail if no token — just attaches user if present
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  let token = req.cookies?.token
  const header = req.headers.authorization
  if (!token && header?.startsWith('Bearer ')) {
    token = header.slice(7)
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
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
