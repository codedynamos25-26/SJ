import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import logoImg from '../assets/logo.jpeg'

const semesters = [
  { id: '1', label: 'SEM_1' },
  { id: '2', label: 'SEM_2' },
  { id: '3', label: 'SEM_3' },
  { id: '4', label: 'SEM_4' },
  { id: '5', label: 'SEM_5' },
  { id: '6', label: 'SEM_6' },
  { id: '7', label: 'SEM_7' },
  { id: '8', label: 'SEM_8' },
]

const Signup = () => {
  const { signup, isLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [usn, setUsn] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!usn || !department || !year) {
      setError('USN, Department, and Year are required.')
      return
    }
    if (!selectedSemester) {
      setError('Select your current semester.')
      return
    }

    try {
      await signup({ 
        email, 
        name, 
        password, 
        track: 'Fullstack', // Default track
        semester: selectedSemester,
        usn: usn || undefined,
        department: department || undefined,
        year: year || undefined
      })
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
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-surface-variant/50 border border-outline-variant mb-6 group transition-all duration-500 hover:border-primary overflow-hidden shadow-xl">
              <img 
                src={logoImg} 
                alt="Code Dynamos Logo" 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
              />
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

            {/* USN / Dept / Year (For Students) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="usn">
                  USN
                </label>
                <input
                  className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 px-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                  id="usn"
                  placeholder="1CR22CS001"
                  type="text"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="dept">
                  Department
                </label>
                <input
                  className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 px-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                  id="dept"
                  placeholder="CSE / ISE / AIML"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1" htmlFor="year">
                  Year
                </label>
                <input
                  className="w-full bg-surface-variant/50 border border-outline-variant focus:border-primary focus:ring-0 rounded-sm py-4 px-4 text-on-surface font-body placeholder-on-surface-variant/30 transition-all text-sm"
                  id="year"
                  placeholder="1 / 2 / 3 / 4"
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
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

            {/* Semester Selection */}
            <div className="space-y-3">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant ml-1">
                Current Semester
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {semesters.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSemester(s.id)}
                    className={`flex flex-col items-center justify-center py-3 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                      selectedSemester === s.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant bg-surface-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
                    }`}
                  >
                    {s.label}
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
        <div className="mt-8 flex justify-center items-center px-4 opacity-60">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#d3ef57]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface">Welcome</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">- SJ</span>
          </div>
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
