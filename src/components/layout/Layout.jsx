import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  CreditCard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  LogOut: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

export default function Layout() {
  const { staffProfile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Balaji Library</h1>
          <span>Attendance & Fee Manager</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">Overview</div>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Home /> Dashboard
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Daily Work</div>
            <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Calendar /> Mark Attendance
            </NavLink>
            <NavLink to="/overdue" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.AlertTriangle /> Overdue Fees
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Management</div>
            <NavLink to="/members" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Users /> Members
            </NavLink>
            <NavLink to="/fees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.CreditCard /> Fee Payments
            </NavLink>
            {staffProfile?.role === 'admin' && (
              <NavLink to="/staff" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icons.Shield /> Staff
              </NavLink>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="staff-name">{staffProfile?.name || 'Staff'}</div>
          <div className="staff-role">{staffProfile?.role || ''}</div>
          <button onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
