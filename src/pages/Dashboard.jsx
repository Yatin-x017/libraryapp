import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const [
        { count: totalMembers },
        { count: todayPresent },
        { count: paidThisMonth },
        { count: overdueCount },
      ] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today),
        supabase.from('fee_payments').select('*', { count: 'exact', head: true }).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('members').select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .not('id', 'in', `(select member_id from fee_payments where month=${currentMonth} and year=${currentYear})`),
      ])

      const { data: recent } = await supabase
        .from('attendance')
        .select('*, members(name, member_id)')
        .eq('date', today)
        .order('marked_at', { ascending: false })
        .limit(8)

      setStats({ totalMembers, todayPresent, paidThisMonth, overdueCount: totalMembers - paidThisMonth })
      setRecentAttendance(recent || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'var(--text-muted)' }}>
      <div className="spinner"></div> Loading dashboard...
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="label">Total Members</div>
          <div className="value">{stats?.totalMembers ?? 0}</div>
          <div className="sub">Active members</div>
        </div>
        <div className="stat-card">
          <div className="label">Present Today</div>
          <div className="value">{stats?.todayPresent ?? 0}</div>
          <div className="sub">of {stats?.totalMembers ?? 0} members</div>
        </div>
        <div className="stat-card">
          <div className="label">Fees Paid</div>
          <div className="value">{stats?.paidThisMonth ?? 0}</div>
          <div className="sub">{format(new Date(), 'MMMM yyyy')}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">Overdue</div>
          <div className="value">{Math.max(0, stats?.overdueCount ?? 0)}</div>
          <div className="sub">Haven't paid this month</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/attendance')} style={{ justifyContent: 'center' }}>
              ✅ Mark Today's Attendance
            </button>
            <button className="btn" onClick={() => navigate('/overdue')} style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: '#fecaca' }}>
              ⚠️ View Overdue Fees ({Math.max(0, stats?.overdueCount ?? 0)})
            </button>
            <button className="btn" onClick={() => navigate('/members')} style={{ justifyContent: 'center' }}>
              👤 Add New Member
            </button>
          </div>
        </div>

        {/* Recent attendance */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Check-ins Today</h3>
          {recentAttendance.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>No attendance marked yet today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentAttendance.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span className="font-medium">{a.members?.name}</span>
                  <span className="text-muted">{format(new Date(a.marked_at), 'h:mm a')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
