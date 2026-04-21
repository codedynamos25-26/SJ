import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface ChallengeDetail {
  id: string; title: string; difficulty: string; xp: number
  pool: number; completions: number; participants: number
  tags: string[]; description: string; enrolledByMe: boolean
}

const diffStyle: Record<string, { text: string; border: string; bg: string; icon: string }> = {
  Legendary: { text: 'text-primary', border: 'border-primary', bg: 'bg-primary', icon: 'military_tech' },
  Hard:      { text: 'text-error',   border: 'border-error',   bg: 'bg-error',   icon: 'terminal' },
  Medium:    { text: 'text-secondary', border: 'border-secondary', bg: 'bg-secondary', icon: 'memory' },
  Easy:      { text: 'text-tertiary-fixed', border: 'border-tertiary-fixed', bg: 'bg-tertiary-fixed', icon: 'code' },
}

// Static supplemental content per challenge
const extras: Record<string, { prizes: { place: string; reward: string }[]; requirements: string[]; timeline: { phase: string; desc: string }[] }> = {
  ch1: {
    prizes: [{ place: '1st', reward: '₹15,000 + Legendary Badge' }, { place: '2nd', reward: '₹8,000' }, { place: '3rd', reward: '₹5,000' }],
    requirements: ['5+ years experience recommended', 'System design fundamentals', 'Proficiency in any compiled language'],
    timeline: [{ phase: 'Registration', desc: 'Open until challenge starts' }, { phase: 'Sprint', desc: '72-hour coding window' }, { phase: 'Review', desc: '5-day evaluation period' }, { phase: 'Results', desc: 'Announced on leaderboard' }],
  },
}

const defaultExtra = {
  prizes: [{ place: '1st', reward: '₹10,000 + XP Boost' }, { place: '2nd', reward: '₹5,000' }, { place: '3rd', reward: '₹2,500' }],
  requirements: ['Valid member account', 'Solo participation only', 'Submission via GitHub repo'],
  timeline: [{ phase: 'Registration', desc: 'Enroll before sprint starts' }, { phase: 'Sprint', desc: 'Solve within the time window' }, { phase: 'Submission', desc: 'Push your final solution' }, { phase: 'Review', desc: 'Panel review + auto-scoring' }],
}

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenge', id] }),
  })

  const withdrawMutation = useMutation({
    mutationFn: () => api.delete(`/challenges/${id}/enroll`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenge', id] }),
  })

  const handleAction = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/challenges/${id}` } } })
      return
    }
    if (challenge?.enrolledByMe) {
      withdrawMutation.mutate()
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

  const isPending = enrollMutation.isPending || withdrawMutation.isPending
  const completionPct = challenge.participants > 0 ? Math.round((challenge.completions / challenge.participants) * 100) : 0
  const style = diffStyle[challenge.difficulty] ?? diffStyle['Medium']
  const extra = extras[challenge.id] ?? defaultExtra

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

            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Timeline</h2>
              <div className="space-y-0 border-l-2 border-white/10 pl-6">
                {extra.timeline.map((t, i) => (
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
                {extra.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant mt-0.5">check_circle</span>
                    <span className="font-body text-sm text-on-surface-variant">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Completion stats */}
            <div>
              <h2 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Completion Rate</h2>
              <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-2">
                <span>{challenge.completions} completions</span>
                <span className="text-white">{completionPct}%</span>
              </div>
              <div className="w-full bg-white/5 h-1">
                <div className={`h-full ${style.bg}`} style={{ width: `${completionPct}%` }} />
              </div>
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
                disabled={isPending}
                className={`w-full py-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all disabled:opacity-40 ${
                  challenge.enrolledByMe
                    ? 'border-error text-error hover:bg-error hover:text-white'
                    : `${style.text} ${style.border} hover:${style.bg} hover:text-on-primary`
                }`}
              >
                {isPending ? 'Processing...'
                  : challenge.enrolledByMe ? 'Withdraw'
                  : !user ? 'Login to Join'
                  : 'Initialize Sprint'}
              </button>

              {challenge.enrolledByMe && (
                <p className="text-[10px] font-mono text-on-surface-variant text-center mt-3">
                  Sprint active in your dashboard.
                </p>
              )}
            </div>

            {/* Prizes */}
            <div className="lab-panel p-6">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-4">Prize Distribution</h3>
              <div className="space-y-3">
                {extra.prizes.map((p) => (
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
