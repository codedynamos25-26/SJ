import type { Challenge } from '../types'

export const challenges: Challenge[] = [
  {
    id: 'ch9',
    title: 'hasi',
    difficulty: 'Easy',
    xp: 300,
    pool: 1500,
    completions: 45,
    participants: 120,
    tags: ['Algorithms', 'Logic'],
    description: 'A logic-based challenge focusing on pattern recognition and optimization.',
    status: 'Open',
    enrollmentXp: 0,
  },
]

export const getChallengeById = (id: string) => challenges.find((c) => c.id === id)
