import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import logoImg from '../../assets/logo.jpeg'

const navLinks = [
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
  const { theme, toggle } = useTheme()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen font-headline">
      {/* Ticker */}
      <div className="w-full bg-primary text-on-primary py-2 overflow-hidden z-[60] relative">
        <div className="ticker-scroll flex items-center space-x-12">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] whitespace-nowrap">
            WEB WEAVE '26 — Registration Open • Cloud Native Sprint T-minus 14 days • AI Workshop Active • Regional Award Confirmed
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] whitespace-nowrap">
            WEB WEAVE '26 — Registration Open • Cloud Native Sprint T-minus 14 days • AI Workshop Active • Regional Award Confirmed
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="fixed top-8 w-full z-50 px-8">
        <div className="max-w-[1440px] mx-auto bg-black/95 backdrop-blur-md border border-white/10 py-4 px-8 flex justify-between items-center rounded-lg">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logoImg}
                alt="Code Dynamos"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
              <img
                src="https://cmr.edu.in/wp-content/uploads/2026/03/CMR-NAAC-LOGO-small.png"
                alt="CMR University"
                className="h-8 w-auto object-contain brightness-90"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-xs text-white/80 font-mono uppercase tracking-wider leading-tight font-semibold">
                CMR<br />University
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  pathname === to
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-white/70 hover:text-primary'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-sm">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/dashboard" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-red-400 transition-colors">
                  Logout
                </button>
                <Link to="/dashboard" className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="font-pixel text-xs text-primary">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="bg-primary px-6 py-2.5 rounded-sm text-on-primary font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform">
                  Join Registry
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="pt-28">{children}</div>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] border-t border-white/5 py-16 px-8 mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div>
              <div className="mb-3">
                <img
                  src={logoImg}
                  alt="Code Dynamos"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-white/60 max-w-xs font-body">
                Web Weave '26 — Technical Excellence Platform for elite developers.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-white/50 font-mono uppercase tracking-widest mb-3">In association with</p>
              <div className="flex items-center gap-3">
                <img
                  src="https://cmr.edu.in/wp-content/uploads/2026/03/CMR-NAAC-LOGO-small.png"
                  alt="CMR University"
                  className="h-10 w-auto object-contain brightness-95"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <p className="text-base font-bold text-white tracking-wide">CMR University</p>
                  <p className="text-xs text-white/60 font-mono">Bengaluru, Karnataka</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-16 text-sm font-bold uppercase tracking-widest">
            <div className="space-y-4">
              <div className="text-white/50 mb-6 text-xs tracking-[0.3em]">Platform</div>
              {navLinks.map(({ label, to }) => (
                <Link key={to} className="block text-white/70 hover:text-primary transition-colors" to={to}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="space-y-4">
              <div className="text-white/50 mb-6 text-xs tracking-[0.3em]">Account</div>
              <Link className="block text-white/70 hover:text-primary transition-colors" to="/login">Login</Link>
              <Link className="block text-white/70 hover:text-primary transition-colors" to="/signup">Sign Up</Link>
              <Link className="block text-white/70 hover:text-primary transition-colors" to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
          <span className="text-xs text-white/50 font-mono uppercase tracking-widest">© 2026 Code Dynamos. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d3ef57]" />
            <span className="text-xs font-mono uppercase tracking-widest text-white/60">Systems Nominal</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
