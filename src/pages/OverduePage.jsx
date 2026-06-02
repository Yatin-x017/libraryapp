import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_HI = ['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्तूबर','नवंबर','दिसंबर']

// How many 30-day cycles have elapsed since the member's original due date?
// e.g. due 1 Jun, checking on 3 Jul → 1 full cycle passed → ₹500 × 2 (Jun + Jul)
function calcAmountDue(member, asOfDate) {
  const { fee_due_day, fee_amount } = member
  const base = parseFloat(fee_amount) || 0
  if (!fee_due_day || base === 0) return { cycles: 1, total: base }

  // Original due date: fee_due_day of the current month being viewed
  // We look back to find how many 30-day periods have passed since that day
  const dueThisMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), fee_due_day)

  // If due date hasn't passed yet this month, check from last month's due date
  const originalDue = dueThisMonth <= asOfDate ? dueThisMonth
    : new Date(asOfDate.getFullYear(), asOfDate.getMonth() - 1, fee_due_day)

  const msPerDay = 1000 * 60 * 60 * 24
  const daysElapsed = Math.max(0, Math.floor((asOfDate - originalDue) / msPerDay))
  const cycles = Math.max(1, Math.ceil((daysElapsed + 1) / 30))

  return { cycles, total: base * cycles }
}

export default function OverduePage() {
  const { t, lang } = useLang()
  const months = lang === 'hi' ? MONTHS_HI : MONTHS_EN
  const [overdue, setOverdue]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1)
  const [targetYear, setTargetYear]   = useState(new Date().getFullYear())
  const navigate = useNavigate()
  const today = new Date()

  useEffect(() => { fetchOverdue() }, [targetMonth, targetYear])

  async function fetchOverdue() {
    setLoading(true)
    const { data: allMembers, error: memberError } = await supabase
      .from('members')
      .select('id, name, member_id, phone, email, fee_amount, fee_due_day')
      .eq('is_active', true)
      .order('name')
    if (memberError) console.error('members fetch error:', memberError)
    const { data: paidData } = await supabase
      .from('fee_payments')
      .select('member_id')
      .eq('month', targetMonth)
      .eq('year', targetYear)
    const paidIds = new Set((paidData || []).map(p => p.member_id))
    setOverdue((allMembers || []).filter(m => !paidIds.has(m.id)))
    setLoading(false)
  }

  function isDueDatePassed(dueDay) {
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

  // Total accumulated across all overdue members
  const grandTotal = filtered.reduce((sum, m) => {
    const { total } = calcAmountDue(m, today)
    return sum + total
  }, 0)

  function copyAlertList() {
    const lines = filtered.map(m => {
      const { cycles, total } = calcAmountDue(m, today)
      return `${m.name} (${m.member_id}) - ₹${total} (${cycles} month${cycles !== 1 ? 's' : ''}) - ${m.phone || 'No phone'}`
    })
    navigator.clipboard.writeText(`OVERDUE FEES - ${months[targetMonth-1]} ${targetYear}\n\n${lines.join('\n')}`)
    alert(t.copySuccess)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>⚠️ {t.overdueTitle}</h2>
            <p>{lang === 'hi' ? 'शुल्क 30 दिन प्रति चक्र के हिसाब से जुड़ता है' : 'Fees accumulate every 30 days from original due date'}</p>
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
            &nbsp;{lang === 'hi' ? 'कुल बकाया:' : 'Total accumulated:'} <strong>₹{grandTotal.toLocaleString()}</strong>
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
                <th style={{ whiteSpace: 'nowrap' }}>{lang === 'hi' ? 'मूल शुल्क' : 'Base Fee'}</th>
                <th style={{ whiteSpace: 'nowrap' }}>{lang === 'hi' ? 'चक्र' : 'Cycles'}</th>
                <th style={{ whiteSpace: 'nowrap' }}>{lang === 'hi' ? 'कुल बकाया' : 'Total Due'}</th>
                <th>{t.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {search ? t.noMembersFoundSearch : t.noOverdue}
                </td></tr>
              ) : filtered.map((m, idx) => {
                const pastDue = isDueDatePassed(m.fee_due_day)
                const { cycles, total } = calcAmountDue(m, today)
                const isAccumulated = cycles > 1
                return (
                  <tr key={m.id} className={pastDue ? 'overdue' : ''}>
                    <td className="text-muted text-sm">{idx + 1}</td>
                    <td className="font-medium">{m.name}</td>
                    <td><code style={{ fontSize: 12 }}>{m.member_id}</code></td>
                    <td>{m.phone || '—'}</td>
                    <td>₹{parseFloat(m.fee_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${isAccumulated ? 'badge-danger' : 'badge-warning'}`}>
                        {cycles}×
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: isAccumulated ? 'var(--danger)' : 'var(--text)' }}>
                      ₹{total.toLocaleString()}
                      {isAccumulated && (
                        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
                          ({cycles} {lang === 'hi' ? 'महीने' : 'months'})
                        </span>
                      )}
                    </td>
                    <td>
                      {pastDue
                        ? <span className="badge badge-danger">⚠️ {t.overdueBadge}</span>
                        : <span className="badge badge-warning">{t.dueSoon}</span>
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/fees', { state: { prefill: { member_id: m.id, amount: total, cycles } } })}
                      >
                        {t.collectFee}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accumulation explainer */}
      <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
          {lang === 'hi'
            ? 'शुल्क हर 30 दिन में एक बार जुड़ता है। उदाहरण: यदि किसी सदस्य का शुल्क 1 जून को देय था और उन्होंने 3 जुलाई को भुगतान किया, तो 2 चक्र (जून + जुलाई) के लिए कुल ₹1000 देना होगा।'
            : 'Fees accumulate once every 30 days from the original due date. Example: if due on 1 Jun and paid on 3 Jul, 2 cycles have elapsed — total owed is ₹1,000 (2 × ₹500).'}
        </p>
      </div>
    </div>
  )
}
