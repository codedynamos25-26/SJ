import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'

const STATUSES = ['All', 'Live', 'Beta', 'Archived'] as const
type Status = typeof STATUSES[number]

type Project = {
  id: string
  status: string
  title: string
  description: string
  tech: string[]
  stars: number
  forks: number
  img: string
  githubUrl?: string
}

const statusStyle: Record<string, { text: string; border: string; bg: string }> = {
  Live:     { text: 'text-tertiary-fixed',  border: 'border-tertiary-fixed/60',  bg: 'bg-tertiary-fixed/10'  },
  Beta:     { text: 'text-secondary',       border: 'border-secondary/60',       bg: 'bg-secondary/10'       },
  Archived: { text: 'text-white/40',        border: 'border-white/20',           bg: 'bg-white/5'            },
}

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

const ProjectsPage = () => {
  const [filter, setFilter] = useState<Status>('All')
  const [lightbox, setLightbox] = useState<{ img: string; label: string; tag: string; year: string } | null>(null)
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects').then(r => r.data),
  })
  const filtered = filter === 'All' ? projects : projects.filter((p) => p.status === filter)

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-10 px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[11px] font-black tracking-[0.5em] text-primary uppercase mb-4 font-['Space_Mono']">DEPLOYED SYSTEMS</div>
          <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter mb-6 font-['Orbitron']">Projects</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mb-8" />
          <p className="text-on-surface-variant font-body max-w-xl">
            Open-source systems, research prototypes, and production tools built by the Code Dynamos collective.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[100px] z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 px-8 py-4">
        <div className="max-w-[1440px] mx-auto flex gap-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-all ${
                filter === s ? 'bg-primary text-on-primary' : 'border border-white/10 text-on-surface-variant hover:border-primary/50 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading && (
            <div className="col-span-full flex items-center justify-center h-48">
              <span className="font-pixel text-primary text-sm animate-pulse">LOADING PROJECTS...</span>
            </div>
          )}

          {!isLoading && filtered.map((p) => {
            const st = statusStyle[p.status] ?? statusStyle.Archived
            const hasRepo = !!p.githubUrl
            return <ProjectCard key={p.id} p={p} st={st} hasRepo={hasRepo} onFullscreen={() => setLightbox({ img: p.img, label: p.title, tag: 'Project', year: p.status })} />
          })}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-48 gap-3 text-center">
              <span className="material-symbols-outlined text-4xl text-white/20">deployed_code</span>
              <p className="font-mono text-on-surface-variant text-sm">No projects available in this category.</p>
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

function ProjectCard({ p, st, hasRepo, onFullscreen }: { p: Project; st: any; hasRepo: boolean; onFullscreen: () => void }) {
  return (
    <div className="lab-panel group flex flex-col overflow-hidden relative min-h-[400px]">
      {/* Header / Image Area */}
      <div className="h-52 relative overflow-hidden bg-black/40 border-b border-white/5">
        {p.img ? (
          <div className="w-full h-full relative group/img">
            <img
              alt={p.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={p.img}
            />
            {/* Full Image Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onFullscreen(); }}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all border bg-black/60 text-white/40 border-white/10 hover:border-primary hover:text-primary hover:scale-110"
              title="View Project Photo"
            >
              <span className="material-symbols-outlined text-sm">open_in_full</span>
            </button>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] p-6 font-mono overflow-hidden">
            <span className="material-symbols-outlined text-4xl text-primary/20 mb-3 group-hover:scale-110 transition-transform duration-500">terminal</span>
            <div className="text-[8px] text-primary/40 uppercase tracking-[0.3em] space-y-1 w-full opacity-50">
              <div className="flex justify-between"><span>SYS_ID</span> <span>{p.id.slice(0, 8)}</span></div>
              <div className="flex justify-between"><span>MEM_ALLOC</span> <span>{(p.stars * 1024).toString(16).toUpperCase()}H</span></div>
              <div className="flex justify-between"><span>STATUS</span> <span className={st.text}>{p.status.toUpperCase()}</span></div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* GitHub link on image hover */}
        {hasRepo && (
          <a
            href={p.githubUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-white/20 hover:border-primary/60 px-3 py-1.5 text-white hover:text-primary rounded-full text-[10px] font-mono font-black uppercase tracking-wider"
          >
            <GithubIcon />
            GitHub
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-7 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-headline font-black text-xl uppercase group-hover:text-primary transition-colors">{p.title}</h3>
          <span className={`text-[9px] font-mono font-black px-2 py-0.5 uppercase tracking-wider border rounded-full ${st.text} ${st.border} ${st.bg}`}>
            {p.status}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant font-body mb-5 flex-1 leading-relaxed">{p.description}</p>

        {/* Tech tags */}
        {p.tech.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {p.tech.map((t) => (
              <span key={t} className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-on-surface-variant rounded">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer: stars/forks + View Repo */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-5 text-[11px] font-mono text-on-surface-variant">
            <span className="flex items-center gap-1.5 group/star">
              <span className="material-symbols-outlined text-sm group-hover/star:text-yellow-400 transition-colors">star</span>
              <span className="group-hover/star:text-white transition-colors">{p.stars.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5 group/fork">
              <span className="material-symbols-outlined text-sm group-hover/fork:text-primary transition-colors">fork_right</span>
              <span className="group-hover/fork:text-white transition-colors">{p.forks.toLocaleString()}</span>
            </span>
          </div>

          {hasRepo ? (
            <a
              href={p.githubUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-primary hover:text-white border border-primary/40 hover:border-white/40 hover:bg-white/5 px-4 py-2 rounded transition-all duration-200"
            >
              <GithubIcon />
              View Repo
            </a>
          ) : (
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">lock</span>
              Private
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage
