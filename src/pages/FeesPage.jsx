import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { format } from 'date-fns'

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_HI = ['जन','फर','मार','अप्र','मई','जून','जुल','अग','सित','अक्त','नव','दिस']

function PaymentModal({ members, onClose, onSave, t, months }) {
  const [form, setForm] = useState({
    member_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    paid_on: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.member_id || !form.amount) { setError(t.selectMemberAmount); return }
    setLoading(true)
    setError('')
    const err = await onSave(form)
    if (err) setError(err)
    setLoading(false)
  }

  function handleMemberChange(memberId) {
    update('member_id', memberId)
    const m = members.find(m => m.id === memberId)
    if (m) update('amount', m.fee_amount)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{t.recordFeePayment}</h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-group">
          <label className="form-label">{t.selectMemberLabel}</label>
          <select className="form-select" value={form.member_id} onChange={e => handleMemberChange(e.target.value)}>
            <option value="">{t.selectMemberOption}</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.monthLabel}</label>
            <select className="form-select" value={form.month} onChange={e => update('month', parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t.yearLabel}</label>
            <input className="form-input" type="number" value={form.year} onChange={e => update('year', parseInt(e.target.value))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.amountLabel}</label>
            <input className="form-input" type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="500" />
          </div>
          <div className="form-group">
            <label className="form-label">{t.paidOnLabel}</label>
            <input className="form-input" type="date" value={form.paid_on} onChange={e => update('paid_on', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t.notes}</label>
          <input className="form-input" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder={t.notesPlaceholder} />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t.cancel}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : t.savePayment}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FeesPage() {
  const { staffProfile } = useAuth()
  const { t, lang } = useLang()
  const months = lang === 'hi' ? MONTHS_HI : MONTHS_EN
  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [filterMonth, filterYear])

  async function fetchData() {
    setLoading(true)
    const [{ data: payData }, { data: memberData }] = await Promise.all([
      supabase.from('fee_payments').select('*, members(name, member_id), staff(name)').eq('month', filterMonth).eq('year', filterYear).order('paid_on', { ascending: false }),
      supabase.from('members').select('id, name, member_id, fee_amount').eq('is_active', true).order('name'),
    ])
    setPayments(payData || [])
    setMembers(memberData || [])
    setLoading(false)
  }

  async function savePayment(form) {
    const { error } = await supabase.from('fee_payments').insert({ ...form, collected_by: staffProfile?.id })
    if (error) {
      if (error.code === '23505') return `${t.alreadyPaid} ${months[filterMonth-1]}.`
      return error.message
    }
    setMsg({ type: 'success', text: t.paymentRecorded })
    setShowModal(false)
    fetchData()
    return null
  }

  const filtered = payments.filter(p =>
    p.members?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.members?.member_id.toLowerCase().includes(search.toLowerCase())
  )

  const totalCollected = filtered.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>{t.feePaymentsTitle}</h2>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t.recordPayment}</button>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="flex items-center gap-2 mb-4">
        <select className="form-select" style={{ width: 110 }} value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="form-select" style={{ width: 90 }} value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card accent">
          <div className="label">{t.feesPaid}</div>
          <div className="value">{filtered.length}</div>
          <div className="sub">{months[filterMonth-1]} {filterYear}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t.amount}</div>
          <div className="value">₹{totalCollected.toLocaleString()}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">{t.overdue}</div>
          <div className="value">{Math.max(0, members.length - filtered.length)}</div>
          <div className="sub">{t.membersUnpaid}</div>
        </div>
      </div>

      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder={t.searchFees} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.member}</th>
                <th>{t.memberId}</th>
                <th>{t.amount}</th>
                <th>{t.paidOn}</th>
                <th>{t.collectedBy}</th>
                <th>{t.notes}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>{t.noPayments}</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">{p.members?.name}</td>
                  <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.members?.member_id}</code></td>
                  <td>₹{parseFloat(p.amount).toLocaleString()}</td>
                  <td>{format(new Date(p.paid_on), 'dd MMM yyyy')}</td>
                  <td className="text-muted">{p.staff?.name || '—'}</td>
                  <td className="text-muted" style={{ fontSize: 12 }}>{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <PaymentModal members={members} onClose={() => setShowModal(false)} onSave={savePayment} t={t} months={months} />}
    </div>
  )
}
