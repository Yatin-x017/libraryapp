import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Invalid email or password.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="login-page" style={{ background: 'var(--bg)' }}>
      <div style={{ width: 380 }}>

        {/* Brand header above card */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28,
            boxShadow: '0 4px 14px rgba(45,80,22,0.3)',
          }}>
            📚
          </div>
          <h1 style={{
            fontFamily: 'system-ui, sans-serif', fontSize: 22, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            Balaji Library
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Staff Management Portal
          </p>
        </div>

        {/* Login card */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Sign in to your account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 22 }}>
            Enter your credentials to continue
          </p>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@balajilib.in"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', padding: '10px 14px', fontSize: 14 }}
            >
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-subtle)', marginTop: 20 }}>
          © {new Date().getFullYear()} Balaji Library · Attendance & Fee Manager
        </p>
      </div>
    </div>
  )
}
