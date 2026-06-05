import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_HI = ['जन','फर','मार','अप्र','मई','जून','जुल','अग','सित','अक्त','नव','दिस']

/* ─────────────────────────────────────────────
   ADD PAYMENT MODAL
───────────────────────────────────────────── */
function PaymentModal({ members, onClose, onSave, t, months, prefill }) {
  const [form, setForm] = useState({
    member_id: prefill?.member_id || '',
    month:     new Date().getMonth() + 1,
    year:      new Date().getFullYear(),
    amount:    prefill?.amount || '',
    paid_on:   format(new Date(), 'yyyy-MM-dd'),
    notes:     prefill?.cycles > 1 ? `${prefill.cycles} months accumulated` : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { lang } = useLang()

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.member_id || !form.amount) { setError(t.selectMemberAmount); return }
    setLoading(true); setError('')
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
  const baseFee        = selectedMember ? parseFloat(selectedMember.fee_amount) : 0
  const enteredAmount  = parseFloat(form.amount) || 0
  const cycles         = baseFee > 0 ? Math.round(enteredAmount / baseFee) : 1
  const isMultiMonth   = cycles > 1

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
            <input className="form-input" type="number" value={form.amount}
              onChange={e => update('amount', e.target.value)} placeholder="500" />
            {isMultiMonth && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--warning)', background: 'var(--warning-light)', padding: '5px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
                💡 {lang === 'hi' ? `₹${baseFee} × ${cycles} महीने = ₹${enteredAmount}` : `₹${baseFee} × ${cycles} months = ₹${enteredAmount}`}
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

/* ─────────────────────────────────────────────
   EDIT PAYMENT MODAL
───────────────────────────────────────────── */
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
    setLoading(true); setError('')
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

        <div className="form-group">
          <label className="form-label">{t.selectMemberLabel}</label>
          <input className="form-input"
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
            <input className="form-input" type="number" value={form.amount}
              onChange={e => update('amount', e.target.value)} placeholder="500" />
            {isMultiMonth && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--warning)', background: 'var(--warning-light)', padding: '5px 10px', borderRadius: 6, border: '1px solid #fde68a' }}>
                💡 {lang === 'hi' ? `₹${baseFee} × ${cycles} महीने = ₹${enteredAmount}` : `₹${baseFee} × ${cycles} months = ₹${enteredAmount}`}
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

/* ─────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────── */
function DeleteConfirmModal({ payment, members, onClose, onConfirm, lang, t }) {
  const [loading, setLoading] = useState(false)
  const member = members.find(m => m.id === payment.member_id)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm(payment.id)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 style={{ color: 'var(--danger)' }}>
            {lang === 'hi' ? '🗑 भुगतान हटाएं' : '🗑 Delete Payment'}
          </h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '4px 0 16px', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
          {lang === 'hi'
            ? 'क्या आप वाकई इस भुगतान को हटाना चाहते हैं?'
            : 'Are you sure you want to delete this payment? This cannot be undone.'}
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
            <div><strong>{member?.name || '—'}</strong> <span style={{ color: 'var(--text-muted)' }}>({member?.member_id || '—'})</span></div>
            <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
              ₹{parseFloat(payment.amount).toLocaleString()} &nbsp;·&nbsp;
              {MONTHS_EN[payment.month - 1]} {payment.year} &nbsp;·&nbsp;
              {payment.paid_on ? format(new Date(payment.paid_on + 'T00:00:00'), 'dd MMM yyyy') : '—'}
            </div>
            {payment.notes && <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-muted)' }}>{payment.notes}</div>}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t.cancel}</button>
          <button
            className="btn"
            onClick={handleConfirm}
            disabled={loading}
            style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
          >
            {loading
              ? <span className="spinner" style={{ width: 14, height: 14 }}></span>
              : (lang === 'hi' ? 'हाँ, हटाएं' : 'Yes, Delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   COMMENTS PANEL (slide-in drawer)
───────────────────────────────────────────── */
function CommentsPanel({ payment, members, staffProfile, onClose, lang }) {
  const [comments, setComments] = useState([])
  const [newText, setNewText]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef               = useRef(null)

  const member = members.find(m => m.id === payment.member_id)

  useEffect(() => { fetchComments() }, [payment.id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  async function fetchComments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('payment_comments')
      .select('*, staff(name)')
      .eq('payment_id', payment.id)
      .order('created_at', { ascending: true })
    if (error) {
      setError('setup')
    } else {
      setComments(data || [])
    }
    setLoading(false)
  }

  async function handleSend() {
    if (!newText.trim()) return
    setSending(true)
    const { error } = await supabase.from('payment_comments').insert({
      payment_id: payment.id,
      staff_id:   staffProfile?.id || null,
      body:       newText.trim(),
    })
    if (error) {
      setError('setup')
    } else {
      setNewText('')
      fetchComments()
    }
    setSending(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999 }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
        background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-icon" onClick={onClose} style={{ marginRight: 4 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              💬 {lang === 'hi' ? 'टिप्पणियाँ' : 'Comments'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {member?.name} · ₹{parseFloat(payment.amount).toLocaleString()} · {MONTHS_EN[payment.month - 1]} {payment.year}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error === 'setup' ? (
            <div style={{ padding: 16, borderRadius: 8, background: 'var(--warning-light)', border: '1px solid #fde68a', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              <strong>⚠️ {lang === 'hi' ? 'तालिका नहीं मिली' : 'Table not found'}</strong><br />
              {lang === 'hi'
                ? 'कृपया Supabase में payment_comments तालिका बनाएं।'
                : 'Please create the'} <code style={{ background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 3 }}>payment_comments</code>
              {lang !== 'hi' && ' table in Supabase. Run the SQL below:'}
              <pre style={{ marginTop: 10, fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{`create table payment_comments (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references fee_payments(id) on delete cascade,
  staff_id uuid references staff(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);
alter table payment_comments enable row level security;
create policy "staff can manage comments"
  on payment_comments for all using (true);`}</pre>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
              {lang === 'hi' ? 'अभी तक कोई टिप्पणी नहीं।' : 'No comments yet. Be the first to add one.'}
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{
                padding: '10px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.55,
                background: c.staff_id === staffProfile?.id ? 'var(--primary-light, rgba(59,130,246,0.08))' : 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                alignSelf: c.staff_id === staffProfile?.id ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
              }}>
                <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                  {c.staff?.name || (lang === 'hi' ? 'अज्ञात' : 'Unknown')}
                  <span style={{ marginLeft: 8, fontWeight: 400 }}>
                    {c.created_at ? format(new Date(c.created_at), 'dd MMM, hh:mm a') : ''}
                  </span>
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{c.body}</div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error !== 'setup' && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder={lang === 'hi' ? 'टिप्पणी लिखें… (Enter भेजें)' : 'Write a comment… (Enter to send)'}
              style={{
                flex: 1, resize: 'none', padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !newText.trim()}
              className="btn btn-primary"
              style={{ padding: '8px 14px', alignSelf: 'flex-end' }}
            >
              {sending ? <span className="spinner" style={{ width: 13, height: 13 }}></span> : '➤'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function FeesPage() {
  const { staffProfile }      = useAuth()
  const { t, lang }           = useLang()
  const location              = useLocation()
  const months                = lang === 'hi' ? MONTHS_HI : MONTHS_EN

  const [payments, setPayments]             = useState([])
  const [members, setMembers]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [showModal, setShowModal]           = useState(false)
  const [editPayment, setEditPayment]       = useState(null)
  const [deletePayment, setDeletePayment]   = useState(null)   // ← new: for delete confirm
  const [commentPayment, setCommentPayment] = useState(null)   // ← new: for comments panel
  const [msg, setMsg]                       = useState(null)
  const [filterMonth, setFilterMonth]       = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear]         = useState(new Date().getFullYear())
  const [search, setSearch]                 = useState('')
  const [prefill, setPrefill]               = useState(null)
  const [commentCounts, setCommentCounts]   = useState({})     // ← new: badge counts

  useEffect(() => {
    if (location.state?.prefill) {
      setPrefill(location.state.prefill)
      setShowModal(true)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  useEffect(() => { fetchData() }, [filterMonth, filterYear])

  async function fetchData() {
    setLoading(true)
    const [{ data: payData }, { data: memberData }] = await Promise.all([
      supabase
        .from('fee_payments')
        .select('*, members(name, member_id), staff(name)')
        .eq('month', filterMonth)
        .eq('year', filterYear)
        .order('paid_on', { ascending: false }),
      supabase.from('members').select('id, name, member_id, fee_amount').eq('is_active', true).order('name'),
    ])
    const pRows = payData || []
    setPayments(pRows)
    setMembers(memberData || [])
    setLoading(false)

    // Fetch comment counts for badge indicators (best-effort, silent if table missing)
    if (pRows.length > 0) {
      const ids = pRows.map(p => p.id)
      const { data: countData } = await supabase
        .from('payment_comments')
        .select('payment_id')
        .in('payment_id', ids)
      if (countData) {
        const counts = {}
        countData.forEach(r => { counts[r.payment_id] = (counts[r.payment_id] || 0) + 1 })
        setCommentCounts(counts)
      }
    }
  }

  async function savePayment(form) {
    const { error } = await supabase.from('fee_payments').insert({ ...form, collected_by: staffProfile?.id })
    if (error) {
      if (error.code === '23505') return `${t.alreadyPaid} ${months[filterMonth - 1]}.`
      return error.message
    }
    setMsg({ type: 'success', text: t.paymentRecorded })
    setShowModal(false); setPrefill(null)
    fetchData()
    return null
  }

  async function updatePayment(id, form) {
    const { error } = await supabase
      .from('fee_payments')
      .update({ month: form.month, year: form.year, amount: form.amount, paid_on: form.paid_on, notes: form.notes })
      .eq('id', id)
    if (error) return error.message
    setMsg({ type: 'success', text: lang === 'hi' ? 'भुगतान अपडेट किया गया।' : 'Payment updated.' })
    setEditPayment(null)
    fetchData()
    return null
  }

  // ← new: delete handler
  async function confirmDelete(id) {
    const { error } = await supabase.from('fee_payments').delete().eq('id', id)
    if (error) {
      setMsg({ type: 'danger', text: error.message })
    } else {
      setMsg({ type: 'success', text: lang === 'hi' ? 'भुगतान हटा दिया गया।' : 'Payment deleted.' })
    }
    setDeletePayment(null)
    fetchData()
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
          <div><h2>{t.feePaymentsTitle}</h2></div>
          <button className="btn btn-primary" onClick={() => { setPrefill(null); setShowModal(true) }}>
            {t.recordPayment}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>
          {msg.text}
        </div>
      )}

      {/* Month / Year filter */}
      <div className="flex items-center gap-2 mb-4">
        <select className="form-select" style={{ width: 110 }} value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
          {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="form-select" style={{ width: 90 }} value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card accent">
          <div className="label">{t.feesPaid}</div>
          <div className="value">{filtered.length}</div>
          <div className="sub">{months[filterMonth - 1]} {filterYear}</div>
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

      {/* Search */}
      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input placeholder={t.searchFees} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
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
                <th style={{ width: 120, textAlign: 'center' }}>
                  {lang === 'hi' ? 'क्रियाएं' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>{t.noPayments}</td></tr>
              ) : filtered.map(p => {
                const base   = members.find(m => m.id === p.member_id)?.fee_amount
                const paid   = parseFloat(p.amount)
                const cycles = base ? Math.round(paid / parseFloat(base)) : 1
                const cCount = commentCounts[p.id] || 0
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
                    <td>{format(new Date(p.paid_on + 'T00:00:00'), 'dd MMM yyyy')}</td>
                    <td className="text-muted">{p.staff?.name || '—'}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{p.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                        {/* Edit */}
                        <button
                          className="btn btn-icon"
                          title={t.edit}
                          onClick={() => setEditPayment(p)}
                          style={{ padding: '4px 7px', fontSize: 13 }}
                        >✏️</button>

                        {/* Comments */}
                        <button
                          className="btn btn-icon"
                          title={lang === 'hi' ? 'टिप्पणियाँ' : 'Comments'}
                          onClick={() => setCommentPayment(p)}
                          style={{ padding: '4px 7px', fontSize: 13, position: 'relative' }}
                        >
                          💬
                          {cCount > 0 && (
                            <span style={{
                              position: 'absolute', top: -2, right: -2,
                              background: 'var(--primary)', color: '#fff',
                              borderRadius: '50%', width: 14, height: 14,
                              fontSize: 9, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              lineHeight: 1,
                            }}>{cCount}</span>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          className="btn btn-icon"
                          title={t.delete}
                          onClick={() => setDeletePayment(p)}
                          style={{ padding: '4px 7px', fontSize: 13, color: 'var(--danger)' }}
                        >🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add payment modal */}
      {showModal && (
        <PaymentModal
          members={members}
          onClose={() => { setShowModal(false); setPrefill(null) }}
          onSave={savePayment}
          t={t} months={months} prefill={prefill}
        />
      )}

      {/* Edit payment modal */}
      {editPayment && (
        <EditPaymentModal
          payment={editPayment} members={members}
          onClose={() => setEditPayment(null)}
          onSave={updatePayment}
          t={t} months={months} lang={lang}
        />
      )}

      {/* Delete confirm modal */}
      {deletePayment && (
        <DeleteConfirmModal
          payment={deletePayment} members={members}
          onClose={() => setDeletePayment(null)}
          onConfirm={confirmDelete}
          lang={lang} t={t}
        />
      )}

      {/* Comments panel */}
      {commentPayment && (
        <CommentsPanel
          payment={commentPayment}
          members={members}
          staffProfile={staffProfile}
          onClose={() => { setCommentPayment(null); fetchData() }}
          lang={lang}
        />
      )}
    </div>
  )
}
