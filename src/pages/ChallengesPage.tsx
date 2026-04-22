import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import AnimatedDropdown from '../components/ui/AnimatedDropdown'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const DIFFS = ['All', 'Legendary', 'Hard', 'Medium', 'Easy'] as const
type Diff = typeof DIFFS[number]
const PHASE_FILTERS = ['All', 'Active', 'Upcoming', 'Finished'] as const
type PhaseFilter = typeof PHASE_FILTERS[number]

interface Challenge {
  id: string; title: string; difficulty: string; xp: number
  pool: number; completions: number; participants: number
  tags: string[]; description: string; status: string; enrolledByMe?: boolean
  endsAt?: string | null
}

const diffStyle: Record<string, string> = {
  Legendary: 'text-primary border-primary',
  Hard: 'text-error border-error',
  Medium: 'text-secondary border-secondary',
  Easy: 'text-tertiary-fixed border-tertiary-fixed',
}

const diffBorder: Record<string, string> = {
  Legendary: 'border-t-2 border-t-primary',
  Hard: 'border-t-2 border-t-error',
  Medium: 'border-t-2 border-t-secondary',
  Easy: 'border-t-2 border-t-tertiary-fixed',
}

const diffBg: Record<string, string> = {
  Legendary: 'bg-primary',
  Hard: 'bg-error',
  Medium: 'bg-secondary',
  Easy: 'bg-tertiary-fixed',
}

const iconMap: Record<string, string> = {
  Legendary: 'military_tech',
  Hard: 'terminal',
  Medium: 'memory',
  Easy: 'code',
}

const fetchChallenges = () => api.get<Challenge[]>('/challenges').then((r) => r.data)

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const isFinishedChallenge = (c: Challenge) => {
  const status = c.status.toLowerCase()
  if (status === 'closed' || status === 'finished') return true
  const end = parseDate(c.endsAt)
  return !!(end && end.getTime() < Date.now())
}

const isUpcomingChallenge = (c: Challenge) => {
  if (isFinishedChallenge(c)) return false
  const status = c.status.toLowerCase()
  if (status === 'upcoming') return true
  const end = parseDate(c.endsAt)
  return !!(end && end.getTime() > Date.now() && c.participants === 0)
}

const ChallengesPage = () => {
  const [filter, setFilter] = useState<Diff>('All')
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('All')
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: challenges = [], isLoading } = useQuery({ queryKey: ['challenges'], queryFn: fetchChallenges })

  const enrollMutation = useMutation({
    mutationFn: (challengeId: string) => api.post(`/challenges/${challengeId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
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
    const diffMatch = filter === 'All' || c.difficulty === filter
    if (!diffMatch) return false

    if (phaseFilter === 'All') return true
    if (phaseFilter === 'Finished') return isFinishedChallenge(c)
    if (phaseFilter === 'Upcoming') return isUpcomingChallenge(c)
    return !isFinishedChallenge(c) && !isUpcomingChallenge(c)
  })

  const totalPool = challenges.reduce((sum, c) => sum + c.pool, 0)
  const totalParticipants = challenges.reduce((sum, c) => sum + c.participants, 0)

  return (
    <PublicLayout>
      {/* ... header and filters ... */}
      <section className="py-10 px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary whitespace-nowrap font-['Space_Mono']">ACTIVE OPERATIONS</span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
          </div>
          <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter mb-6 font-['Orbitron']">Current Sprints</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mb-8" />
          <div className="flex flex-wrap gap-8 md:gap-16">
            <div>
              <div className="text-4xl md:text-5xl font-black text-primary mb-1">{challenges.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Active Sprints</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-white mb-1">{totalParticipants.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Participants</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-secondary mb-1">₹{(totalPool / 1000).toFixed(0)}K</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Prize Pool</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-[72px] z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 px-8 py-4">
        <div className="max-w-[1440px] mx-auto space-y-3">
          <AnimatedDropdown
            label="Status"
            value={phaseFilter}
            options={PHASE_FILTERS}
            onChange={setPhaseFilter}
          />
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {DIFFS.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${
                  filter === d
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
      <section className="py-16 px-8">
        <div className="max-w-[1440px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="font-pixel text-primary text-sm animate-pulse">LOADING SPRINTS...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((ch) => {
                const isEnrolled = !!ch.enrolledByMe
                const isFinished = isFinishedChallenge(ch)
                const isPending = enrollMutation.isPending && enrollMutation.variables === ch.id
                const completionPct = ch.participants > 0 ? Math.min(Math.round((ch.completions / ch.participants) * 100), 100) : 0

                return (
                  <div key={ch.id} className={`lab-panel p-8 flex flex-col group relative transition-all duration-500 ${diffBorder[ch.difficulty]} ${isFinished ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100' : ''}`}>
                    <div className="flex justify-between items-start mb-8">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary transition-colors">
                        {iconMap[ch.difficulty] ?? 'terminal'}
                      </span>
                      <span className={`text-[8px] font-mono font-black px-2 py-0.5 uppercase tracking-tighter border ${diffStyle[ch.difficulty]}`}>
                        {ch.difficulty}
                      </span>
                    </div>
                    <Link to={`/challenges/${ch.id}`} className="after:absolute after:inset-0">
                      <h3 className="text-xl font-black uppercase mb-4 italic leading-tight group-hover:text-primary transition-colors">
                        {ch.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-on-surface-variant mb-4 font-body leading-relaxed flex-1">{ch.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-6">
                      {ch.tags.map((tag) => (
                        <span key={tag} className="text-[8px] font-mono px-1.5 py-0.5 border border-white/10 text-on-surface-variant">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                        <span>POOL: <span className="text-white">₹{ch.pool.toLocaleString()}</span></span>
                        <span>{ch.participants} ops</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-1">
                        <span>COMPLETION</span>
                        <span className="text-white">{completionPct}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 overflow-hidden rounded-full">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${diffBg[ch.difficulty]}`} 
                          style={{ width: `${completionPct}%` }} 
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-4 relative z-10">
                        <button
                          onClick={() => handleEnroll(ch.id)}
                          disabled={isPending || isEnrolled || isFinished}
                          className={`flex-1 py-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all disabled:opacity-50 ${
                            isEnrolled || isFinished
                              ? 'border-white/10 text-on-surface-variant cursor-not-allowed'
                              : `${diffStyle[ch.difficulty]} hover:bg-primary hover:text-on-primary hover:border-primary`
                          }`}
                        >
                          {isPending
                            ? 'Processing...'
                            : isEnrolled
                            ? 'Active'
                            : isFinished
                            ? 'Sprint Finished'
                            : user
                            ? 'Initialize'
                            : 'Login to Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}

export default ChallengesPage
