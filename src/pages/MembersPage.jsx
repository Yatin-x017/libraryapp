import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

function MemberModal({ member, onClose, onSave, t }) {
  const [form, setForm] = useState(member || {
    member_id: '', name: '', phone: '', email: '', address: '',
    fee_amount: 500, fee_due_day: 1, join_date: '', payment_day: '', is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.name.trim() || !form.member_id.trim()) {
      setError(t.nameRequired); return
    }
    setLoading(true)
    setError('')
    await onSave(form)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{member ? t.editMemberTitle : t.addNewMemberTitle}</h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.memberIdLabel}</label>
            <input className="form-input" value={form.member_id} onChange={e => update('member_id', e.target.value)} placeholder="LIB-001" />
          </div>
          <div className="form-group">
            <label className="form-label">{t.fullName}</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ravi Kumar" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.phoneLabel}</label>
            <input className="form-input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="9876543210" />
          </div>
          <div className="form-group">
            <label className="form-label">{t.emailLabel}</label>
            <input className="form-input" value={form.email || ''} onChange={e => update('email', e.target.value)} placeholder="ravi@email.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t.address}</label>
          <input className="form-input" value={form.address || ''} onChange={e => update('address', e.target.value)} placeholder="123 Main St, City" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.monthlyFeeLabel}</label>
            <input className="form-input" type="number" value={form.fee_amount} onChange={e => update('fee_amount', parseFloat(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t.dueDayLabel}</label>
            <input className="form-input" type="number" min="1" max="28" value={form.fee_due_day} onChange={e => update('fee_due_day', parseInt(e.target.value))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.joinDayLabel}</label>
            <input className="form-input" type="date" value={form.join_date || ''} onChange={e => update('join_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">{t.paymentDayLabel}</label>
            <input className="form-input" type="number" min="1" max="31" value={form.payment_day || ''} onChange={e => update('payment_day', e.target.value === '' ? null : parseInt(e.target.value))} />
          </div>
        </div>
        {member && (
          <div className="form-group">
            <label className="form-label">{t.statusLabel}</label>
            <select className="form-select" value={form.is_active ? 'active' : 'inactive'} onChange={e => update('is_active', e.target.value === 'active')}>
              <option value="active">{t.active}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t.cancel}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : t.saveMember}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { staffProfile } = useAuth()
  const { t } = useLang()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [msg, setMsg] = useState(null)
  const [filter, setFilter] = useState('active')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [pickSearch, setPickSearch] = useState('')

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    setLoading(true)
    const { data } = await supabase.from('members').select('*').order('name')
    setMembers(data || [])
    setLoading(false)
  }

  async function saveMember(form) {
    let error
    if (form.id) {
      const { error: e } = await supabase.from('members').update(form).eq('id', form.id)
      error = e
    } else {
      const { error: e } = await supabase.from('members').insert({ ...form, created_by: staffProfile?.id })
      error = e
    }
    if (error) { setMsg({ type: 'danger', text: error.message }); return }
    setMsg({ type: 'success', text: form.id ? t.memberUpdated : t.memberAdded })
    setShowModal(false)
    setEditMember(null)
    fetchMembers()
  }

  async function deleteMember(member) {
    const { error } = await supabase.from('members').delete().eq('id', member.id)
    if (error) {
      setMsg({ type: 'danger', text: error.message })
    } else {
      setMsg({ type: 'success', text: `${member.name} deleted.` })
      fetchMembers()
    }
    setDeleteConfirm(null)
    setPickSearch('')
  }

  function openEdit(member) { setEditMember(member); setShowModal(true) }
  function openAdd() { setEditMember(null); setShowModal(true) }

  const filtered = members
    .filter(m => filter === 'all' ? true : filter === 'active' ? m.is_active : !m.is_active)
    .filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_id.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone || '').includes(search)
    )

  const pickFiltered = members.filter(m =>
    m.name.toLowerCase().includes(pickSearch.toLowerCase()) ||
    m.member_id.toLowerCase().includes(pickSearch.toLowerCase()) ||
    (m.phone || '').includes(pickSearch)
  )

  const filterLabels = { active: t.active, inactive: t.inactive, all: t.all }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>{t.membersTitle}</h2>
            <p>{members.filter(m => m.is_active).length} {t.activeMembersCount}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setDeleteConfirm('pick')}>{t.removeMember}</button>
            <button className="btn btn-primary" onClick={openAdd}>{t.addMember}</button>
          </div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="flex items-center justify-between mb-4">
        <div className="tabs">
          {['active', 'inactive', 'all'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder={t.searchMembers} value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.memberId}</th>
                <th>{t.name}</th>
                <th>{t.phone}</th>
                <th>{t.email}</th>
                <th>{t.monthlyFee}</th>
                <th>{t.dueDay}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  {t.noMembersFound}
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.id}>
                  <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.member_id}</code></td>
                  <td className="font-medium">{m.name}</td>
                  <td>{m.phone || '—'}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email || '—'}</td>
                  <td>₹{m.fee_amount}</td>
                  <td>{m.fee_due_day}</td>
                  <td><span className={`badge ${m.is_active ? 'badge-success' : 'badge-neutral'}`}>{m.is_active ? t.active : t.inactive}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => openEdit(m)}>{t.edit}</button>
                    <button className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setDeleteConfirm(m)}>{t.delete}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <MemberModal member={editMember} onClose={() => { setShowModal(false); setEditMember(null) }} onSave={saveMember} t={t} />
      )}

      {deleteConfirm && deleteConfirm === 'pick' && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.removeMemberTitle}</h3>
              <button className="btn btn-icon" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ margin: '4px 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>{t.selectMember}</p>
            <div className="search-bar" style={{ marginBottom: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder={t.searchMembersPlaceholder} autoFocus value={pickSearch} onChange={e => setPickSearch(e.target.value)} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              {pickFiltered.length === 0
                ? <p style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center' }}>{t.noMembersFound}</p>
                : pickFiltered.map(m => (
                  <div key={m.id} onClick={() => setDeleteConfirm(m)}
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.member_id} · {m.phone || 'no phone'}</div>
                    </div>
                    <span className={`badge ${m.is_active ? 'badge-success' : 'badge-neutral'}`}>{m.is_active ? t.active : t.inactive}</span>
                  </div>
                ))}
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && deleteConfirm !== 'pick' && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.deleteMemberTitle}</h3>
              <button className="btn btn-icon" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ margin: '12px 0 24px', color: 'var(--text-muted)' }}>
              {t.deleteMemberConfirm} <strong>{deleteConfirm.name}</strong>{t.deleteMemberWarning}
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDeleteConfirm('pick')}>{t.back}</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => deleteMember(deleteConfirm)}>
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
