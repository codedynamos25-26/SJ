import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'member' | 'admin'
  xp: number
  rank: number
  usn?: string
  department?: string
  year?: string
  semester?: string
  githubUrl?: string
  leetcodeProfile?: string
  leetcodeSolved?: number
  track: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  signup: (data: { email: string; name: string; password: string; track: string; semester?: string; usn?: string; department?: string; year?: string }) => Promise<AuthUser>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('cd_user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch the user on mount if a session token or user is present
  useEffect(() => {
    const storedToken = localStorage.getItem('cd_token')
    const storedUser = localStorage.getItem('cd_user')

    // If there is no token or saved user, skip /auth/me to avoid unnecessary 401 console errors
    if (!storedToken && !storedUser) {
      return
    }

    api.get<AuthUser>('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('cd_user', JSON.stringify(res.data))
      })
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 401) {
          setUser(null)
          localStorage.removeItem('cd_user')
          localStorage.removeItem('cd_token')
        }
      })
  }, [])

  // Prevent back-button access to cached protected views after logout
  useEffect(() => {
    const syncAuthState = () => {
      const currentUser = localStorage.getItem('cd_user')
      if (!currentUser) {
        setUser(null)
      }
    }

    window.addEventListener('pageshow', syncAuthState)
    window.addEventListener('popstate', syncAuthState)
    return () => {
      window.removeEventListener('pageshow', syncAuthState)
      window.removeEventListener('popstate', syncAuthState)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post<{ user: AuthUser; token?: string }>('/auth/login', { email, password })
      if (res.data.token) {
        localStorage.setItem('cd_token', res.data.token)
      }
      localStorage.setItem('cd_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      return res.data.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (data: { email: string; name: string; password: string; track: string; semester?: string; usn?: string; department?: string; year?: string }) => {
    setIsLoading(true)
    try {
      const res = await api.post<{ user: AuthUser; token?: string }>('/auth/signup', data)
      if (res.data.token) {
        localStorage.setItem('cd_token', res.data.token)
      }
      localStorage.setItem('cd_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      return res.data.user
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('cd_user')
      localStorage.removeItem('cd_token')
      setUser(null)
      window.location.href = '/login'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
