import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface EventDetail {
  id: string; type: string; date: string; title: string
  description: string; slots: number; total: number
  status: string; location: string; accent: string
  image?: string; enrolledByMe: boolean
  platform?: string; externalUrl?: string
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

// Static per-event supplemental content keyed by id
const extras: Record<string, { highlights: string[]; requirements: string[]; schedule: { time: string; item: string }[] }> = {
  ev1: {
    highlights: ['Memory model deep-dive', 'Async runtimes with tokio', 'Building APIs with axum', 'Zero-copy techniques'],
    requirements: ['Rust basic familiarity', 'Laptop with Rust toolchain', 'VS Code or any editor'],
    schedule: [{ time: '09:00', item: 'Setup & intro' }, { time: '10:00', item: 'Memory model' }, { time: '13:00', item: 'Lunch break' }, { time: '14:00', item: 'tokio async runtime' }, { time: '16:30', item: 'axum API workshop' }, { time: '18:00', item: 'Wrap up' }],
  },
  ev2: {
    highlights: ['Kubernetes deployment', 'Serverless architecture', 'Edge computing patterns', '₹5L prize pool'],
    requirements: ['Any tech stack', 'Team of 2-4', 'Valid student ID', 'Pre-registration required'],
    schedule: [{ time: 'Day 1 09:00', item: 'Kickoff & problem reveal' }, { time: 'Day 1 10:00', item: 'Hacking begins' }, { time: 'Day 2 10:00', item: 'Mentor office hours' }, { time: 'Day 2 16:00', item: 'Submissions close' }, { time: 'Day 2 18:00', item: 'Demo day & awards' }],
  },
}

const defaultExtra = {
  highlights: ['Hands-on sessions', 'Industry mentors', 'Networking opportunities', 'Certificate of participation'],
  requirements: ['Laptop required', 'Pre-registration mandatory', 'Basic programming knowledge'],
  schedule: [{ time: '09:00', item: 'Registration & setup' }, { time: '10:00', item: 'Session begins' }, { time: '13:00', item: 'Lunch break' }, { time: '14:00', item: 'Afternoon session' }, { time: '17:00', item: 'Wrap up & Q&A' }],
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: event, isLoading, isError } = useQuery<EventDetail>({
    queryKey: ['event', id],
    queryFn: () => api.get<EventDetail>(`/events/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const rsvpMutation = useMutation({
    mutationFn: () => api.post(`/events/${id}/rsvp`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', id] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/events/${id}/rsvp`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', id] }),
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
  const extra = extras[event.id] ?? defaultExtra
  const accentCls = accentVar[event.accent] ?? 'text-primary border-primary'

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
        <div className="w-full h-64 md:h-80 overflow-hidden">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
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

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">What you'll get</h2>
              <ul className="space-y-2">
                {extra.highlights.map((h) => (
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
                {extra.schedule.map((s, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div className="absolute -left-[27px] top-1 w-3 h-3 border-2 border-white/20 bg-[#0A0A0A]" style={{ borderColor: event.accent }} />
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: event.accent }}>{s.time}</div>
                    <div className="text-sm font-body text-on-surface">{s.item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Requirements</h2>
              <ul className="space-y-2">
                {extra.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">check_circle</span>
                    <span className="font-body text-sm text-on-surface-variant">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — RSVP card */}
          <div className="lg:sticky lg:top-28 self-start">
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

              {event.externalUrl ? (
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all text-center block ${accentCls} hover:bg-current hover:text-black`}
                  style={{ borderColor: event.accent, color: event.accent }}
                >
                  JOIN ON {event.platform?.toUpperCase() || 'PLATFORM'}
                </a>
              ) : (
                <button
                  onClick={handleAction}
                  disabled={isFull && !event.enrolledByMe || isPending}
                  className={`w-full py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all disabled:opacity-40 ${
                    event.enrolledByMe
                      ? 'border-error text-error hover:bg-error hover:text-white'
                      : isFull
                      ? 'border-white/10 text-on-surface-variant cursor-not-allowed'
                      : `border-current hover:text-on-primary ${accentCls}`
                  }`}
                  style={!event.enrolledByMe && !isFull ? { borderColor: event.accent, color: event.accent } : undefined}
                >
                  {isPending ? 'Processing...'
                    : event.enrolledByMe ? 'Cancel RSVP'
                    : isFull ? 'Queue Closed'
                    : !user ? 'Login to RSVP'
                    : 'Execute RSVP'}
                </button>
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
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default EventDetailPage
