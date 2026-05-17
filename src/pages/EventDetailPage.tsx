import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface EventDetail {
  id: string; type: string; date: string; title: string
  description: string; slots: number; total: number
  status: string; location: string; accent: string
  image?: string;  enrollmentXp: number; enrolledByMe: boolean
  platform: string | null
  externalUrl: string | null
  benefits?: string[]
  schedule?: { time: string; activity: string }[]
  requirements?: string[]
  winners?: Array<{ id: string; name: string; position: number; awardXp: number }>
}

const ensureAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}


const typeColor: Record<string, string> = {
  Workshop: 'bg-primary text-on-primary',
  Hackathon: 'bg-white text-black',
  Meetup: 'bg-primary text-on-primary',
  Competition: 'bg-error text-on-error',
}

const accentVar: Record<string, string> = {
  '#d3ef57': 'text-primary border-primary',
  '#dbb8ff': 'text-secondary border-secondary',
  '#74facb': 'text-tertiary-fixed border-tertiary-fixed',
  '#ffb4ab': 'text-error border-error',
}

const defaultExtra = {
  highlights: ['Hands-on sessions', 'Industry mentors', 'Networking opportunities', 'Certificate of participation'],
  requirements: ['Laptop required', 'Pre-registration mandatory', 'Basic programming knowledge'],
  schedule: [{ time: '09:00', activity: 'Registration & setup' }, { time: '10:00', activity: 'Session begins' }, { time: '13:00', activity: 'Lunch break' }, { time: '14:00', activity: 'Afternoon session' }, { time: '17:00', activity: 'Wrap up & Q&A' }],
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [lightbox, setLightbox] = useState<{ img: string; label: string; tag: string; year: string } | null>(null)
  const [isExtHovered, setIsExtHovered] = useState(false)

  const { data: event, isLoading, isError } = useQuery<EventDetail>({
    queryKey: ['event', id],
    queryFn: () => api.get<EventDetail>(`/events/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const rsvpMutation = useMutation({
    mutationFn: () => api.post(`/events/${id}/rsvp`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/events/${id}/rsvp`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const handleAction = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } })
      return
    }
    if (event?.enrolledByMe) {
      cancelMutation.mutate()
    } else {
      rsvpMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-96">
          <span className="font-pixel text-primary text-sm animate-pulse">LOADING EVENT...</span>
        </div>
      </PublicLayout>
    )
  }

  if (isError || !event) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <span className="font-mono text-error text-sm">Event not found.</span>
          <Link to="/events" className="text-primary font-mono text-xs uppercase tracking-widest hover:underline">← Back to Events</Link>
        </div>
      </PublicLayout>
    )
  }

  const isFull = event.slots === 0
  const isPending = rsvpMutation.isPending || cancelMutation.isPending
  const fillPct = Math.round(((event.total - event.slots) / event.total) * 100)
  const accentCls = accentVar[event.accent] ?? 'text-primary border-primary'

  // Dynamic Content from Admin Dashboard
  const benefits = event.benefits?.length ? event.benefits : defaultExtra.highlights
  const requirements = event.requirements?.length ? event.requirements : defaultExtra.requirements
  const schedule = (event.schedule?.length ? event.schedule : defaultExtra.schedule).map(s => {
    if (typeof s === 'string') {
      const [time, activity] = (s as string).split('|')
      return { time: time?.trim() || '', activity: activity?.trim() || '' }
    }
    return s
  })

  return (
    <PublicLayout>
      {/* Breadcrumb */}
      <div className="px-8 py-4 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <Link to="/events" className="text-[10px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
            ← Event Queue
          </Link>
        </div>
      </div>

      {/* Hero image - only for internal events */}
      {(event.image && !event.platform) && (
        <div className="w-full relative group bg-black/40 border-b border-white/5 flex items-center justify-center overflow-hidden h-[300px] md:h-[450px]">
          <img 
            src={event.image} 
            alt={event.title} 
            className="max-w-full max-h-full object-contain" 
          />
          <button 
            onClick={() => setLightbox({ img: event.image!, label: event.title, tag: event.type, year: event.date })}
            className="absolute bottom-6 right-6 w-12 h-12 bg-black/60 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:border-primary hover:scale-110 transition-all z-10"
            title="View Full Image"
          >
            <span className="material-symbols-outlined">open_in_full</span>
          </button>
        </div>
      )}

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

      {/* Hero */}
      <section className="py-16 px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-[10px] font-mono font-bold px-3 py-1 uppercase tracking-widest ${typeColor[event.type] ?? 'bg-primary text-on-primary'}`}>
              {event.type}
            </span>
            <span className={`text-[10px] font-mono px-3 py-1 border uppercase ${event.status === 'Open' ? 'border-tertiary-fixed/40 text-tertiary-fixed' : event.status === 'Full' ? 'border-error/40 text-error' : 'border-secondary/40 text-secondary'}`}>
              {event.status}
            </span>
            {event.enrolledByMe && (
              <span className="text-[10px] font-mono px-3 py-1 border border-primary/40 text-primary uppercase">
                You're in
              </span>
            )}
          </div>

          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-4 max-w-3xl">{event.title}</h1>
          <div className="h-1 w-24 mb-6" style={{ background: event.accent }} />

          <div className="flex flex-wrap gap-6 text-sm font-mono">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-lg" style={{ color: event.accent }}>calendar_month</span>
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-lg" style={{ color: event.accent }}>location_on</span>
              {event.location}
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-lg" style={{ color: event.accent }}>group</span>
              {event.platform ? 'External Registration' : `${event.total - event.slots} / ${event.total} registered`}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">About this event</h2>
              <p className="text-base font-body text-on-surface leading-relaxed">{event.description}</p>
            </div>

            {event.winners && event.winners.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-6xl text-primary">military_tech</span>
                </div>
                <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-6">Hall of Fame / Event Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.winners.map((w) => (
                    <div key={w.id} className="flex items-center gap-4 bg-black/40 p-4 border border-white/5 group hover:border-primary/40 transition-all">
                      <div className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">
                        {w.position}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-white group-hover:text-primary transition-colors">{w.name}</div>
                        <div className="text-[9px] font-mono text-on-surface-variant uppercase">Awarded +{w.awardXp} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">What you'll get</h2>
              <ul className="space-y-2">
                {benefits.map((h) => (
                  <li key={h} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 mt-2 shrink-0" style={{ background: event.accent }} />
                    <span className="font-body text-sm text-on-surface">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Schedule</h2>
              <div className="space-y-0 border-l-2 border-white/10 pl-6">
                {schedule.map((s, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 border-2 border-white/20 bg-[#0A0A0A]" style={{ borderColor: event.accent }} />
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: event.accent }}>{s.time}</div>
                    <div className="text-sm font-body text-on-surface">{s.activity}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">check_circle</span>
                    <span className="font-body text-sm text-on-surface-variant">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — RSVP card */}
          <div className="lg:sticky lg:top-28 self-start space-y-4">
            <div className="lab-panel p-8 border-t-4" style={{ borderTopColor: event.accent }}>
              <div className="mb-6">
                <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-1">Seats available</div>
                <div className="text-3xl font-black" style={{ color: event.accent }}>
                  {isFull ? 'Full' : `${event.slots}`}
                </div>
                {!isFull && <div className="text-[10px] font-mono text-on-surface-variant">of {event.total} total</div>}
              </div>

              <div className="w-full bg-white/5 h-1 mb-6">
                <div className="h-full transition-all" style={{ width: `${fillPct}%`, background: event.accent }} />
              </div>

              <button
                onClick={handleAction}
                disabled={isPending || event.status === 'Closed' || (isFull && !event.enrolledByMe)}
                className={`w-full py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all disabled:opacity-40 ${
                  event.status === 'Closed'
                    ? 'border-white/10 text-on-surface-variant cursor-not-allowed'
                    : event.enrolledByMe
                    ? 'border-error text-error hover:bg-error hover:text-white'
                    : isFull
                    ? 'border-white/10 text-on-surface-variant cursor-not-allowed'
                    : `border-current hover:text-on-primary ${accentCls}`
                }`}
                style={!event.enrolledByMe && !isFull && event.status !== 'Closed' ? { borderColor: event.accent, color: event.accent } : undefined}
              >
                {isPending ? 'Processing...'
                  : event.status === 'Closed' ? 'Event Ended'
                  : event.enrolledByMe ? 'Cancel Registration'
                  : isFull ? 'Queue Full'
                  : !user ? 'Login to Register!'
                  : 'Register!'}
              </button>

              {event.enrolledByMe && event.externalUrl && (
                <a
                  href={ensureAbsoluteUrl(event.externalUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setIsExtHovered(true)}
                  onMouseLeave={() => setIsExtHovered(false)}
                  className={`w-full mt-4 py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all text-center block`}
                  style={{
                    borderColor: event.accent,
                    color: isExtHovered ? '#000000' : event.accent,
                    backgroundColor: isExtHovered ? event.accent : 'transparent'
                  }}
                >
                  JOIN ON {event.platform?.toUpperCase() || 'EXTERNAL PLATFORM'}
                </a>
              )}

              {event.enrolledByMe && (
                <p className="text-[10px] font-mono text-on-surface-variant text-center mt-3">
                  You're registered for this event.
                </p>
              )}

              <div className="mt-8 space-y-3 text-[10px] font-mono text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Date</span><span className="text-white">{event.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span><span className="text-white">{event.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span><span className="text-white">{event.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span style={{ color: event.accent }}>{event.status}</span>
                </div>
              </div>
            </div>

            {/* "All the best" Panel */}
            <div className="lab-panel p-6 bg-[#0E0E0E] border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-sm shadow-xl shadow-black/50" style={{ borderTop: `4px solid ${event.accent}` }}>
              {/* Decorative Tech Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_60%)] pointer-events-none" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-current/10 to-transparent blur-xl group-hover:from-current/20 transition-all duration-700 text-primary" style={{ color: event.accent }} />
              
              <div className="relative z-10 flex flex-col items-center text-center py-4 space-y-4">
                <style>{`
                  @keyframes event-tech-blink {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px currentColor); }
                    50% { opacity: 0.35; filter: drop-shadow(0 0 2px transparent); }
                  }
                  .animate-event-tech-blink {
                    animation: event-tech-blink 1.5s infinite;
                  }
                `}</style>
                <span className="material-symbols-outlined text-4xl animate-pulse" style={{ color: event.accent }}>
                  local_fire_department
                </span>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black italic uppercase tracking-wider font-headline animate-event-tech-blink" style={{ color: event.accent }}>
                    ALL THE BEST!
                  </h3>
                </div>
                <div className="h-[1px] w-12 bg-white/10 group-hover:w-20 transition-all duration-500" />
                <p className="text-[11px] font-mono text-on-surface-variant max-w-[200px] leading-relaxed uppercase tracking-wide">
                  Push your limits. Conquer the stack. Build the future.
                </p>
              </div>
              
              {/* Corner tech lines */}
              <div className="absolute top-0 left-0 w-2 h-[2px]" style={{ backgroundColor: event.accent }} />
              <div className="absolute top-0 left-0 w-[2px] h-2" style={{ backgroundColor: event.accent }} />
              <div className="absolute bottom-0 right-0 w-2 h-[2px]" style={{ backgroundColor: event.accent }} />
              <div className="absolute bottom-0 right-0 w-[2px] h-2" style={{ backgroundColor: event.accent }} />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default EventDetailPage
