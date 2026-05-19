import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import PublicLayout from '../components/layouts/PublicLayout'

interface TeamMember { id: string; name: string; role: string; dept: string; tier: string; image?: string; instagramUrl?: string; linkedinUrl?: string }

const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

const CATEGORY_CONFIG: Record<string, { label: string; accent: string; glow: string; border: string; badge: string; icon: string }> = {
  'Faculty': {
    label: 'Faculty',
    accent: '#d3ef57',
    glow: 'shadow-[0_0_40px_rgba(211,239,87,0.25)]',
    border: 'border-[#d3ef57]/40',
    badge: 'bg-[#d3ef57]/10 text-[#d3ef57] border-[#d3ef57]/30',
    icon: 'school',
  },
  'Student Coordinators': {
    label: 'Student Coordinators',
    accent: '#dbb8ff',
    glow: 'shadow-[0_0_30px_rgba(219,184,255,0.2)]',
    border: 'border-[#dbb8ff]/40',
    badge: 'bg-[#dbb8ff]/10 text-[#dbb8ff] border-[#dbb8ff]/30',
    icon: 'groups',
  },
  'Core': {
    label: 'Core',
    accent: '#74facb',
    glow: 'shadow-[0_0_40px_rgba(116,250,203,0.25)]',
    border: 'border-[#74facb]/40',
    badge: 'bg-[#74facb]/10 text-[#74facb] border-[#74facb]/30',
    icon: 'military_tech',
  },
  'Technical': {
    label: 'Technical',
    accent: '#74facb',
    glow: 'shadow-[0_0_30px_rgba(116,250,203,0.2)]',
    border: 'border-[#74facb]/40',
    badge: 'bg-[#74facb]/10 text-[#74facb] border-[#74facb]/30',
    icon: 'code',
  },
  'Marketing': {
    label: 'Marketing',
    accent: '#ffb4ab',
    glow: 'shadow-[0_0_30px_rgba(255,180,171,0.2)]',
    border: 'border-[#ffb4ab]/40',
    badge: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30',
    icon: 'campaign',
  },
  'Creative': {
    label: 'Creative',
    accent: '#80cbc4',
    glow: 'shadow-[0_0_30px_rgba(128,203,196,0.2)]',
    border: 'border-[#80cbc4]/40',
    badge: 'bg-[#80cbc4]/10 text-[#80cbc4] border-[#80cbc4]/30',
    icon: 'brush',
  },
  'Operator': {
    label: 'Operators',
    accent: '#dbb8ff',
    glow: 'shadow-[0_0_30px_rgba(219,184,255,0.2)]',
    border: 'border-[#dbb8ff]/40',
    badge: 'bg-[#dbb8ff]/10 text-[#dbb8ff] border-[#dbb8ff]/30',
    icon: 'terminal',
  },
  'All': {
    label: 'All Operators',
    accent: '#ffffff',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.1)]',
    border: 'border-white/20',
    badge: 'bg-white/10 text-white border-white/30',
    icon: 'apps',
  },
}

const FALLBACK_CONFIG = CATEGORY_CONFIG['Operator']

function MemberCard({ m, cfg, isCore, onProfileClick, onImageClick }: { m: TeamMember; cfg: any; isCore: boolean; onProfileClick: (m: TeamMember) => void; onImageClick: (m: TeamMember) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
      onClick={() => onProfileClick(m)}
    >
      {/* Dynamic Glow Background */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[50px]"
        style={{ background: `${cfg.accent}15` }}
      />

      {/* Main Card Body */}
      <div
        className={`relative h-full flex flex-col items-center text-center rounded-[2.5rem] border overflow-hidden transition-all duration-500
          bg-black/40 backdrop-blur-3xl group-hover:bg-black/60
          ${isCore ? 'p-10' : 'p-6'}
          group-hover:${cfg.border}
        `}
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Hover Gradient Shine */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {/* Photo Container */}
        <div
          className={`relative mb-6 flex-shrink-0 rounded-full p-1 transition-all duration-700 group-hover:scale-105 group-hover:rotate-1
            ${isCore ? 'w-44 h-44' : 'w-28 h-28'}
          `}
          style={{ 
            background: `linear-gradient(135deg, ${cfg.accent}, transparent)`,
            boxShadow: `0 20px 40px -10px ${cfg.accent}20`
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-[#0A0A0A] bg-[#111] relative group/photo">
            {m.image ? (
              <>
                <img
                  src={m.image}
                  alt={m.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); onImageClick(m) }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-primary text-xl">open_in_full</span>
                </button>
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${cfg.accent}15, transparent)` }}
              >
                <span
                  className={`font-black tracking-tighter ${isCore ? 'text-5xl' : 'text-3xl'}`}
                  style={{ color: cfg.accent }}
                >
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
            )}
          </div>

          {/* Status Dot */}
          <div 
            className="absolute bottom-3 right-3 w-4 h-4 rounded-full border-[3px] border-[#0A0A0A] z-10"
            style={{ backgroundColor: cfg.accent, boxShadow: `0 0 15px ${cfg.accent}` }}
          />
        </div>

        {/* Info */}
        <div className="relative z-10 space-y-2 flex-1">
          <div 
            className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2 border ${cfg.badge}`}
          >
            {m.tier}
          </div>
          <h3 className={`font-headline font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors ${isCore ? 'text-2xl' : 'text-lg'}`}>
            {m.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 font-mono">
            {m.role}
          </p>
        </div>

        {/* Action Button - Only visible on hover */}
        <div className="mt-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          <button 
            className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all bg-white/5 border border-white/10 hover:bg-white hover:text-black hover:scale-105"
          >
            View Profile
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function CategorySection({ category, members, onProfileClick, onImageClick }: { category: string; members: TeamMember[]; onProfileClick: (m: TeamMember) => void; onImageClick: (m: TeamMember) => void }) {
  const cfg = CATEGORY_CONFIG[category] ?? FALLBACK_CONFIG
  const isCore = category === 'Core' || category === 'Faculty'

  return (
    <section className="py-10 px-6 md:px-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid gap-6 items-start">
          <div className={`grid gap-6 ${isCore
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
          }`}>
            {members.map((m) => (
              <MemberCard key={m.id} m={m} cfg={cfg} isCore={isCore} onProfileClick={onProfileClick} onImageClick={onImageClick} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const TeamPage = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [lightbox, setLightbox] = useState<{ img: string; label: string; tag: string; year: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { data: team = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data)
  })

  // Group by category, maintaining a logical order
  const CATEGORY_ORDER = ['Faculty', 'Student Coordinators', 'Core', 'Technical', 'Marketing', 'Creative', 'Operator']
  const grouped = CATEGORY_ORDER.reduce<Record<string, TeamMember[]>>((acc, cat) => {
    const members = team.filter(m => m.tier === cat)
    if (members.length > 0) acc[cat] = members
    return acc
  }, {})
  // Add any remaining categories not in the order
  team.forEach(m => {
    if (m.tier && !CATEGORY_ORDER.includes(m.tier)) {
      if (!grouped[m.tier]) grouped[m.tier] = []
      if (!grouped[m.tier].includes(m)) grouped[m.tier].push(m)
    }
  })

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="relative py-16 px-8 bg-[#0A0A0A] border-b border-white/5 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1440px] mx-auto relative">
          <div className="text-[11px] font-black tracking-[0.5em] text-primary uppercase mb-4 font-['Space_Mono']">OPERATOR PROFILES</div>
          <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter mb-6 font-['Orbitron'] leading-none">
            The <span className="text-primary">Team</span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-primary via-secondary to-transparent mb-6" />
          <p className="text-on-surface-variant font-body max-w-lg text-sm leading-relaxed">
            The engineers, researchers, and builders driving Code Dynamos forward. Every card is a story of dedication.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      {!isLoading && team.length > 0 && (
        <section className="sticky top-[72px] z-30 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
          <div className="max-w-[1440px] mx-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">filter_list</span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Filter by Category</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all min-w-[200px] justify-between"
              >
                <span>{activeCategory}</span>
                <motion.span 
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  className="material-symbols-outlined text-xs text-white/40"
                >
                  expand_more
                </motion.span>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsDropdownOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-full bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-2 space-y-1"
                    >
                      {['All', ...Object.keys(grouped)].filter((v, i, a) => a.indexOf(v) === i).map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory(cat)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-[9px] font-mono font-bold uppercase tracking-widest rounded-xl transition-colors
                            ${activeCategory === cat ? 'bg-primary text-black' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                          `}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-32 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-['Space_Mono'] text-primary text-xs uppercase tracking-widest animate-pulse">Synchronizing Operators...</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && team.length === 0 && (
        <div className="py-32 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-white/20">group</span>
          <p className="font-mono text-white/30 text-sm">No team members registered yet.</p>
        </div>
      )}

      {/* Category Sections */}
      {!isLoading && (
        <div className="bg-[#0A0A0A] pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeCategory === 'All' ? (
                <div className="space-y-4">
                  {CATEGORY_ORDER.filter(c => c !== 'All' && grouped[c]).map(cat => (
                    <CategorySection 
                      key={cat}
                      category={cat} 
                      members={grouped[cat]} 
                      onProfileClick={setSelectedMember}
                      onImageClick={(m) => setLightbox({ img: m.image!, label: m.name, tag: m.tier, year: m.dept })}
                    />
                  ))}
                </div>
              ) : (
                grouped[activeCategory] && (
                  <CategorySection 
                    category={activeCategory} 
                    members={grouped[activeCategory]} 
                    onProfileClick={setSelectedMember}
                    onImageClick={(m) => setLightbox({ img: m.image!, label: m.name, tag: m.tier, year: m.dept })}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Profile Modal */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#0D0D0D] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Left: Big Photo */}
            <div className="w-full md:w-1/2 h-[400px] md:h-auto relative group/bigphoto">
              {selectedMember.image ? (
                <>
                  <img 
                    src={selectedMember.image} 
                    alt={selectedMember.name} 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => setLightbox({ img: selectedMember.image!, label: selectedMember.name, tag: selectedMember.tier, year: selectedMember.dept })}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-primary opacity-0 group-hover/bigphoto:opacity-100 transition-all hover:scale-110"
                    title="Fullscreen"
                  >
                    <span className="material-symbols-outlined">open_in_full</span>
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                   <span className="text-8xl font-black text-primary opacity-20">
                    {selectedMember.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent md:hidden" />
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-8">
                <div 
                  className="inline-block px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest mb-4"
                  style={{ 
                    backgroundColor: (CATEGORY_CONFIG[selectedMember.tier] ?? FALLBACK_CONFIG).accent + '20',
                    color: (CATEGORY_CONFIG[selectedMember.tier] ?? FALLBACK_CONFIG).accent,
                    border: `1px solid ${(CATEGORY_CONFIG[selectedMember.tier] ?? FALLBACK_CONFIG).accent}40`
                  }}
                >
                  {selectedMember.tier}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                  {selectedMember.name}
                </h2>
                <p className="text-xl font-mono text-primary font-bold uppercase tracking-wider">
                  {selectedMember.role}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-2">Department</h4>
                  <p className="text-white font-body">{selectedMember.dept}</p>
                </div>

                {(selectedMember.instagramUrl || selectedMember.linkedinUrl) && (
                  <div>
                    <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-2">Connect</h4>
                    <div className="flex gap-4">
                      {selectedMember.instagramUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.instagramUrl)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#E1306C] hover:border-[#E1306C] transition-colors" title="Instagram">
                          <span className="material-symbols-outlined text-white">photo_camera</span>
                        </a>
                      )}
                      {selectedMember.linkedinUrl && (
                        <a href={ensureAbsoluteUrl(selectedMember.linkedinUrl)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#0077B5] hover:border-[#0077B5] transition-colors" title="LinkedIn">
                          <span className="material-symbols-outlined text-white">work</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 h-px w-full bg-white/10" />
              <div className="mt-6 flex items-center gap-4">
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                  Official Member of Code Dynamos
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 border border-white/20 flex items-center justify-center text-white hover:border-primary hover:text-primary transition-colors"
            onClick={() => setLightbox(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
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

export default TeamPage
