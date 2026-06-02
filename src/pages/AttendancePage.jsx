import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { format, parseISO } from 'date-fns'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function AttendancePage() {
  const { staffProfile } = useAuth()
  const { t, lang } = useLang()

  const [members, setMembers]           = useState([])
  const [todayLog, setTodayLog]         = useState([])   // [{member_id, id, ...}]
  const [logDates, setLogDates]         = useState([])   // ['2026-06-01', ...]
  const [selectedDate, setSelectedDate] = useState(null)
  const [dateLog, setDateLog]           = useState([])   // present members for selectedDate
  const [monthlySummary, setMonthlySummary] = useState([]) // [{member_id, name, days}]
  const [search, setSearch]             = useState('')
  const [logSearch, setLogSearch]       = useState('')
  const [activeTab, setActiveTab]       = useState('today')
  const [loading, setLoading]           = useState(true)
  const [loadingDate, setLoadingDate]   = useState(false)
  const [msg, setMsg]                   = useState(null)

  const today = todayStr()

  // ── Initial load ─────────────────────────────────────────
  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: mems }, { data: att }, { data: dates }] = await Promise.all([
      supabase.from('members').select('id,member_id,name,phone,is_active').eq('is_active', true).order('name'),
      supabase.from('attendance').select('id,member_id,marked_at').eq('date', today),
      supabase.from('attendance').select('date').gte('date', '2026-06-01').order('date', { ascending: false }),
    ])
    setMembers(mems || [])
    setTodayLog(att || [])

    // unique dates
    const unique = [...new Set((dates || []).map(r => r.date))]
    setLogDates(unique)
    setLoading(false)
  }

  // ── Mark present ─────────────────────────────────────────
  async function markPresent(member) {
    const alreadyIn = todayLog.some(r => r.member_id === member.id)
    if (alreadyIn) return
    const { data, error } = await supabase.from('attendance').insert({
      member_id: member.id,
      date: today,
      marked_at: new Date().toISOString(),
      marked_by: staffProfile?.id ?? null,
    }).select().single()
    if (error) { flash('danger', error.message); return }
    setTodayLog(prev => [...prev, data])
  }

  // ── Mark absent (remove) ─────────────────────────────────
  async function markAbsent(member) {
    const row = todayLog.find(r => r.member_id === member.id)
    if (!row) return
    const { error } = await supabase.from('attendance').delete().eq('id', row.id)
    if (error) { flash('danger', error.message); return }
    setTodayLog(prev => prev.filter(r => r.id !== row.id))
  }

  // ── Reset today ──────────────────────────────────────────
  async function resetToday() {
    const ids = todayLog.map(r => r.id)
    if (ids.length === 0) return
    const { error } = await supabase.from('attendance').delete().in('id', ids)
    if (error) { flash('danger', error.message); return }
    setTodayLog([])
    flash('success', lang === 'hi' ? 'आज की उपस्थिति रीसेट हुई।' : "Today's attendance reset.")
  }

  // ── Load a past date ─────────────────────────────────────
  async function loadDate(date) {
    setSelectedDate(date)
    setLoadingDate(true)
    const { data } = await supabase
      .from('attendance')
      .select('member_id, members(name, member_id)')
      .eq('date', date)
    setDateLog(data || [])

    // 30-day summary
    const { data: summary } = await supabase
      .from('attendance')
      .select('member_id, members(name)')
      .gte('date', '2026-06-01')
    const counts = {}
    ;(summary || []).forEach(r => {
      const key = r.member_id
      if (!counts[key]) counts[key] = { name: r.members?.name ?? '—', days: 0 }
      counts[key].days++
    })
    setMonthlySummary(Object.values(counts).sort((a, b) => b.days - a.days))
    setLoadingDate(false)
  }

  function flash(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  // ── Derived ───────────────────────────────────────────────
  const presentIds = new Set(todayLog.map(r => r.member_id))
  const presentCount = presentIds.size
  const absentCount  = members.length - presentCount
  const rate         = members.length ? Math.round((presentCount / members.length) * 100) : 0

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(m =>
      m.name.toLowerCase().includes(q) || (m.phone || '').includes(q) || m.member_id.toLowerCase().includes(q)
    )
  }, [members, search])

  const filteredDateLog = useMemo(() => {
    if (!logSearch.trim()) return dateLog
    const q = logSearch.toLowerCase()
    return dateLog.filter(r => r.members?.name?.toLowerCase().includes(q))
  }, [dateLog, logSearch])

  function fmtDate(d) {
    try { return format(parseISO(d), 'd MMM yyyy') } catch { return d }
  }
  function fmtDay(d) {
    try { return format(parseISO(d), 'EEE') } catch { return '' }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'var(--text-muted)' }}>
      <div className="spinner"></div> {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h2>📅 {t.attendanceTitle}</h2>
        <p>{lang === 'hi' ? 'आधी रात को स्वतः रीसेट होती है' : 'Auto-resets at midnight'} · {lang === 'hi' ? 'आज' : 'Today'}: {fmtDate(today)}</p>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          📋 {lang === 'hi' ? 'आज की उपस्थिति' : "Today's Attendance"}
        </button>
        <button className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => { setActiveTab('logs'); if (!selectedDate && logDates[0]) loadDate(logDates[0]) }}>
          📊 {lang === 'hi' ? 'मासिक लॉग' : 'Monthly Logs'}
        </button>
      </div>

      {/* ══════════ TODAY TAB ══════════ */}
      {activeTab === 'today' && (
        <>
          {/* Stat cards */}
          <div className="stats-grid">
            <div className="stat-card accent">
              <div className="label">{t.totalMembers}</div>
              <div className="value">{members.length}</div>
              <div className="sub">{t.activeMembers}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--success-light)', borderColor: '#bbf7d0' }}>
              <div className="label">{t.presentToday}</div>
              <div className="value" style={{ color: 'var(--success)' }}>{presentCount}</div>
              <div className="sub">{lang === 'hi' ? `${members.length} में से` : `of ${members.length}`}</div>
            </div>
            <div className="stat-card danger">
              <div className="label">{lang === 'hi' ? 'आज अनुपस्थित' : 'Absent Today'}</div>
              <div className="value">{absentCount}</div>
            </div>
            <div className="stat-card warning">
              <div className="label">{lang === 'hi' ? 'उपस्थिति दर' : 'Attendance Rate'}</div>
              <div className="value">{rate}%</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                {lang === 'hi' ? 'आज की उपस्थिति' : "Today's presence"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                {presentCount}/{members.length}
              </span>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${members.length ? (presentCount / members.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg, var(--accent-mid), var(--accent))',
                height: '100%', borderRadius: 999, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Search + Reset */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-subtle)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'hi' ? 'नाम या मोबाइल से खोजें...' : 'Search by name or mobile...'}
              />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>}
            </div>
            <button className="btn btn-danger btn-sm" onClick={resetToday} style={{ whiteSpace: 'nowrap' }}>
              ↺ {lang === 'hi' ? 'सभी रीसेट करें' : 'Reset All'}
            </button>
          </div>

          {/* Member table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.memberId}</th>
                    <th>{t.name}</th>
                    <th>{t.phone}</th>
                    <th>{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                    <th>{lang === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                        {t.noMembersFound}
                      </td>
                    </tr>
                  )}
                  {filteredMembers.map(m => {
                    const isPresent = presentIds.has(m.id)
                    return (
                      <tr key={m.id} style={{ background: isPresent ? 'var(--success-light)' : undefined }}>
                        <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.member_id}</code></td>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.phone || '—'}</td>
                        <td>
                          <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                            {isPresent
                              ? (lang === 'hi' ? '✓ उपस्थित' : '✓ Present')
                              : (lang === 'hi' ? '✗ अनुपस्थित' : '✗ Absent')}
                          </span>
                        </td>
                        <td>
                          {!isPresent ? (
                            <button className="btn btn-primary btn-sm" onClick={() => markPresent(m)}>
                              {lang === 'hi' ? 'उपस्थित करें' : 'Mark Present'}
                            </button>
                          ) : (
                            <button className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: '#fecaca' }} onClick={() => markAbsent(m)}>
                              {lang === 'hi' ? 'हटाएं' : 'Mark Absent'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════ LOGS TAB ══════════ */}
      {activeTab === 'logs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left: Date list */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 700 }}>
              {lang === 'hi' ? 'तिथियां' : 'Dates'}
            </div>
            {logDates.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {lang === 'hi' ? 'कोई लॉग नहीं' : 'No logs yet'}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 560, overflowY: 'auto' }}>
              {logDates.map(date => {
                const isSelected = date === selectedDate
                const isToday    = date === today
                return (
                  <button
                    key={date}
                    onClick={() => loadDate(date)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 'var(--radius)',
                      border: `1px solid ${isSelected ? 'var(--accent-mid)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-light)' : 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                          {isToday ? `📍 ${lang === 'hi' ? 'आज' : 'Today'}` : fmtDate(date)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{fmtDay(date)}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Detail + Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Selected day detail */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {selectedDate
                      ? (selectedDate === today ? `📍 ${lang === 'hi' ? 'आज' : 'Today'}` : fmtDate(selectedDate))
                      : (lang === 'hi' ? 'तिथि चुनें' : 'Select a date')}
                    {selectedDate && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{fmtDay(selectedDate)}</span>
                    )}
                  </div>
                  {selectedDate && !loadingDate && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {dateLog.length} {lang === 'hi' ? 'उपस्थित' : 'present'} · {members.length - dateLog.length} {lang === 'hi' ? 'अनुपस्थित' : 'absent'}
                    </div>
                  )}
                </div>
                <div className="search-bar" style={{ marginBottom: 0, width: 180 }}>
                  <input
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    placeholder={lang === 'hi' ? 'खोजें...' : 'Search...'}
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ padding: '16px 20px', minHeight: 60 }}>
                {loadingDate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner"></div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</span>
                  </div>
                ) : !selectedDate ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {lang === 'hi' ? '← बाईं ओर से तिथि चुनें' : '← Select a date on the left'}
                  </p>
                ) : filteredDateLog.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {dateLog.length === 0
                      ? (lang === 'hi' ? '🚫 इस दिन कोई उपस्थिति नहीं' : '🚫 No attendance recorded for this day')
                      : (lang === 'hi' ? 'कोई परिणाम नहीं' : 'No results')}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {filteredDateLog.map(r => (
                      <span key={r.member_id} className="badge badge-success" style={{ padding: '4px 12px', fontSize: 13 }}>
                        ✓ {r.members?.name ?? '—'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly summary table */}
            {monthlySummary.length > 0 && (
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    📊 {lang === 'hi' ? '1 जून से सारांश' : 'Summary since 1 Jun'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {lang === 'hi' ? 'कुल उपस्थित दिन प्रति सदस्य' : 'Total days present per member'}
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.name}</th>
                        <th>{lang === 'hi' ? 'उपस्थित दिन' : 'Days Present'}</th>
                        <th>{lang === 'hi' ? 'दर' : 'Rate'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlySummary.map((entry, i) => {
                        const totalDays = logDates.length || 1
                        const rate = Math.round((entry.days / totalDays) * 100)
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{entry.name}</td>
                            <td><span className="badge badge-info">{entry.days}</span></td>
                            <td>
                              <span className={`badge ${rate >= 70 ? 'badge-success' : rate >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
