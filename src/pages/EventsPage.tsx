import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FILTERS = ['All', 'Workshop', 'Hackathon', 'Meetup', 'Competition'] as const
type Filter = typeof FILTERS[number]

interface Event {
  id: string; type: string; date: string; title: string
  description: string; slots: number; total: number
  status: string; location: string; accent: string; image?: string
  platform?: string; externalUrl?: string
}

const typeColor: Record<string, string> = {
  Workshop: 'bg-primary text-on-primary',
  Hackathon: 'bg-white text-black',
  Meetup: 'bg-primary text-on-primary',
  Competition: 'bg-error text-on-error',
}

const accentClass: Record<string, string> = {
  '#d3ef57': 'text-primary',
  '#dbb8ff': 'text-secondary',
  '#74facb': 'text-tertiary-fixed',
  '#ffb4ab': 'text-error',
}

const fetchEvents = () => api.get<Event[]>('/events').then((r) => r.data)

const EventsPage = () => {
  const [filter, setFilter] = useState<Filter>('All')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: fetchEvents })

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/rsvp`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const handleRsvp = (eventId: string) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/events' } } })
      return
    }
    rsvpMutation.mutate(eventId)
  }

  const filtered = filter === 'All' ? events : events.filter((e) => e.type === filter)

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-20 px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[10px] font-black tracking-[0.5em] text-primary uppercase mb-4 font-mono">
            SCHEDULED OPERATIONS
          </div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter mb-4">Event Queue</h1>
          <div className="h-1 w-24 bg-primary mb-8" />
          <p className="text-on-surface-variant font-body max-w-xl">
            High-signal technical events curated for elite developers. Workshops, hackathons, and community sprints.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[5.5rem] z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 px-8 py-4">
        <div className="max-w-[1440px] mx-auto flex gap-3 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-primary text-on-primary'
                  : 'border border-white/10 text-on-surface-variant hover:border-primary/50 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
              {filtered.length} events
            </span>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 px-8">
        <div className="max-w-[1440px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="font-pixel text-primary text-sm animate-pulse">LOADING OPERATIONS...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((ev) => {
                const isFull = ev.slots === 0
                const isPending = rsvpMutation.isPending && rsvpMutation.variables === ev.id
                const accentText = accentClass[ev.accent] ?? 'text-primary'

                return (
                  <div key={ev.id} className="lab-panel group flex flex-col relative">
                    <div className={`${ev.platform ? 'h-28' : 'h-48'} relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 ${ev.platform ? 'bg-white/5 flex items-center justify-center' : ''}`}>
                      {(!ev.platform && ev.image)
                      ? <img 
                          src={ev.image} 
                          alt={ev.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      : <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">
                            {ev.platform ? 'terminal' : 'event'}
                          </span>
                        </div>
                    }
                      <div className={`absolute top-0 right-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest ${typeColor[ev.type] ?? 'bg-primary text-on-primary'}`}>
                        {ev.type}
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1 border-t border-white/5">
                      <div className={`text-[10px] font-mono font-bold tracking-[0.3em] mb-3 ${accentText}`}>
                        {ev.date} · {ev.location} {ev.platform && `· ${ev.platform.toUpperCase()}`}
                      </div>
                      <Link to={`/events/${ev.id}`} className="after:absolute after:inset-0">
                        <h3 className="text-xl font-black uppercase mb-3 leading-tight group-hover:text-primary transition-colors">
                          {ev.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-on-surface-variant mb-6 flex-1 font-body">{ev.description}</p>

                      {/* Slots */}
                      <div className="mb-6">
                        <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-2">
                          <span>SLOTS AVAILABLE</span>
                          <span className={isFull ? 'text-error' : 'text-primary'}>
                            {isFull ? 'FULL' : `${ev.slots} / ${ev.total}`}
                          </span>
                        </div>
                        <div className="w-full bg-white/5 h-0.5">
                          <div
                            className={`h-full transition-all ${isFull ? 'bg-error' : 'bg-primary'}`}
                            style={{ width: `${(ev.slots / ev.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleRsvp(ev.id)}
                        disabled={isFull || isPending}
                        className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors ${
                          isFull
                            ? 'text-on-surface-variant cursor-not-allowed'
                            : 'text-primary hover:text-white cursor-pointer'
                        }`}
                      >
                        {isFull ? 'QUEUE CLOSED' : isPending ? 'PROCESSING...' : user ? 'EXECUTE RSVP' : 'LOGIN TO RSVP'}
                        {!isFull && <span className="w-6 h-[1px] bg-current inline-block" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}

export default EventsPage
