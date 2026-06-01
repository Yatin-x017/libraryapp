import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_HI = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्तूबर','नवंबर','दिसंबर']

export default function OverduePage() {
  const { t, lang } = useLang()
  const months = lang === 'hi' ? MONTHS_HI : MONTHS_EN
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1)
  const [targetYear, setTargetYear] = useState(new Date().getFullYear())
  const navigate = useNavigate()

  useEffect(() => { fetchOverdue() }, [targetMonth, targetYear])

  async function fetchOverdue() {
    setLoading(true)
    const { data: allMembers } = await supabase.from('members').select('id, name, member_id, phone, email, fee_amount, fee_due_day').eq('is_active', true).order('name')
    const { data: paidData } = await supabase.from('fee_payments').select('member_id').eq('month', targetMonth).eq('year', targetYear)
    const paidIds = new Set((paidData || []).map(p => p.member_id))
    setOverdue((allMembers || []).filter(m => !paidIds.has(m.id)))
    setLoading(false)
  }

  function isDueDatePassed(dueDay) {
    const today = new Date()
    if (targetYear < today.getFullYear()) return true
    if (targetYear === today.getFullYear() && targetMonth < today.getMonth() + 1) return true
    if (targetYear === today.getFullYear() && targetMonth === today.getMonth() + 1) return today.getDate() > dueDay
    return false
  }

  const filtered = overdue.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.member_id.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || '').includes(search)
  )

  const totalUnpaid = filtered.reduce((sum, m) => sum + parseFloat(m.fee_amount), 0)

  function copyAlertList() {
    const text = filtered.map(m => `${m.name} (${m.member_id}) - ₹${m.fee_amount} - ${m.phone || 'No phone'}`).join('\n')
    navigator.clipboard.writeText(`OVERDUE FEES - ${months[targetMonth-1]} ${targetYear}\n\n${text}`)
    alert(t.copySuccess)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>⚠️ {t.overdueTitle}</h2>
            <p>{t.overdueSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="form-select" style={{ width: 120 }} value={targetMonth} onChange={e => setTargetMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i+1}>{m.slice(0,3)}</option>)}
            </select>
            <select className="form-select" style={{ width: 90 }} value={targetYear} onChange={e => setTargetYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="alert alert-warning">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>
            <strong>{overdue.length} {t.membersUnpaid}</strong> {months[targetMonth-1]} {targetYear}.
            &nbsp;₹{totalUnpaid.toLocaleString()}
          </span>
        </div>
      )}

      {overdue.length === 0 && !loading && (
        <div className="alert alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          {t.noOverdue}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="search-bar" style={{ flex: 1, marginBottom: 0, marginRight: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder={t.searchOverdue} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-sm" onClick={copyAlertList} disabled={filtered.length === 0}>{t.copyAlertList}</button>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/fees')} style={{ marginLeft: 6 }}>{t.recordPayment}</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t.member}</th>
                <th>{t.memberId}</th>
                <th>{t.phone}</th>
                <th>{t.email}</th>
                <th>{t.amount}</th>
                <th>{t.dueDay}</th>
                <th>{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {search ? t.noMembersFoundSearch : t.noOverdue}
                </td></tr>
              ) : filtered.map((m, idx) => {
                const pastDue = isDueDatePassed(m.fee_due_day)
                return (
                  <tr key={m.id} className={pastDue ? 'overdue' : ''}>
                    <td className="text-muted text-sm">{idx + 1}</td>
                    <td className="font-medium">{m.name}</td>
                    <td><code style={{ fontSize: 12 }}>{m.member_id}</code></td>
                    <td>{m.phone || '—'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{m.fee_amount}</td>
                    <td>{m.fee_due_day}</td>
                    <td>
                      {pastDue
                        ? <span className="badge badge-danger">⚠️ {t.overdueBadge}</span>
                        : <span className="badge badge-warning">{t.dueSoon}</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
