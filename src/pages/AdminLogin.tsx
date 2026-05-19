import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.jpeg'
import { motion } from 'framer-motion'

export default function AdminLogin() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      const u = await login(email, password)
      if (u.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        setError('Access restricted to administrators only. Members must authenticate via Google SSO.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please verify your admin credentials.'
      setError(msg)
    }
  }

  return (
    <div className="bg-[#0A0A0A] font-body text-on-surface selection:bg-[#ffb4ab] selection:text-black min-h-screen flex items-center justify-center overflow-hidden py-12 relative">
      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#ffb4ab 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* Dynamic Ambient Blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-[60%] h-[60%] bg-red-500/5 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-[#ffb4ab]/5 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-[#0D0D0D]/80 backdrop-blur-2xl border border-red-500/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ffb4ab]/40 to-transparent" />
          <div className="scanline opacity-20 pointer-events-none" />

          {/* Brand header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/5 border border-red-500/20 mb-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <img 
                src={logoImg} 
                alt="Code Dynamos Logo" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <h1 className="font-headline font-black text-4xl tracking-tighter text-white uppercase italic">
              Admin Terminal
            </h1>
            <p className="font-mono text-[#ffb4ab] text-[10px] mt-2 tracking-[0.3em] uppercase">
              Secure Operations Access
            </p>
          </div>

          {/* Alert Banner */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded-xl flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              <div>{error}</div>
            </motion.div>
          )}

          {/* Form */}
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="font-mono text-[9px] uppercase tracking-widest text-white/40 ml-1" htmlFor="email">
                Admin Email
              </label>
              <input
                className="w-full bg-[#141414] border border-white/10 focus:border-red-500/50 rounded-2xl py-4 px-6 text-white font-mono placeholder-white/10 transition-all text-xs focus:ring-0 focus:outline-none"
                id="email"
                placeholder="ADMINSJ@CODEDYNAMOS.CLUB"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-white/40" htmlFor="password">
                  Cipher Password
                </label>
                <Link className="font-mono text-[9px] uppercase tracking-widest text-[#ffb4ab] hover:underline" to="/forgot-password">
                  Forgot protocol?
                </Link>
              </div>
              <input
                className="w-full bg-[#141414] border border-white/10 focus:border-red-500/50 rounded-2xl py-4 px-6 text-white font-mono placeholder-white/10 transition-all text-xs focus:ring-0 focus:outline-none"
                id="password"
                placeholder="ENTER SECURE PASSWORD"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="w-full bg-[#ffb4ab] hover:bg-white text-black font-headline font-extrabold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] group tracking-[0.15em] text-xs disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'DECRYPTING...' : 'ACCESS CENTRAL CORE'}</span>
              {!isLoading && (
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  key
                </span>
              )}
            </button>

            <div className="mt-8 border-t border-white/5 pt-8 w-full flex justify-center">
              <div className="flex items-center gap-6 font-mono text-[10px] text-white/30 uppercase tracking-widest leading-loose">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Admin Console SECURE
              </div>
            </div>
          </form>
        </div>

        {/* Back Link to Standard Auth */}
        <div className="mt-8 flex justify-center items-center px-4">
          <Link to="/" className="text-white/40 hover:text-white font-mono text-[11px] flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Back to Public View
          </Link>
        </div>
      </main>
    </div>
  )
}
