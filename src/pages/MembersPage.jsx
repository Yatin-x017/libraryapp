import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(member || {
    member_id: '', name: '', phone: '', email: '', address: '',
    fee_amount: 500, fee_due_day: 1, is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.name.trim() || !form.member_id.trim()) {
      setError('Name and Member ID are required.'); return
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
          <h3>{member ? 'Edit Member' : 'Add New Member'}</h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Member ID *</label>
            <input className="form-input" value={form.member_id} onChange={e => update('member_id', e.target.value)} placeholder="LIB-001" />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ravi Kumar" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="9876543210" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email || ''} onChange={e => update('email', e.target.value)} placeholder="ravi@email.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" value={form.address || ''} onChange={e => update('address', e.target.value)} placeholder="123 Main St, City" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monthly Fee (₹)</label>
            <input className="form-input" type="number" value={form.fee_amount} onChange={e => update('fee_amount', parseFloat(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Day of Month</label>
            <input className="form-input" type="number" min="1" max="28" value={form.fee_due_day} onChange={e => update('fee_due_day', parseInt(e.target.value))} />
          </div>
        </div>
        {member && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.is_active ? 'active' : 'inactive'} onChange={e => update('is_active', e.target.value === 'active')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : 'Save Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const { staffProfile } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [msg, setMsg] = useState(null)
  const [filter, setFilter] = useState('active') // active | inactive | all

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
    if (error) {
      setMsg({ type: 'danger', text: error.message }); return
    }
    setMsg({ type: 'success', text: form.id ? 'Member updated.' : 'Member added.' })
    setShowModal(false)
    setEditMember(null)
    fetchMembers()
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

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>Members</h2>
            <p>{members.filter(m => m.is_active).length} active members</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Member</button>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="flex items-center justify-between mb-4">
        <div className="tabs">
          {['active', 'inactive', 'all'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Search by name, ID, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Monthly Fee</th>
                <th>Due Day</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No members found.
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.id}>
                  <td><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.member_id}</code></td>
                  <td className="font-medium">{m.name}</td>
                  <td>{m.phone || '—'}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email || '—'}</td>
                  <td>₹{m.fee_amount}</td>
                  <td>{m.fee_due_day}</td>
                  <td><span className={`badge ${m.is_active ? 'badge-success' : 'badge-neutral'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openEdit(m)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <MemberModal
          member={editMember}
          onClose={() => { setShowModal(false); setEditMember(null) }}
          onSave={saveMember}
        />
      )}
    </div>
  )
}
