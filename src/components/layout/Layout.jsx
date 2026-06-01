import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'

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
  const { lang, t, toggleLang } = useLang()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>📚 {t.appName}</h1>
          <span>{t.appSubtitle}</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">{t.overview}</div>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Home /> {t.dashboard}
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">{t.dailyWork}</div>
            <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Calendar /> {t.markAttendance}
            </NavLink>
            <NavLink to="/overdue" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.AlertTriangle /> {t.overdueFees}
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">{t.management}</div>
            <NavLink to="/members" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Users /> {t.members}
            </NavLink>
            <NavLink to="/fees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.CreditCard /> {t.feePayments}
            </NavLink>
            {staffProfile?.role === 'admin' && (
              <NavLink to="/staff" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icons.Shield /> {t.staff}
              </NavLink>
            )}
          </div>
        </nav>

        {/* Language Toggle */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Language
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              {lang === 'en' ? 'EN' : 'हि'}
            </span>
          </div>
          <button
            onClick={toggleLang}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '6px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0
            }}
          >
            <span style={{
              flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '4px 0', borderRadius: 6,
              background: lang === 'en' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: lang === 'en' ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.2s'
            }}>
              🇬🇧 English
            </span>
            <span style={{
              flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600, padding: '4px 0', borderRadius: 6,
              background: lang === 'hi' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: lang === 'hi' ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.2s'
            }}>
              🇮🇳 हिंदी
            </span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="staff-name">{staffProfile?.name || 'Staff'}</div>
          <div className="staff-role">{staffProfile?.role === 'admin' ? t.admin : t.staff}</div>
          <button onClick={handleSignOut}>
            {t.signOut}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
