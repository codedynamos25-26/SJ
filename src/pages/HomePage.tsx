import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

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

const HomePage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const eventScrollRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/events').then(r => r.data),
  })

  const scrollEvents = (dir: 'left' | 'right') => {
    if (!eventScrollRef.current) return
    eventScrollRef.current.scrollBy({ left: dir === 'left' ? -450 : 450, behavior: 'smooth' })
  }

  return (
    <div className="bg-[#0A0A0A] text-white selection:bg-primary/30 font-headline">

      {/* Announcement Ticker */}
      <div className="w-full bg-primary text-on-primary py-2 overflow-hidden z-[60] relative border-b border-white/10">
        <div className="ticker-scroll flex items-center space-x-12">
          <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.25em] whitespace-nowrap">
            SYSTEM ALERT: Next Hackathon - Cloud Native Sprint starts in T-minus 14 days • AI Workshop Registration Active • Code Dynamos Regional Engineering Award Confirmed • Release: Open Source Ledger v2.1
          </span>
          <span className="font-label text-[10px] font-extrabold uppercase tracking-[0.25em] whitespace-nowrap">
            SYSTEM ALERT: Next Hackathon - Cloud Native Sprint starts in T-minus 14 days • AI Workshop Registration Active • Code Dynamos Regional Engineering Award Confirmed • Release: Open Source Ledger v2.1
          </span>
        </div>
      </div>

      {/* TopNavBar */}
      <nav className="fixed top-8 w-full z-50 px-8">
        <div className="max-w-[1440px] mx-auto bg-black/95 backdrop-blur-md border border-white/10 py-4 px-8 flex justify-between items-center rounded-lg">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/logo.jpeg"
              alt="Code Dynamos"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
              <img
                src="https://cmr.edu.in/wp-content/uploads/2026/03/CMR-NAAC-LOGO-small.png"
                alt="CMR University"
                className="h-8 w-auto object-contain brightness-95"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-xs text-white/80 font-mono uppercase tracking-wider leading-tight font-semibold">
                CMR<br />University
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            <Link className="text-sm font-bold uppercase tracking-widest text-primary border-b-2 border-primary pb-1" to="/events">
              Events
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-primary transition-colors" to="/challenges">
              Challenges
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-primary transition-colors" to="/team">
              Team
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-primary transition-colors" to="/projects">
              Projects
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-primary transition-colors" to="/gallery">
              Gallery
            </Link>
            <Link className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-primary transition-colors" to="/leaderboard">
              Leaderboard
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link className="text-sm font-bold uppercase tracking-widest text-primary hover:text-white transition-colors" to="/admin">
                    Admin
                  </Link>
                )}
                <Link className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors" to="/dashboard">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-red-400 transition-colors">
                  Logout
                </button>
                <Link to="/dashboard" className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="font-pixel text-xs text-primary">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors" to="/login">
                  Login
                </Link>
                <Link
                  className="bg-primary px-6 py-2.5 rounded-sm text-on-primary font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                  to="/signup"
                >
                  Join Registry
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-40">

        {/* Hero Section */}
        <section className="relative min-h-[800px] flex items-center px-8 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(211,239,87,0.05)_0%,_transparent_50%)] z-0" />
          <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 mb-8">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">EST 2024 / ENGINEERING LAB</span>
              </div>
              <h1 className="font-headline text-7xl md:text-8xl font-black tracking-tight leading-none mb-8 uppercase italic">
                Build. <br />
                <span className="text-primary">Compete.</span> <br />
                Connect.
              </h1>
              <p className="font-body text-lg text-on-surface-variant max-w-xl mb-12 leading-relaxed border-l-2 border-white/10 pl-6">
                Operational hub for elite developers. Push architecture boundaries through high-stakes technical sprints and collaborative deep-tech initiatives.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="bg-primary px-10 py-5 text-on-primary font-black text-sm uppercase tracking-[0.2em] hover:brightness-110 transition-all border border-primary"
                >
                  Initialize Access
                </Link>
                <Link
                  to="/events"
                  className="bg-transparent border border-white/20 px-10 py-5 text-on-surface font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Sprints Directory
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 hidden lg:block">
              <div className="technical-border p-2 bg-[#141414] relative">
                <img
                  alt="Advanced code editor workspace"
                  className="grayscale hover:grayscale-0 transition-all duration-700 object-cover aspect-[4/5] border border-white/5 w-full"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNmzidLD06E26fFgq1694riEB2PgiPq9Oj5ypLMPcqU32x0Jd4fe6odxf1tfw0ANNRh_toaV4r1jTnkukeo7jYUCcUM1ODqEt7ulU0SQ27--XRB5qetz4nusorJAMrkTiAm3T-vJX4KoX74DnSNNhXhgkG1_dRpYpQ7geb88_1GZ6KdnuTvfM9fFez4yx5tAqAOCJxb7yRjGoUViJ5tjWlu7ZAky6ZD9qbktZIBzdD9L-rp1PskEzzrqGtmpsxnklLIPlNYVheEQ"
                />
                <div className="absolute -bottom-4 -right-4 bg-primary text-on-primary px-4 py-1 text-[10px] font-black tracking-widest uppercase">
                  System_Active.exe
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-[#141414] border-y border-white/5 py-12">
          <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-primary mb-1">148</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Active_Operators</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-white mb-1">32</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Sprints_Per_Annum</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-white mb-1">24</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Live_Challenges</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-primary mb-1">67</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Projects_Deployed</div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-24 bg-[#0A0A0A]">
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
                        {isFull ? 'Full' : `${ev.slots} slots left`}
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
        <section className="py-24 bg-[#141414] px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-20">
              <div className="text-[10px] font-black tracking-[0.5em] text-primary uppercase mb-4">ACTIVE OPERATIONS</div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">Current Sprints</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Challenge 1 — Legendary */}
              <div className="md:row-span-2 lab-panel p-10 flex flex-col justify-between border-t-2 border-primary">
                <div>
                  <div className="flex justify-between items-start mb-12">
                    <span className="material-symbols-outlined text-4xl text-primary">terminal</span>
                    <span className="border border-primary text-primary text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter">CLASS: LEGENDARY</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase mb-6 italic">The Kernel Architect</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-10">
                    Low-level optimization challenge: build a priority-based scheduler in pure C (max 500 lines).
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                    <span>POOL: $2,500</span>
                    <span>COMPLETION: 65%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 mb-10">
                    <div className="bg-primary h-full w-2/3" />
                  </div>
                  <button className="w-full py-4 bg-primary text-on-primary font-black text-xs uppercase tracking-[0.3em] hover:brightness-110 transition-all">
                    INITIALIZE
                  </button>
                </div>
              </div>
              {/* Challenge 2 */}
              <div className="lab-panel p-8 group border-l border-white/10">
                <div className="flex justify-between items-start mb-8">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors">database</span>
                  <span className="text-[8px] font-bold text-on-surface-variant border border-white/20 px-2 py-0.5 uppercase">HARD</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4 italic">Query Ninja</h3>
                <p className="text-xs text-on-surface-variant mb-8">
                  High-performance database optimization: reduce query latency on a 10M-row dataset.
                </p>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  <span>POOL: $800</span>
                  <span>42%</span>
                </div>
                <div className="w-full bg-white/5 h-1">
                  <div className="bg-white/40 h-full w-5/12" />
                </div>
              </div>
              {/* Challenge 3 */}
              <div className="lab-panel p-8 group border-l border-white/10">
                <div className="flex justify-between items-start mb-8">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors">hub</span>
                  <span className="text-[8px] font-bold text-on-surface-variant border border-white/20 px-2 py-0.5 uppercase">MEDIUM</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4 italic">Graph Weaver</h3>
                <p className="text-xs text-on-surface-variant mb-8">
                  Implement a real-time collaborative graph editor with conflict-free replicated data types.
                </p>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  <span>POOL: $600</span>
                  <span>71%</span>
                </div>
                <div className="w-full bg-white/5 h-1">
                  <div className="bg-white/40 h-full w-8/12" />
                </div>
              </div>
              {/* Challenge 4 */}
              <div className="lab-panel p-8 group border-l border-white/10">
                <div className="flex justify-between items-start mb-8">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors">memory</span>
                  <span className="text-[8px] font-bold text-on-surface-variant border border-white/20 px-2 py-0.5 uppercase">HARD</span>
                </div>
                <h3 className="text-xl font-black uppercase mb-4 italic">Cache Architect</h3>
                <p className="text-xs text-on-surface-variant mb-8">
                  Design a distributed cache layer that achieves sub-millisecond read latency at 99th percentile.
                </p>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  <span>POOL: $1,200</span>
                  <span>28%</span>
                </div>
                <div className="w-full bg-white/5 h-1">
                  <div className="bg-white/40 h-full w-3/12" />
                </div>
              </div>
            </div>

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

        {/* Footer */}
        <footer className="bg-[#0A0A0A] border-t border-white/5 py-16 px-8">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
            <div>
              <div className="mb-3">
                <img
                  src="/src/assets/logo.jpeg"
                  alt="Code Dynamos"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Web Weave '26 — Technical Excellence Platform for elite developers.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest mb-3">In association with</p>
              <div className="flex items-center gap-3">
                <img
                  src="https://cmr.edu.in/wp-content/uploads/2026/03/CMR-NAAC-LOGO-small.png"
                  alt="CMR University"
                  className="h-10 w-auto object-contain brightness-90"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <p className="text-sm font-bold text-white tracking-wide">CMR University</p>
                  <p className="text-[10px] text-on-surface-variant font-mono">Bengaluru, Karnataka</p>
                </div>
              </div>
            </div>
          </div>
            <div className="flex gap-16 text-xs font-bold uppercase tracking-widest">
              <div className="space-y-4">
                <div className="text-on-surface-variant mb-6">Platform</div>
                <Link className="block text-on-surface-variant hover:text-primary transition-colors" to="/events">Events</Link>
                <Link className="block text-on-surface-variant hover:text-primary transition-colors" to="/challenges">Challenges</Link>
                <Link className="block text-on-surface-variant hover:text-primary transition-colors" to="/leaderboard">Leaderboard</Link>
              </div>
              <div className="space-y-4">
                <div className="text-on-surface-variant mb-6">Community</div>
                <Link className="block text-on-surface-variant hover:text-primary transition-colors" to="/team">Team</Link>
                <Link className="block text-on-surface-variant hover:text-primary transition-colors" to="/projects">Projects</Link>
                <Link className="block text-on-surface-variant hover:text-primary transition-colors" to="/gallery">Gallery</Link>
              </div>
            </div>
          </div>
          <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">
              © 2026 Code Dynamos. All rights reserved.
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d3ef57]" />
              <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Systems Nominal</span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}

export default HomePage
