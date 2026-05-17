import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface ChallengeDetail {
  id: string; title: string; difficulty: string; xp: number
  pool: number; completions: number; participants: number
  tags: string[]; description: string; enrolledByMe: boolean
  requirements?: string[]
  timeline?: string[]
  prizes?: string[]
  status: string
  externalUrl?: string
  winners?: Array<{ id: string; name: string; position: number; awardXp: number }>
}

const ensureAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}


const diffStyle: Record<string, { text: string; border: string; bg: string; icon: string }> = {
  Legendary: { text: 'text-primary', border: 'border-primary', bg: 'bg-primary', icon: 'military_tech' },
  Hard:      { text: 'text-error',   border: 'border-error',   bg: 'bg-error',   icon: 'terminal' },
  Medium:    { text: 'text-secondary', border: 'border-secondary', bg: 'bg-secondary', icon: 'memory' },
  Easy:      { text: 'text-tertiary-fixed', border: 'border-tertiary-fixed', bg: 'bg-tertiary-fixed', icon: 'code' },
}

const defaultRequirements = ['Valid member account', 'Solo participation only', 'Submission via GitHub repo']
const defaultTimeline = [
  'Registration|Enroll before sprint starts',
  'Sprint|Solve within the time window',
  'Submission|Push your final solution',
  'Review|Panel review + auto-scoring',
]
const defaultPrizes = ['1st|₹10,000 + XP Boost', '2nd|₹5,000', '3rd|₹2,500']

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: challenge, isLoading, isError } = useQuery<ChallengeDetail>({
    queryKey: ['challenge', id],
    queryFn: () => api.get<ChallengeDetail>(`/challenges/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/challenges/${id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', id] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: () => api.delete(`/challenges/${id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', id] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })

  const handleAction = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/challenges/${id}` } } })
      return
    }
    if (challenge?.enrolledByMe) {
      unenrollMutation.mutate()
    } else {
      enrollMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-96">
          <span className="font-pixel text-primary text-sm animate-pulse">LOADING SPRINT...</span>
        </div>
      </PublicLayout>
    )
  }

  if (isError || !challenge) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <span className="font-mono text-error text-sm">Sprint not found.</span>
          <Link to="/challenges" className="text-primary font-mono text-xs uppercase tracking-widest hover:underline">← Back to Sprints</Link>
        </div>
      </PublicLayout>
    )
  }

  const isPending = enrollMutation.isPending || unenrollMutation.isPending
  const completionPct = challenge.participants > 0 ? Math.round((challenge.completions / challenge.participants) * 100) : 0
  const style = diffStyle[challenge.difficulty] ?? diffStyle['Medium']
  const timeline = (challenge.timeline && challenge.timeline.length > 0 ? challenge.timeline : defaultTimeline)
    .map((item) => {
      const [phase, ...rest] = item.split('|')
      return { phase: (phase ?? '').trim(), desc: rest.join('|').trim() }
    })
    .filter((item) => item.phase && item.desc)

  const requirements = challenge.requirements && challenge.requirements.length > 0
    ? challenge.requirements
    : defaultRequirements

  const prizes = (challenge.prizes && challenge.prizes.length > 0 ? challenge.prizes : defaultPrizes)
    .map((item) => {
      const [place, ...rest] = item.split('|')
      return { place: (place ?? '').trim(), reward: rest.join('|').trim() }
    })
    .filter((item) => item.place && item.reward)

  return (
    <PublicLayout>
      {/* Breadcrumb */}
      <div className="px-8 py-4 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <Link to="/challenges" className="text-[10px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
            ← Active Sprints
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className={`py-16 px-8 bg-[#0A0A0A] border-b border-white/5 border-t-4 ${style.border}`}>
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-[10px] font-mono font-black px-3 py-1 border uppercase ${style.text} ${style.border}`}>
              {challenge.difficulty}
            </span>
            <span className="text-[10px] font-mono px-3 py-1 border border-white/10 text-on-surface-variant uppercase">
              {challenge.participants} participants
            </span>
            <span className={`text-[10px] font-mono px-3 py-1 border uppercase ${challenge.status === 'Open' ? 'border-tertiary-fixed/40 text-tertiary-fixed' : 'border-error/40 text-error'}`}>
              {challenge.status}
            </span>
            {challenge.enrolledByMe && (
              <span className="text-[10px] font-mono px-3 py-1 border border-primary/40 text-primary uppercase">
                Enrolled
              </span>
            )}
          </div>

          <div className="flex items-start gap-4 mb-4">
            <span className={`material-symbols-outlined text-4xl ${style.text}`}>{style.icon}</span>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter max-w-3xl">{challenge.title}</h1>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {challenge.tags.map((tag) => (
              <span key={tag} className="text-[9px] font-mono px-2 py-1 border border-white/10 text-on-surface-variant uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Mission Brief</h2>
              <p className="text-base font-body text-on-surface leading-relaxed">{challenge.description}</p>
            </div>

            {challenge.winners && challenge.winners.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-6xl text-primary">workspace_premium</span>
                </div>
                <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-6">Sprint Finalists / Winners</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenge.winners.map((w) => (
                    <div key={w.id} className="flex items-center gap-4 bg-black/40 p-4 border border-white/5 group hover:border-primary/40 transition-all">
                      <div className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center font-black shadow-lg shadow-primary/20">
                        {w.position}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-white group-hover:text-primary transition-colors">{w.name}</div>
                        <div className="text-[9px] font-mono text-on-surface-variant uppercase">Claimed +{w.awardXp} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Timeline</h2>
              <div className="space-y-0 border-l-2 border-white/10 pl-6">
                {timeline.map((t, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div className={`absolute -left-[27px] top-1 w-3 h-3 border-2 bg-[#0A0A0A] ${style.border}`} />
                    <div className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${style.text}`}>{t.phase}</div>
                    <div className="text-sm font-body text-on-surface-variant">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">check_circle</span>
                    <span className="font-body text-sm text-on-surface-variant">{r}</span>
                  </li>
                ))}
              </ul>
            </div>


          </div>

          {/* Right — enroll card */}
          <div className="lg:sticky lg:top-28 self-start space-y-4">
            <div className={`lab-panel p-8 border-t-4 ${style.border}`}>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>XP Reward</span>
                  <span className={`font-black text-sm ${style.text}`}>+{challenge.xp.toLocaleString()} XP</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>Prize Pool</span>
                  <span className="text-white font-black text-sm">₹{challenge.pool.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>Difficulty</span>
                  <span className={`uppercase font-black ${style.text}`}>{challenge.difficulty}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
                  <span>Participants</span>
                  <span className="text-white">{challenge.participants}</span>
                </div>
              </div>

              <button
                onClick={handleAction}
                disabled={isPending || challenge.status === 'Closed'}
                className={`w-full py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all disabled:opacity-40 ${
                  challenge.status === 'Closed'
                    ? 'border-white/10 text-on-surface-variant cursor-not-allowed'
                    : challenge.enrolledByMe
                    ? 'border-error text-error hover:bg-error hover:text-white'
                    : `${style.text} ${style.border} hover:${style.bg} hover:text-on-primary`
                }`}
              >
                {isPending ? 'Processing...'
                  : challenge.status === 'Closed' ? 'Sprint Finished'
                  : challenge.enrolledByMe ? 'Cancel Enrollment'
                  : !user ? 'Login to Join'
                  : 'Initialize Sprint'}
              </button>

              {challenge.enrolledByMe && challenge.externalUrl && (
                <a
                  href={ensureAbsoluteUrl(challenge.externalUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full mt-4 py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all text-center block ${style.text} ${style.border} hover:${style.bg} hover:text-on-primary`}
                >
                  GO TO EXTERNAL CONTEST
                </a>
              )}

              {challenge.enrolledByMe && (
                <p className="text-[10px] font-mono text-on-surface-variant text-center mt-3">
                  Sprint active in your dashboard.
                </p>
              )}
            </div>

            {/* "All the best" Panel */}
            <div className={`lab-panel p-6 bg-[#0E0E0E] border border-white/5 relative overflow-hidden group hover:${style.border}/30 transition-all duration-500 rounded-sm shadow-xl shadow-black/50`}>
              {/* Decorative Tech Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_60%)] pointer-events-none" />
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-current/10 to-transparent blur-xl group-hover:from-current/20 transition-all duration-700 ${style.text}`} />
              
              <div className="relative z-10 flex flex-col items-center text-center py-4 space-y-4">
                <style>{`
                  @keyframes challenge-tech-blink {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px currentColor); }
                    50% { opacity: 0.35; filter: drop-shadow(0 0 2px transparent); }
                  }
                  .animate-challenge-tech-blink {
                    animation: challenge-tech-blink 1.5s infinite;
                  }
                `}</style>
                <span className={`material-symbols-outlined text-4xl animate-pulse ${style.text}`}>
                  local_fire_department
                </span>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-black italic uppercase tracking-wider font-headline animate-challenge-tech-blink ${style.text}`}>
                    ALL THE BEST!
                  </h3>
                </div>
                <div className="h-[1px] w-12 bg-white/10 group-hover:w-20 transition-all duration-500" />
                <p className="text-[11px] font-mono text-on-surface-variant max-w-[200px] leading-relaxed uppercase tracking-wide">
                  Push your limits. Conquer the stack. Build the future.
                </p>
              </div>
              
              {/* Corner tech lines */}
              <div className={`absolute top-0 left-0 w-2 h-[2px] ${style.bg}/40`} />
              <div className={`absolute top-0 left-0 w-[2px] h-2 ${style.bg}/40`} />
              <div className={`absolute bottom-0 right-0 w-2 h-[2px] ${style.bg}/40`} />
              <div className={`absolute bottom-0 right-0 w-[2px] h-2 ${style.bg}/40`} />
            </div>

            {/* Prizes */}
            <div className="lab-panel p-6">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Prize Distribution</h3>
              <div className="space-y-3">
                {prizes.map((p) => (
                  <div key={p.place} className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono font-black w-8 ${style.text}`}>{p.place}</span>
                    <span className="text-sm font-body text-on-surface">{p.reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default ChallengeDetailPage
