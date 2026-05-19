import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import PublicLayout from '../components/layouts/PublicLayout'
import { useAuth } from '../context/AuthContext'
import logoImg from '../assets/logo.jpeg'
import { motion, AnimatePresence } from 'framer-motion'

interface HomeStats {
  totalUsers: number
  totalEvents: number
  totalChallenges: number
  totalProjects: number
}

interface Challenge {
  id: string
  title: string
  difficulty: string
  xp: number
  participants: number
  pool: number
  description: string
}

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const characters = '01<>[]{}/\\+=&*!@#$_-ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#d3ef57'
      ctx.font = `bold ${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillText(text, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none"
    />
  )
}

const HomePage = () => {
  const { user } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [isZooming, setIsZooming] = useState(false)

  useEffect(() => {
    if (!showSplash) return
    
    // Stay static for 1 second, then zoom
    const zoomTimeout = setTimeout(() => {
      setIsZooming(true)
    }, 1000)

    // Unmount splash screen after zoom completes (600ms)
    const hideTimeout = setTimeout(() => {
      setShowSplash(false)
    }, 1600)

    return () => {
      clearTimeout(zoomTimeout)
      clearTimeout(hideTimeout)
    }
  }, [showSplash])

  const { data: stats = { totalUsers: 0, totalEvents: 0, totalChallenges: 0, totalProjects: 0 } } = useQuery<HomeStats>({
    queryKey: ['homeStats'],
    queryFn: () => api.get<HomeStats>('/stats/home').then(r => r.data).catch(() => ({ 
      totalUsers: 0, 
      totalEvents: 0, 
      totalChallenges: 0, 
      totalProjects: 0 
    })),
  })

  const { data: challenges = [], isLoading: isChallengesLoading } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => api.get<Challenge[]>('/challenges').then(r => r.data),
  })

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: isZooming ? 0 : 1,
            }}
            transition={{ duration: 0.6, ease: [0.6, 0.05, -0.01, 0.9] }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Cyber Matrix Digital Code Rain canvas */}
            <MatrixRain />

            {/* Subtle Overlay Grid */}
            <div 
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(211,239,87,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(211,239,87,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />

            {/* Glowing Mainframe Sonar Pulse Ripples */}
            <motion.div
              animate={{ scale: [0.8, 2.5], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeOut" }}
              className="absolute w-60 h-60 border border-primary/20 rounded-full pointer-events-none"
            />
            <motion.div
              animate={{ scale: [0.8, 3.5], opacity: [0.2, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeOut", delay: 1.8 }}
              className="absolute w-60 h-60 border border-primary/10 rounded-full pointer-events-none"
            />

            {/* Floating Cybernetic Translucent Binary Columns */}
            <div className="absolute inset-x-8 top-16 bottom-16 flex justify-between opacity-[0.03] font-mono text-[9px] text-primary select-none pointer-events-none">
              <div className="flex flex-col gap-2.5">
                <span>INIT_PROTOCOL: SUCCESS</span>
                <span>MEM_ADDR: 0x7F3B92A</span>
                <span>SYS_STABLE: 100%</span>
                <span>SJ_VERIFIED: ACTIVE</span>
                <span>LATENCY_POLL: OK</span>
              </div>
              <div className="flex flex-col gap-2.5 text-right">
                <span>PORT_CORE: 5000</span>
                <span>NET_LATENCY: 12ms</span>
                <span>DB_SYNCHRONIZED</span>
                <span>ACCESS: OPERATOR</span>
                <span>SESSION: SECURE</span>
              </div>
            </div>

            <div className="scanline" />

            {/* Cinematic zooming Logo Container */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ 
                scale: isZooming ? 20 : 1, 
                opacity: isZooming ? 0 : 1,
              }}
              transition={{ 
                duration: isZooming ? 0.6 : 0.8,
                ease: isZooming ? [0.6, 0.05, -0.01, 0.9] : "easeOut"
              }}
              className="text-center relative z-10 flex flex-col items-center max-w-sm px-6"
            >
              <div className="relative group mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  className="absolute -inset-4 rounded-full border border-dashed border-primary/30"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                  className="absolute -inset-2 rounded-full border border-dotted border-white/10"
                />
                <div className="w-28 h-28 rounded-full border border-white/10 overflow-hidden shadow-2xl p-1 bg-black/40">
                  <img src={logoImg} alt="Code Dynamos Logo" className="w-full h-full object-cover rounded-full" />
                </div>
              </div>

              <h2 className="font-headline font-black text-3xl tracking-wider text-white uppercase italic">
                CODE DYNAMOS
              </h2>
              <div className="font-mono text-[9px] text-primary uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                System Initializing
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PublicLayout>

        <main>

          {/* Hero Section */}
          <section className="relative min-h-[650px] flex items-center px-8 overflow-hidden pt-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(211,239,87,0.05)_0%,_transparent_50%)] z-0" />
            <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              <div className="lg:col-span-7">
                <h1 className="font-headline text-7xl md:text-8xl font-black tracking-tight leading-none mb-8 uppercase italic animate-fadeInScale">
                  Build. <br />
                  <span className="text-primary bg-gradient-to-r from-primary to-secondary/50 bg-clip-text text-transparent animate-glow">Compete.</span> <br />
                  Connect.
                </h1>
                <p className="font-body text-lg text-on-surface-variant max-w-xl mb-12 leading-relaxed border-l-2 border-white/10 pl-6 animate-slideInRight">
                  <i>From Hello World to changing the world.</i> <br />
                  The official coding club and technical hub for future architects.
                </p>
                <div className="flex flex-wrap gap-4">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="bg-primary px-10 py-5 text-on-primary font-black text-sm uppercase tracking-[0.2em] hover:brightness-110 transition-all border border-primary"
                    >
                      Operator Hub
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      className="bg-primary px-10 py-5 text-on-primary font-black text-sm uppercase tracking-[0.2em] hover:brightness-110 transition-all border border-primary"
                    >
                      Initialize Access
                    </Link>
                  )}
                <Link
                  to="/events"
                  className="bg-transparent border border-white/20 px-10 py-5 text-on-surface font-black text-sm uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Can YOU??
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative p-2 bg-[#141414] border border-white/10 rounded-sm overflow-hidden">
                  <div className="scanline" />
                  <img
                    alt="Code Dynamos Elite Club Operatives"
                    className="grayscale group-hover:grayscale-0 transition-all duration-1000 object-cover aspect-[4/5] border border-white/5 w-full h-[500px] scale-105 group-hover:scale-100"
                    src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800"
                  />
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="h-px w-12 bg-primary" />
                    <div className="h-px w-8 bg-primary" />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-primary text-on-primary px-6 py-2 text-[11px] font-black tracking-[0.3em] uppercase shadow-[0_20px_40px_rgba(211,239,87,0.3)] transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                  welcome dynamites
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-[#141414] border-y border-white/5 py-12">
          <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-primary mb-1">{stats.totalUsers}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Active_Operators</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-white mb-1">{stats.totalEvents}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Sprints_Per_Annum</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-white mb-1">{stats.totalChallenges}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Live_Challenges</div>
            </div>
            <div className="border-l border-white/10 pl-6">
              <div className="text-4xl font-black text-primary mb-1">{stats.totalProjects}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">Projects_Deployed</div>
            </div>
          </div>
        </section>

        {/* 2025–26 Club Wrap-Up */}
        <section className="py-20 bg-[#0A0A0A] relative overflow-hidden">
          {/* Ambient lighting */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="px-8 max-w-[1440px] mx-auto">
            <div className="mb-16">
              <div className="text-[10px] font-mono tracking-[0.5em] text-primary uppercase mb-3">HISTORICAL LOG // ARCHIVE</div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4 text-white">
                2025–26 Club Wrap-Up
              </h2>
              <div className="h-1 w-32 bg-primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Timeline / Visual Milestone Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <div className="text-[9px] font-mono text-primary uppercase tracking-[0.2em] mb-2">// 01 / FOUNDATION</div>
                  <h4 className="text-lg font-bold text-white mb-2 uppercase italic">CSE FOUNDING LEGACY</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-body">
                    Founded through the vision of CSE students <strong className="text-white">Sujal Jondhale</strong> and <strong className="text-white">Jayaduran T</strong> under the expert guidance of <strong className="text-white">Dr. G. Sharmila</strong>.
                  </p>
                </div>

                <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                  <div className="text-[9px] font-mono text-blue-400 uppercase tracking-[0.2em] mb-2">// 02 / OBSTACLES OVERCOME</div>
                  <h4 className="text-lg font-bold text-white mb-2 uppercase italic">Dedication & Teamwork</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-body">
                    From initial approvals and resource management to balancing tight academic schedules, overcoming obstacles shaped our strong core.
                  </p>
                </div>

                <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-orange-500/20 transition-all duration-500">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                  <div className="text-[9px] font-mono text-orange-400 uppercase tracking-[0.2em] mb-2">// 03 / COMMUNITY</div>
                  <h4 className="text-lg font-bold text-white mb-2 uppercase italic">Space For Innovation</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-body">
                    More than a club — a hub for learning, collaboration, networking, and college-wide hackathon achievements.
                  </p>
                </div>
              </div>

              {/* Main Detailed Narrative Section */}
              <div className="lg:col-span-8 bg-[#141414]/40 border border-white/5 p-8 md:p-12 rounded-3xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d3ef57]/30 to-transparent" />
                <div className="scanline opacity-20 pointer-events-none" />

                <div className="space-y-6 text-on-surface-variant text-sm leading-relaxed font-body">
                  <p className="text-base text-white/90 font-light italic">
                    The year 2025 marked the beginning of an incredible journey for our club. What started as a simple idea soon grew into a vibrant community of passionate, talented, and driven students. With the success and enthusiasm we witnessed throughout the year, we proudly chose to continue and expand the club with even more opportunities and activities for students.
                  </p>
                  
                  <p>
                    The club was founded by the CSE Department through the efforts of students <strong className="text-primary font-bold">Sujal Jondhale</strong> and <strong className="text-primary font-bold">Jayaduran T</strong>, under the valuable guidance of <strong className="text-white">Dr. G. Sharmila</strong>. Our vision was to create a platform where students could connect with talented individuals, build strong professional networks, collaborate on innovative projects, and actively participate in events and hackathons conducted by various colleges and organizations.
                  </p>

                  <p>
                    Like every meaningful journey, we also faced several challenges along the way. From obtaining management approvals and organizing resources to encouraging student participation and balancing academic schedules with club activities, the journey was not always easy. Managing time, coordinating events, and maintaining consistency required dedication and teamwork from everyone involved.
                  </p>

                  <p>
                    However, despite these obstacles, the unwavering support from students with great vision and enthusiasm kept the club moving forward. Their active participation, creative ideas, and willingness to contribute played a major role in shaping the club into what it is today. We are also deeply grateful to the management and faculty members for believing in our mission and supporting us throughout the process. We would especially like to express our sincere gratitude to our HOD <strong className="text-primary font-bold">Dr. Rubini P</strong>, Dean <strong className="text-primary font-bold">Dr. Kannan N</strong>, and mentor <strong className="text-white">Dr. G. Sharmila</strong> for their constant encouragement, valuable guidance, and continuous support towards the success and growth of the club.
                  </p>

                  <p>
                    Over the year, the club became more than just a student organization — it became a space for learning, collaboration, innovation, and growth. Through teamwork and networking, members explored new technologies, participated in competitions, gained valuable experiences, and created memorable moments together. We would also like to extend our heartfelt gratitude to our amazing team members <strong className="text-primary font-bold">Sai Niranjanaa D, Abhishek C K, Sidhant Saswat, Kavin, and Dikshith</strong> for joining us on this journey and contributing their dedication, creativity, and teamwork towards the growth of the club. Their constant support and enthusiasm played an important role in making our initiatives successful and impactful. A special thanks to every member, participant, faculty mentor, and supporter who believed in our vision and helped us build a strong and inspiring community. Every event organized, every project completed, and every milestone achieved was possible because of the collective efforts of passionate individuals working together with a shared purpose.
                  </p>

                  <p>
                    As we wrap up the 2025–26 journey, we look back with pride on everything we achieved and look ahead with excitement for what is yet to come. This is only the beginning, and we are committed to making the club even stronger in the coming years.
                  </p>

                  <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-white font-headline font-bold text-base mb-2 uppercase tracking-wide">
                      ⚡ Join the Operations
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      We warmly invite more students to join our club and become part of this growing community. Whether you are passionate about technology, innovation, teamwork, or simply eager to learn and explore new opportunities, our club is the perfect place to grow your skills, build connections, and create an impact. Together, let us continue to learn, innovate, and achieve greater milestones in the years ahead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Current Sprints / Featured Challenges */}
        <section className="py-16 bg-[#141414] px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-20">
              <div className="text-[10px] font-black tracking-[0.5em] text-primary uppercase mb-4">ACTIVE OPERATIONS</div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">Current Sprints</h2>
            </div>
            {isChallengesLoading ? (
              <div className="lab-panel p-10 flex flex-col justify-center items-center h-64 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 animate-pulse">terminal</span>
                <h3 className="text-xl font-black uppercase tracking-widest text-on-surface-variant">Loading Sprints...</h3>
              </div>
            ) : challenges.length === 0 ? (
              <div className="lab-panel p-10 flex flex-col justify-center items-center h-64 border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">terminal</span>
                <h3 className="text-xl font-black uppercase tracking-widest text-on-surface-variant">No Active Sprints</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.slice(0, 3).map((ch) => (
                  <div key={ch.id} className="lab-panel p-8 border border-outline-variant/30 group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">{ch.difficulty}</span>
                      <span className="text-[10px] font-black text-secondary">+{ch.xp} XP</span>
                    </div>
                    <h3 className="text-xl font-black uppercase mb-3 group-hover:text-primary transition-colors">{ch.title}</h3>
                    <p className="text-sm text-on-surface-variant mb-6 line-clamp-2">{ch.description}</p>
                    <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-5">
                      <span>{ch.participants} participants</span>
                      <span>₹{Math.round(ch.pool / 1000)}K pool</span>
                    </div>
                    <Link
                      to={`/challenges/${ch.id}`}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"
                    >
                      View Sprint <span className="w-4 h-[1px] bg-primary inline-block" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                to="/challenges"
                className="border border-white/20 px-12 py-4 text-sm font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all inline-block"
              >
                View All Active Sprints
              </Link>
            </div>
          </div>
        </section>

      </main>
    </PublicLayout>
  </>
)
}

export default HomePage
