import { useState } from 'react'
import PublicLayout from '../components/layouts/PublicLayout'

const SEASONS = ['Season 3 — 2026', 'Season 2 — 2025', 'Season 1 — 2024'] as const
type Season = typeof SEASONS[number]

const podium = [
  { rank: 2, name: 'Priya Sharma', xp: 14820, challenges: 38, badge: 'Architect', gradient: 'from-secondary/20 to-secondary/5', accent: '#dbb8ff' },
  { rank: 1, name: 'Karan Nair', xp: 18540, challenges: 47, badge: 'Legendary', gradient: 'from-primary/25 to-primary/5', accent: '#d3ef57' },
  { rank: 3, name: 'Arjun Mehta', xp: 12350, challenges: 31, badge: 'Elite', gradient: 'from-tertiary-fixed/20 to-tertiary-fixed/5', accent: '#74facb' },
]

const entries = [
  { rank: 1, name: 'Karan Nair', xp: 18540, challenges: 47, streak: 12, badge: 'Legendary' },
  { rank: 2, name: 'Priya Sharma', xp: 14820, challenges: 38, streak: 8, badge: 'Architect' },
  { rank: 3, name: 'Arjun Mehta', xp: 12350, challenges: 31, streak: 5, badge: 'Elite' },
  { rank: 4, name: 'Sneha Patel', xp: 10900, challenges: 28, streak: 3, badge: 'Expert' },
  { rank: 5, name: 'Dev Rao', xp: 9450, challenges: 24, streak: 7, badge: 'Expert' },
  { rank: 6, name: 'Anika Singh', xp: 8210, challenges: 22, streak: 2, badge: 'Senior' },
  { rank: 7, name: 'Rahul Verma', xp: 7830, challenges: 19, streak: 4, badge: 'Senior' },
  { rank: 8, name: 'Meera Joshi', xp: 6600, challenges: 17, streak: 1, badge: 'Member' },
  { rank: 9, name: 'Vikram Das', xp: 5940, challenges: 15, streak: 0, badge: 'Member' },
  { rank: 10, name: 'Tanvi Kumar', xp: 5100, challenges: 13, streak: 2, badge: 'Member' },
]

const badgeStyle: Record<string, string> = {
  Legendary: 'text-primary border-primary',
  Architect: 'text-secondary border-secondary',
  Elite: 'text-tertiary-fixed border-tertiary-fixed',
  Expert: 'text-on-surface-variant border-outline-variant',
  Senior: 'text-on-surface-variant border-outline-variant',
  Member: 'text-on-surface-variant/60 border-outline-variant/40',
}

const podiumHeight = [80, 100, 60] // rank 2, 1, 3

const LeaderboardPage = () => {
  const [season, setSeason] = useState<Season>(SEASONS[0])

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-20 px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="text-[10px] font-mono font-black tracking-[0.5em] text-primary uppercase mb-4">PERFORMANCE MATRIX</div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter mb-4">Leaderboard</h1>
            <div className="h-1 w-24 bg-primary" />
          </div>
          {/* Season Selector */}
          <div className="flex gap-2 flex-wrap">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`px-4 py-2 text-[10px] font-mono font-black uppercase tracking-widest transition-all ${
                  season === s ? 'bg-primary text-on-primary' : 'border border-white/10 text-on-surface-variant hover:border-primary/50 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Podium */}
      <section className="py-20 px-8 bg-[#0A0A0A]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-end justify-center gap-4 md:gap-8 mb-16">
            {podium.map((p, i) => (
              <div key={p.rank} className="flex flex-col items-center">
                {/* Medal */}
                <div className={`w-16 h-16 md:w-20 md:h-20 mb-4 bg-gradient-to-br ${p.gradient} border-2 flex items-center justify-center`} style={{ borderColor: p.accent }}>
                  <span className="font-pixel text-xl md:text-2xl" style={{ color: p.accent }}>
                    {p.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: p.accent }}>{p.badge}</div>
                <div className="font-headline font-black text-sm mb-1">{p.name}</div>
                <div className="text-[10px] font-mono text-on-surface-variant">{p.xp.toLocaleString()} XP</div>
                {/* Podium Block */}
                <div
                  className="mt-4 w-24 md:w-32 flex items-center justify-center border-t-2"
                  style={{ height: `${podiumHeight[i]}px`, background: `${p.accent}10`, borderTopColor: p.accent }}
                >
                  <span className="font-pixel text-3xl md:text-4xl" style={{ color: p.accent }}>
                    #{p.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Rankings Table */}
          <div className="bg-surface-container rounded-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="font-mono font-black uppercase tracking-tighter text-lg">Full Rankings — {season}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high">
                  <tr>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Rank</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Operator</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">XP</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Challenges</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Streak</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {entries.map((e) => (
                    <tr key={e.rank} className="hover:bg-surface-bright/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`font-pixel text-xl ${e.rank <= 3 ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                          #{e.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="font-pixel text-xs text-primary">{e.name.split(' ').map((n) => n[0]).join('')}</span>
                          </div>
                          <span className="font-headline font-bold text-white">{e.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-primary font-bold">{e.xp.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-sm text-on-surface-variant">{e.challenges}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-mono text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm text-primary">local_fire_department</span>
                          {e.streak}d
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-mono font-black px-2 py-0.5 uppercase tracking-tighter border ${badgeStyle[e.badge]}`}>
                          {e.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default LeaderboardPage
