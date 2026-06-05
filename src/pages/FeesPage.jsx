import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_HI = ['जन','फर','मार','अप्र','मई','जून','जुल','अग','सित','अक्त','नव','दिस']

function PaymentModal({ members, onClose, onSave, t, months, prefill }) {
  const [form, setForm] = useState({
    member_id: prefill?.member_id || '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: prefill?.amount || '',
    paid_on: format(new Date(), 'yyyy-MM-dd'),
    notes: prefill?.cycles > 1 ? `${prefill.cycles} months accumulated` : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { lang } = useLang()

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
    if (!prefill?.amount) {
      const m = members.find(m => m.id === memberId)
      if (m) update('amount', m.fee_amount)
    }
  }

  const selectedMember = members.find(m => m.id === form.member_id)
  const baseFee = selectedMember ? parseFloat(selectedMember.fee_amount) : 0
  const enteredAmount = parseFloat(form.amount) || 0
  const cycles = baseFee > 0 ? Math.round(enteredAmount / baseFee) : 1
  const isMultiMonth = cycles > 1

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
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
            <input
              className="form-input"
              type="number"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="500"
            />
            {isMultiMonth && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--warning)', background: 'var(--warning-light)', padding: '5px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
                💡 {lang === 'hi'
                  ? `₹${baseFee} × ${cycles} महीने = ₹${enteredAmount}`
                  : `₹${baseFee} × ${cycles} months = ₹${enteredAmount}`}
              </div>
            )}
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

function EditPaymentModal({ payment, members, onClose, onSave, t, months, lang }) {
  const [form, setForm] = useState({
    member_id: payment.member_id || '',
    month:     payment.month,
    year:      payment.year,
    amount:    payment.amount || '',
    paid_on:   payment.paid_on ? payment.paid_on.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
    notes:     payment.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const selectedMember = members.find(m => m.id === form.member_id)
  const baseFee        = selectedMember ? parseFloat(selectedMember.fee_amount) : 0
  const enteredAmount  = parseFloat(form.amount) || 0
  const cycles         = baseFee > 0 ? Math.round(enteredAmount / baseFee) : 1
  const isMultiMonth   = cycles > 1

  async function handleSave() {
    if (!form.amount) { setError(t.selectMemberAmount); return }
    setLoading(true)
    setError('')
    const err = await onSave(payment.id, form)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>{lang === 'hi' ? 'भुगतान संपादित करें' : 'Edit Payment'}</h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Member (read-only in edit — changing member would alter history) */}
        <div className="form-group">
          <label className="form-label">{t.selectMemberLabel}</label>
          <input
            className="form-input"
            value={selectedMember ? `${selectedMember.name} (${selectedMember.member_id})` : '—'}
            readOnly
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
          />
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
            <input
              className="form-input"
              type="number"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="500"
            />
            {isMultiMonth && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--warning)', background: 'var(--warning-light)', padding: '5px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
                💡 {lang === 'hi'
                  ? `₹${baseFee} × ${cycles} महीने = ₹${enteredAmount}`
                  : `₹${baseFee} × ${cycles} months = ₹${enteredAmount}`}
              </div>
            )}
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
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : (lang === 'hi' ? 'सहेजें' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FeesPage() {
  const { staffProfile } = useAuth()
  const { t, lang } = useLang()
  const location = useLocation()
  const months = lang === 'hi' ? MONTHS_HI : MONTHS_EN

  const [payments, setPayments]       = useState([])
  const [members, setMembers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editPayment, setEditPayment] = useState(null)   // payment row being edited
  const [msg, setMsg]                 = useState(null)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear())
  const [search, setSearch]           = useState('')
  const [prefill, setPrefill]         = useState(null)

  // Open modal pre-filled if navigated from Overdue page
  useEffect(() => {
    if (location.state?.prefill) {
      setPrefill(location.state.prefill)
      setShowModal(true)
      // Clear location state so refreshing doesn't re-open
      window.history.replaceState({}, '')
    }
  }, [location.state])

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
    setPrefill(null)
    fetchData()
    return null
  }

  async function updatePayment(id, form) {
    const { error } = await supabase
      .from('fee_payments')
      .update({
        month:   form.month,
        year:    form.year,
        amount:  form.amount,
        paid_on: form.paid_on,
        notes:   form.notes,
      })
      .eq('id', id)
    if (error) return error.message
    setMsg({ type: 'success', text: lang === 'hi' ? 'भुगतान अपडेट किया गया।' : 'Payment updated.' })
    setEditPayment(null)
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
          <button className="btn btn-primary" onClick={() => { setPrefill(null); setShowModal(true) }}>
            {t.recordPayment}
          </button>
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
          <div className="label">{lang === 'hi' ? 'कुल संग्रह' : 'Total Collected'}</div>
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
                <th style={{ width: 60 }}>{t.edit}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>{t.noPayments}</td></tr>
              ) : filtered.map(p => {
                const base = members.find(m => m.id === p.member_id)?.fee_amount
                const paid = parseFloat(p.amount)
                const cycles = base ? Math.round(paid / parseFloat(base)) : 1
                return (
                  <tr key={p.id}>
                    <td className="font-medium">{p.members?.name}</td>
                    <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.members?.member_id}</code></td>
                    <td>
                      ₹{paid.toLocaleString()}
                      {cycles > 1 && (
                        <span className="badge badge-warning" style={{ marginLeft: 6, fontSize: 10 }}>
                          {cycles}{lang === 'hi' ? ' महीने' : ' mo.'}
                        </span>
                      )}
                    </td>
                    <td>{format(new Date(p.paid_on), 'dd MMM yyyy')}</td>
                    <td className="text-muted">{p.staff?.name || '—'}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{p.notes || '—'}</td>
                    <td>
                      <button
                        className="btn btn-icon"
                        title={t.edit}
                        onClick={() => setEditPayment(p)}
                        style={{ padding: '4px 8px', fontSize: 14, color: 'var(--primary)' }}
                      >✏️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <PaymentModal
          members={members}
          onClose={() => { setShowModal(false); setPrefill(null) }}
          onSave={savePayment}
          t={t}
          months={months}
          prefill={prefill}
        />
      )}

      {editPayment && (
        <EditPaymentModal
          payment={editPayment}
          members={members}
          onClose={() => setEditPayment(null)}
          onSave={updatePayment}
          t={t}
          months={months}
          lang={lang}
        />
      )}
    </div>
  )
}
