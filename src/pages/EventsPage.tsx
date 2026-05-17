import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import AnimatedDropdown from '../components/ui/AnimatedDropdown'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FILTERS = ['All', 'Workshop', 'Hackathon', 'Meetup', 'Competition'] as const
type Filter = typeof FILTERS[number]
const PHASE_FILTERS = ['All', 'Active', 'Upcoming', 'Finished'] as const
type PhaseFilter = typeof PHASE_FILTERS[number]

interface Event {
  id: string; type: string; date: string; title: string
  description: string; slots: number; total: number
  status: string; location: string; accent: string; image?: string
  endsAt?: string | null
  closedByTime?: boolean
  platform?: string; externalUrl?: string
  benefits?: string[]
  schedule?: { time: string; activity: string }[]
  requirements?: string[]
  enrolledByMe?: boolean
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

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isFinishedEvent = (ev: Event) => {
  const status = ev.status.toLowerCase()
  if (status === 'closed' || status === 'finished') return true
  const end = parseDate(ev.endsAt)
  return !!(end && end.getTime() < Date.now())
}

const isUpcomingEvent = (ev: Event) => {
  if (isFinishedEvent(ev)) return false
  const eventDate = parseDate(ev.date)
  if (eventDate) return eventDate.getTime() > Date.now()
  const status = ev.status.toLowerCase()
  return status === 'upcoming'
}

const EventsPage = () => {
  const [filter, setFilter] = useState<Filter>('All')
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('All')
  const [lightbox, setLightbox] = useState<{ img: string; label: string; tag: string; year: string } | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: fetchEvents })

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/rsvp`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const handleRsvp = (eventId: string) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/events' } } })
      return
    }
    rsvpMutation.mutate(eventId)
  }

  const filtered = events.filter((e) => {
    const typeMatch = filter === 'All' || e.type === filter
    if (!typeMatch) return false

    if (phaseFilter === 'All') return true
    if (phaseFilter === 'Finished') return isFinishedEvent(e)
    if (phaseFilter === 'Upcoming') return isUpcomingEvent(e)
    return !isFinishedEvent(e) && !isUpcomingEvent(e)
  })

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-8 md:py-10 px-4 md:px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[11px] font-black tracking-[0.5em] text-primary uppercase mb-3 font-['Space_Mono']">
            SCHEDULED OPERATIONS
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter mb-4 font-['Orbitron']">Event Queue</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mb-5" />
          <p className="text-on-surface-variant font-body max-w-xl text-sm md:text-base">
            High-signal technical events curated for elite developers. Workshops, hackathons, and community sprints.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[100px] z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-[1440px] mx-auto space-y-2">
          <AnimatedDropdown
            label="Status"
            value={phaseFilter}
            options={PHASE_FILTERS}
            onChange={setPhaseFilter}
          />

          <div className="flex gap-3 overflow-x-auto no-scrollbar">
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
              {filtered.length} shown
            </span>
          </div>
        </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="font-pixel text-primary text-sm animate-pulse">LOADING OPERATIONS...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((ev) => <EventCard key={ev.id} ev={ev} user={user} handleRsvp={handleRsvp} rsvpMutation={rsvpMutation} onFullscreen={() => setLightbox({ img: ev.image!, label: ev.title, tag: ev.type, year: ev.date })} />)}
              {!isLoading && filtered.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <span className="material-symbols-outlined text-4xl text-white/20">event_busy</span>
                  <p className="font-mono text-on-surface-variant text-sm">No events found in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 border border-white/20 flex items-center justify-center text-white hover:border-primary hover:text-primary transition-colors"
            onClick={() => setLightbox(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.img} alt={lightbox.label} className="w-full max-h-[85vh] object-contain" />
            <div className="mt-4 flex items-center gap-4">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-primary">{lightbox.tag} / {lightbox.year}</span>
              <span className="text-white font-headline font-bold uppercase text-sm">{lightbox.label}</span>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}

function EventCard({ ev, user, handleRsvp, rsvpMutation, onFullscreen }: { ev: Event; user: any; handleRsvp: (id: string) => void; rsvpMutation: any; onFullscreen: () => void }) {
  const isFull = ev.slots === 0
  const isFinished = isFinishedEvent(ev)
  const isPending = rsvpMutation.isPending && rsvpMutation.variables === ev.id
  const accentText = accentClass[ev.accent] ?? 'text-primary'

  return (
    <div className={`lab-panel group flex flex-col relative min-h-[450px] transition-all duration-500 ${isFinished ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100' : ''}`}>
      {/* Header Area */}
      <div className={`h-48 relative overflow-hidden transition-all duration-500 bg-black/40 border-b border-white/5`}>
        {ev.image ? (
          <div className="w-full h-full relative group/img">
            <img 
              src={ev.image} 
              alt={ev.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            {/* Full Image Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onFullscreen(); }}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all border bg-black/60 text-white/40 border-white/10 hover:border-primary hover:text-primary hover:scale-110"
              title="View Event Photo"
            >
              <span className="material-symbols-outlined text-sm">open_in_full</span>
            </button>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] p-6 font-mono overflow-hidden">
            <span className="material-symbols-outlined text-4xl text-white/10 mb-2 group-hover:scale-110 transition-transform duration-500">
              {ev.platform ? 'terminal' : 'event'}
            </span>
            <div className="text-[7px] text-white/20 uppercase tracking-[0.4em] space-y-1 w-full text-center opacity-50">
              <div>EVENT_NODE_{ev.id.slice(0,4)}</div>
              <div className={accentText}>LOC: {ev.location.toUpperCase()}</div>
            </div>
          </div>
        )}

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
        <p className="text-sm text-on-surface-variant mb-6 flex-1 font-body leading-relaxed">{ev.description}</p>

        {/* Participants */}
        <div className="mb-6">
          <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-2">
            <span>PARTICIPANTS</span>
            <span className={isFull ? 'text-error' : 'text-primary'}>
              {isFull ? 'FULL' : `${ev.total - ev.slots} / ${ev.total}`}
            </span>
          </div>
          <div className="w-full bg-white/5 h-0.5">
            <div
              className={`h-full transition-all ${isFull ? 'bg-error' : 'bg-primary'}`}
              style={{ width: `${((ev.total - ev.slots) / ev.total) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => handleRsvp(ev.id)}
          disabled={isFull || isPending || isFinished || !!ev.enrolledByMe}
          className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors ${
            isFinished || isFull || ev.enrolledByMe
              ? 'text-on-surface-variant cursor-not-allowed'
              : 'text-primary hover:text-white cursor-pointer relative z-10'
          }`}
        >
          {isPending
            ? 'PROCESSING...'
            : isFinished
            ? 'EVENT ENDED'
            : ev.enrolledByMe
            ? 'REGISTERED'
            : isFull
            ? 'QUEUE FULL'
            : user
            ? 'REGISTER'
            : 'LOGIN TO REGISTER'}
          {!isFull && !isFinished && !ev.enrolledByMe && <span className="w-6 h-[1px] bg-current inline-block" />}
        </button>
      </div>
    </div>
  )
}

export default EventsPage
