import { useState } from 'react'
import PublicLayout from '../components/layouts/PublicLayout'

const STATUSES = ['All', 'Live', 'Beta', 'Archived'] as const
type Status = typeof STATUSES[number]

const projects = [
  {
    id: 1, status: 'Live', title: 'Open Source Ledger',
    desc: 'Transparent contribution tracking system for open-source developers with on-chain verification.',
    stack: ['TypeScript', 'Solidity', 'Next.js', 'PostgreSQL'],
    stars: 284, forks: 47, gradient: 'from-primary/15 to-primary/5',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxLaCVb8z-dG60gD4JXs0oEE9zbrisDcxA_OHXQXR4hgH215CAHQrnE35wC38NhkHJB7ZBb01Tq2wpUpBx9hgVGvrBAmoD-SCSYBai6W9ZD5DEDQlNIBL5TPPFXxQ6ATEx3vu6Arfi-oKduohcA6WDn4I4CHbzdhWdgclpYemNyddCgR81BKM2AP5mpVIJ4Wq7OWqnfb9py1n2PeqIG04JO0CAoDLDhbiAi9qypY9t1dN6JvqHsm9qpNy2NEaQ8eKQ9D4kDbBLUQ',
  },
  {
    id: 2, status: 'Beta', title: 'Quantum Link API',
    desc: 'High-throughput distributed messaging API with sub-millisecond latency and built-in schema enforcement.',
    stack: ['Go', 'gRPC', 'Redis', 'Prometheus'],
    stars: 112, forks: 23, gradient: 'from-secondary/15 to-secondary/5',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNmzidLD06E26fFgq1694riEB2PgiPq9Oj5ypLMPcqU32x0Jd4fe6odxf1tfw0ANNRh_toaV4r1jTnkukeo7jYUCcUM1ODqEt7ulU0SQ27--XRB5qetz4nusorJAMrkTiAm3T-vJX4KoX74DnSNNhXhgkG1_dRpYpQ7geb88_1GZ6KdnuTvfM9fFez4yx5tAqAOCJxb7yRjGoUViJ5tjWlu7ZAky6ZD9qbktZIBzdD9L-rp1PskEzzrqGtmpsxnklLIPlNYVheEQ',
  },
  {
    id: 3, status: 'Live', title: 'Neural Net Mesh',
    desc: 'Edge-deployed neural network inference framework with automatic model quantization.',
    stack: ['Python', 'ONNX', 'Rust', 'WebAssembly'],
    stars: 501, forks: 88, gradient: 'from-tertiary-fixed/15 to-tertiary-fixed/5',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxLaCVb8z-dG60gD4JXs0oEE9zbrisDcxA_OHXQXR4hgH215CAHQrnE35wC38NhkHJB7ZBb01Tq2wpUpBx9hgVGvrBAmoD-SCSYBai6W9ZD5DEDQlNIBL5TPPFXxQ6ATEx3vu6Arfi-oKduohcA6WDn4I4CHbzdhWdgclpYemNyddCgR81BKM2AP5mpVIJ4Wq7OWqnfb9py1n2PeqIG04JO0CAoDLDhbiAi9qypY9t1dN6JvqHsm9qpNy2NEaQ8eKQ9D4kDbBLUQ',
  },
  {
    id: 4, status: 'Beta', title: 'Synapse-7 Neural Link',
    desc: 'Research project investigating hardware interrupt patterns in biological neural network simulations.',
    stack: ['C', 'Python', 'FPGA', 'Julia'],
    stars: 67, forks: 14, gradient: 'from-error/15 to-error/5',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNmzidLD06E26fFgq1694riEB2PgiPq9Oj5ypLMPcqU32x0Jd4fe6odxf1tfw0ANNRh_toaV4r1jTnkukeo7jYUCcUM1ODqEt7ulU0SQ27--XRB5qetz4nusorJAMrkTiAm3T-vJX4KoX74DnSNNhXhgkG1_dRpYpQ7geb88_1GZ6KdnuTvfM9fFez4yx5tAqAOCJxb7yRjGoUViJ5tjWlu7ZAky6ZD9qbktZIBzdD9L-rp1PskEzzrqGtmpsxnklLIPlNYVheEQ',
  },
  {
    id: 5, status: 'Archived', title: 'Auth Protocol Alpha',
    desc: 'Zero-trust authentication protocol with hardware security key integration and biometric fallback.',
    stack: ['Rust', 'WebAuthn', 'FIDO2'],
    stars: 330, forks: 62, gradient: 'from-on-surface-variant/10 to-transparent',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxLaCVb8z-dG60gD4JXs0oEE9zbrisDcxA_OHXQXR4hgH215CAHQrnE35wC38NhkHJB7ZBb01Tq2wpUpBx9hgVGvrBAmoD-SCSYBai6W9ZD5DEDQlNIBL5TPPFXxQ6ATEx3vu6Arfi-oKduohcA6WDn4I4CHbzdhWdgclpYemNyddCgR81BKM2AP5mpVIJ4Wq7OWqnfb9py1n2PeqIG04JO0CAoDLDhbiAi9qypY9t1dN6JvqHsm9qpNy2NEaQ8eKQ9D4kDbBLUQ',
  },
  {
    id: 6, status: 'Live', title: 'Code Dynamos Platform',
    desc: 'The very platform you\'re browsing. Open-source club management system built at Web Weave \'26.',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind'],
    stars: 94, forks: 18, gradient: 'from-primary/15 to-primary/5',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNmzidLD06E26fFgq1694riEB2PgiPq9Oj5ypLMPcqU32x0Jd4fe6odxf1tfw0ANNRh_toaV4r1jTnkukeo7jYUCcUM1ODqEt7ulU0SQ27--XRB5qetz4nusorJAMrkTiAm3T-vJX4KoX74DnSNNhXhgkG1_dRpYpQ7geb88_1GZ6KdnuTvfM9fFez4yx5tAqAOCJxb7yRjGoUViJ5tjWlu7ZAky6ZD9qbktZIBzdD9L-rp1PskEzzrqGtmpsxnklLIPlNYVheEQ',
  },
]

const statusStyle: Record<string, string> = {
  Live: 'text-tertiary-fixed border-tertiary-fixed',
  Beta: 'text-secondary border-secondary',
  Archived: 'text-on-surface-variant border-outline-variant',
}

const ProjectsPage = () => {
  const [filter, setFilter] = useState<Status>('All')
  const filtered = filter === 'All' ? projects : projects.filter((p) => p.status === filter)

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-20 px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[10px] font-mono font-black tracking-[0.5em] text-primary uppercase mb-4">DEPLOYED SYSTEMS</div>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter mb-4">Projects</h1>
          <div className="h-1 w-24 bg-primary mb-8" />
          <p className="text-on-surface-variant font-body max-w-xl">
            Open-source systems, research prototypes, and production tools built by the Code Dynamos collective.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[5.5rem] z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 px-8 py-4">
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
          {filtered.map((p) => (
            <div key={p.id} className="lab-panel group flex flex-col overflow-hidden">
              <div className="h-48 relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                <img alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={p.img} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className={`absolute top-4 right-4 text-[9px] font-mono font-black px-2 py-0.5 uppercase tracking-tighter border ${statusStyle[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="font-headline font-black text-xl uppercase mb-3 group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="text-sm text-on-surface-variant font-body mb-6 flex-1">{p.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {p.stack.map((t) => (
                    <span key={t} className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-on-surface-variant">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-mono text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">star</span>{p.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">fork_right</span>{p.forks}
                    </span>
                  </div>
                  <button className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    View Repo <span className="w-4 h-[1px] bg-primary inline-block" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}

export default ProjectsPage
