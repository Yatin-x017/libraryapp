import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export default function AttendancePage() {
  const { staffProfile } = useAuth()
  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState(new Set()) // set of member IDs present today
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // member id being saved
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchData() }, [selectedDate])

  async function fetchData() {
    setLoading(true)
    const [{ data: memberData }, { data: attendanceData }] = await Promise.all([
      supabase.from('members').select('id, name, member_id').eq('is_active', true).order('name'),
      supabase.from('attendance').select('member_id').eq('date', selectedDate),
    ])
    setMembers(memberData || [])
    setAttendance(new Set((attendanceData || []).map(a => a.member_id)))
    setLoading(false)
  }

  async function toggleAttendance(memberId) {
    setSaving(memberId)
    const isPresent = attendance.has(memberId)

    try {
      if (isPresent) {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('member_id', memberId)
          .eq('date', selectedDate)
        if (error) throw error
        setAttendance(prev => { const next = new Set(prev); next.delete(memberId); return next })
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert({ member_id: memberId, date: selectedDate, marked_by: staffProfile?.id })
        if (error) throw error
        setAttendance(prev => new Set([...prev, memberId]))
      }
    } catch (err) {
      setMsg({ type: 'danger', text: 'Failed to update attendance: ' + err.message })
    }
    setSaving(null)
  }

  async function markAllPresent() {
    if (!window.confirm(`Mark ALL ${filtered.length} visible members as present?`)) return
    setSaving('all')
    const toInsert = filtered
      .filter(m => !attendance.has(m.id))
      .map(m => ({ member_id: m.id, date: selectedDate, marked_by: staffProfile?.id }))

    if (toInsert.length > 0) {
      const { error } = await supabase.from('attendance').insert(toInsert)
      if (!error) {
        setAttendance(prev => new Set([...prev, ...toInsert.map(i => i.member_id)]))
        setMsg({ type: 'success', text: `Marked ${toInsert.length} members as present.` })
      } else {
        setMsg({ type: 'danger', text: 'Error: ' + error.message })
      }
    }
    setSaving(null)
  }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.member_id.toLowerCase().includes(search.toLowerCase())
  )

  const presentCount = filtered.filter(m => attendance.has(m.id)).length

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>Mark Attendance</h2>
            <p>Click a member card to mark present / absent</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width: 170 }}
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>
          {msg.text} <span style={{ marginLeft: 'auto', opacity: 0.5 }}>✕</span>
        </div>
      )}

      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="badge badge-success">{attendance.size} Present</span>
            <span className="badge badge-neutral">{members.length - attendance.size} Absent</span>
            <span className="text-muted text-sm">| Showing {filtered.length} of {members.length}</span>
          </div>
          <button className="btn btn-sm" onClick={markAllPresent} disabled={saving === 'all'}>
            {saving === 'all' ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : '✅'} Mark All Present
          </button>
        </div>
      </div>

      <div className="search-bar mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          placeholder="Search by name or member ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No members found for "{search}"
        </div>
      ) : (
        <div className="attendance-grid">
          {filtered.map(member => {
            const isPresent = attendance.has(member.id)
            const isSaving = saving === member.id
            return (
              <div
                key={member.id}
                className={`attendance-card ${isPresent ? 'present' : ''}`}
                onClick={() => !isSaving && toggleAttendance(member.id)}
                style={{ opacity: isSaving ? 0.6 : 1, userSelect: 'none' }}
              >
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-id">{member.member_id}</span>
                </div>
                <div className="check-icon">
                  {isSaving
                    ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: isPresent ? '#16a34a' : 'var(--accent)' }}></div>
                    : isPresent
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      : null
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
