import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { format, parseISO, subDays } from 'date-fns'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function NewspaperPage() {
  const { staffProfile } = useAuth()
  const { t, lang } = useLang()

  const [logs, setLogs]       = useState([])   // rows from newspaper_log, last 30 days
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)

  const today = todayStr()

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const since = format(subDays(new Date(), 29), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('newspaper_log')
      .select('id, date, received, marked_at, staff(name)')
      .gte('date', since)
      .order('date', { ascending: false })
    if (error) console.error('newspaper_log fetch error:', error)
    setLogs(data || [])
    setLoading(false)
  }

  const todayEntry = logs.find(l => l.date === today)

  async function markArrived() {
    setSaving(true)
    const { data, error } = await supabase
      .from('newspaper_log')
      .upsert({ date: today, received: true, marked_by: staffProfile?.id ?? null, marked_at: new Date().toISOString() }, { onConflict: 'date' })
      .select('id, date, received, marked_at, staff(name)')
      .single()
    setSaving(false)
    if (error) { flash('danger', error.message); return }
    setLogs(prev => [data, ...prev.filter(l => l.date !== today)])
    flash('success', lang === 'hi' ? 'दर्ज कर दिया गया।' : 'Marked as arrived.')
  }

  async function undoToday() {
    if (!todayEntry) return
    setSaving(true)
    const { error } = await supabase.from('newspaper_log').delete().eq('id', todayEntry.id)
    setSaving(false)
    if (error) { flash('danger', error.message); return }
    setLogs(prev => prev.filter(l => l.id !== todayEntry.id))
  }

  function flash(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  // Build a complete 30-day list (today back 29 days), filling in gaps as "not marked"
  const last30 = useMemo(() => {
    const byDate = {}
    logs.forEach(l => { byDate[l.date] = l })
    const days = []
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      days.push(byDate[d] || { date: d, received: false, marked_at: null, staff: null, unmarked: true })
    }
    return days
  }, [logs])

  function fmtDate(d) {
    try { return format(parseISO(d), 'd MMM yyyy') } catch { return d }
  }
  function fmtDay(d) {
    try { return format(parseISO(d), 'EEE') } catch { return '' }
  }
  function fmtTime(ts) {
    try { return format(parseISO(ts), 'hh:mm a') } catch { return '' }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'var(--text-muted)' }}>
      <div className="spinner"></div> {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h2>📰 {t.newspaperTitle}</h2>
        <p>{t.newspaperSubtitle}</p>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>
          {msg.text}
        </div>
      )}

      {/* Today's status card */}
      <div
        className="card"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', marginBottom: 20,
          border: `1px solid ${todayEntry ? '#bbf7d0' : 'var(--border)'}`,
          background: todayEntry ? 'var(--success-light)' : 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 30 }}>{todayEntry ? '✅' : '📰'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: todayEntry ? 'var(--success)' : 'var(--text)' }}>
              {todayEntry ? t.newspaperArrivedToday : t.newspaperNotArrivedToday}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {fmtDate(today)} · {fmtDay(today)}
              {todayEntry && (
                <> · {t.markedBy} {todayEntry.staff?.name || '—'} {todayEntry.marked_at ? `· ${fmtTime(todayEntry.marked_at)}` : ''}</>
              )}
            </div>
          </div>
        </div>
        <div>
          {!todayEntry ? (
            <button className="btn btn-primary" onClick={markArrived} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : t.markArrived}
            </button>
          ) : (
            <button className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={undoToday} disabled={saving}>
              {t.undoMark}
            </button>
          )}
        </div>
      </div>

      {/* 30-day log */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{t.newspaperLog}</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{lang === 'hi' ? 'तिथि' : 'Date'}</th>
                <th>{lang === 'hi' ? 'दिन' : 'Day'}</th>
                <th>{t.status}</th>
                <th>{t.markedBy}</th>
                <th>{lang === 'hi' ? 'समय' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {last30.map(entry => (
                <tr key={entry.date} style={entry.date === today ? { background: 'var(--bg-hover)' } : undefined}>
                  <td className="font-medium">
                    {entry.date === today ? `📍 ${fmtDate(entry.date)}` : fmtDate(entry.date)}
                  </td>
                  <td className="text-muted">{fmtDay(entry.date)}</td>
                  <td>
                    {entry.received
                      ? <span className="badge badge-success">✓ {t.arrived}</span>
                      : <span className="badge badge-neutral">{t.notMarked}</span>}
                  </td>
                  <td className="text-muted">{entry.staff?.name || '—'}</td>
                  <td className="text-muted">{entry.marked_at ? fmtTime(entry.marked_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
