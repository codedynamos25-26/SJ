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
  challenges: number
  streak: number
  badge: string
  track: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: { email: string; name: string; password: string; track: string }) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('cd_user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cd_token'))
  const [isLoading, setIsLoading] = useState(false)

  // Verify token is still valid on mount — only clear session on 401,
  // not on network errors (e.g. server not running yet)
  useEffect(() => {
    if (!token) return
    api.get<AuthUser>('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('cd_user', JSON.stringify(res.data))
      })
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 401) {
          setUser(null)
          setToken(null)
          localStorage.removeItem('cd_token')
          localStorage.removeItem('cd_user')
        }
        // On network error keep the cached user so the UI stays usable offline
      })
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
      localStorage.setItem('cd_token', res.data.token)
      localStorage.setItem('cd_user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setUser(res.data.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (data: { email: string; name: string; password: string; track: string }) => {
    setIsLoading(true)
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/signup', data)
      localStorage.setItem('cd_token', res.data.token)
      localStorage.setItem('cd_user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setUser(res.data.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cd_token')
    localStorage.removeItem('cd_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
