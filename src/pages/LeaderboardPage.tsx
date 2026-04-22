import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaderEntry {
  id: string
  name: string
  xp: number
  rank: number
  track: string
  department?: string
  year?: string
  position: number
  badge: string
  leetcodeSolved?: number
  leetcodeProfile?: string
}

const BADGE_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  Legendary: { text: 'text-primary', bg: 'bg-primary/10',    border: 'border-primary/40' },
  Architect: { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/40' },
  Elite:     { text: 'text-[#74facb]', bg: 'bg-[#74facb]/10', border: 'border-[#74facb]/40' },
  Expert:    { text: 'text-blue-400',  bg: 'bg-blue-400/10',  border: 'border-blue-400/40' },
  Senior:    { text: 'text-white/60',  bg: 'bg-white/5',      border: 'border-white/20' },
  Member:    { text: 'text-white/40',  bg: 'bg-white/5',      border: 'border-white/10' },
}

const LeaderboardPage = () => {
  const [view, setView] = useState<'club' | 'leetcode'>('club')
  const [search, setSearch] = useState('')

  const { data: entries = [], isLoading } = useQuery<LeaderEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard').then(r => r.data),
    refetchInterval: 30000,
  })

  const filteredAndSorted = useMemo(() => {
    let list = [...entries]
    if (view === 'leetcode') {
      list = list.filter(e => e.leetcodeSolved && e.leetcodeSolved > 0)
                 .sort((a, b) => (b.leetcodeSolved || 0) - (a.leetcodeSolved || 0))
    } else {
      list = list.sort((a, b) => b.xp - a.xp)
    }

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(e => e.name.toLowerCase().includes(s) || (e.department?.toLowerCase().includes(s)))
    }

    return list.map((e, i) => ({ ...e, dynamicPos: i + 1 }))
  }, [entries, view, search])

  const top3 = filteredAndSorted.slice(0, 3)

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-12 px-8 bg-[#0A0A0A] border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,_rgba(211,239,87,0.05)_0%,_transparent_50%)]" />
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className={`text-[11px] font-black tracking-[0.5em] uppercase mb-4 font-['Space_Mono'] flex items-center gap-2 transition-colors ${view === 'club' ? 'text-primary' : 'text-orange-400'}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse transition-colors ${view === 'club' ? 'bg-primary' : 'bg-orange-500'}`} />
                PERFORMANCE_OF_DYNAMITES
              </div>
              <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 font-['Orbitron']">
                {view === 'club' ? 'Elite' : 'LeetCode'}
              </h1>
              <div className={`h-1.5 w-32 bg-gradient-to-r transition-all duration-500 ${view === 'club' ? 'from-primary' : 'from-orange-500'} via-secondary to-transparent`} />
            </div>

            {/* View Toggles */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
              <button
                onClick={() => setView('club')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'club' ? 'bg-primary text-black shadow-[0_0_20px_rgba(211,239,87,0.3)]' : 'text-white/40 hover:text-white'}`}
              >
                Club XP
              </button>
              <button
                onClick={() => setView('leetcode')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'leetcode' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'text-white/40 hover:text-white'}`}
              >
                LeetCode
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Global Search & Filters */}
      <section className="sticky top-[72px] z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 py-4 px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 transition-colors ${view === 'club' ? 'group-focus-within:text-primary' : 'group-focus-within:text-orange-500'}`}>search</span>
            <input
              type="text"
              placeholder="Search by name or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none transition-all font-mono ${view === 'club' ? 'focus:border-primary/50' : 'focus:border-orange-500/50'}`}
            />
          </div>
          <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <span>TOTAL: {filteredAndSorted.length}</span>
            <span className="w-px h-4 bg-white/10" />
            <span>SORT: {view === 'club' ? 'XP DESC' : 'SOLVED DESC'}</span>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
          <span className="font-pixel text-primary text-xs tracking-widest animate-pulse">RECONSTRUCTING_RANKINGS...</span>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <section className="py-24 px-8">
          <div className="max-w-[1440px] mx-auto lab-panel p-20 flex flex-col items-center text-center gap-6 border-dashed border-2 border-white/5">
            <span className="material-symbols-outlined text-6xl text-white/10">radar</span>
            <h3 className="text-2xl font-black uppercase tracking-widest text-white/40">No records found</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Our sensors didn't find any operators matching your search or criteria. Keep building to make your mark.
            </p>
          </div>
        </section>
      ) : (
        <div className="max-w-[1440px] mx-auto px-8 py-16 space-y-24">
          
          {/* Podium for top 3 (only when no search) */}
          {!search && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-10">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={view}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end justify-center gap-4 md:gap-12"
                >
                  {[top3[1], top3[0], top3[2]].filter(Boolean).map((p) => (
                    <div key={p.id} className="flex flex-col items-center">
                      <div className="relative mb-6">
                        <div 
                          className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 flex items-center justify-center relative z-10 transition-transform hover:scale-110"
                          style={{ borderColor: view === 'club' ? '#d3ef57' : '#f97316', background: '#0D0D0D' }}
                        >
                          <span className="text-3xl font-black uppercase" style={{ color: view === 'club' ? '#d3ef57' : '#f97316' }}>
                            {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0D0D0D] border-2 rounded-full flex items-center justify-center z-20" style={{ borderColor: view === 'club' ? '#d3ef57' : '#f97316' }}>
                          <span className="font-black text-white text-xs">#{p.dynamicPos}</span>
                        </div>
                      </div>
                      <h3 className="font-black text-lg text-white mb-1">{p.name}</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">{p.track}</p>
                      <div 
                        className="w-24 md:w-32 rounded-t-3xl transition-all duration-700"
                        style={{ 
                          height: p.dynamicPos === 1 ? '160px' : p.dynamicPos === 2 ? '120px' : '90px',
                          background: `linear-gradient(to top, ${view === 'club' ? '#d3ef5710' : '#f9731610'}, ${view === 'club' ? '#d3ef5740' : '#f9731640'})`,
                          borderTop: `2px solid ${view === 'club' ? '#d3ef57' : '#f97316'}`
                        }}
                      >
                        <div className="pt-4 text-center">
                          <div className="text-xl font-black text-white">
                            {view === 'club' ? p.xp.toLocaleString() : p.leetcodeSolved}
                          </div>
                          <div className="text-[9px] font-mono text-white/60 uppercase">{view === 'club' ? 'XP' : 'Solved'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Table for rest */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Standings</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      {['Rank', 'Operator', 'Track', 'Department', view === 'club' ? 'Club XP' : 'LeetCode Solved', 'Status'].map(h => (
                        <th key={h} className="px-8 py-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAndSorted.map((e) => {
                      const badge = BADGE_STYLE[e.badge] ?? BADGE_STYLE.Member
                      return (
                        <motion.tr 
                          layout
                          key={e.id} 
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <span className={`text-2xl font-black ${e.dynamicPos <= 3 ? (view === 'club' ? 'text-primary' : 'text-orange-500') : 'text-white/20'}`}>
                              #{e.dynamicPos}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${e.dynamicPos <= 3 ? (view === 'club' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-orange-500/40 bg-orange-500/10 text-orange-500') : 'border-white/10 text-white/40'}`}>
                                {e.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-white group-hover:text-primary transition-colors">{e.name}</div>
                                {e.leetcodeProfile && view === 'leetcode' && (
                                  <div className="text-[10px] font-mono text-white/40">@{e.leetcodeProfile}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{e.track}</span>
                          </td>
                          <td className="px-8 py-6 text-sm text-white/40">{e.department || '—'}</td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className={`text-xl font-black ${view === 'club' ? 'text-primary' : 'text-orange-500'}`}>
                                {view === 'club' ? e.xp.toLocaleString() : e.leetcodeSolved}
                              </span>
                              <span className="text-[9px] font-mono text-white/30 uppercase">{view === 'club' ? 'XP EARNED' : 'PROBLEMS'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            {view === 'club' ? (
                              <span className={`text-[9px] font-mono font-black px-3 py-1 uppercase border rounded-full ${badge.text} ${badge.border} ${badge.bg}`}>
                                {e.badge}
                              </span>
                            ) : (
                              <a 
                                href={`https://leetcode.com/${e.leetcodeProfile}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-[10px] font-mono text-orange-400 hover:underline"
                              >
                                PROFILE <span className="material-symbols-outlined text-sm">open_in_new</span>
                              </a>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {filteredAndSorted.length > 50 && (
              <div className="mt-8 text-center text-[10px] font-mono text-white/20 uppercase tracking-widest animate-pulse">
                Showing top 50 operators. Search to find specific records.
              </div>
            )}
          </section>
        </div>
      )}
    </PublicLayout>
  )
}

export default LeaderboardPage
