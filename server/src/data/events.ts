import type { Event } from '../types'

export const events: Event[] = [

  {
    id: 'ev2',
    type: 'Hackathon',
    date: 'APR 08-09',
    title: "WEB WEAVE '26",
    description: "A two-day hybrid web design event organized by Code Dynamos. Build real-time web projects and present them before a panel. ₹5,000 prize pool.",
    slots: 50,
    total: 50,
    status: 'Open',
    location: 'Hybrid (Campus Lab / Online)',
    accent: '#dbb8ff',
    image: 'https://images.unsplash.com/photo-1547658719-da2b811691ea?auto=format&fit=crop&q=80&w=800',
    enrollmentXp: 0,
  },
]

export const getEventById = (id: string) => events.find((e) => e.id === id)
