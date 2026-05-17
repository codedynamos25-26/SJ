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
            Challenge Dec
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
    </PublicLayout>
  )
}

function ChallengeCard({
  c,
  user,
  handleEnroll,
  enrollMutation
}: {
  c: Challenge
  user: any
  handleEnroll: (id: string) => void
  enrollMutation: any
}) {
  const style = diffStyle[c.difficulty] ?? diffStyle['Medium']
  const isClosed = c.status === 'Closed'
  const isPending = enrollMutation.isPending && enrollMutation.variables === c.id
  return (
    <div className={`lab-panel group flex flex-col relative min-h-[420px] border-t-4 ${style.border} transition-all duration-500 ${isClosed ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100' : ''}`}>
      {/* Header Area */}
      <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`material-symbols-outlined text-xl ${style.text}`}>{style.icon}</span>
          <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${style.text}`}>
            {c.difficulty}
          </span>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase ${c.status === 'Open' ? 'border-tertiary-fixed/40 text-tertiary-fixed' : 'border-error/40 text-error'}`}>
          {c.status}
        </span>
      </div>

      {/* Content Area */}
      <div className="p-8 flex flex-col flex-1">
        <div className="flex-1">
          <Link to={`/challenges/${c.id}`} className="after:absolute after:inset-0">
            <h3 className="text-xl font-black uppercase mb-3 leading-tight group-hover:text-primary transition-colors">
              {c.title}
            </h3>
          </Link>
          <p className="text-sm text-on-surface-variant mb-6 line-clamp-3 font-body leading-relaxed">
            {c.description}
          </p>
        </div>

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
