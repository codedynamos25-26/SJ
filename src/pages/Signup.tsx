import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tracks = [
  { id: 'Frontend', label: 'Frontend', icon: 'web' },
  { id: 'Backend', label: 'Backend', icon: 'dns' },
  { id: 'ML', label: 'ML / AI', icon: 'psychology' },
  { id: 'Security', label: 'Security', icon: 'shield' },
  { id: 'Fullstack', label: 'Fullstack', icon: 'hub' },
]

const Signup = () => {
  const { signup, isLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!selectedTrack) {
      setError('Select a primary discipline.')
      return
    }

    try {
      await signup({ email, name, password, track: selectedTrack })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Signup failed. Please try again.')
    }
  }

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex items-center justify-center overflow-hidden py-12">
      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#d3ef57 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -right-1/4 w-[60%] h-[60%] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-primary/8 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 w-full max-w-xl px-6">
        <div className="kinetic-glass technical-border rounded-lg p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="scanline" />

          {/* Header */}
          <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-surface-variant border border-outline-variant mb-6 group hover:border-primary transition-all duration-500">
              <span className="material-symbols-outlined text-primary text-4xl">deployed_code</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl tracking-[0.2em] text-on-surface uppercase italic">
              ESTABLISH CREDENTIALS
            </h1>
            <p className="font-mono text-primary text-[10px] mt-2 tracking-[0.3em] uppercase opacity-80">
              New Operator Registration // CODE DYNAMOS
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-error/10 border border-error/30 text-error text-xs font-mono rounded-sm relative z-10">
              {error}
            </div>
          )}

          <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="name">
                Operator Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-outline-variant/30">
                  <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">person</span>
                </div>
                <input
                  className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 pl-14 pr-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                  id="name"
                  name="name"
                  placeholder="FULL_NAME"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="email">
                User Identifier
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-outline-variant/30">
                  <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">alternate_email</span>
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

            {/* Password row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="password">
                  Cipher Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-outline-variant/30">
                    <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">key</span>
                  </div>
                  <input
                    className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 pl-14 pr-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="confirm">
                  Confirm
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-outline-variant/30">
                    <span className="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">lock</span>
                  </div>
                  <input
                    className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 pl-14 pr-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                    id="confirm"
                    name="confirm"
                    placeholder="••••••••"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Track Selection */}
            <div className="space-y-3">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1">
                Primary Discipline
              </label>
              <div className="grid grid-cols-5 gap-2">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTrack(t.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-sm border text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                      selectedTrack === t.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant bg-surface-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="w-full bg-primary hover:bg-white text-on-primary font-headline font-extrabold py-4 rounded-sm flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] group tracking-[0.15em] text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'DEPLOYING...' : 'DEPLOY PROFILE'}</span>
              {!isLoading && (
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">rocket_launch</span>
              )}
            </button>
          </form>

          <p className="text-center mt-8 font-mono text-[11px] text-on-surface-variant tracking-wide relative z-10">
            ALREADY REGISTERED?{' '}
            <Link className="text-primary font-bold hover:underline underline-offset-4 ml-1" to="/login">
              INITIALIZE SESSION
            </Link>
          </p>
        </div>

        {/* Status */}
        <div className="mt-8 flex justify-between items-center px-4 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d3ef57]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface">Registration Open</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">WEB WEAVE '26</span>
        </div>
      </main>

      {/* BG decoration */}
      <div className="fixed top-0 left-0 w-2/3 h-full overflow-hidden pointer-events-none opacity-10 mix-blend-screen">
        <img
          alt="Circuit board background"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5cbor7xSRXmFHgKdIBmmtX-_Nh0ij8GsuVOCXModWXLP7RjLtF1EN0caNT1EQQz4XUfJDMLG8dWhU9WL7upmKcBMMNBJo6kfSAuZ2A4bjdyFDGHX0lihfbZ3rB_7kJF8X06KUedcj4JvzppA6S8oL64UNXJK0DrOdXXrvTatkZMAWjAwicSaHfG8yNf621bbRXY7mwKt_5-ktCOoJ1XGRiSpeRpVobDDDoFOA3llDGSTKJ99AqPHbO3sVhyC2HT35UZm13DuuKQ"
        />
      </div>
    </div>
  )
}

export default Signup
