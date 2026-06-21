import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'

const Icons = {
  Home:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Calendar:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Users:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  CreditCard:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Newspaper:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
  Shield:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  HelpCircle:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  LogOut:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
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

        {/* ── Logo / Branding ── */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, border: '1px solid rgba(255,255,255,0.2)',
            }}>
              📚
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: 'system-ui, sans-serif' }}>
                Balaji Library
              </h1>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'स्टाफ पोर्टल' : 'Staff Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
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
            <NavLink to="/newspaper" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.Newspaper /> {t.newspaper}
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

          <div className="nav-section">
            <div className="nav-label">{lang === 'hi' ? 'अन्य' : 'OTHER'}</div>
            <NavLink to="/help" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icons.HelpCircle /> {lang === 'hi' ? 'सहायता' : 'Help'}
            </NavLink>
          </div>
        </nav>

        {/* ── Language toggle ── */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Language
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {lang === 'en' ? 'EN' : 'हि'}
            </span>
          </div>
          <button
            onClick={toggleLang}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '5px 4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            {[{ code: 'en', flag: '🇬🇧', label: 'English' }, { code: 'hi', flag: '🇮🇳', label: 'हिंदी' }].map(opt => (
              <span key={opt.code} style={{
                flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 600,
                padding: '4px 0', borderRadius: 6,
                background: lang === opt.code ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: lang === opt.code ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
              }}>
                {opt.flag} {opt.label}
              </span>
            ))}
          </button>
        </div>

        {/* ── Footer / user ── */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              {(staffProfile?.name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div className="staff-name">{staffProfile?.name || 'Staff'}</div>
              <div className="staff-role">{staffProfile?.role === 'admin' ? t.admin : t.staff}</div>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Icons.LogOut />
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
