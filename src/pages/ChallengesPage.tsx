import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import AnimatedDropdown from '../components/ui/AnimatedDropdown'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard', 'Legendary'] as const
type Difficulty = typeof DIFFICULTIES[number]

const STATUS_FILTERS = ['All', 'Open', 'Closed'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

interface Challenge {
  id: string
  title: string
  difficulty: string
  xp: number
  pool: number
  completions: number
  tags: string[]
  description: string
  requirements?: string[]
  timeline?: string[]
  prizes?: string[]
  status: string
  endsAt: string | null
  externalUrl?: string | null
  participants: number
  enrolledByMe: boolean
  image?: string | null
}

const diffStyle: Record<string, { text: string; border: string; bg: string; icon: string }> = {
  Legendary: { text: 'text-primary', border: 'border-primary', bg: 'bg-primary', icon: 'military_tech' },
  Hard:      { text: 'text-error',   border: 'border-error',   bg: 'bg-error',   icon: 'terminal' },
  Medium:    { text: 'text-secondary', border: 'border-secondary', bg: 'bg-secondary', icon: 'memory' },
  Easy:      { text: 'text-tertiary-fixed', border: 'border-tertiary-fixed', bg: 'bg-tertiary-fixed', icon: 'code' },
}

const fetchChallenges = () => api.get<Challenge[]>('/challenges').then((r) => r.data)

const ChallengesPage = () => {
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('All')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [lightbox, setLightbox] = useState<{ img: string; label: string; tag: string; year: string } | null>(null)

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges
  })

  const enrollMutation = useMutation({
    mutationFn: (challengeId: string) => api.post(`/challenges/${challengeId}/enroll`),
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const handleEnroll = (challengeId: string) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/challenges' } } })
      return
    }
    enrollMutation.mutate(challengeId)
  }

  const filtered = challenges.filter((c) => {
    const diffMatch = difficultyFilter === 'All' || c.difficulty === difficultyFilter
    if (!diffMatch) return false

    if (statusFilter === 'All') return true
    return c.status === statusFilter
  })

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-8 md:py-10 px-4 md:px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[11px] font-black tracking-[0.5em] text-primary uppercase mb-3 font-['Space_Mono']">
            ACTIVE ALGORITHMIC SPRINTS
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter mb-4 font-['Orbitron']">
            Challenges
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mb-5" />
          <p className="text-on-surface-variant font-body max-w-xl text-sm md:text-base">
            Prove your engineering dominance. Participate in sandbox engineering tasks, speed coding tournaments, and structural design sprints.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[100px] z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-[1440px] mx-auto space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <AnimatedDropdown
              label="Status"
              value={statusFilter}
              options={STATUS_FILTERS}
              onChange={setStatusFilter}
            />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${
                  difficultyFilter === d
                    ? 'bg-primary text-on-primary'
                    : 'border border-white/10 text-on-surface-variant hover:border-primary/50 hover:text-white'
                }`}
              >
                {d}
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

      {/* Challenges Grid */}
      <section className="py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="font-pixel text-primary text-sm animate-pulse">LOADING SPRINTS...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((c) => (
                <ChallengeCard
                  key={c.id}
                  c={c}
                  user={user}
                  handleEnroll={handleEnroll}
                  enrollMutation={enrollMutation}
                  onFullscreen={() => setLightbox({ img: c.image!, label: c.title, tag: 'Challenge', year: c.difficulty })}
                />
              ))}
              {!isLoading && filtered.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <span className="material-symbols-outlined text-4xl text-white/20">terminal_off</span>
                  <p className="font-mono text-on-surface-variant text-sm">No active sprints matching filter query.</p>
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

function ChallengeCard({
  c,
  user,
  handleEnroll,
  enrollMutation,
  onFullscreen
}: {
  c: Challenge
  user: any
  handleEnroll: (id: string) => void
  enrollMutation: any
  onFullscreen: () => void
}) {
  const style = diffStyle[c.difficulty] ?? diffStyle['Medium']
  const isClosed = c.status === 'Closed'
  const isPending = enrollMutation.isPending && enrollMutation.variables === c.id

  return (
    <div className={`lab-panel group flex flex-col relative min-h-[450px] border-t-4 ${style.border} transition-all duration-500 ${isClosed ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100' : ''}`}>
      {/* Header Area */}
      <div className="h-48 relative overflow-hidden transition-all duration-500 bg-black/40 border-b border-white/5">
        {c.image ? (
          <div className="w-full h-full relative group/img">
            <img 
              src={c.image} 
              alt={c.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            {/* Full Image Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onFullscreen(); }}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all border bg-black/60 text-white/40 border-white/10 hover:border-primary hover:text-primary hover:scale-110"
              title="View Challenge Photo"
            >
              <span className="material-symbols-outlined text-sm">open_in_full</span>
            </button>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] p-6 font-mono overflow-hidden">
            <span className={`material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform duration-500 ${style.text}`}>
              {style.icon}
            </span>
            <div className="text-[7px] text-white/20 uppercase tracking-[0.4em] space-y-1 w-full text-center opacity-50">
              <div>CHALLENGE_NODE_{c.id.slice(0, 4).toUpperCase()}</div>
              <div className={style.text}>DIFF: {c.difficulty.toUpperCase()}</div>
            </div>
          </div>
        )}

        <div className={`absolute top-0 right-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest ${style.bg} ${style.bg === 'bg-white' ? 'text-black' : 'text-on-primary'}`}>
          {c.difficulty}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 flex flex-col flex-1 border-t border-white/5">
        <div className={`text-[10px] font-mono font-bold tracking-[0.3em] mb-3 ${style.text}`}>
          {c.status.toUpperCase()} · XP: +{c.xp.toLocaleString()} · POOL: ₹{c.pool.toLocaleString()}
        </div>
        <Link to={`/challenges/${c.id}`} className="after:absolute after:inset-0">
          <h3 className="text-xl font-black uppercase mb-3 leading-tight group-hover:text-primary transition-colors">
            {c.title}
          </h3>
        </Link>
        <p className="text-sm text-on-surface-variant mb-6 line-clamp-3 font-body leading-relaxed">{c.description}</p>

        {/* Challenge Specs */}
        <div className="grid grid-cols-2 gap-4 mb-6 border-y border-white/5 py-4">
          <div>
            <div className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">XP Reward</div>
            <div className={`text-sm font-black font-mono ${style.text}`}>+{c.xp.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">Prize Pool</div>
            <div className="text-sm font-black font-mono text-white">₹{c.pool.toLocaleString()}</div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleEnroll(c.id)}
          disabled={isClosed || isPending || c.enrolledByMe}
          className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-colors ${
            isClosed || c.enrolledByMe
              ? 'text-on-surface-variant cursor-not-allowed'
              : 'text-primary hover:text-white cursor-pointer relative z-10'
          }`}
        >
          {isPending
            ? 'PROCESSING...'
            : isClosed
            ? 'SPRINT CLOSED'
            : c.enrolledByMe
            ? 'ENROLLED'
            : user
            ? 'INITIALIZE SPRINT'
            : 'LOGIN TO INITIALIZE'}
          {!isClosed && !c.enrolledByMe && <span className="w-6 h-[1px] bg-current inline-block" />}
        </button>
      </div>
    </div>
  )
}

export default ChallengesPage
