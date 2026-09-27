import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ui/ProtectedRoute'
import CustomCursor from './components/ui/CustomCursor'
import HomePage from './pages/HomePage'

// Route Code-Splitting for Lightning-Fast Initial Page Loads
const UnifiedAuth = lazy(() => import('./pages/UnifiedAuth'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const ChallengeDetailPage = lazy(() => import('./pages/ChallengeDetailPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds fresh
      refetchOnWindowFocus: false,
    },
  },
})

// Sleek Cybernetic Loading Screen Fallback
const PageLoadingFallback = () => (
  <div className="bg-[#0A0A0A] min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.03]"
      style={{ backgroundImage: 'radial-gradient(#d3ef57 1px, transparent 1px)', backgroundSize: '32px 32px' }}
    />
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      <span className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase animate-pulse">
        INITIALIZING_MODULE...
      </span>
    </div>
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CustomCursor />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<UnifiedAuth />} />
              <Route path="/signup" element={<UnifiedAuth />} />
              <Route path="/auth/google" element={<UnifiedAuth />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/challenges" element={<ChallengesPage />} />
              <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />

              {/* Protected — must be logged in */}
              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />

              {/* Admin only */}
              <Route path="/admin" element={
                <AdminRoute><AdminDashboard /></AdminRoute>
              } />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '212640393402-ud3mar6rlp3rrjg1n8cgvepshpfb7jsn.apps.googleusercontent.com').trim()

export default function AppWrapper() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  )
}
