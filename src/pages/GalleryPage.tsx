import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PublicLayout from '../components/layouts/PublicLayout'
import { api } from '../lib/api'

const TABS = ['All', '2026', '2025', 'Hackathons', 'Workshops', 'Drive Links'] as const
type Tab = typeof TABS[number]

interface GalleryPhoto {
  id: string
  tag: string
  year: string
  label: string
  span: string
  img: string
  driveUrl?: string | null
}

const fetchGallery = () => api.get<GalleryPhoto[]>('/gallery').then((r) => r.data)

const GalleryPage = () => {
  const [tab, setTab] = useState<Tab>('All')
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null)
  const { data: photos = [], isLoading } = useQuery({ queryKey: ['gallery'], queryFn: fetchGallery })

  const filtered = tab === 'All'
    ? photos
    : tab === 'Drive Links'
    ? photos.filter((p) => !!p.driveUrl)
    : photos.filter((p) =>
        tab === '2026' || tab === '2025' ? p.year === tab : p.tag === tab
      )

  const handleCardClick = (p: GalleryPhoto) => {
    if (p.driveUrl) {
      window.open(p.driveUrl, '_blank', 'noopener,noreferrer')
    } else {
      setLightbox(p)
    }
  }

  return (
    <PublicLayout>
      {/* Header */}
      <section className="py-8 md:py-10 px-4 md:px-8 bg-[#0A0A0A] border-b border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-[11px] font-black tracking-[0.5em] text-primary uppercase mb-3 font-['Space_Mono']">MISSION ARCHIVE</div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter mb-4 font-['Orbitron']">Gallery</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mb-5" />
          <p className="text-on-surface-variant font-body max-w-xl text-sm md:text-base">
            Visual record of Code Dynamos events, hackathons, and community milestones — plus shared Drive resources.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="sticky top-[100px] z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-[1440px] mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 md:px-5 py-2 text-[9px] md:text-[10px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${
                tab === t ? 'bg-primary text-on-primary' : 'border border-white/10 text-on-surface-variant hover:border-primary/50 hover:text-white'
              } ${t === 'Drive Links' ? (tab === t ? '' : 'border-primary/30 text-primary/70') : ''}`}
            >
              {t === 'Drive Links' ? '📁 Drive Links' : t}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="font-pixel text-primary text-sm animate-pulse">LOADING ARCHIVE...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <span className="material-symbols-outlined text-4xl text-white/20">photo_library</span>
              <span className="font-mono text-on-surface-variant text-sm">No items in this category yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className={`relative overflow-hidden group cursor-pointer ${p.span || ''}`}
                  onClick={() => handleCardClick(p)}
                >
                  <img
                    alt={p.label}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    src={p.img}
                  />
                  {/* Drive link badge */}
                  {p.driveUrl && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-on-primary px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider z-10">
                      <span className="material-symbols-outlined text-xs">folder_shared</span>
                      Drive
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <div className="text-[9px] font-mono font-black uppercase tracking-widest text-primary mb-0.5">{p.tag} / {p.year}</div>
                    <p className="text-xs md:text-sm font-headline font-black uppercase leading-tight">{p.label}</p>
                    {p.driveUrl && (
                      <div className="flex items-center gap-1 mt-1 text-primary text-[9px] font-mono font-black uppercase">
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                        Open Drive
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-black/50 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">
                        {p.driveUrl ? 'folder_shared' : 'open_in_full'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox — only for non-drive items */}
      {lightbox && !lightbox.driveUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 border border-white/20 flex items-center justify-center text-white hover:border-primary hover:text-primary transition-colors"
            onClick={() => setLightbox(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.img}
              alt={lightbox.label}
              className="w-full max-h-[80vh] object-contain"
            />
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

export default GalleryPage
