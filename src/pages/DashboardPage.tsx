import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import AnimatedProfileBadge from '../components/ui/AnimatedProfileBadge'
import LeetCodeSettings from '../components/ui/LeetCodeSettings'


interface DashboardData {
  user: {
    id: string; name: string; email: string; xp: number; rank: number
    usn: string; department: string; year: string; semester?: string; githubUrl: string; track: string
  }
  enrolledEvents: Array<{ id: string; type: string; date: string; title: string; status: string; accent: string }>
  activeChallenges: Array<{ id: string; title: string; difficulty: string; xp: number; verified: boolean }>
  activity: Array<{ time: string; text: string; accent: string }>
}

const fetchDashboard = () => api.get<DashboardData>('/dashboard').then((r) => r.data)

const DashboardPage = () => {
  const { logout, user: authUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingField, setEditingField] = useState<'year' | 'semester' | 'track' | 'usn' | 'department' | 'name' | null>(null)
  const [draftValue, setDraftValue] = useState('')

  const updateProfile = useMutation({
    mutationFn: (updates: Record<string, any>) => api.put('/user/profile', updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })
      const previous = queryClient.getQueryData(['dashboard'])
      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old) return old
        return { ...old, user: { ...old.user, ...updates } }
      })
      return { previous }
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) queryClient.setQueryData(['dashboard'], context.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const startEdit = (field: 'year' | 'semester' | 'track' | 'usn' | 'department' | 'name', current?: string) => {
    setEditingField(field)
    setDraftValue(current ?? '')
  }

  const cancelEdit = () => {
    setEditingField(null)
    setDraftValue('')
  }

  const saveEdit = () => {
    if (!editingField) return
    const nextValue = draftValue.trim()
    if (!nextValue) {
      cancelEdit()
      return
    }
    updateProfile.mutate({ [editingField]: nextValue }, { onSuccess: () => cancelEdit() })
  }

  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
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

  const { user, enrolledEvents, activeChallenges, activity } = data

  return (
    <div className="min-h-screen bg-[#0d141c] font-headline text-on-surface">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0d141c]/80 backdrop-blur-xl border-b border-outline-variant/10 h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-primary font-black text-lg tracking-tighter uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-primary inline-block" />
            CODE DYNAMOS
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-white/60 hover:text-primary transition-colors flex items-center gap-1" title="Back to Home">
            <span className="material-symbols-outlined text-lg">home</span>
          </Link>
          <Link to="/challenges" className="text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Challenges</Link>
          <Link to="/events" className="text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Events</Link>
          {authUser?.role === 'admin' && (
            <Link to="/admin" className="text-xs font-mono uppercase tracking-widest text-primary hover:text-white transition-colors">Admin</Link>
          )}
          <button onClick={handleLogout} className="text-xs font-mono uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors">
            Logout
          </button>
          <AnimatedProfileBadge
            name={user.name}
            initials={user.name.split(' ').map((n) => n[0]).join('')}
            className="cursor-pointer"
          />
        </div>
      </header>

      <main className="pt-20 p-8 max-w-[1400px] mx-auto">
        {/* Welcome */}
        <section className="mb-10">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">OPERATOR HUB</div>
          {editingField === 'name' ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                placeholder="Full Name"
                className="font-headline font-black text-4xl bg-transparent border-b border-primary/50 focus:outline-none placeholder:text-on-surface-variant/30 text-white"
              />
              <button onClick={saveEdit} className="text-primary p-2">
                <span className="material-symbols-outlined text-xl">check</span>
              </button>
              <button onClick={cancelEdit} className="text-error p-2">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          ) : (
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-2">
              Welcome back, <span className="text-primary">{user.name}</span>
              <button onClick={() => startEdit('name', user.name)} className="p-1 rounded-full text-primary hover:text-white transition-colors" title="Edit Full Name">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            </h1>
          )}
          <p className="text-on-surface-variant font-body mt-1 text-sm">
            2026 Season · Rank #{user.rank} · {user.xp.toLocaleString()} XP
          </p>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total XP', value: user.xp.toLocaleString(), icon: 'bolt', accent: '#d3ef57' },
            { label: 'Global Rank', value: `#${user.rank}`, icon: 'emoji_events', accent: '#dbb8ff' },
            { label: 'Department', value: user.department || 'N/A', icon: 'school', accent: '#74facb' },
            { label: 'Track', value: user.track, icon: 'route', accent: '#ffb4ab' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-container-low p-5 border-l-4 flex flex-col gap-3 relative" style={{ borderLeftColor: s.accent }}>
              <span className="material-symbols-outlined text-xl" style={{ color: s.accent }}>{s.icon}</span>
              {s.label === 'Track' && editingField === 'track' ? (
                <input
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value.toUpperCase())}
                  placeholder="FULLSTACK"
                  className="text-2xl font-black bg-transparent border-b border-outline-variant/40 focus:outline-none uppercase placeholder:text-on-surface-variant/50"
                  style={{ color: s.accent }}
                />
              ) : s.label === 'Department' && editingField === 'department' ? (
                <input
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value.toUpperCase())}
                  placeholder="CSE"
                  className="text-2xl font-black bg-transparent border-b border-outline-variant/40 focus:outline-none uppercase placeholder:text-on-surface-variant/50"
                  style={{ color: s.accent }}
                />
              ) : (
                <div className="text-3xl font-black truncate" style={{ color: s.accent }}>{s.value}</div>
              )}
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">{s.label}</div>
              {s.label === 'Track' && (
                editingField === 'track' ? (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button onClick={saveEdit} className="text-primary">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                    <button onClick={cancelEdit} className="text-error">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit('track', user.track)} className="absolute top-2 right-2 text-primary z-10">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )
              )}
              {s.label === 'Department' && (
                editingField === 'department' ? (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button onClick={saveEdit} className="text-primary">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                    <button onClick={cancelEdit} className="text-error">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit('department', user.department)} className="absolute top-2 right-2 text-primary z-10">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )
              )}
            </div>
          ))}
        </section>

        {/* Missing rankProgress replacement — using student track info */}
        <section className="bg-surface-container rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-1">Student Profile Validation</div>
              {editingField === 'usn' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value.toUpperCase())}
                    placeholder="1CR22CS001"
                    className="font-headline font-black text-xl bg-transparent border-b border-primary/50 focus:outline-none uppercase placeholder:text-on-surface-variant/30 text-white"
                  />
                  <button onClick={saveEdit} className="text-primary p-1">
                    <span className="material-symbols-outlined text-base">check</span>
                  </button>
                  <button onClick={cancelEdit} className="text-error p-1">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ) : (
                <div className="font-headline font-black flex items-center">
                  {user.usn || 'UNVERIFIED IDENTIFIER'}
                  <button onClick={() => startEdit('usn', user.usn)} className="ml-2 p-1 rounded-full text-primary hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {editingField === 'year' ? (
                <div className="font-mono text-sm text-on-surface-variant flex items-center gap-2">
                  <span>Year:</span>
                  <input
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    placeholder="1st"
                    className="w-20 bg-transparent border-b border-outline-variant/40 focus:outline-none placeholder:text-on-surface-variant/50"
                  />
                  <button onClick={saveEdit} className="text-primary">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                  <button onClick={cancelEdit} className="text-error">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <div className="font-mono text-sm text-on-surface-variant flex items-center">
                  Year: {user.year || 'N/A'}
                  <button onClick={() => startEdit('year', user.year)} className="ml-2 p-1 rounded-full text-primary">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              )}
              {editingField === 'semester' ? (
                <div className="font-mono text-sm text-on-surface-variant flex items-center gap-2">
                  <span>Sem:</span>
                  <input
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    placeholder="5"
                    className="w-16 bg-transparent border-b border-outline-variant/40 focus:outline-none placeholder:text-on-surface-variant/50"
                  />
                  <button onClick={saveEdit} className="text-primary">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                  <button onClick={cancelEdit} className="text-error">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <div className="font-mono text-sm text-on-surface-variant flex items-center">
                  Sem: {user.semester || 'N/A'}
                  <button onClick={() => startEdit('semester', user.semester)} className="ml-2 p-1 rounded-full text-primary">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant mt-4 pt-3 border-t border-outline-variant/10">
             <div className="flex flex-wrap items-center gap-3">
               <span>EMAIL: <span className="text-white font-bold">{user.email}</span></span>
               <span className="hidden md:inline w-px h-3 bg-white/15" />
               <span>BEST RANK ACHIEVED: <span className="text-[#dbb8ff] font-bold">#{user.rank || 1} (2026)</span></span>
             </div>
             {user.githubUrl && <a href={user.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold uppercase tracking-wider">GitHub Profile</a>}
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
                  <Link key={c.id} to={`/challenges/${c.id}`} className="px-6 py-5 border-b border-outline-variant/10 last:border-none hover:bg-surface-bright/20 transition-colors group block">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-headline font-bold group-hover:text-primary transition-colors">{c.title}</h3>
                        <span className="text-[9px] font-mono uppercase text-on-surface-variant">{c.difficulty}</span>
                      </div>
                      <span className="font-mono text-xs text-primary font-bold">+{c.xp} XP</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-2">
                      <span>Status</span>
                      <span className={c.verified ? "text-primary" : "text-tertiary-fixed"}>
                        {c.verified ? "VERIFIED" : "SUBMITTED"}
                      </span>
                    </div>
                  </Link>
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
                  <Link key={ev.id} to={`/events/${ev.id}`} className="px-6 py-5 border-b border-outline-variant/10 last:border-none hover:bg-surface-bright/20 transition-colors group block">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-surface-container-high flex flex-col items-center justify-center border transition-colors group-hover:border-primary/50" style={{ borderColor: `${ev.accent}30` }}>
                        <span className="font-pixel text-[8px] uppercase" style={{ color: ev.accent }}>{ev.date.split(' ')[0]}</span>
                        <span className="font-pixel text-lg font-bold" style={{ color: ev.accent }}>{ev.date.split(' ')[1]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: ev.accent }}>{ev.type}</div>
                        <h3 className="font-headline font-bold text-sm group-hover:text-primary transition-colors">{ev.title}</h3>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 border" style={{ color: ev.accent, borderColor: `${ev.accent}40` }}>
                        {ev.status}
                      </span>
                    </div>
                  </Link>
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

        {/* Settings Section */}
        <section className="mt-12">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8">Settings</h2>
          <LeetCodeSettings />
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
