import type { Challenge } from '../types'

export const challenges: Challenge[] = []

export const getChallengeById = (id: string) => challenges.find((c) => c.id === id)
