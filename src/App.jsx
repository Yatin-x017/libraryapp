import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AttendancePage from './pages/AttendancePage'
import MembersPage from './pages/MembersPage'
import FeesPage from './pages/FeesPage'
import StaffPage from './pages/StaffPage'
import OverduePage from './pages/OverduePage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, staffProfile, loading } = useAuth()

  if (loading) return (
    <div className="loading-page">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  )

  if (!user || !staffProfile) return <Navigate to="/login" replace />

  if (adminOnly && staffProfile.role !== 'admin') return <Navigate to="/" replace />

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="overdue" element={<OverduePage />} />
        <Route path="staff" element={<ProtectedRoute adminOnly><StaffPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
