import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute, AdminRoute } from './components/ui/ProtectedRoute'
import CustomCursor from './components/ui/CustomCursor'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/admin/Dashboard'
import EventsPage from './pages/EventsPage'
import ChallengesPage from './pages/ChallengesPage'
import TeamPage from './pages/TeamPage'
import ProjectsPage from './pages/ProjectsPage'
import GalleryPage from './pages/GalleryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import DashboardPage from './pages/DashboardPage'
import EventDetailPage from './pages/EventDetailPage'
import ChallengeDetailPage from './pages/ChallengeDetailPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
        <AuthProvider>
          <CustomCursor />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
