import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../lib/api'
import logoImg from '../assets/logo.jpeg'
import { motion, AnimatePresence } from 'framer-motion'

export default function UnifiedAuth() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('')
    setLoading(true)
    const credential = credentialResponse.credential

    try {
      // Send token securely to backend to login or auto-register with default empty fields
      const res = await api.post<{
        token?: string
        user?: any
        error?: string
      }>('/auth/google', { credential })

      if (res.data.user) {
        // Log user in successfully and redirect to dashboard
        localStorage.setItem('cd_user', JSON.stringify(res.data.user))
        window.location.href = res.data.user.role === 'admin' ? '/admin' : '/dashboard'
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.error || 'Authentication failed. Please verify your student email.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0A0A0A] font-body text-on-surface min-h-screen flex items-center justify-center overflow-hidden py-12 relative">
      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#d3ef57 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      {/* Dynamic Ambient Blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-[60%] h-[60%] bg-[#d3ef57]/5 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-[#0D0D0D]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d3ef57]/40 to-transparent" />
          
          {/* Brand header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/5 border border-white/10 mb-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#d3ef57]/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <img 
                src={logoImg} 
                alt="Code Dynamos Logo" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <h1 className="font-headline font-black text-4xl tracking-tighter text-white uppercase italic">
              Welcome Dynamite
            </h1>
            <p className="font-mono text-primary text-[10px] mt-2 tracking-[0.3em] uppercase">
              Happy Journey
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

          <AnimatePresence mode="wait">
            <motion.div
              key="step-login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center gap-8 py-4"
            >
              <div className="text-center max-w-sm space-y-3">
                <h3 className="text-sm font-mono uppercase tracking-widest text-white/80">Authorized access protocol</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Access is strictly restricted to students holding valid <span className="text-primary font-bold">@cmr.edu.in</span> accounts.
                </p>
              </div>

              <div className="w-full max-w-xs flex flex-col items-center gap-4 relative z-50">
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin" />
                    <span className="font-mono text-[9px] text-primary uppercase tracking-widest animate-pulse">VERIFYING_CREDENTIALS...</span>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="flex justify-center scale-110 hover:scale-105 transition-all">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign-In was cancelled or failed.')}
                        theme="filled_black"
                        size="large"
                        shape="pill"
                        width="280px"
                      />
                    </div>
                    <Link
                      to="/admin-login"
                      className="mt-2 text-white/30 hover:text-[#ffb4ab] font-mono text-[9px] uppercase tracking-widest transition-all duration-300 border border-white/5 hover:border-red-500/20 px-4 py-2 bg-white/[0.02] rounded-full"
                    >
                      Access Admin Terminal
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-white/5 pt-8 w-full flex justify-center">
                <div className="flex items-center gap-6 font-mono text-[10px] text-white/30 uppercase tracking-widest leading-loose">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Security Verified -SJ
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Back Link to Home */}
        <div className="mt-8 flex justify-center items-center px-4">
          <Link to="/" className="text-white/40 hover:text-white font-mono text-[11px] flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
