export interface User {
  id: string
  email: string
  name: string
  role: 'member' | 'admin'
  passwordHash: string
  xp: number
  rank: number
  challenges: number
  streak: number
  badge: string
  track: string
  usn?: string
  department?: string
  year?: string
  semester?: string
  createdAt: string
  enrolledEvents: string[]
  activeChallenges: string[]
}

export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: 'member' | 'admin'
  iat?: number
  exp?: number
}

export interface Event {
  id: string
  type: string
  date: string
  title: string
  description: string
  slots: number
  total: number
  status: string
  location: string
  accent: string
  image?: string
  platform?: string
  externalUrl?: string
  benefits?: string[]
  schedule?: { time: string; activity: string }[]
  requirements?: string[]
  enrollmentXp: number
  endsAt?: string
}

export interface Challenge {
  id: string
  title: string
  difficulty: 'Legendary' | 'Hard' | 'Medium' | 'Easy'
  xp: number
  pool: number
  completions: number
  participants: number
  tags: string[]
  description: string
  requirements?: string[]
  timeline?: string[]
  prizes?: string[]
  status: string
  enrollmentXp: number
  endsAt?: string
  externalUrl?: string
  image?: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  dept: string
  skills: string[]
  accent: string
  gradient?: string
  tier: 'Faculty' | 'Core' | 'Technical' | 'Marketing' | 'Creative' | 'Operator'
  image?: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'Live' | 'Beta' | 'Archived'
  tech: string[]
  stars: number
  forks: number
  img: string
  githubUrl?: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  xp: number
  challenges: number
  streak: number
  badge: string
}

export interface GalleryPhoto {
  id: string
  tag: string
  year: string
  label: string
  span: string
  img: string
}

// Extend Express Request to include auth user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
