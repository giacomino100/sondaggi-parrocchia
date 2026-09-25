import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  createRegistration,
  deleteRegistration,
  setRegistrationStatus,
  watchRegistrations,
} from '../lib/registrations'
import QrModal from '../components/QrModal'
import SectionNav from '../components/SectionNav'

function publicUrl(registrationId) {
  return `${window.location.origin}/i/${registrationId}`
}

function defaultTitle() {
  // L'anno associativo parte a settembre
  const now = new Date()
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `Iscrizioni ACR ${start}/${start + 1}`
}

function CreateModal({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState(
    "Compila il modulo per iscrivere tuo figlio/a al nuovo anno dell'Azione Cattolica Ragazzi.",
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      const ref = await createRegistration({ title: title.trim(), description: description.trim(), uid: user.uid })
      navigate(`/iscrizioni/${ref.id}`)
    } catch {
      setError('Creazione non riuscita. Riprova.')
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
        <h2 className="dialog__title">Nuova iscrizione</h2>
        <div className="field">
          <label htmlFor="reg-title">Titolo <span className="req">*</span></label>
          <input id="reg-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="reg-desc">Descrizione <span className="opt">(facoltativo)</span></label>
          <textarea id="reg-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="alert">{error}</p>}
        <div className="dialog__azioni">
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={saving}>Annulla</button>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Creazione…' : 'Crea iscrizione'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Registrations() {
  const { user, logout } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [qrRegistration, setQrRegistration] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => watchRegistrations(setRegistrations), [])

  async function handleDelete(registrationId) {
    if (confirm('Eliminare definitivamente questa iscrizione? Gli iscritti non saranno più visibili.')) {
      await deleteRegistration(registrationId)
    }
  }

  async function copyLink(registrationId) {
    try {
      await navigator.clipboard.writeText(publicUrl(registrationId))
      setCopiedId(registrationId)
      setTimeout(() => setCopiedId((id) => (id === registrationId ? null : id)), 2000)
    } catch { /* clipboard non disponibile */ }
  }

  async function toggleStatus(registration) {
    await setRegistrationStatus(registration.id, registration.status === 'open' ? 'closed' : 'open')
  }

  return (
    <div className="wrap wrap--wide">
      <div className="topbar">
        <div>
          <h1 className="topbar__title">Iscrizioni</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Connesso come {user.email}</p>
        </div>
        <div className="topbar__actions">
          <button className="btn btn--primary btn--sm" onClick={() => setCreating(true)}>+ Nuova</button>
          <button className="btn btn--ghost btn--sm" onClick={logout}>Esci</button>
        </div>
      </div>

      <SectionNav />

      {registrations.length === 0 ? (
        <p className="empty">Nessuna iscrizione creata finora.</p>
      ) : (
        <ul className="survey-list">
          {registrations.map((registration) => {
            const isOpen = registration.status === 'open'
            return (
              <li key={registration.id} className="survey-card">
                <div className="survey-card__head">
                  <span className="survey-card__title">{registration.title}</span>
                  <span className={`badge badge--${isOpen ? 'open' : 'closed'}`}>
                    {isOpen ? 'Aperta' : 'Chiusa'}
                  </span>
                </div>

                {registration.description && (
                  <p className="muted" style={{ margin: 0 }}>{registration.description}</p>
                )}

                <div className="toggle-row">
                  <span className="toggle-label">
                    {isOpen ? 'Iscrizioni aperte' : 'Iscrizioni chiuse'}
                  </span>
                  <button
                    className={`toggle-btn ${isOpen ? 'toggle-btn--on' : 'toggle-btn--off'}`}
                    onClick={() => toggleStatus(registration)}
                    aria-label={isOpen ? 'Chiudi' : 'Apri'}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>

                <div className="card-actions">
                  <Link className="btn btn--soft btn--sm" to={`/iscrizioni/${registration.id}`}>
                    👥 Iscritti
                  </Link>
                  <button className="btn btn--ghost btn--sm" onClick={() => copyLink(registration.id)}>
                    {copiedId === registration.id ? 'Link copiato ✓' : 'Copia link'}
                  </button>
                  <button className="btn btn--soft btn--sm" onClick={() => setQrRegistration(registration)}>
                    QR Code
                  </button>
                  <button className="btn btn--danger-soft btn--sm" onClick={() => handleDelete(registration.id)}>
                    Elimina
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {creating && <CreateModal onClose={() => setCreating(false)} />}
      {qrRegistration && (
        <QrModal
          title={qrRegistration.title}
          url={publicUrl(qrRegistration.id)}
          onClose={() => setQrRegistration(null)}
        />
      )}
    </div>
  )
}
