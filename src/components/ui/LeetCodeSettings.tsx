import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

interface LeetCodeStats {
  username: string
  totalSolved: number
  easyCount: number
  mediumCount: number
  hardCount: number
  ranking: number
}

// Real LeetCode SVG icon
const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
)

const LeetCodeSettings = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const isConnected = !!user?.leetcodeProfile
  const [editing, setEditing] = useState(false)
  const [leetcodeUsername, setLeetcodeUsername] = useState(user?.leetcodeProfile || '')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<LeetCodeStats | null>(null)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    if (!leetcodeUsername.trim()) {
      setError('Please enter a LeetCode username or profile link')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/user/leetcode', { username: leetcodeUsername })
      setStats(response.data)
      await api.put('/user/profile', {
        leetcodeProfile: leetcodeUsername,
        leetcodeSolved: response.data.totalSolved,
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setEditing(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch LeetCode profile')
    } finally {
      setLoading(false)
    }
  }

  const connected = isConnected && !editing

  return (
    <div className="space-y-6">
      <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FFA116] to-orange-600 rounded-lg flex items-center justify-center text-white">
              <LeetCodeIcon />
            </div>
            <div>
              <h3 className="font-black text-lg text-white leading-none">LeetCode Profile</h3>
              {connected && (
                <p className="text-[10px] font-mono text-tertiary-fixed uppercase mt-0.5">
                  ✓ Connected · {user?.leetcodeProfile}
                </p>
              )}
            </div>
          </div>
          {connected && (
            <button
              onClick={() => { setEditing(true); setError('') }}
              className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border border-white/20 text-on-surface-variant hover:border-primary hover:text-primary transition-all"
            >
              Change
            </button>
          )}
        </div>

        <p className="text-sm text-on-surface-variant mb-4">
          Connect your LeetCode profile to display your achievements and track your progress.
        </p>

        {/* Input row — only show when not connected OR editing */}
        {(!connected) && (
          <div className="flex gap-3 flex-col md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-xs font-black uppercase tracking-wider text-on-surface-variant mb-2">
                LeetCode Username or Profile Link
              </label>
              <input
                type="text"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="e.g. tommysmith or https://leetcode.com/u/tommysmith/"
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:border-[#FFA116] outline-none transition-all text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>
            <div className="flex gap-2">
              {editing && (
                <button
                  onClick={() => { setEditing(false); setLeetcodeUsername(user?.leetcodeProfile || ''); setError('') }}
                  className="px-4 py-2 text-xs font-mono uppercase border border-white/20 text-on-surface-variant hover:text-white transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConnect}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#FFA116] to-orange-600 text-white font-black text-sm uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? 'Connecting...' : editing ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">{error}</div>
        )}

        {/* Stats grid — show if just fetched OR already connected */}
        {(stats || (connected && user?.leetcodeSolved !== undefined)) && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-3">
              {stats ? 'Live Stats' : 'Stored Stats'}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-black/40 border border-[#FFA116]/20 rounded-lg">
                <div className="text-2xl font-black text-[#FFA116] mb-1">
                  {stats ? stats.totalSolved : user?.leetcodeSolved ?? '—'}
                </div>
                <div className="text-[10px] font-mono uppercase text-on-surface-variant">Solved</div>
              </div>
              {stats && (
                <>
                  <div className="p-3 bg-black/40 border border-tertiary-fixed/20 rounded-lg">
                    <div className="text-2xl font-black text-tertiary-fixed mb-1">{stats.easyCount}</div>
                    <div className="text-[10px] font-mono uppercase text-on-surface-variant">Easy</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-yellow-500/20 rounded-lg">
                    <div className="text-2xl font-black text-yellow-400 mb-1">{stats.mediumCount}</div>
                    <div className="text-[10px] font-mono uppercase text-on-surface-variant">Medium</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-red-500/20 rounded-lg">
                    <div className="text-2xl font-black text-red-400 mb-1">{stats.hardCount}</div>
                    <div className="text-[10px] font-mono uppercase text-on-surface-variant">Hard</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeetCodeSettings
