import axios from 'axios'

// In dev: Vite proxies /api → localhost:4000 (see vite.config.ts)
// In production: set VITE_API_URL to your Railway backend URL
const cleanApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')
const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const baseURL = cleanApiUrl
  ? cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`
  : isLocalHost
    ? 'http://localhost:4000/api'
    : 'https://sj-3.onrender.com/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Automatically attach Bearer token from localStorage for seamless cross-domain auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cd_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear stored credentials and redirect to login
// BUT skip this for auth endpoints themselves (login/signup/me) so their
// error messages can reach the component catch blocks without a hard redirect loop
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/me')
    
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('cd_user')
      localStorage.removeItem('cd_token')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)
