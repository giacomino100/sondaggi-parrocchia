import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const dest = location.state?.from ?? '/dashboard'
    return <Navigate to={dest} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Email o password non corretti.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="wrap">
      <div className="card">
        <div className="card__bar"></div>

        <header className="hero">
          <span className="eyebrow">Area gestori</span>
          <h1 className="hero__title">Accesso</h1>
          <p className="hero__desc">
            Riservata a chi crea e gestisce i sondaggi della parrocchia.
          </p>
        </header>

        <form className="body" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email <span className="req">*</span></label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password <span className="req">*</span></label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="alert">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Accesso…' : 'Accedi'}
          </button>
        </form>
      </div>

      <p className="foot">Parrocchia · Sondaggi</p>
    </div>
  )
}
