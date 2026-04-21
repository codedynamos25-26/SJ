import bcrypt from 'bcryptjs'
import type { User } from '../types'

// Passwords are hashed with bcrypt (cost 10)
// Plain passwords for dev: admin@codedynamos.io → Admin@1234, others → Member@1234

export const users: User[] = [
  {
    id: 'u1',
    email: 'admin@codedynamos.io',
    name: 'Aayan Joshi',
    role: 'admin',
    passwordHash: bcrypt.hashSync('Admin@1234', 10),
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
  {
    id: 'u2',
    email: 'arjun@codedynamos.io',
    name: 'Arjun Mehta',
    role: 'member',
    passwordHash: bcrypt.hashSync('Member@1234', 10),
    xp: 10900,
    rank: 4,
    challenges: 28,
    streak: 3,
    badge: 'Expert',
    track: 'Backend',
    createdAt: '2024-09-15T00:00:00Z',
    enrolledEvents: ['ev1', 'ev2'],
    activeChallenges: ['ch1', 'ch2'],
  },
  {
    id: 'u3',
    email: 'priya@codedynamos.io',
    name: 'Priya Sharma',
    role: 'member',
    passwordHash: bcrypt.hashSync('Member@1234', 10),
    xp: 14820,
    rank: 2,
    challenges: 38,
    streak: 8,
    badge: 'Architect',
    track: 'ML',
    createdAt: '2024-08-20T00:00:00Z',
    enrolledEvents: ['ev2'],
    activeChallenges: ['ch3'],
  },
  {
    id: 'u4',
    email: 'karan@codedynamos.io',
    name: 'Karan Nair',
    role: 'member',
    passwordHash: bcrypt.hashSync('Member@1234', 10),
    xp: 18540,
    rank: 1,
    challenges: 47,
    streak: 12,
    badge: 'Legendary',
    track: 'Security',
    createdAt: '2024-07-10T00:00:00Z',
    enrolledEvents: ['ev1'],
    activeChallenges: ['ch4'],
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
