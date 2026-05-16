import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No reset token provided. Please use the link from your email.')
    }
  }, [token])

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
    onSuccess: (res) => {
      setSuccessMessage(res.data.message || 'Password has been reset successfully')
      setError('')
      setTimeout(() => navigate('/login'), 3000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to reset password.')
      setSuccessMessage('')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Invalid reset link')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    resetMutation.mutate(password)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#111] border border-white/10 p-8 shadow-2xl relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Reset Password</h1>
            <p className="text-sm font-mono text-white/40">Enter your new secure password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-1">New Password</label>
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-1">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:border-primary focus:outline-none transition-colors rounded"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            {error && <div className="text-xs font-mono text-error uppercase">{error}</div>}
            {successMessage && <div className="text-xs font-mono text-primary uppercase">{successMessage}<br/>Redirecting to login...</div>}

            <button
              type="submit"
              disabled={resetMutation.isPending || !token}
              className="w-full bg-primary text-black font-black uppercase tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-50 mt-4 rounded"
            >
              {resetMutation.isPending ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-mono text-white/40">
            <Link to="/login" className="text-primary hover:underline">Return to Login</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPasswordPage
