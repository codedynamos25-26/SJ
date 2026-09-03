import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

type Tab = 'members' | 'events' | 'challenges' | 'gallery' | 'projects' | 'announcements' | 'team'

interface Member { id: string; email: string; name: string; role: string; xp: number; track: string; usn?: string; department?: string; year?: string; githubUrl?: string; createdAt: string }
interface Event { id: string; type: string; date: string; title: string; description: string; slots: number; total: number; status: string; location: string; accent: string; image?: string; benefits?: string[]; schedule?: (string | { time: string; activity: string })[]; requirements?: string[]; enrollmentXp?: number; externalUrl?: string; endsAt?: string | null; closedByTime?: boolean }
interface Challenge { id: string; title: string; difficulty: string; xp: number; pool: number; completions: number; participants: number; tags: string[]; description: string; status: string; enrollmentXp?: number; externalUrl?: string; endsAt?: string | null; closedByTime?: boolean; requirements?: string[]; timeline?: string[]; prizes?: string[]; image?: string }
interface GalleryPhoto { id: string; tag: string; year: string; label: string; span: string; img: string; driveUrl?: string | null }
interface Project { id: string; title: string; description: string; status: string; tech: string[]; stars: number; forks: number; img: string; githubUrl?: string }
interface TeamMember { id: string; name: string; role: string; dept: string; tier: string; image?: string; instagramUrl?: string; linkedinUrl?: string }

const DIFF_COLORS: Record<string, string> = { Legendary: 'text-primary', Hard: 'text-error', Medium: 'text-secondary', Easy: 'text-tertiary-fixed' }

const toCommaList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

const toLineList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

/**
 * Fast Client-Side Image Compressor & Converter
 * Resizes and compresses user-uploaded images to lightweight WebP/JPEG format
 * (Shrinks 10MB camera files to ~100KB-150KB before uploading to server/DB).
 */
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size <= 150 * 1024) {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(event.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const compressed = canvas.toDataURL('image/webp', quality)
        if (compressed && compressed.length > 50 && compressed.startsWith('data:image/webp')) {
          resolve(compressed)
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
      }
      img.onerror = () => resolve(event.target?.result as string)
      img.src = event.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

/**
 * Auto-converts Google Drive file/view links to direct high-speed CDN image URLs.
 */
const formatDriveImageUrl = (url: string): string => {
  if (!url) return ''
  let formatted = url.trim()
  if (formatted.includes('drive.google.com/file/d/')) {
    const id = formatted.split('/d/')[1]?.split('/')[0]?.split('?')[0]
    if (id) return `https://lh3.googleusercontent.com/d/${id}`
  } else if (formatted.includes('drive.google.com/open?id=')) {
    const id = formatted.split('id=')[1]?.split('&')[0]
    if (id) return `https://lh3.googleusercontent.com/d/${id}`
  } else if (formatted.includes('drive.google.com/uc?id=')) {
    const id = formatted.split('id=')[1]?.split('&')[0]
    if (id) return `https://lh3.googleusercontent.com/d/${id}`
  }
  return formatted
}

const toScheduleList = (value: unknown): (string | { time: string; activity: string })[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (entry && typeof entry === 'object' && 'time' in entry && 'activity' in entry) {
        return entry as { time: string; activity: string };
      }
      const line = String(entry).trim();
      if (!line) return null;
      const dividerIndex = line.indexOf('|');
      if (dividerIndex === -1) return line;

      const time = line.slice(0, dividerIndex).trim();
      const activity = line.slice(dividerIndex + 1).trim();
      if (!time || !activity) return line;

      return { time, activity };
    }).filter((x): x is string | { time: string; activity: string } => x !== null);
  }

  const lines = toLineList(value);
  return lines.map((line) => {
    const dividerIndex = line.indexOf('|');
    if (dividerIndex === -1) return line;

    const time = line.slice(0, dividerIndex).trim();
    const activity = line.slice(dividerIndex + 1).trim();
    if (!time || !activity) return line;

    return { time, activity };
  });
}

const toScheduleTextareaValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''

  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry
      return `${entry.time} | ${entry.activity}`
    })
    .join('\n')
}

const blankEvent = (): Partial<Event> => ({ type: 'Workshop', date: '', title: '', description: '', slots: 30, total: 30, status: 'Open', location: '', accent: '#d3ef57', image: '', benefits: [], schedule: [], requirements: [], enrollmentXp: 0, externalUrl: '' })
const blankChallenge = (): Partial<Challenge> => ({
  title: '',
  difficulty: 'Medium',
  xp: 500,
  pool: 2500,
  description: '',
  tags: [],
  requirements: ['Valid member account', 'Solo participation only', 'Submission via GitHub repo'],
  timeline: [
    'Registration|Enroll before sprint starts',
    'Sprint|Solve within the time window',
    'Submission|Push your final solution',
    'Review|Panel review + auto-scoring',
  ],
  prizes: ['1st|₹10,000 + XP Boost', '2nd|₹5,000', '3rd|₹2,500'],
  status: 'Open',
  enrollmentXp: 0,
  externalUrl: '',
  image: '',
})
const blankPhoto = (): Partial<GalleryPhoto> => ({ tag: 'Workshops', year: '2026', label: '', span: '', img: '', driveUrl: '' })
const blankProject = (): Partial<Project> => ({ title: '', description: '', status: 'Beta', tech: [], stars: 0, forks: 0, img: '', githubUrl: '' })
const blankTeamMember = (): Partial<TeamMember> => ({ name: '', role: '', dept: '', tier: 'Operator', image: '', instagramUrl: '', linkedinUrl: '' })

const AdminDashboard = () => {
  const [tab, setTab] = useState<Tab>('members')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Modal state
  const [eventModal, setEventModal] = useState<{ open: boolean; data: Partial<Event>; editing: boolean }>({ open: false, data: blankEvent(), editing: false })
  const [challengeModal, setChallengeModal] = useState<{ open: boolean; data: Partial<Challenge>; editing: boolean }>({ open: false, data: blankChallenge(), editing: false })
  const [photoModal, setPhotoModal] = useState<{ open: boolean; data: Partial<GalleryPhoto> }>({ open: false, data: blankPhoto() })
  const [projectModal, setProjectModal] = useState<{ open: boolean; data: Partial<Project>; editing: boolean }>({ open: false, data: blankProject(), editing: false })
  const [teamModal, setTeamModal] = useState<{ open: boolean; data: Partial<TeamMember>; editing: boolean }>({ open: false, data: blankTeamMember(), editing: false })
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'member' | 'event' | 'challenge' | 'photo' | 'project' | 'team'; id: string } | null>(null)
  const [participantsModal, setParticipantsModal] = useState<{ open: boolean; type: 'event' | 'challenge'; id: string; title: string } | null>(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const handleBackup = async () => {
    try {
      const res = await api.get('/admin/backup', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'code-dynamos-db-backup.json')
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Backup download failed', error)
      alert('Failed to download database backup.')
    }
  }

  // Queries
  const { data: members = [] } = useQuery<Member[]>({ queryKey: ['admin-members'], queryFn: () => api.get('/admin/members').then(r => r.data), enabled: tab === 'members' })
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ['admin-events'], queryFn: () => api.get('/admin/events').then(r => r.data), enabled: tab === 'events' })
  const { data: challenges = [] } = useQuery<Challenge[]>({ queryKey: ['admin-challenges'], queryFn: () => api.get('/admin/challenges').then(r => r.data), enabled: tab === 'challenges' })
  const { data: photos = [] } = useQuery<GalleryPhoto[]>({ queryKey: ['admin-gallery'], queryFn: () => api.get('/admin/gallery').then(r => r.data), enabled: tab === 'gallery' })
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ['admin-projects'], queryFn: () => api.get('/admin/projects').then(r => r.data), enabled: tab === 'projects' })
  const { data: team = [] } = useQuery<TeamMember[]>({ queryKey: ['admin-team'], queryFn: () => api.get('/admin/team').then(r => r.data), enabled: tab === 'team' })

  // Member role mutation
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/admin/members/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-members'] }),
  })
  // Member XP mutation (controls leaderboard)
  const xpMutation = useMutation({
    mutationFn: ({ id, xp }: { id: string; xp: number }) => api.patch(`/admin/members/${id}/xp`, { xp }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-members'] }),
  })
  // Member delete mutation
  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/members/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-members'] }); setDeleteConfirm(null) },
  })

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: (data: Partial<Event>) => api.post('/admin/events', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setEventModal({ open: false, data: blankEvent(), editing: false }) },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to create event'),
  })
  const updateEventMutation = useMutation({
    mutationFn: (data: Partial<Event>) => api.patch(`/admin/events/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setEventModal({ open: false, data: blankEvent(), editing: false }) },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to update event'),
  })
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/events/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setDeleteConfirm(null) },
  })

  // Challenge mutations
  const createChallengeMutation = useMutation({
    mutationFn: (data: Partial<Challenge>) => api.post('/admin/challenges', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-challenges'] }); setChallengeModal({ open: false, data: blankChallenge(), editing: false }) },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to create challenge'),
  })
  const updateChallengeMutation = useMutation({
    mutationFn: (data: Partial<Challenge>) => api.patch(`/admin/challenges/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-challenges'] }); setChallengeModal({ open: false, data: blankChallenge(), editing: false }) },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to update challenge'),
  })
  const deleteChallengeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/challenges/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-challenges'] }); setDeleteConfirm(null) },
  })

  // Gallery mutations
  const createPhotoMutation = useMutation({
    mutationFn: (data: Partial<GalleryPhoto>) => api.post('/admin/gallery', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-gallery'] }); setPhotoModal({ open: false, data: blankPhoto() }) },
  })
  const deletePhotoMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/gallery/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-gallery'] }); setDeleteConfirm(null) },
  })

  // Project mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: Partial<Project>) => api.post('/admin/projects', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-projects'] }); setProjectModal({ open: false, data: blankProject(), editing: false }) },
  })
  const updateProjectMutation = useMutation({
    mutationFn: (data: Partial<Project>) => api.patch(`/admin/projects/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-projects'] }); setProjectModal({ open: false, data: blankProject(), editing: false }) },
  })
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/projects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-projects'] }); setDeleteConfirm(null) },
  })

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: (data: Partial<TeamMember>) => api.post('/admin/team', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team'] }); setTeamModal({ open: false, data: blankTeamMember(), editing: false }) },
  })
  const updateTeamMutation = useMutation({
    mutationFn: (data: Partial<TeamMember>) => api.patch(`/admin/team/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team'] }); setTeamModal({ open: false, data: blankTeamMember(), editing: false }) },
  })
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/team/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-team'] }); setDeleteConfirm(null) },
  })

  const winnersMutation = useMutation({
    mutationFn: ({ type, id, winners }: { type: 'event' | 'challenge', id: string, winners: any[] }) =>
      api.post(`/admin/${type === 'event' ? 'events' : 'challenges'}/${id}/winners`, { winners }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] })
      setParticipantsModal(null)
    }
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'members', icon: 'group', label: 'Members' },
    { id: 'events', icon: 'event', label: 'Events' },
    { id: 'challenges', icon: 'terminal', label: 'Challenges' },
    { id: 'gallery', icon: 'photo_library', label: 'Gallery' },
    { id: 'projects', icon: 'science', label: 'Projects' },
    { id: 'team', icon: 'badge', label: 'Team' },
    { id: 'announcements', icon: 'campaign', label: 'Announcements' },
  ]

  return (
    <div className="overflow-x-hidden bg-[#0d141c] min-h-screen text-white font-headline">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[45] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#151c24] border-r border-white/5 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full py-6 px-4 overflow-y-auto">
          <div className="mb-8 px-2 flex items-center justify-between">
            <div>
              <h1 className="text-primary font-black text-lg tracking-tighter uppercase">CODE DYNAMOS</h1>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mt-0.5">Admin Panel</p>
            </div>
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex-1 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all ${
                  tab === item.id
                    ? 'text-primary bg-[#192028] border-r-4 border-primary'
                    : 'text-slate-400 hover:text-white hover:bg-[#192028]'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-lg">{item.icon}</span>
                <span className="font-mono uppercase tracking-wider text-xs">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-1 pt-4 border-t border-white/5">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="font-pixel text-xs text-primary">{user?.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-primary font-mono uppercase">Admin</div>
              </div>
            </div>
            <Link to="/" className="flex items-center px-4 py-2 text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined mr-3 text-sm">home</span>
              <span className="font-mono uppercase tracking-wider text-xs font-bold">Site Home</span>
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-slate-400 hover:text-error transition-colors">
              <span className="material-symbols-outlined mr-3 text-sm">logout</span>
              <span className="font-mono uppercase tracking-wider text-xs font-bold">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 h-14 z-40 bg-[#0d141c]/95 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-8 gap-3">
        <button
          className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex-1 text-xs font-mono uppercase tracking-widest text-on-surface-variant">
          Admin / <span className="text-white capitalize">{tab}</span>
        </div>
        <button 
          onClick={handleBackup} 
          className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest border border-outline-variant/30 text-on-surface-variant hover:text-white hover:border-primary px-3 py-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Backup DB
        </button>
      </header>

      {/* Main */}
      <main className="lg:ml-64 pt-14 p-4 md:p-6 lg:p-8 min-h-screen text-on-surface">

        {/* ── OVERVIEW ── */}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div>
            <div className="mb-8 flex justify-between items-end">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">OPERATOR REGISTRY</div>
                <h2 className="text-4xl font-black tracking-tighter">Members <span className="text-primary">({members.length})</span></h2>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-high">
                    <tr>
                      {['Operator', 'USN', 'Dept', 'Year', 'XP (Leaderboard)', 'Role'].map(h => (
                        <th key={h} className="px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-bright/20 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="font-pixel text-xs text-primary">{m.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white">{m.name}</div>
                              <div className="text-[10px] text-on-surface-variant font-mono">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{m.usn || '—'}</td>
                        <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{m.department || '—'}</td>
                        <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{m.year || '—'}</td>
                        <td className="px-4 py-4 font-mono text-sm text-primary font-bold">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={m.xp}
                              id={`xp-${m.id}`}
                              className="w-20 bg-surface-bright/20 border border-outline-variant/30 px-2 py-1 text-xs font-mono text-white rounded-sm focus:border-primary outline-none"
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById(`xp-${m.id}`) as HTMLInputElement
                                const val = parseInt(el.value, 10)
                                if (!isNaN(val)) xpMutation.mutate({ id: m.id, xp: val })
                              }}
                              className="text-[9px] font-mono px-2 py-1 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-on-primary transition-colors uppercase"
                            >
                              Set XP
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 border uppercase ${m.role === 'admin' ? 'text-primary border-primary' : 'text-on-surface-variant border-outline-variant'}`}>
                              {m.role}
                            </span>
                            <button
                              onClick={() => roleMutation.mutate({ id: m.id, role: m.role === 'admin' ? 'member' : 'admin' })}
                              className="text-[9px] font-mono px-2 py-1 border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-colors uppercase"
                            >
                              {m.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'member', id: m.id })}
                              className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors ml-2"
                              title="Delete Member"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS ── */}
        {tab === 'events' && (
          <div>
            <div className="mb-8 flex justify-between items-end">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">EVENT MANAGEMENT</div>
                <h2 className="text-4xl font-black tracking-tighter">Events <span className="text-primary">({events.length})</span></h2>
              </div>
              <button
                onClick={() => setEventModal({ open: true, data: blankEvent(), editing: false })}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 font-mono font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Event
              </button>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="bg-surface-container p-5 border border-outline-variant/10 flex items-center gap-6 group hover:border-primary/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[9px] font-mono font-black px-2 py-0.5 bg-primary/10 text-primary uppercase">{ev.type}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase ${ev.status === 'Open' ? 'border-tertiary-fixed/30 text-tertiary-fixed' : 'border-error/30 text-error'}`}>{ev.status}</span>
                    </div>
                    <Link to={`/events/${ev.id}`} className="font-bold text-white group-hover:text-primary transition-colors inline-block">{ev.title}</Link>
                    <div className="text-[10px] font-mono text-on-surface-variant mt-1">{ev.date} · {ev.location} · {ev.total - ev.slots} Participants</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/events/${ev.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-on-surface-variant border border-white/10 text-[10px] font-mono uppercase font-black hover:border-primary/40 hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Open
                    </Link>
                    <button
                      onClick={() => setParticipantsModal({ open: true, type: 'event', id: ev.id, title: ev.title })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/30 text-[10px] font-mono uppercase font-black hover:bg-secondary hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">groups</span>
                      Participants
                    </button>
                    <button
                      onClick={() => setEventModal({ open: true, data: { ...ev }, editing: true })}
                      className="p-2 text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        const newStatus = ev.status === 'Open' ? 'Closed' : 'Open';
                        updateEventMutation.mutate({ id: ev.id, status: newStatus, endsAt: newStatus === 'Open' ? null : ev.endsAt });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono uppercase font-black transition-all ${ev.status === 'Open' ? 'border-error/30 text-error hover:bg-error hover:text-white' : 'border-primary/30 text-primary hover:bg-primary hover:text-on-primary'}`}
                      title={ev.status === 'Open' ? 'End Registration' : (ev.closedByTime ? 'Resume Registration (Time Closed)' : 'Resume Registration')}
                    >
                      <span className="material-symbols-outlined text-sm">{ev.status === 'Open' ? 'block' : 'play_arrow'}</span>
                      {ev.status === 'Open' ? 'Close' : (ev.closedByTime ? 'Resume (Time)' : 'Resume')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'event', id: ev.id })}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CHALLENGES ── */}
        {tab === 'challenges' && (
          <div>
            <div className="mb-8 flex justify-between items-end">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">CHALLENGE MANAGEMENT</div>
                <h2 className="text-4xl font-black tracking-tighter">Challenges <span className="text-primary">({challenges.length})</span></h2>
              </div>
              <button
                onClick={() => setChallengeModal({ open: true, data: blankChallenge(), editing: false })}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 font-mono font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Challenge
              </button>
            </div>

            <div className="space-y-3">
              {challenges.map((ch) => (
                <div key={ch.id} className="bg-surface-container p-5 border border-outline-variant/10 flex items-center gap-6 group hover:border-primary/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 border uppercase ${DIFF_COLORS[ch.difficulty] ?? 'text-on-surface-variant'} border-current`}>{ch.difficulty}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase ${ch.status === 'Open' ? 'border-tertiary-fixed/30 text-tertiary-fixed' : 'border-error/30 text-error'}`}>{ch.status}</span>
                    </div>
                    <Link to={`/challenges/${ch.id}`} className="font-bold text-white group-hover:text-primary transition-colors inline-block">{ch.title}</Link>
                    <div className="text-[10px] font-mono text-on-surface-variant mt-1">+{ch.xp} XP · ₹{ch.pool.toLocaleString()} pool · {ch.tags.join(', ')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/challenges/${ch.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-on-surface-variant border border-white/10 text-[10px] font-mono uppercase font-black hover:border-primary/40 hover:text-white transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Open
                    </Link>
                    <button
                      onClick={() => setParticipantsModal({ open: true, type: 'challenge', id: ch.id, title: ch.title })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 text-[10px] font-mono uppercase font-black hover:bg-primary hover:text-on-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">workspace_premium</span>
                      Winners
                    </button>
                    <button
                      onClick={() => setChallengeModal({ open: true, data: { ...ch }, editing: true })}
                      className="p-2 text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        const newStatus = ch.status === 'Open' ? 'Closed' : 'Open';
                        updateChallengeMutation.mutate({ id: ch.id, status: newStatus, endsAt: newStatus === 'Open' ? null : ch.endsAt });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono uppercase font-black transition-all ${ch.status === 'Open' ? 'border-error/30 text-error hover:bg-error hover:text-white' : 'border-primary/30 text-primary hover:bg-primary hover:text-on-primary'}`}
                      title={ch.status === 'Open' ? 'Close Challenge' : (ch.closedByTime ? 'Resume Challenge (Time Closed)' : 'Resume Challenge')}
                    >
                      <span className="material-symbols-outlined text-sm">{ch.status === 'Open' ? 'block' : 'play_arrow'}</span>
                      {ch.status === 'Open' ? 'Close' : (ch.closedByTime ? 'Resume (Time)' : 'Resume')}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'challenge', id: ch.id })}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GALLERY ── */}
        {tab === 'gallery' && (
          <div>
            <div className="mb-8 flex justify-between items-end">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">GALLERY MANAGEMENT</div>
                <h2 className="text-4xl font-black tracking-tighter">Gallery <span className="text-primary">({photos.length})</span></h2>
              </div>
              <button
                onClick={() => setPhotoModal({ open: true, data: blankPhoto() })}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 font-mono font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Photo
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((ph) => (
                <div key={ph.id} className="bg-surface-container border border-outline-variant/10 overflow-hidden group relative shadow-lg hover:border-primary/30 transition-all">
                  <div className="relative">
                    <img src={ph.img} alt={ph.label} className="w-full h-40 object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                    {ph.driveUrl && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-on-primary px-1.5 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-xs">folder_shared</span>
                        Drive Link
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-white truncate">{ph.label}</div>
                    <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">{ph.tag} · {ph.year}</div>
                    {ph.driveUrl && (
                      <a href={ph.driveUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-primary hover:underline mt-1 block truncate">
                        {ph.driveUrl}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({ type: 'photo', id: ph.id })}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-on-surface-variant hover:text-error hover:bg-error/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab === 'projects' && (
          <div>
            <div className="mb-8 flex justify-between items-end">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">PROJECT MANAGEMENT</div>
                <h2 className="text-4xl font-black tracking-tighter">Projects <span className="text-primary">({projects.length})</span></h2>
              </div>
              <button
                onClick={() => setProjectModal({ open: true, data: blankProject(), editing: false })}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 font-mono font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Project
              </button>
            </div>
            <div className="space-y-3">
              {projects.map((pr) => (
                <div key={pr.id} className="bg-surface-container p-5 border border-outline-variant/10 flex items-center gap-6 group hover:border-primary/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 border uppercase ${pr.status === 'Live' ? 'text-tertiary-fixed border-tertiary-fixed/40' : pr.status === 'Beta' ? 'text-secondary border-secondary/40' : 'text-on-surface-variant border-outline-variant'}`}>{pr.status}</span>
                      <span className="text-[9px] font-mono text-on-surface-variant">★ {pr.stars} · ⑂ {pr.forks}</span>
                    </div>
                    <div className="font-bold text-white group-hover:text-primary transition-colors">{pr.title}</div>
                    <div className="text-[10px] font-mono text-on-surface-variant mt-1 line-clamp-1">{pr.description}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pr.tech.map(t => <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 border border-white/10 text-on-surface-variant bg-white/5">{t}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProjectModal({ open: true, data: { ...pr }, editing: true })}
                      className="p-2 text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'project', id: pr.id })}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEAM ── */}
        {tab === 'team' && (
          <TeamTab
            team={team}
            onEdit={(m) => setTeamModal({ open: true, data: m, editing: true })}
            onDelete={(id) => setDeleteConfirm({ type: 'team', id })}
            onNew={() => setTeamModal({ open: true, data: blankTeamMember(), editing: false })}
          />
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {tab === 'announcements' && <AnnouncementsTab />}

      </main>

      {/* ── MODALS (Outside Main) ── */}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#151c24] border border-error/20 w-full max-w-sm p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <h3 className="font-mono font-black uppercase text-sm text-error">Confirm Delete</h3>
            </div>
            <p className="text-sm text-on-surface-variant font-body mb-6">
              This will permanently delete this {deleteConfirm.type}. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'member') deleteMemberMutation.mutate(deleteConfirm.id)
                  else if (deleteConfirm.type === 'event') deleteEventMutation.mutate(deleteConfirm.id)
                  else if (deleteConfirm.type === 'challenge') deleteChallengeMutation.mutate(deleteConfirm.id)
                  else if (deleteConfirm.type === 'photo') deletePhotoMutation.mutate(deleteConfirm.id)
                  else if (deleteConfirm.type === 'team') deleteTeamMutation.mutate(deleteConfirm.id)
                  else deleteProjectMutation.mutate(deleteConfirm.id)
                }}
                disabled={deleteMemberMutation.isPending || deleteEventMutation.isPending || deleteChallengeMutation.isPending || deletePhotoMutation.isPending || deleteProjectMutation.isPending || deleteTeamMutation.isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-error text-white hover:brightness-110 disabled:opacity-50 font-black transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EVENT MODAL ── */}
      {eventModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#151c24] border border-outline-variant/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-[#192028]">
              <h3 className="font-mono font-black uppercase text-sm">{eventModal.editing ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => setEventModal({ open: false, data: blankEvent(), editing: false })} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {([
                { field: 'title', label: 'Title', type: 'text' },
                { field: 'type', label: 'Type', type: 'select', options: ['Workshop', 'Hackathon', 'Meetup', 'Competition'] },
                { field: 'date', label: 'Date (e.g. MAY 24)', type: 'text' },
                { field: 'location', label: 'Location', type: 'text' },
                { field: 'description', label: 'Description', type: 'textarea' },
                { field: 'image', label: 'Image (URL or Upload)', type: 'image-upload' },
                { field: 'slots', label: 'Available Slots', type: 'number' },
                { field: 'total', label: 'Total Capacity', type: 'number' },
                { field: 'status', label: 'Status', type: 'select', options: ['Open', 'Full', 'Closed'] },
                { field: 'enrollmentXp', label: 'Registration Bonus (XP)', type: 'number' },
                { field: 'externalUrl', label: 'External Contest/Meeting Link (e.g. HackerRank)', type: 'text' },
                { field: 'benefits', label: "Benefits / What you'll get (comma separated)", type: 'tags' },
                { field: 'requirements', label: 'Requirements (comma separated)', type: 'tags' },
                { field: 'schedule', label: 'Schedule (Line format: 10:00 AM | Hacking Begins)', type: 'schedule' },
                { field: 'endsAt', label: 'Closing Date & Time (Override Status)', type: 'datetime-local' },
              ] as Array<{ field: keyof Event; label: string; type: string; options?: string[] }>).map(({ field, label, type, options }) => {
                let value: string | number = '';
                if (type === 'datetime-local') {
                  const val = eventModal.data[field];
                  if (val) {
                    const d = new Date(val as string);
                    if (!isNaN(d.getTime())) {
                      // Use local time instead of UTC to avoid shifting dates in the UI
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const hours = String(d.getHours()).padStart(2, '0');
                      const minutes = String(d.getMinutes()).padStart(2, '0');
                      value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    }
                  }
                } else if (type === 'tags') {
                  const val = eventModal.data[field];
                  value = Array.isArray(val) ? val.join(', ') : (val as string ?? '');
                } else if (type === 'schedule') {
                  value = toScheduleTextareaValue(eventModal.data.schedule);
                } else {
                  value = (eventModal.data[field] as string | number) ?? '';
                }

                return (
                  <div key={field}>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        value={value}
                        onChange={(e) => setEventModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body resize-none h-20 focus:outline-none"
                      />
                    ) : type === 'select' ? (
                      <select
                        value={value}
                        onChange={(e) => setEventModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none appearance-none"
                      >
                        {options!.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : type === 'tags' ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setEventModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value as unknown as string[] } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                      />
                    ) : type === 'schedule' ? (
                      <textarea
                        placeholder="9:00 AM | Kickoff&#10;10:00 AM | Hacking Starts"
                        value={value}
                        onChange={(e) => setEventModal(s => ({ ...s, data: { ...s.data, schedule: e.target.value as unknown as Event['schedule'] } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body resize-none h-32 focus:outline-none"
                      />
                    ) : type === 'image-upload' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Paste image or Google Drive URL..."
                          value={(eventModal.data[field] as string) ?? ''}
                          onChange={(e) => {
                            const val = formatDriveImageUrl(e.target.value)
                            setEventModal(s => ({ ...s, data: { ...s.data, [field]: val } }))
                          }}
                          className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                const compressed = await compressImage(file)
                                setEventModal(s => ({ ...s, data: { ...s.data, [field]: compressed } }))
                              } catch (err) {
                                console.error('Image compression error:', err)
                              }
                            }
                          }}
                          className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-mono file:font-black file:uppercase file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                        />
                        {eventModal.data.image && (
                          <div className="mt-2 flex items-center gap-3">
                            <img src={eventModal.data.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-primary/40" />
                            <span className="text-[10px] font-mono text-primary">Image ready (Compressed)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={(eventModal.data[field] as string | number) ?? ''}
                        onChange={(e) => setEventModal(s => ({ ...s, data: { ...s.data, [field]: type === 'number' ? Number(e.target.value) : e.target.value } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-6 border-t border-outline-variant/10 flex gap-3 justify-end bg-[#192028]">
              <button
                onClick={() => setEventModal({ open: false, data: blankEvent(), editing: false })}
                className="px-4 py-2 text-xs font-mono uppercase text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const eventId = eventModal.data.id;
                  const sanitized = {
                    id: eventId,
                    type: eventModal.data.type,
                    date: eventModal.data.date,
                    title: eventModal.data.title,
                    description: eventModal.data.description,
                    slots: eventModal.data.slots,
                    total: eventModal.data.total,
                    status: eventModal.data.status,
                    location: eventModal.data.location,
                    accent: eventModal.data.accent,
                    image: eventModal.data.image,
                    enrollmentXp: eventModal.data.enrollmentXp,
                    externalUrl: eventModal.data.externalUrl,
                    endsAt: eventModal.data.endsAt,
                    benefits: toCommaList(eventModal.data.benefits),
                    requirements: toCommaList(eventModal.data.requirements),
                    schedule: toScheduleList(eventModal.data.schedule),
                  };
                  eventModal.editing ? updateEventMutation.mutate(sanitized) : createEventMutation.mutate(sanitized);
                }}
                disabled={createEventMutation.isPending || updateEventMutation.isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white disabled:opacity-50 transition-colors font-black"
              >
                {eventModal.editing ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHALLENGE MODAL ── */}
      {challengeModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#151c24] border border-outline-variant/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-[#192028]">
              <h3 className="font-mono font-black uppercase text-sm">{challengeModal.editing ? 'Edit Challenge' : 'New Challenge'}</h3>
              <button onClick={() => setChallengeModal({ open: false, data: blankChallenge(), editing: false })} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {([
                { field: 'title', label: 'Title', type: 'text' },
                { field: 'difficulty', label: 'Difficulty', type: 'select', options: ['Legendary', 'Hard', 'Medium', 'Easy'] },
                { field: 'description', label: 'Description', type: 'textarea' },
                { field: 'xp', label: 'Completion XP', type: 'number' },
                { field: 'enrollmentXp', label: 'Registration Bonus (XP)', type: 'number' },
                { field: 'pool', label: 'Prize Pool (₹)', type: 'number' },
                { field: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
                { field: 'image', label: 'Image (URL or Upload)', type: 'image-upload' },
                { field: 'externalUrl', label: 'External Contest Link (e.g. HackerRank)', type: 'text' },
                { field: 'endsAt', label: 'Closing Date & Time (Override Status)', type: 'datetime-local' },
                { field: 'tags', label: 'Tags (comma separated)', type: 'tags' },
                { field: 'requirements', label: 'Requirements (comma separated)', type: 'tags' },
                { field: 'timeline', label: 'Timeline (Line format: Phase | Description)', type: 'timeline' },
                { field: 'prizes', label: 'Prize Distribution (Line format: Place | Reward)', type: 'timeline' },
              ] as Array<{ field: keyof Challenge; label: string; type: string; options?: string[] }>).map(({ field, label, type, options }) => {
                let value: string | number = '';
                if (type === 'datetime-local') {
                  const val = challengeModal.data[field];
                  if (val) {
                    const d = new Date(val as string);
                    if (!isNaN(d.getTime())) {
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const hours = String(d.getHours()).padStart(2, '0');
                      const minutes = String(d.getMinutes()).padStart(2, '0');
                      value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    }
                  }
                } else if (type === 'tags') {
                  const val = challengeModal.data[field];
                  value = Array.isArray(val) ? val.join(', ') : (val as string ?? '');
                } else if (type === 'timeline') {
                  const val = challengeModal.data[field];
                  value = Array.isArray(val) ? val.join('\n') : (val as string ?? '');
                } else {
                  value = (challengeModal.data[field] as string | number) ?? '';
                }

                return (
                  <div key={field}>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        value={value}
                        onChange={(e) => setChallengeModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body resize-none h-20 focus:outline-none"
                      />
                    ) : type === 'select' ? (
                      <select
                        value={value}
                        onChange={(e) => setChallengeModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none appearance-none"
                      >
                        {options!.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : type === 'tags' ? (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setChallengeModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value as unknown as string[] } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                        placeholder={field === 'tags' ? 'e.g. SQL, Redis, Algorithms' : 'Comma separated values'}
                      />
                    ) : type === 'timeline' ? (
                      <textarea
                        placeholder={field === 'timeline' ? 'Registration | Enroll before sprint starts\nSprint | Solve within the time window' : '1st | ₹10,000 + XP Boost\n2nd | ₹5,000'}
                        value={value}
                        onChange={(e) => setChallengeModal(s => ({
                          ...s,
                          data: {
                            ...s.data,
                            [field]: e.target.value as unknown as string[],
                          },
                        }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body resize-none h-24 focus:outline-none"
                      />
                    ) : type === 'image-upload' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Paste image or Google Drive URL..."
                          value={(challengeModal.data[field] as string) ?? ''}
                          onChange={(e) => {
                            const val = formatDriveImageUrl(e.target.value)
                            setChallengeModal(s => ({ ...s, data: { ...s.data, [field]: val } }))
                          }}
                          className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                const compressed = await compressImage(file)
                                setChallengeModal(s => ({ ...s, data: { ...s.data, [field]: compressed } }))
                              } catch (err) {
                                console.error('Image compression error:', err)
                              }
                            }
                          }}
                          className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-mono file:font-black file:uppercase file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                        />
                        {challengeModal.data.image && (
                          <div className="mt-2 flex items-center gap-3">
                            <img src={challengeModal.data.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-primary/40" />
                            <span className="text-[10px] font-mono text-primary">Image ready (Compressed)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={value}
                        onChange={(e) => setChallengeModal(s => ({ ...s, data: { ...s.data, [field]: type === 'number' ? Number(e.target.value) : e.target.value } }))}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-6 border-t border-outline-variant/10 flex gap-3 justify-end bg-[#192028]">
              <button onClick={() => setChallengeModal({ open: false, data: blankChallenge(), editing: false })} className="px-4 py-2 text-xs font-mono uppercase text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-white/30 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  const challengeId = challengeModal.data.id;
                  const sanitized = {
                    id: challengeId,
                    title: challengeModal.data.title,
                    difficulty: challengeModal.data.difficulty,
                    xp: challengeModal.data.xp,
                    pool: challengeModal.data.pool,
                    description: challengeModal.data.description,
                    status: challengeModal.data.status,
                    enrollmentXp: challengeModal.data.enrollmentXp,
                    externalUrl: challengeModal.data.externalUrl,
                    endsAt: challengeModal.data.endsAt,
                    tags: toCommaList(challengeModal.data.tags),
                    requirements: toCommaList(challengeModal.data.requirements),
                    timeline: toLineList(challengeModal.data.timeline),
                    prizes: toLineList(challengeModal.data.prizes),
                    image: challengeModal.data.image,
                  }
                  challengeModal.editing ? updateChallengeMutation.mutate(sanitized) : createChallengeMutation.mutate(sanitized)
                }}
                disabled={createChallengeMutation.isPending || updateChallengeMutation.isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white disabled:opacity-50 transition-colors font-black"
              >
                {challengeModal.editing ? 'Save Changes' : 'Create Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO MODAL ── */}
      {photoModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="bg-[#151c24] border border-outline-variant/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center bg-[#192028]">
              <h3 className="font-mono font-black uppercase text-sm">Add to Gallery</h3>
              <button onClick={() => setPhotoModal({ open: false, data: blankPhoto() })} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPhotoModal(s => ({ ...s, data: { ...s.data, driveUrl: '' } }))}
                  className={`flex-1 py-2.5 text-[10px] font-mono font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 ${!photoModal.data.driveUrl && photoModal.data.driveUrl !== undefined && photoModal.data.driveUrl === '' ? 'bg-primary text-on-primary border-primary' : 'border-white/10 text-on-surface-variant hover:border-primary/50'}`}
                >
                  <span className="material-symbols-outlined text-sm">image</span> Direct Image
                </button>
                <button
                  onClick={() => setPhotoModal(s => ({ ...s, data: { ...s.data, driveUrl: s.data.driveUrl || 'https://drive.google.com/' } }))}
                  className={`flex-1 py-2.5 text-[10px] font-mono font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 ${photoModal.data.driveUrl ? 'bg-primary text-on-primary border-primary' : 'border-white/10 text-on-surface-variant hover:border-primary/50'}`}
                >
                  <span className="material-symbols-outlined text-sm">folder_shared</span> Drive Link
                </button>
              </div>

              {/* Drive URL field — shown in Drive Link mode */}
              {photoModal.data.driveUrl !== undefined && photoModal.data.driveUrl !== '' && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">Google Drive URL *</label>
                  <input
                    type="text"
                    value={photoModal.data.driveUrl ?? ''}
                    onChange={(e) => setPhotoModal(s => ({ ...s, data: { ...s.data, driveUrl: e.target.value } }))}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-primary mt-1">Students will be taken directly to this Drive link when they click the card.</p>
                </div>
              )}

              {/* Common fields */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">Label / Caption *</label>
                <input type="text" value={photoModal.data.label ?? ''} onChange={(e) => setPhotoModal(s => ({ ...s, data: { ...s.data, label: e.target.value } }))} className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none" placeholder="e.g. Hackathon 2026 Photos" />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">
                  {photoModal.data.driveUrl ? 'Thumbnail Image (Upload) *' : 'Image (URL or Upload) *'}
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Paste image or Google Drive URL..."
                    value={(photoModal.data.img as string) ?? ''}
                    onChange={(e) => {
                      const val = formatDriveImageUrl(e.target.value)
                      setPhotoModal(s => ({ ...s, data: { ...s.data, img: val } }))
                    }}
                    className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          const compressed = await compressImage(file)
                          setPhotoModal(s => ({ ...s, data: { ...s.data, img: compressed } }))
                        } catch (err) {
                          console.error('Image compression error:', err)
                        }
                      }
                    }}
                    className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-mono file:font-black file:uppercase file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                  />
                  {photoModal.data.img && <img src={photoModal.data.img as string} alt="Preview" className="w-full h-32 object-cover border border-outline-variant/20" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">Tag</label>
                  <select value={photoModal.data.tag ?? 'Workshops'} onChange={(e) => setPhotoModal(s => ({ ...s, data: { ...s.data, tag: e.target.value } }))} className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none appearance-none">
                    {['Hackathons', 'Workshops', 'Meetups', 'Competitions'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">Year</label>
                  <input type="text" value={photoModal.data.year ?? '2026'} onChange={(e) => setPhotoModal(s => ({ ...s, data: { ...s.data, year: e.target.value } }))} className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant/10 flex gap-3 justify-end bg-[#192028]">
              <button onClick={() => setPhotoModal({ open: false, data: blankPhoto() })} className="px-4 py-2 text-xs font-mono uppercase text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-white/30 transition-colors">Cancel</button>
              <button
                onClick={() => createPhotoMutation.mutate(photoModal.data)}
                disabled={createPhotoMutation.isPending || !photoModal.data.label || !photoModal.data.img}
                className="px-4 py-2 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white disabled:opacity-50 transition-colors font-black"
              >
                Add Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROJECT MODAL ── */}
      {projectModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#151c24] border border-outline-variant/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-[#192028]">
              <h3 className="font-mono font-black uppercase text-sm">{projectModal.editing ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={() => setProjectModal({ open: false, data: blankProject(), editing: false })} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {([
                { field: 'title', label: 'Title', type: 'text' },
                { field: 'description', label: 'Description', type: 'textarea' },
                { field: 'status', label: 'Status', type: 'select', options: ['Live', 'Beta', 'Archived'] },
                { field: 'githubUrl', label: 'GitHub URL (auto-fetches ★ & ⑂)', type: 'text' },
                { field: 'img', label: 'Image (URL or Upload)', type: 'image-upload' },
                { field: 'stars', label: 'Stars (auto-set from GitHub)', type: 'number' },
                { field: 'forks', label: 'Forks (auto-set from GitHub)', type: 'number' },
                { field: 'tech', label: 'Tech Stack (comma separated)', type: 'tags' },
              ] as Array<{ field: keyof Project; label: string; type: string; options?: string[] }>).map(({ field, label, type, options }) => (
                <div key={field}>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={(projectModal.data[field] as string) ?? ''}
                      onChange={(e) => setProjectModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                      className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body resize-none h-20 focus:outline-none"
                    />
                  ) : type === 'select' ? (
                    <select
                      value={(projectModal.data[field] as string) ?? ''}
                      onChange={(e) => setProjectModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                      className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none appearance-none"
                    >
                      {options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : type === 'tags' ? (
                    <input
                      type="text"
                      value={Array.isArray(projectModal.data.tech) ? projectModal.data.tech.join(', ') : ''}
                      onChange={(e) => setProjectModal(s => ({ ...s, data: { ...s.data, tech: e.target.value.split(',').map(t => t.trim()) } }))}
                      className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                      placeholder="e.g. React, TypeScript, Tailwind"
                    />
                  ) : type === 'image-upload' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Paste image or Google Drive URL..."
                        value={(projectModal.data[field] as string) ?? ''}
                        onChange={(e) => {
                          const val = formatDriveImageUrl(e.target.value)
                          setProjectModal(s => ({ ...s, data: { ...s.data, [field]: val } }))
                        }}
                        className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const compressed = await compressImage(file)
                              setProjectModal(s => ({ ...s, data: { ...s.data, [field]: compressed } }))
                            } catch (err) {
                              console.error('Image compression error:', err)
                            }
                          }
                        }}
                        className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-mono file:font-black file:uppercase file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                      />
                    </div>
                  ) : (
                    <input
                      type={type}
                      value={(projectModal.data[field] as string | number) ?? ''}
                      onChange={(e) => setProjectModal(s => ({ ...s, data: { ...s.data, [field]: type === 'number' ? Number(e.target.value) : e.target.value } }))}
                      className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                    />
                  )}
                </div>
              ))}
              {projectModal.data.img && <img src={projectModal.data.img} alt="Preview" className="w-full h-32 object-cover border border-outline-variant/20" />}
            </div>
            <div className="p-6 border-t border-outline-variant/10 flex gap-3 justify-end bg-[#192028]">
              <button
                onClick={() => setProjectModal({ open: false, data: blankProject(), editing: false })}
                className="px-4 py-2 text-xs font-mono uppercase text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const sanitized = { ...projectModal.data, tech: projectModal.data.tech?.filter(Boolean) }
                  projectModal.editing ? updateProjectMutation.mutate(sanitized) : createProjectMutation.mutate(sanitized)
                }}
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white disabled:opacity-50 transition-colors font-black"
              >
                {projectModal.editing ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM MODAL ── */}
      {teamModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#151c24] border border-outline-variant/20 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-[#192028]">
              <h3 className="font-mono font-black uppercase text-sm">{teamModal.editing ? 'Edit Team Member' : 'New Team Member'}</h3>
              <button onClick={() => setTeamModal({ open: false, data: blankTeamMember(), editing: false })} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Static fields */}
              {([
                { field: 'name', label: 'Name', type: 'text' },
                { field: 'role', label: 'Role Title (e.g. Student Coordinator)', type: 'text' },
                { field: 'dept', label: 'Department (e.g. B.Tech CSE)', type: 'text' },
                { field: 'tier', label: 'Category / Tier', type: 'select', options: ['Faculty', 'Student Coordinators', 'Core', 'Technical', 'Marketing', 'Creative', 'Operator'] },
                { field: 'instagramUrl', label: 'Instagram URL', type: 'text' },
                { field: 'linkedinUrl', label: 'LinkedIn URL', type: 'text' },
              ] as Array<{ field: keyof TeamMember; label: string; type: string; options?: string[] }>).map(({ field, label, type, options }) => (
                <div key={field}>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">{label}</label>
                  {type === 'select' ? (
                    <select
                      value={(teamModal.data[field] as string) ?? ''}
                      onChange={(e) => setTeamModal(s => ({ ...s, data: { ...s.data, [field]: e.target.value } }))}
                      className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none appearance-none"
                    >
                      {options!.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={(teamModal.data[field] as string) ?? ''}
                      onChange={(e) => setTeamModal(s => ({
                        ...s,
                        data: {
                          ...s.data,
                          [field]: e.target.value
                        }
                      }))}
                      className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                    />
                  )}
                </div>
              ))}

              {/* Photo upload field */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block mb-1">Photo</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Paste image or Google Drive URL..."
                    value={teamModal.data.image ?? ''}
                    onChange={(e) => {
                      const val = formatDriveImageUrl(e.target.value)
                      setTeamModal(s => ({ ...s, data: { ...s.data, image: val } }))
                    }}
                    className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-on-surface font-body focus:outline-none"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          const compressed = await compressImage(file)
                          setTeamModal(s => ({ ...s, data: { ...s.data, image: compressed } }))
                        } catch (err) {
                          console.error('Image compression error:', err)
                        }
                      }
                    }}
                    className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-mono file:font-black file:uppercase file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                  />
                  {teamModal.data.image && (
                    <div className="mt-2 flex items-center gap-3">
                      <img src={teamModal.data.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-primary/40" />
                      <span className="text-[10px] font-mono text-primary">Photo ready (Compressed)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/10 flex gap-3 justify-end bg-[#192028]">
              <button onClick={() => setTeamModal({ open: false, data: blankTeamMember(), editing: false })} className="px-4 py-2 text-xs font-mono uppercase text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-white/30 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  const sanitized = { ...teamModal.data }
                  teamModal.editing ? updateTeamMutation.mutate(sanitized) : createTeamMutation.mutate(sanitized)
                }}
                disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white disabled:opacity-50 transition-colors font-black"
              >
                {teamModal.editing ? 'Save Changes' : 'Create Member'}
              </button>
            </div>
          </div>
        </div>
      )}
      {participantsModal?.open && (
        <ParticipantsModal
          {...participantsModal}
          onClose={() => setParticipantsModal(null)}
          onSubmit={(winners) => winnersMutation.mutate({ type: participantsModal.type, id: participantsModal.id, winners })}
          isPending={winnersMutation.isPending}
        />
      )}

    </div>
  )
}

/* ─── Team Tab Sub-component ────────────────────────────────────────────── */
function TeamTab({ team, onEdit, onDelete, onNew }: { team: TeamMember[], onEdit: (m: TeamMember) => void, onDelete: (id: string) => void, onNew: () => void }) {
  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">TEAM ROSTER</div>
          <h2 className="text-4xl font-black tracking-tighter">Team Operator Hub</h2>
        </div>
        <button onClick={onNew} className="px-6 py-3 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white transition-colors font-black">
          Add New Member
        </button>
      </div>

      <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left order-collapse">
            <thead className="bg-surface-container-high">
              <tr>
                {['Name', 'Role', 'Department', 'Category', 'Socials', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-surface-bright/20 transition-colors">
                  <td className="px-4 py-4 font-bold text-sm text-white">{m.name}</td>
                  <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{m.role}</td>
                  <td className="px-4 py-4 font-mono text-xs text-on-surface-variant">{m.dept}</td>
                  <td className="px-4 py-4">
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 border border-primary/30 text-primary uppercase">{m.tier}</span>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <div className="flex flex-wrap gap-2">
                      {m.instagramUrl && (
                        <a href={m.instagramUrl} target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary transition-colors" title="Instagram">
                          <span className="material-symbols-outlined text-sm">photo_camera</span>
                        </a>
                      )}
                      {m.linkedinUrl && (
                        <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-[#0077b5] transition-colors" title="LinkedIn">
                          <span className="material-symbols-outlined text-sm">work</span>
                        </a>
                      )}
                      {!m.instagramUrl && !m.linkedinUrl && <span className="text-[10px] text-on-surface-variant font-mono">None</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(m)} className="p-1.5 text-on-surface-variant hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => onDelete(m.id)} className="p-1.5 text-on-surface-variant hover:text-error transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Announcements Sub-component ─────────────────────────────────────────── */
interface Ann { id: string; text: string; active: boolean }

function AnnouncementsTab() {
  const queryClient = useQueryClient()
  const [newText, setNewText] = useState('')

  const { data: anns = [] } = useQuery<Ann[]>({ queryKey: ['admin-announcements'], queryFn: () => api.get('/admin/announcements').then(r => r.data) })

  const createMut = useMutation({
    mutationFn: (text: string) => api.post('/admin/announcements', { text }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }); setNewText('') },
  })
  const toggleMut = useMutation({
    mutationFn: (a: Ann) => api.patch(`/admin/announcements/${a.id}`, { active: !a.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
  })

  return (
    <div>
      <div className="mb-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-on-surface-variant mb-2">HOMEPAGE TICKER</div>
        <h2 className="text-4xl font-black tracking-tighter">Announcements</h2>
        <p className="text-sm text-on-surface-variant mt-1 font-body">These appear in the scrolling ticker bar at the top of the public site.</p>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          className="flex-1 bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm p-3 text-sm text-white font-body focus:outline-none"
          placeholder="Type a new announcement…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newText.trim() && createMut.mutate(newText.trim())}
        />
        <button
          onClick={() => newText.trim() && createMut.mutate(newText.trim())}
          disabled={createMut.isPending || !newText.trim()}
          className="px-6 py-3 text-xs font-mono uppercase bg-primary text-on-primary hover:bg-white disabled:opacity-50 transition-colors font-black shadow-lg"
        >
          Add
        </button>
      </div>

      <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl">
        {anns.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-mono text-xs">No announcements yet.</div>
        ) : (
          anns.map((a) => (
            <div key={a.id} className="px-6 py-4 border-b border-outline-variant/10 last:border-none flex items-center justify-between gap-4 hover:bg-surface-bright/20 transition-colors">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                  onClick={() => toggleMut.mutate(a)}
                  className={`shrink-0 w-5 h-5 border-2 flex items-center justify-center transition-colors ${a.active ? 'border-primary bg-primary/20' : 'border-outline-variant'}`}
                >
                  {a.active && <span className="material-symbols-outlined text-primary text-xs">check</span>}
                </button>
                <span className={`text-sm font-body truncate ${a.active ? 'text-white' : 'text-on-surface-variant line-through opacity-50'}`}>{a.text}</span>
              </div>
              <button onClick={() => deleteMut.mutate(a.id)} className="text-on-surface-variant hover:text-error transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ─── Participants / Winners Modal ────────────────────────────────────────── */
interface Participant { id: string; name: string; email: string; usn?: string; verified?: boolean; position?: number; awardXp?: number }

function ParticipantsModal({ type, id, title, onClose, onSubmit, isPending }: { type: 'event' | 'challenge', id: string, title: string, onClose: () => void, onSubmit: (winners: any[]) => void, isPending: boolean }) {
  const { data: participants = [], isLoading } = useQuery<Participant[]>({
    queryKey: ['admin', type, id, 'participants'],
    queryFn: () => api.get(`/admin/${type === 'event' ? 'events' : 'challenges'}/${id}/participants`).then(r => r.data)
  })

  const [winners, setWinners] = useState<{ userId: string; position: number; awardXp: number }[]>([])
  const [draggedUser, setDraggedUser] = useState<Participant | null>(null)

  useEffect(() => {
    if (participants.length > 0) {
      const existingWinners = participants
        .filter(p => p.position !== null && p.position !== undefined)
        .map(p => ({ userId: p.id, position: p.position!, awardXp: p.awardXp || 0 }))
        .sort((a, b) => a.position - b.position)

      if (existingWinners.length > 0) {
        setWinners(existingWinners)
      }
    }
  }, [participants])

  const addWinner = (p: Participant) => {
    if (winners.find(w => w.userId === p.id)) return
    setWinners([...winners, { userId: p.id, position: winners.length + 1, awardXp: 0 }])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedUser) addWinner(draggedUser)
  }

  const removeWinner = (userId: string) => {
    setWinners(winners.filter(w => w.userId !== userId).map((w, i) => ({ ...w, position: i + 1 })))
  }

  const updateAward = (userId: string, xp: number) => {
    setWinners(winners.map(w => w.userId === userId ? { ...w, awardXp: xp } : w))
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
      <div className="bg-[#151c24] border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#192028]">
          <div>
            <h3 className="font-mono font-black uppercase text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">{type === 'event' ? 'groups' : 'workspace_premium'}</span>
              {type === 'event' ? 'Event Participants' : 'Challenge Winners'}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider mt-1">{title}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
          {/* List of all participants */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 bg-white/5 border-b border-white/5">
              <div className="text-[10px] font-mono uppercase font-black text-on-surface-variant tracking-widest">Enrolled Operators ({participants.length})</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="h-full flex items-center justify-center font-mono text-xs text-on-surface-variant">Loading...</div>
              ) : participants.length === 0 ? (
                <div className="h-full flex items-center justify-center font-mono text-xs text-on-surface-variant">No participants yet.</div>
              ) : (
                participants.map(p => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedUser(p)}
                    onDragEnd={() => setDraggedUser(null)}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-primary/30 transition-all group cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="font-pixel text-[10px] text-primary">{p.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                        <div className="text-[10px] font-mono text-on-surface-variant uppercase">{p.usn || 'No USN'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addWinner(p)}
                      disabled={winners.some(w => w.userId === p.id)}
                      className="opacity-0 group-hover:opacity-100 disabled:opacity-30 p-2 text-primary hover:bg-primary/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Winner assignment */}
          <div
            className={`w-1/2 flex flex-col transition-all ${draggedUser ? 'bg-primary/5 border-2 border-dashed border-primary/40 shadow-inner shadow-primary/10' : 'bg-black/20 border-l border-white/5'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="p-4 bg-white/5 border-b border-white/5">
              <div className="text-[10px] font-mono uppercase font-black text-primary tracking-widest">Selected Winners & XP Awards</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {winners.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <span className="material-symbols-outlined text-4xl text-white/10 mb-2">military_tech</span>
                  <p className="text-xs font-mono text-on-surface-variant">Click the (+) on the left to add a winner and assign their rank & XP.</p>
                </div>
              ) : (
                winners.map((w) => {
                  const p = participants.find(p => p.id === w.userId)
                  return (
                    <div key={w.userId} className="p-4 bg-primary/5 border border-primary/20 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
                            {w.position}
                          </div>
                          <div className="text-sm font-black text-white">{p?.name}</div>
                        </div>
                        <button onClick={() => removeWinner(w.userId)} className="text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-[9px] font-mono uppercase text-on-surface-variant block mb-1">Position / Rank</label>
                          <input
                            type="number"
                            value={w.position}
                            onChange={(e) => setWinners(winners.map(win => win.userId === w.userId ? { ...win, position: Number(e.target.value) } : win))}
                            className="w-full bg-white/5 border border-white/10 p-2 text-xs font-mono text-white outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] font-mono uppercase text-on-surface-variant block mb-1">Award XP</label>
                          <input
                            type="number"
                            value={w.awardXp}
                            onChange={(e) => updateAward(w.userId, Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 p-2 text-xs font-mono text-primary outline-none focus:border-primary"
                            placeholder="e.g. 500"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-4 border-t border-white/5 bg-white/5">
              <button
                onClick={() => onSubmit(winners)}
                disabled={winners.length === 0 || isPending}
                className="w-full py-3 bg-primary text-on-primary font-black font-mono text-xs uppercase tracking-widest hover:bg-white disabled:opacity-50 transition-all shadow-xl shadow-primary/10"
              >
                {isPending ? 'Reflecting XP...' : `Finalize & Award ${winners.length} Winners`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
