import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function AddStaffModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required.'); return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }
    setLoading(true)
    setError('')
    const err = await onSave(form)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add Staff Member</h3>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Priya Sharma" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="priya@library.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min. 6 characters" />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => update('role', e.target.value)}>
            <option value="staff">Staff (can mark attendance & fees)</option>
            <option value="admin">Admin (full access)</option>
          </select>
        </div>
        <div className="alert alert-warning" style={{ fontSize: 12 }}>
          ⚠️ This creates a Supabase Auth user. You can reset their password from the Supabase dashboard if needed.
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchStaff() }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data } = await supabase.from('staff').select('*').order('created_at')
    setStaff(data || [])
    setLoading(false)
  }

  async function addStaff(form) {
    // Create auth user via Supabase admin — note: this requires using the service role key
    // For the client, we use a workaround: create via signUp then insert staff record
    // In production, use an Edge Function with service role key for proper user creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } }
    })

    if (authError) return authError.message
    if (!authData.user) return 'User creation failed.'

    const { error: staffError } = await supabase.from('staff').insert({
      id: authData.user.id,
      name: form.name,
      email: form.email,
      role: form.role,
    })

    if (staffError) return staffError.message

    setMsg({ type: 'success', text: `Staff member ${form.name} added. They'll need to verify their email.` })
    setShowModal(false)
    fetchStaff()
    return null
  }

  async function updateRole(id, newRole) {
    const { error } = await supabase.from('staff').update({ role: newRole }).eq('id', id)
    if (!error) fetchStaff()
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>Staff Management</h2>
            <p>Admin-only — manage library staff accounts</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Staff</button>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Added On</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
              ) : staff.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-muted">{s.email}</td>
                  <td>
                    <span className={`badge ${s.role === 'admin' ? 'badge-info' : 'badge-neutral'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: 110, padding: '4px 8px', fontSize: 12 }}
                      value={s.role}
                      onChange={e => updateRole(s.id, e.target.value)}
                    >
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddStaffModal onClose={() => setShowModal(false)} onSave={addStaff} />}
    </div>
  )
}
