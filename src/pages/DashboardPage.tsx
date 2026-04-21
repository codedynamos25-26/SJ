import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface DashboardData {
  user: {
    id: string; name: string; email: string; xp: number; rank: number
    badge: string; challenges: number; streak: number; track: string
  }
  rankProgress: { current: string; next: string; xp: number; threshold: number; percent: number }
  enrolledEvents: Array<{ id: string; type: string; date: string; title: string; status: string; accent: string }>
  activeChallenges: Array<{ id: string; title: string; difficulty: string; xp: number; progress: number }>
  activity: Array<{ time: string; text: string; accent: string }>
}

const fetchDashboard = () => api.get<DashboardData>('/dashboard').then((r) => r.data)

const DashboardPage = () => {
  const { logout, user: authUser } = useAuth()
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d141c] flex items-center justify-center">
        <span className="font-pixel text-primary text-sm animate-pulse">LOADING OPERATOR HUB...</span>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0d141c] flex items-center justify-center">
        <span className="font-mono text-error text-sm">Failed to load dashboard. <button onClick={() => window.location.reload()} className="text-primary underline">Retry</button></span>
      </div>
    )
  }

  const { user, rankProgress, enrolledEvents, activeChallenges, activity } = data

  return (
    <div className="min-h-screen bg-[#0d141c] font-headline text-on-surface">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0d141c]/80 backdrop-blur-xl border-b border-outline-variant/10 h-16 flex items-center justify-between px-8">
        <Link to="/" className="text-primary font-black text-lg tracking-tighter uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-primary inline-block" />
          CODE DYNAMOS
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/challenges" className="text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Challenges</Link>
          <Link to="/events" className="text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Events</Link>
          {authUser?.role === 'admin' && (
            <Link to="/admin" className="text-xs font-mono uppercase tracking-widest text-primary hover:text-white transition-colors">Admin</Link>
          )}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={handleLogout} className="text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors">
            Logout
          </button>
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="font-pixel text-xs text-primary">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
        </div>
      </header>

      <main className="pt-20 p-8 max-w-[1400px] mx-auto">
        {/* Welcome */}
        <section className="mb-10">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">OPERATOR HUB</div>
          <h1 className="text-4xl font-black tracking-tighter">
            Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-on-surface-variant font-body mt-1 text-sm">
            Season 3 · Rank #{user.rank} · {user.xp.toLocaleString()} XP
          </p>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total XP', value: user.xp.toLocaleString(), icon: 'bolt', accent: '#d3ef57' },
            { label: 'Global Rank', value: `#${user.rank}`, icon: 'emoji_events', accent: '#dbb8ff' },
            { label: 'Challenges', value: user.challenges.toString(), icon: 'terminal', accent: '#74facb' },
            { label: 'Day Streak', value: user.streak.toString(), icon: 'local_fire_department', accent: '#ffb4ab' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-low p-5 border-l-4 flex flex-col gap-3" style={{ borderLeftColor: s.accent }}>
              <span className="material-symbols-outlined text-xl" style={{ color: s.accent }}>{s.icon}</span>
              <div className="text-3xl font-black" style={{ color: s.accent }}>{s.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">{s.label}</div>
            </div>
          ))}
        </section>

        {/* XP Progress */}
        <section className="bg-surface-container rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-1">XP Progress to Next Rank</div>
              <div className="font-headline font-black">
                {rankProgress.current} → <span className="text-primary">{rankProgress.next}</span>
              </div>
            </div>
            <span className="font-mono text-sm text-on-surface-variant">
              {rankProgress.xp.toLocaleString()} / {rankProgress.threshold.toLocaleString()} XP
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${rankProgress.percent}%` }} />
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant mt-2">
            {(rankProgress.threshold - rankProgress.xp).toLocaleString()} XP to {rankProgress.next} —{' '}
            <span className="text-primary">{rankProgress.percent}% complete</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Challenges */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface-container rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center">
                <h2 className="font-mono font-black uppercase tracking-tighter">Active Challenges</h2>
                <Link to="/challenges" className="text-[10px] font-mono text-primary uppercase tracking-widest">View All →</Link>
              </div>
              {activeChallenges.length === 0 ? (
                <div className="px-6 py-8 text-center text-on-surface-variant font-mono text-xs">
                  No active challenges. <Link to="/challenges" className="text-primary underline">Browse challenges →</Link>
                </div>
              ) : (
                activeChallenges.map((c) => (
                  <div key={c.id} className="px-6 py-5 border-b border-outline-variant/10 last:border-none hover:bg-surface-bright/20 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-headline font-bold group-hover:text-primary transition-colors">{c.title}</h3>
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant">{c.difficulty}</span>
                      </div>
                      <span className="font-mono text-xs text-primary font-bold">+{c.xp} XP</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-2">
                      <span>Progress</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1">
                      <div className="bg-primary h-full" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Enrolled Events */}
            <div className="bg-surface-container rounded-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center">
                <h2 className="font-mono font-black uppercase tracking-tighter">Enrolled Events</h2>
                <Link to="/events" className="text-[10px] font-mono text-primary uppercase tracking-widest">Browse →</Link>
              </div>
              {enrolledEvents.length === 0 ? (
                <div className="px-6 py-8 text-center text-on-surface-variant font-mono text-xs">
                  No enrolled events. <Link to="/events" className="text-primary underline">Browse events →</Link>
                </div>
              ) : (
                enrolledEvents.map((ev) => (
                  <div key={ev.id} className="px-6 py-5 border-b border-outline-variant/10 last:border-none hover:bg-surface-bright/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-surface-container-high flex flex-col items-center justify-center border" style={{ borderColor: `${ev.accent}30` }}>
                        <span className="font-pixel text-[8px] uppercase" style={{ color: ev.accent }}>{ev.date.split(' ')[0]}</span>
                        <span className="font-pixel text-lg font-bold" style={{ color: ev.accent }}>{ev.date.split(' ')[1]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: ev.accent }}>{ev.type}</div>
                        <h3 className="font-headline font-bold text-sm">{ev.title}</h3>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 border" style={{ color: ev.accent, borderColor: `${ev.accent}40` }}>
                        {ev.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h2 className="font-mono font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">pulse_alert</span>
              Recent Activity
            </h2>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-outline-variant/20">
              {activity.map((a, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-0 top-1 w-6 h-6 bg-surface-container flex items-center justify-center border" style={{ borderColor: `${a.accent}60` }}>
                    <div className="w-2 h-2" style={{ background: a.accent }} />
                  </div>
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest" style={{ color: a.accent }}>{a.time}</span>
                  <p className="text-xs font-body text-on-surface mt-1 leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-10 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">Quick Actions</div>
              <Link to="/challenges" className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-bright/30 border border-outline-variant/10 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-primary text-lg">terminal</span>
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-primary transition-colors">Browse Challenges</span>
              </Link>
              <Link to="/events" className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-bright/30 border border-outline-variant/10 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-secondary text-lg">event</span>
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-primary transition-colors">Upcoming Events</span>
              </Link>
              <Link to="/leaderboard" className="flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-bright/30 border border-outline-variant/10 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-tertiary-fixed text-lg">emoji_events</span>
                <span className="text-xs font-mono uppercase tracking-wider group-hover:text-primary transition-colors">View Leaderboard</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
