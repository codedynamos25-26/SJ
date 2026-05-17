import bcrypt from 'bcryptjs'
import type { User } from '../types'

// Passwords are hashed with bcrypt (cost 10)
// Plain passwords for dev: admin@codedynamos.io → Admin@1234, others → Member@1234

export const users: User[] = [
  {
    id: 'u1',
    email: 'admin@codedynamos.io',
    name: 'JAYA',
    role: 'admin',
    passwordHash: bcrypt.hashSync('sujaljaya$2025yr', 10),
    xp: 18540,
    rank: 1,
    challenges: 47,
    streak: 12,
    badge: 'Legendary',
    track: 'Fullstack',
    createdAt: '2024-08-01T00:00:00Z',
    enrolledEvents: ['ev1', 'ev2'],
    activeChallenges: ['ch1', 'ch2'],
  },
]

export const findUserByEmail = (email: string) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase())

export const findUserById = (id: string) => users.find((u) => u.id === id)

export const createUser = (data: {
  email: string
  name: string
  track: string
  password: string
}): User => {
  const newUser: User = {
    id: `u${users.length + 1}`,
    email: data.email,
    name: data.name,
    role: 'member',
    passwordHash: bcrypt.hashSync(data.password, 10),
    xp: 0,
    rank: users.length + 1,
    challenges: 0,
    streak: 0,
    badge: 'Member',
    track: data.track,
    createdAt: new Date().toISOString(),
    enrolledEvents: [],
    activeChallenges: [],
  }
  users.push(newUser)
  return newUser
}
