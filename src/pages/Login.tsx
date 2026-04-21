import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="bg-background font-body text-on-surface selection:bg-primary selection:text-on-primary min-h-screen flex items-center justify-center overflow-hidden">

      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#d3ef57 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-lg px-6">
        <div className="kinetic-glass technical-border rounded-lg p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="scanline" />

          {/* Brand Identity */}
          <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-surface-variant border border-outline-variant mb-6 group transition-all duration-500 hover:border-primary">
              <span className="material-symbols-outlined text-primary text-4xl transform group-hover:scale-110 transition-transform">
                terminal
              </span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl tracking-[0.2em] text-on-surface uppercase italic">
              CODE DYNAMOS
            </h1>
            <p className="font-label text-primary text-[10px] mt-2 tracking-[0.3em] uppercase opacity-80">
              Technical Excellence Platform // SECURED
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-error/10 border border-error/30 text-error text-xs font-mono rounded-sm relative z-10">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="email">
                User Identifier
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-outline-variant/30 mr-4">
                  <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">
                    alternate_email
                  </span>
                </div>
                <input
                  className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 pl-14 pr-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                  id="email"
                  name="email"
                  placeholder="ENGINEER_ID@CODEDYNAMOS.IO"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant" htmlFor="password">
                  Security Cipher
                </label>
                <a className="font-label text-[9px] uppercase tracking-widest text-primary hover:underline transition-all" href="#">
                  Recovery protocol
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-outline-variant/30 mr-4">
                  <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">
                    key
                  </span>
                </div>
                <input
                  className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 pl-14 pr-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary hover:bg-white text-on-primary font-headline font-extrabold py-4 rounded-sm flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] group tracking-[0.15em] text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}</span>
              {!isLoading && (
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  bolt
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-surface-container-lowest px-4 text-on-surface-variant font-label tracking-[0.2em]">
                External Auth
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button className="flex items-center justify-center gap-3 bg-surface-variant border border-outline-variant hover:border-primary/50 py-3 rounded-sm transition-all duration-200 group">
              <img
                alt="Google"
                className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnbNwy7JyqJn0T1_m7VUuxtMwFFY4HUDUiWLRa-r2LzwpYvIqONPpE8-koSicUwFNYs4uNsbfp8CAs4_ZTm-EhjoI9Zovmy7xxyIpmYz9m45veLM04E763GSzSfXllH95Q7qI1Zav-fOs58BWQxzsNlcw4veYLabRdC-ZII5NiWU5ICwsB0NmXFODgYSUXJ123OUAP-T3Heo_V0ILhd-y4NbSRhcqVmuz3FtmBr90oW823fuh6P3nUaAbZ-czQ7nCQwOnmM7B2eQ"
              />
              <span className="font-label text-[10px] uppercase tracking-wider text-on-surface">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 bg-surface-variant border border-outline-variant hover:border-primary/50 py-3 rounded-sm transition-all duration-200 group">
              <span className="material-symbols-outlined text-on-surface group-hover:text-primary text-sm transition-colors">
                terminal
              </span>
              <span className="font-label text-[10px] uppercase tracking-wider text-on-surface">GitHub</span>
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center mt-10 font-label text-[11px] text-on-surface-variant tracking-wide relative z-10">
            NEW TO THE LAB?{' '}
            <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" to="/signup">
              ESTABLISH CREDENTIALS
            </Link>
          </p>
        </div>

        {/* System Status Bar */}
        <div className="mt-8 flex justify-between items-center px-4 opacity-60">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d3ef57]" />
              <span className="font-label text-[9px] uppercase tracking-[0.2em] text-on-surface">Node: 01_ACTIVE</span>
            </div>
            <span className="font-label text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">V2.4.0-PRO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[10px] text-primary">verified_user</span>
            <span className="font-label text-[9px] uppercase tracking-[0.2em] text-on-surface">ENC_AES_256</span>
          </div>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 w-2/3 h-full overflow-hidden pointer-events-none opacity-10 mix-blend-screen">
        <img
          alt="Tech background circuit board"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5cbor7xSRXmFHgKdIBmmtX-_Nh0ij8GsuVOCXModWXLP7RjLtF1EN0caNT1EQQz4XUfJDMLG8dWhU9WL7upmKcBMMNBJo6kfSAuZ2A4bjdyFDGHX0lihfbZ3rB_7kJF8X06KUedcj4JvzppA6S8oL64UNXJK0DrOdXXrvTatkZMAWjAwicSaHfG8yNf621bbRXY7mwKt_5-ktCOoJ1XGRiSpeRpVobDDDoFOA3llDGSTKJ99AqPHbO3sVhyC2HT35UZm13DuuKQ"
        />
      </div>
    </div>
  )
}

export default Login
