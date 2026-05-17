import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import PublicLayout from '../components/layouts/PublicLayout'
import { useAuth } from '../context/AuthContext'

interface Event {
  id: string; type: string; date: string; title: string
  description: string; slots: number; total: number
  status: string; location: string; accent: string; image?: string
  platform?: string; externalUrl?: string
}

interface HomeStats {
  totalUsers: number
  totalEvents: number
  totalChallenges: number
  totalProjects: number
}

interface Challenge {
  id: string
  title: string
  difficulty: string
  xp: number
  participants: number
  pool: number
  description: string
}

const typeColor: Record<string, string> = {
  Workshop: 'bg-primary text-on-primary',
  Hackathon: 'bg-white text-black',
  Meetup: 'bg-primary text-on-primary',
  Competition: 'bg-error text-on-error',
}

const HomePage = () => {
  const eventScrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/events').then(r => r.data),
  })

  const { data: stats = { totalUsers: 0, totalEvents: 0, totalChallenges: 0, totalProjects: 0 } } = useQuery<HomeStats>({
    queryKey: ['homeStats'],
    queryFn: () => api.get<HomeStats>('/stats/home').then(r => r.data).catch(() => ({ 
      totalUsers: 0, 
      totalEvents: 0, 
      totalChallenges: 0, 
      totalProjects: 0 
    })),
  })

  const { data: challenges = [], isLoading: isChallengesLoading } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => api.get<Challenge[]>('/challenges').then(r => r.data),
  })

  const scrollEvents = (dir: 'left' | 'right') => {
    if (!eventScrollRef.current) return
    eventScrollRef.current.scrollBy({ left: dir === 'left' ? -450 : 450, behavior: 'smooth' })
  }

  return (
    <PublicLayout>

      <main>

        {/* Hero Section */}
        <section className="relative min-h-[650px] flex items-center px-8 overflow-hidden pt-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(211,239,87,0.05)_0%,_transparent_50%)] z-0" />
          <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 mb-8">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">EST 2025 / Sujal - Jayaduran</span>
              </div>
              <h1 className="font-headline text-7xl md:text-8xl font-black tracking-tight leading-none mb-8 uppercase italic animate-fadeInScale">
                Build. <br />
                <span className="text-primary bg-gradient-to-r from-primary to-secondary/50 bg-clip-text text-transparent animate-glow">Compete.</span> <br />
                Connect.
              </h1>
              <p className="font-body text-lg text-on-surface-variant max-w-xl mb-12 leading-relaxed border-l-2 border-white/10 pl-6 animate-slideInRight">
                <i>From Hello World to changing the world.</i> <br />
                The official coding club and technical hub for future architects.
              </p>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="bg-primary px-10 py-5 text-on-primary font-black text-sm uppercase tracking-[0.2em] hover:brightness-110 transition-all border border-primary"
                  >
                    Operator Hub
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="bg-primary px-10 py-5 text-on-primary font-black text-sm uppercase tracking-[0.2em] hover:brightness-110 transition-all border border-primary"
                  >
                    Initialize Access
                  </Link>
                )}
                <Link
                  to="/events"
                  className="bg-transparent border border-white/20 px-10 py-5 text-on-surface font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Can YOU??
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative p-2 bg-[#141414] border border-white/10 rounded-sm overflow-hidden">
                  <div className="scanline" />
                  <img
                    alt="Code Dynamos Elite Club Operatives"
                    className="grayscale group-hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5] border border-white/5 w-full h-[500px] scale-105 group-hover:scale-100"
                    src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800"
                  />
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="h-px w-12 bg-primary" />
                    <div className="h-px w-8 bg-primary" />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-primary text-on-primary px-6 py-2 text-[11px] font-black tracking-[0.3em] uppercase shadow-[0_20px_40px_rgba(211,239,87,0.3)] transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                  welcome dynamites
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-[#141414] border-y border-white/5 py-12">
          <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-primary mb-1">{stats.totalUsers}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Active_Operators</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-white mb-1">{stats.totalEvents}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Sprints_Per_Annum</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-white mb-1">{stats.totalChallenges}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Live_Challenges</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-primary mb-1">{stats.totalProjects}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Projects_Deployed</div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="px-8 max-w-[1440px] mx-auto mb-16 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black uppercase italic tracking-tight mb-4">Event Queue</h2>
              <div className="h-1 w-24 bg-primary" />
            </div>
            <div className="flex items-center gap-4">
              <Link to="/events" className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                View All →
              </Link>
              <div className="flex gap-2">
                <button onClick={() => scrollEvents('left')} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 text-on-surface-variant transition-all">
                  <span className="material-symbols-outlined text-sm">west</span>
                </button>
                <button onClick={() => scrollEvents('right')} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 text-on-surface-variant transition-all">
                  <span className="material-symbols-outlined text-sm">east</span>
                </button>
              </div>
            </div>
          </div>
          {/* Full-width scroll track — pl-8 for leading indent, no right constraint */}
          <div ref={eventScrollRef} className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar pl-8">
            {events.map((ev) => {
              const isFull = ev.slots === 0
              return (
                <div key={ev.id} className="flex-none w-[380px] snap-start lab-panel group flex flex-col">
                  <div className={`${ev.platform ? 'h-24' : 'h-40'} relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 shrink-0 ${ev.platform ? 'bg-white/5 flex items-center justify-center' : ''}`}>
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
                  <div className="p-6 border-t border-white/5 flex flex-col flex-1">
                    <div className="text-[10px] font-bold tracking-[0.3em] mb-3" style={{ color: ev.accent }}>
                      {ev.date} · {ev.location} {ev.platform && `· ${ev.platform.toUpperCase()}`}
                    </div>
                    <h3 className="text-lg font-black uppercase mb-3 leading-tight group-hover:text-primary transition-colors flex-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mb-5 line-clamp-2 font-body">{ev.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase ${isFull ? 'border-error/40 text-error' : 'border-white/10 text-on-surface-variant'}`}>
                        {isFull ? 'Full' : `${ev.total - ev.slots} / ${ev.total} Participants`}
                      </span>
                      <Link
                        to={`/events/${ev.id}`}
                        className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                        style={{ color: ev.accent }}
                      >
                        View <span className="w-4 h-[1px] bg-current inline-block" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Right padding sentinel */}
            <div className="flex-none w-8 shrink-0" />
          </div>
        </section>

        {/* Current Sprints / Featured Challenges */}
        <section className="py-16 bg-[#141414] px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-20">
              <div className="text-[10px] font-black tracking-[0.5em] text-primary uppercase mb-4">ACTIVE OPERATIONS</div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">Current Sprints</h2>
            </div>
            {isChallengesLoading ? (
              <div className="lab-panel p-10 flex flex-col justify-center items-center h-64 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 animate-pulse">terminal</span>
                <h3 className="text-xl font-black uppercase tracking-widest text-on-surface-variant">Loading Sprints...</h3>
              </div>
            ) : challenges.length === 0 ? (
              <div className="lab-panel p-10 flex flex-col justify-center items-center h-64 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">terminal</span>
                <h3 className="text-xl font-black uppercase tracking-widest text-on-surface-variant">No Active Sprints</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.slice(0, 3).map((ch) => (
                  <div key={ch.id} className="lab-panel p-8 border border-outline-variant/30 group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">{ch.difficulty}</span>
                      <span className="text-[10px] font-black text-secondary">+{ch.xp} XP</span>
                    </div>
                    <h3 className="text-xl font-black uppercase mb-3 group-hover:text-primary transition-colors">{ch.title}</h3>
                    <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">{ch.description}</p>
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-5">
                      <span>{ch.participants} participants</span>
                      <span>₹{Math.round(ch.pool / 1000)}K pool</span>
                    </div>
                    <Link
                      to={`/challenges/${ch.id}`}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"
                    >
                      View Sprint <span className="w-4 h-[1px] bg-primary inline-block" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                to="/challenges"
                className="border border-white/20 px-12 py-4 text-sm font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all inline-block"
              >
                View All Active Sprints
              </Link>
            </div>
          </div>
        </section>

      </main>
    </PublicLayout>
  )
}

export default HomePage
