import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AttendancePage from './pages/AttendancePage'
import MembersPage from './pages/MembersPage'
import FeesPage from './pages/FeesPage'
import StaffPage from './pages/StaffPage'
import OverduePage from './pages/OverduePage'
import NewspaperPage from './pages/NewspaperPage'
import HelpPage from './pages/HelpPage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, staffProfile, loading, profileLoading } = useAuth()

  if (loading || profileLoading) return (
    <div className="loading-page">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  // If user exists but staffProfile is null, show an error instead of redirect loop
  if (!staffProfile) return (
    <div className="loading-page">
      <p style={{ color: 'var(--danger)', textAlign: 'center', maxWidth: 320 }}>
        ⚠️ Your account is not linked to a staff profile.<br />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'block' }}>
          Ask your admin to add you in the staff table in Supabase.
        </span>
      </p>
    </div>
  )

  if (adminOnly && staffProfile.role !== 'admin') return <Navigate to="/" replace />

  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="loading-page">
      <div className="spinner"></div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="overdue" element={<OverduePage />} />
        <Route path="newspaper" element={<NewspaperPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="staff" element={<ProtectedRoute adminOnly><StaffPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
