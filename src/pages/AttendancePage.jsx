import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

const todayStr = () => new Date().toISOString().slice(0, 10);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

function formatDay(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
@@ -53,7 +48,7 @@ export default function AttendancePage() {
}

export default function Attendance() {
  const { students, attendanceLogs, markPresent, markAbsent, resetTodayAttendance } = useStore();
  const [activeTab, setActiveTab] = useState('today');
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const today = todayStr();

  // --- TODAY TAB ---
  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    return students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.mobile.includes(search));
  }, [students, search]);

  const presentCount = students.filter(s => s.presentToday).length;
  const absentCount = students.length - presentCount;

  // --- LOGS TAB ---
  // Get last 30 days with logs, sorted newest first
  const logDates = useMemo(() => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(key);
    }
    return days;
  }, []);

  const activeDate = selectedDate ?? today;
  const activeDayLog = attendanceLogs[activeDate] ?? [];

  // Search within active day log
  const filteredDayLog = useMemo(() => {
    if (!logSearch.trim()) return activeDayLog;
    return activeDayLog.filter(e => e.name.toLowerCase().includes(logSearch.toLowerCase()));
  }, [activeDayLog, logSearch]);

  // Monthly summary: unique students who attended at least once
  const monthlySummary = useMemo(() => {
    const summary = {};
    logDates.forEach(date => {
      (attendanceLogs[date] ?? []).forEach(e => {
        if (!summary[e.id]) summary[e.id] = { name: e.name, days: 0, dates: [] };
        summary[e.id].days++;
        summary[e.id].dates.push(date);
      });
    });
    return Object.values(summary).sort((a, b) => b.days - a.days);
  }, [attendanceLogs, logDates]);

  const totalPresences = logDates.reduce((sum, d) => sum + (attendanceLogs[d]?.length ?? 0), 0);

  return (
    <div style={{ padding: '32px 28px', background: '#0d1117', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>📅</span>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            Attendance
          </h1>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Auto-resets at midnight · Today: {formatDate(today)}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', borderBottom: '1px solid #1e293b' }}>
        {[['today', "📋 Today's Attendance"], ['logs', '📊 Monthly Logs']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            background: 'transparent',
            color: activeTab === tab ? '#f59e0b' : '#475569',
            borderBottom: activeTab === tab ? '2px solid #f59e0b' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ===== TODAY TAB ===== */}
      {activeTab === 'today' && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Members', value: students.length, icon: '👥', color: '#60a5fa' },
              { label: 'Present Today', value: presentCount, icon: '✅', color: '#4ade80' },
              { label: 'Absent Today', value: absentCount, icon: '🚫', color: '#f87171' },
              { label: 'Attendance Rate', value: students.length ? `${Math.round((presentCount / students.length) * 100)}%` : '0%', icon: '📈', color: '#a78bfa' },
            ].map(c => (
              <div key={c.label} style={{ background: '#161b22', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
                <span style={{ fontSize: '20px' }}>{c.icon}</span>
                <div style={{ fontSize: '26px', fontWeight: '800', color: c.color, marginTop: '6px' }}>{c.value}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: '#161b22', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Today's presence</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#f59e0b' }}>
                {presentCount}/{students.length}
              </span>
            </div>
            <div style={{ background: '#0d1117', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${students.length ? (presentCount / students.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #4ade80, #60a5fa)',
                height: '100%', borderRadius: '999px', transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Search + Reset */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
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
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search by name or mobile..."
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #1e293b',
                background: '#161b22', color: '#e2e8f0', fontSize: '14px', outline: 'none',
              }}
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width: 170 }}
/>
            <button onClick={resetTodayAttendance} style={{
              padding: '10px 18px', borderRadius: '10px', border: '1px solid #ef4444',
              background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>↺ Reset All</button>
          </div>

          {/* Student list */}
          <div style={{ background: '#161b22', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 0.8fr 1fr 1.4fr', padding: '12px 20px', background: '#0d1117', borderBottom: '1px solid #1e293b' }}>
              {['Student', 'Mobile', 'Seat', 'Status', 'Action'].map(h => (
                <span key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No students found</div>
            )}

            {filtered.map((s, i) => (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.4fr 0.8fr 1fr 1.4fr',
                padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #1e293b' : 'none',
                alignItems: 'center',
                background: s.presentToday ? 'rgba(74,222,128,0.03)' : 'transparent',
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9' }}>{s.name}</div>
                </div>
                <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>{s.mobile}</span>
                <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600' }}>{s.seatNo || '—'}</span>
                <span style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
                  background: s.presentToday ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.08)',
                  color: s.presentToday ? '#4ade80' : '#f87171',
                  border: `1px solid ${s.presentToday ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.2)'}`,
                }}>{s.presentToday ? '✓ Present' : '✗ Absent'}</span>
                <div>
                  {!s.presentToday ? (
                    <button onClick={() => markPresent(s.id)} style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1px solid #4ade80',
                      background: 'transparent', color: '#4ade80', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    }}>Mark Present</button>
                  ) : (
                    <button onClick={() => markAbsent(s.id)} style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155',
                      background: 'transparent', color: '#475569', cursor: 'pointer', fontSize: '12px',
                    }}>Mark Absent</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== MONTHLY LOGS TAB ===== */}
      {activeTab === 'logs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>

          {/* LEFT: Date sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: '700' }}>Last 30 Days</div>
            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {logDates.map(date => {
                const count = attendanceLogs[date]?.length ?? 0;
                const isToday = date === today;
                const isSelected = date === activeDate;
                return (
                  <button key={date} onClick={() => setSelectedDate(date)} style={{
                    padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isSelected ? 'rgba(245,158,11,0.12)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(245,158,11,0.4)' : '#1e293b'}`,
                    transition: 'all 0.12s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#f59e0b' : '#e2e8f0' }}>
                          {isToday ? '📍 Today' : formatDate(date)}
                        </span>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{formatDay(date)}</div>
                      </div>
                      <span style={{
                        fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px',
                        background: count > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.1)',
                        color: count > 0 ? '#4ade80' : '#475569',
                      }}>{count}</span>
                    </div>
                    {/* Mini bar */}
                    {students.length > 0 && (
                      <div style={{ marginTop: '6px', background: '#0d1117', borderRadius: '999px', height: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(count / students.length) * 100}%`,
                          background: count > 0 ? '#4ade80' : '#1e293b',
                          height: '100%', borderRadius: '999px',
                        }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Day detail + monthly summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Selected day detail */}
            <div style={{ background: '#161b22', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#f1f5f9' }}>
                    {activeDate === today ? '📍 Today' : formatDate(activeDate)}
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#475569', fontWeight: '400' }}>{formatDay(activeDate)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {activeDayLog.length} present · {students.length - activeDayLog.length} absent
                  </div>
                </div>
                <input
                  value={logSearch} onChange={e => setLogSearch(e.target.value)}
                  placeholder="🔍 Search..."
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #1e293b',
                    background: '#0d1117', color: '#e2e8f0', fontSize: '13px', outline: 'none', width: '180px',
                  }}
                />
              </div>

              {filteredDayLog.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                  {activeDayLog.length === 0 ? '🚫 No attendance recorded for this day' : 'No results'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '16px 20px' }}>
                  {filteredDayLog.map(entry => (
                    <span key={entry.id} style={{
                      padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '600',
                      background: 'rgba(74,222,128,0.08)', color: '#4ade80',
                      border: '1px solid rgba(74,222,128,0.2)',
                    }}>✓ {entry.name}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Summary Table */}
            <div style={{ background: '#161b22', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#f1f5f9' }}>📊 30-Day Summary</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {totalPresences} total check-ins · {monthlySummary.length} unique students attended
                  </div>
                </div>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', padding: '10px 20px', background: '#0d1117', borderBottom: '1px solid #1e293b' }}>
                {['Student', 'Days Present', 'Rate', 'Attendance'].map(h => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {monthlySummary.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>No attendance data yet</div>
              )}

              {monthlySummary.map((entry, i) => {
                const rate = Math.round((entry.days / 30) * 100);
                return (
                  <div key={entry.name} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr',
                    padding: '13px 20px', borderBottom: i < monthlySummary.length - 1 ? '1px solid #1e293b' : 'none',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9' }}>{entry.name}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa' }}>{entry.days} days</span>
                    <span style={{
                      fontSize: '13px', fontWeight: '700',
                      color: rate >= 70 ? '#4ade80' : rate >= 40 ? '#f59e0b' : '#f87171',
                    }}>{rate}%</span>
                    {/* Mini heatmap bar */}
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                      {logDates.slice().reverse().map(date => {
                        const wasPresent = (attendanceLogs[date] ?? []).some(e => e.name === entry.name);
                        return (
                          <div key={date} title={formatDate(date)} style={{
                            width: '8px', height: '8px', borderRadius: '2px',
                            background: wasPresent ? '#4ade80' : '#1e293b',
                          }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
