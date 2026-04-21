import PublicLayout from '../components/layouts/PublicLayout'

const leadership = [
  { name: 'Arjun Mehta', role: 'President', dept: 'Systems Architecture', skills: ['Go', 'Kubernetes', 'Rust'], gradient: 'from-primary/20 to-primary/5', accent: '#d3ef57' },
  { name: 'Priya Sharma', role: 'Technical Lead', dept: 'ML Infrastructure', skills: ['Python', 'PyTorch', 'CUDA'], gradient: 'from-secondary/20 to-secondary/5', accent: '#dbb8ff' },
  { name: 'Karan Nair', role: 'VP Engineering', dept: 'Cloud & DevOps', skills: ['AWS', 'Terraform', 'K8s'], gradient: 'from-tertiary-fixed/20 to-tertiary-fixed/5', accent: '#74facb' },
]

const coreTeam = [
  { name: 'Sneha Patel', role: 'Frontend Architect', dept: 'UI Systems', skills: ['React', 'TypeScript', 'WebGL'], gradient: 'from-primary/15 to-transparent', accent: '#d3ef57' },
  { name: 'Dev Rao', role: 'Security Researcher', dept: 'Cybersec', skills: ['Pentest', 'Cryptography', 'CTF'], gradient: 'from-error/15 to-transparent', accent: '#ffb4ab' },
  { name: 'Anika Singh', role: 'Backend Engineer', dept: 'Platform', skills: ['Node.js', 'PostgreSQL', 'Redis'], gradient: 'from-secondary/15 to-transparent', accent: '#dbb8ff' },
  { name: 'Rahul Verma', role: 'ML Engineer', dept: 'AI Research', skills: ['LLMs', 'RAG', 'FastAPI'], gradient: 'from-tertiary-fixed/15 to-transparent', accent: '#74facb' },
  { name: 'Meera Joshi', role: 'DevOps Engineer', dept: 'Infrastructure', skills: ['Docker', 'CI/CD', 'Linux'], gradient: 'from-primary/15 to-transparent', accent: '#d3ef57' },
  { name: 'Vikram Das', role: 'Mobile Lead', dept: 'Cross-Platform', skills: ['Flutter', 'React Native', 'Swift'], gradient: 'from-secondary/15 to-transparent', accent: '#dbb8ff' },
  { name: 'Tanvi Kumar', role: 'Data Engineer', dept: 'Analytics', skills: ['Spark', 'dbt', 'Airflow'], gradient: 'from-tertiary-fixed/15 to-transparent', accent: '#74facb' },
  { name: 'Rohit Iyer', role: 'Open Source Lead', dept: 'Community', skills: ['OSS', 'Git', 'Documentation'], gradient: 'from-error/15 to-transparent', accent: '#ffb4ab' },
]

const TeamPage = () => (
  <PublicLayout>
    {/* Header */}
    <section className="py-20 px-8 bg-[#0A0A0A] border-b border-white/5">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-[10px] font-mono font-black tracking-[0.5em] text-primary uppercase mb-4">OPERATOR PROFILES</div>
        <h1 className="text-6xl font-black italic uppercase tracking-tighter mb-4">Meet The Team</h1>
        <div className="h-1 w-24 bg-primary mb-8" />
        <p className="text-on-surface-variant font-body max-w-xl">
          The engineers, researchers, and builders driving Code Dynamos forward.
        </p>
      </div>
    </section>

    {/* Leadership */}
    <section className="py-16 px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-on-surface-variant">Core Command</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leadership.map((m) => (
            <div key={m.name} className="lab-panel p-8 group relative overflow-hidden">
              {/* Avatar */}
              <div className={`w-20 h-20 mb-6 bg-gradient-to-br ${m.gradient} border relative`} style={{ borderColor: `${m.accent}30` }}>
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-pixel text-2xl" style={{ color: m.accent }}>
                    {m.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3" style={{ background: m.accent }} />
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] mb-1" style={{ color: m.accent }}>{m.role}</div>
              <h3 className="font-headline font-black text-xl mb-1 group-hover:text-primary transition-colors">{m.name}</h3>
              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider mb-5">{m.dept}</p>
              <div className="flex flex-wrap gap-2">
                {m.skills.map((s) => (
                  <span key={s} className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-on-surface-variant">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Core Team */}
    <section className="py-8 px-8 pb-20">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-on-surface-variant">Core Operators</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {coreTeam.map((m) => (
            <div key={m.name} className="lab-panel p-6 group">
              <div className={`w-12 h-12 mb-4 bg-gradient-to-br ${m.gradient} border flex items-center justify-center`} style={{ borderColor: `${m.accent}30` }}>
                <span className="font-pixel text-sm" style={{ color: m.accent }}>
                  {m.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div className="font-mono text-[8px] uppercase tracking-[0.3em] mb-1" style={{ color: m.accent }}>{m.role}</div>
              <h3 className="font-headline font-bold text-sm mb-1 group-hover:text-primary transition-colors">{m.name}</h3>
              <p className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider mb-3">{m.dept}</p>
              <div className="flex flex-wrap gap-1">
                {m.skills.slice(0, 2).map((s) => (
                  <span key={s} className="text-[8px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 text-on-surface-variant">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </PublicLayout>
)

export default TeamPage
