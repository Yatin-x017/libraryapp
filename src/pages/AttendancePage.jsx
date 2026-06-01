import { useState, useEffect, useCallback } from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { format } from 'date-fns'

export default function AttendancePage() {
const { staffProfile } = useAuth()
  const { t } = useLang()
const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState(new Set()) // set of member IDs present today
  const [attendance, setAttendance] = useState(new Set())
const [search, setSearch] = useState('')
const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // member id being saved
  const [saving, setSaving] = useState(null)
const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
const [msg, setMsg] = useState(null)

@@ -29,20 +31,13 @@ export default function AttendancePage() {
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
        const { error } = await supabase.from('attendance').delete().eq('member_id', memberId).eq('date', selectedDate)
if (error) throw error
setAttendance(prev => { const next = new Set(prev); next.delete(memberId); return next })
} else {
        const { error } = await supabase
          .from('attendance')
          .insert({ member_id: memberId, date: selectedDate, marked_by: staffProfile?.id })
        const { error } = await supabase.from('attendance').insert({ member_id: memberId, date: selectedDate, marked_by: staffProfile?.id })
if (error) throw error
setAttendance(prev => new Set([...prev, memberId]))
}
@@ -53,7 +48,7 @@ export default function AttendancePage() {
}

async function markAllPresent() {
    if (!window.confirm(`Mark ALL ${filtered.length} visible members as present?`)) return
    if (!window.confirm(`${t.markAllConfirm} ${filtered.length} ${t.visibleMembersPresent}`)) return
setSaving('all')
const toInsert = filtered
.filter(m => !attendance.has(m.id))
@@ -63,7 +58,7 @@ export default function AttendancePage() {
const { error } = await supabase.from('attendance').insert(toInsert)
if (!error) {
setAttendance(prev => new Set([...prev, ...toInsert.map(i => i.member_id)]))
        setMsg({ type: 'success', text: `Marked ${toInsert.length} members as present.` })
        setMsg({ type: 'success', text: `${toInsert.length} ${t.markedPresent}` })
} else {
setMsg({ type: 'danger', text: 'Error: ' + error.message })
}
@@ -76,24 +71,16 @@ export default function AttendancePage() {
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
            <h2>{t.attendanceTitle}</h2>
            <p>{t.attendanceSubtitle}</p>
</div>
<div className="flex items-center gap-2">
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width: 170 }}
            />
            <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 170 }} />
</div>
</div>
</div>
@@ -107,24 +94,19 @@ export default function AttendancePage() {
<div className="card mb-4" style={{ padding: '12px 16px' }}>
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
            <span className="badge badge-success">{attendance.size} Present</span>
            <span className="badge badge-neutral">{members.length - attendance.size} Absent</span>
            <span className="text-muted text-sm">| Showing {filtered.length} of {members.length}</span>
            <span className="badge badge-success">{attendance.size} {t.present}</span>
            <span className="badge badge-neutral">{members.length - attendance.size} {t.absent}</span>
            <span className="text-muted text-sm">| {t.showing} {filtered.length} of {members.length}</span>
</div>
<button className="btn btn-sm" onClick={markAllPresent} disabled={saving === 'all'}>
            {saving === 'all' ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : '✅'} Mark All Present
            {saving === 'all' ? <span className="spinner" style={{ width: 14, height: 14 }}></span> : '✅'} {t.markAllPresent}
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
        <input placeholder={t.searchByNameOrId} value={search} onChange={e => setSearch(e.target.value)} autoFocus />
{search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>}
</div>

@@ -134,7 +116,7 @@ export default function AttendancePage() {
</div>
) : filtered.length === 0 ? (
<div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No members found for "{search}"
          {t.noMembersFoundSearch} "{search}"
</div>
) : (
<div className="attendance-grid">
