import type { Event } from '../types'

export const events: Event[] = []

export const getEventById = (id: string) => events.find((e) => e.id === id)
