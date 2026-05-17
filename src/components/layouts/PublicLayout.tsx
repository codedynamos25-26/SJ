import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AnimatedProfileBadge from '../ui/AnimatedProfileBadge'
import logoImg from '../../assets/logo.jpeg'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Challenges', to: '/challenges' },
  { label: 'Team', to: '/team' },
  { label: 'Projects', to: '/projects' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Leaderboard', to: '/leaderboard' },
]

const PublicLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [navVisible, setNavVisible] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<{ id: string; text: string }[]>([])
  const lastScrollY = useRef(0)

  useEffect(() => {
    import('../../lib/api').then(({ api }) => {
      api.get('/announcements')
        .then(r => {
          const data = r.data
          if (data && data.length > 0) setAnnouncements(data)
          else setAnnouncements([{ id: 'default', text: '📢 ANNOUNCING WEB WEAVE \'26: Two-Day Hybrid Web Design Event • April 8th & 9th 2026 • Register Now!' }])
        })
        .catch(() => setAnnouncements([{ id: 'err', text: '📢 ANNOUNCING WEB WEAVE \'26: Two-Day Hybrid Web Design Event • April 8th & 9th 2026 • Register Now!' }]))
    })
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      if (current > lastScrollY.current && current > 80) {
        setNavVisible(false)   // scrolling down — hide
      } else if (current < lastScrollY.current) {
        setNavVisible(true)    // scrolling up — show
      }
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleLogout = () => { logout(); navigate('/') }
  const initials = user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : ''

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen font-headline overflow-x-hidden">

      <div className={`fixed top-0 left-0 right-0 z-[80] transition-transform duration-300 ease-in-out ${
        navVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        {/* ── Announcement Ticker ─────────────────────────────────── */}
        <div className="w-full bg-primary text-on-primary py-2 overflow-hidden relative">
          <div className="ticker-scroll flex items-center">
            {[0, 1].map(i => (
              <span key={i} className="font-['Space_Mono'] text-[11px] font-bold uppercase tracking-[0.3em] whitespace-nowrap px-16">
                {announcements.map((a, idx) => (
                  <span key={a.id}>
                    {a.text}
                    {idx < announcements.length - 1 && (
                      <span className="mx-8 opacity-60">◆</span>
                    )}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── Top Nav ─────────────────────────────────────────────── */}
        <nav className="relative" style={{ top: '0px' }}>
          <div className="mx-4 md:mx-6 lg:mx-8 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-3 flex justify-between items-center gap-4">

            {/* Logo + Code Dynamos */}
            <div className="flex items-center gap-3 shrink-0 min-w-0">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={logoImg} alt="Code Dynamos" className="h-11 w-auto object-contain logo-color" />
              </Link>
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10">
                <span className="text-sm font-black uppercase tracking-wider leading-tight font-['Space_Grotesk'] text-primary whitespace-nowrap">Code Dynamos</span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1 flex-wrap justify-center flex-1">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 overflow-hidden group ${
                    pathname === to
                      ? 'text-primary'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="relative z-10 block">{label}</span>

                  {pathname === to && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full animate-pulse" />
                  )}
                  {pathname !== to && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary/0 group-hover:bg-primary/50 rounded-full transition-colors" />
                  )}
                </Link>
              ))}
            </div>

            {/* Auth Controls */}
            <div className="flex items-center gap-3 shrink-0">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="hidden md:block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-primary text-on-primary rounded-md hover:brightness-110 transition-all"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-red-400 transition-colors px-2 py-1.5"
                  >
                    Logout
                  </button>
                  {/* Animated Profile Badge */}
                  <AnimatedProfileBadge
                    name={user.name}
                    initials={initials}
                    to="/dashboard"
                  />
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden md:block text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors px-3 py-1.5"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-primary px-4 py-2 rounded-md text-on-primary font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    Join
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                className="lg:hidden ml-1 w-9 h-9 flex flex-col justify-center items-center gap-1.5 hover:bg-white/5 rounded-md transition-colors"
                onClick={() => setMobileOpen(v => !v)}
              >
                <span className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-white/5 px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                    pathname === to
                      ? 'text-primary bg-primary/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-1">
                {user ? (
                  <>
                    <Link to="/dashboard" className="px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5">Profile</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10">Admin Panel</Link>
                    )}
                    <button onClick={handleLogout} className="text-left px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5">Login</Link>
                    <Link to="/signup" className="px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10">Join Registry</Link>
                  </>
                )}
              </div>
            </div>
          )}
          </div>
        </nav>
      </div>

      {/* ── Page Content ────────────────────────────────────────── */}
      {/* top padding = ticker(28px) + nav(~64px) + gap(8px) = ~100px */}
      <div className="pt-[90px] md:pt-[100px]">{children}</div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-[#080808] border-t border-white/5 py-10 md:py-14 px-4 md:px-8 mt-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-6 max-w-xs">
            <div>
              <img src={logoImg} alt="Code Dynamos" className="h-14 w-auto object-contain mb-3" />
              <p className="text-xs text-white/50 leading-relaxed font-body">
                Code Dynamos — The official technical club of CMR University, Bengaluru. <span className="text-primary font-bold">Building tomorrow's engineers.</span>
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-3">In association with</p>
              <a 
                href="https://cmr.edu.in/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
              >
                <img
                  src="https://cmr.edu.in/wp-content/uploads/2026/03/CMR-NAAC-LOGO-small.png"
                  alt="CMR University"
                  className="h-12 w-auto object-contain brightness-90 group-hover:brightness-100"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">CMR University</p>
                  <p className="text-[10px] text-white/50 font-mono">Bengaluru, Karnataka</p>
                </div>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-12 md:gap-16 flex-wrap text-xs font-bold uppercase tracking-widest">
            <div className="space-y-3">
              <div className="text-white/30 mb-5 text-[10px] tracking-[0.3em]">Platform</div>
              {navLinks.filter(l => l.to !== '/').map(({ label, to }) => (
                <Link key={to} className="block text-white/60 hover:text-primary transition-colors" to={to}>{label}</Link>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-white/30 mb-5 text-[10px] tracking-[0.3em]">Account</div>
              {!user ? (
                <>
                  <Link className="block text-white/60 hover:text-primary transition-colors" to="/login">Login</Link>
                  <Link className="block text-white/60 hover:text-primary transition-colors" to="/signup">Sign Up</Link>
                </>
              ) : (
                <>
                  <Link className="block text-white/60 hover:text-primary transition-colors" to="/dashboard">My Profile</Link>
                  {user.role === 'admin' && (
                    <Link className="block text-primary hover:text-white transition-colors" to="/admin">Admin Panel</Link>
                  )}
                </>
              )}
            </div>
            <div className="space-y-4">
              <div className="text-white/30 mb-5 text-[10px] tracking-[0.3em]">Contact</div>
              <a href="mailto:codedynamos25@gmail.com" className="flex items-center gap-2 text-white/80 hover:text-primary transition-colors lowercase tracking-normal text-sm font-medium">
                <span className="material-symbols-outlined text-lg">mail</span>
                codedynamos25@gmail.com
              </a>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.linkedin.com/company/code-dynamos-cmru"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all rounded-sm"
                >
                  <svg className="w-5 h-5 fill-white/60 hover:fill-[#0A66C2]" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/codingclub_cmru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-[#E1306C] hover:bg-[#E1306C]/10 transition-all rounded-sm"
                >
                  <svg className="w-5 h-5 fill-white/60" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://chat.whatsapp.com/LTKMAbnTHqp0vhggJY0nBn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-[#25D366] hover:bg-[#25D366]/10 transition-all rounded-sm"
                >
                  <svg className="w-5 h-5 fill-white/60 hover:fill-[#25D366]" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1440px] mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">© 2026 Code Dynamos — CMR University. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d3ef57] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Active SJ</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
