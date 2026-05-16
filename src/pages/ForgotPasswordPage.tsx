import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  const forgotMutation = useMutation({
    mutationFn: (email: string) => api.post('/auth/forgot-password', { email }),
    onSuccess: (res) => {
      setSuccessMessage(res.data.message || 'If an account exists, a reset link was sent.')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to send reset email.')
      setSuccessMessage('')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Email is required')
      return
    }
    forgotMutation.mutate(email)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#111] border border-white/10 p-8 shadow-2xl relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Forgot Password</h1>
            <p className="text-sm font-mono text-white/40">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@dynamos.com"
              />
            </div>

            {error && <div className="text-xs font-mono text-error uppercase">{error}</div>}
            {successMessage && <div className="text-xs font-mono text-primary uppercase">{successMessage}</div>}

            <button
              type="submit"
              disabled={forgotMutation.isPending}
              className="w-full bg-primary text-black font-black uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50 mt-4 rounded"
            >
              {forgotMutation.isPending ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-mono text-white/40">
            Remembered your password? <Link to="/login" className="text-primary hover:underline">Return to Login</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage
