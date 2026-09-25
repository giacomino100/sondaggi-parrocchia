import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { deleteSurvey, setSurveyStatus, watchSurveys } from '../lib/surveys'
import QrModal from '../components/QrModal'
import SectionNav from '../components/SectionNav'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [qrSurvey, setQrSurvey] = useState(null)

  useEffect(() => watchSurveys(setSurveys), [])

  async function handleDelete(surveyId) {
    if (confirm('Eliminare definitivamente questo sondaggio e tutte le risposte?')) {
      await deleteSurvey(surveyId)
    }
  }

  async function copyLink(surveyId) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${surveyId}`)
      setCopiedId(surveyId)
      setTimeout(() => setCopiedId((id) => (id === surveyId ? null : id)), 2000)
    } catch { /* clipboard non disponibile */ }
  }

  async function toggleStatus(survey) {
    await setSurveyStatus(survey.id, survey.status === 'open' ? 'closed' : 'open')
  }

  return (
    <div className="wrap wrap--wide">
      <div className="topbar">
        <div>
          <h1 className="topbar__title">Sondaggi</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Connesso come {user.email}</p>
        </div>
        <div className="topbar__actions">
          <Link className="btn btn--primary btn--sm" to="/sondaggi/nuovo">+ Nuovo</Link>
          <button className="btn btn--ghost btn--sm" onClick={logout}>Esci</button>
        </div>
      </div>

      <SectionNav />

      {surveys.length === 0 ? (
        <p className="empty">Nessun sondaggio creato finora.</p>
      ) : (
        <ul className="survey-list">
          {surveys.map((survey) => {
            const isOpen = survey.status === 'open'
            const isRsvp = survey.surveyType === 'rsvp'
            return (
              <li key={survey.id} className="survey-card">
                <div className="survey-card__head">
                  <span className="survey-card__title">{survey.title}</span>
                  {isRsvp && (
                    <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent-scuro)' }}>
                      Presenze
                    </span>
                  )}
                  <span className={`badge badge--${isOpen ? 'open' : 'closed'}`}>
                    {isOpen ? 'Aperto' : 'Chiuso'}
                  </span>
                </div>

                {survey.description && (
                  <p className="muted" style={{ margin: 0 }}>{survey.description}</p>
                )}

                <div className="toggle-row">
                  <span className="toggle-label">
                    {isOpen ? 'Risposte abilitate' : 'Risposte disabilitate'}
                  </span>
                  <button
                    className={`toggle-btn ${isOpen ? 'toggle-btn--on' : 'toggle-btn--off'}`}
                    onClick={() => toggleStatus(survey)}
                    aria-label={isOpen ? 'Chiudi' : 'Apri'}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>

                <div className="card-actions">
                  <Link className="btn btn--soft btn--sm" to={`/sondaggi/${survey.id}/risultati`}>
                    {isRsvp ? '👥 Presenze' : 'Risultati'}
                  </Link>
                  {!isRsvp && (
                    <Link className="btn btn--ghost btn--sm" to={`/sondaggi/${survey.id}/modifica`}>
                      Modifica
                    </Link>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={() => copyLink(survey.id)}>
                    {copiedId === survey.id ? 'Link copiato ✓' : 'Copia link'}
                  </button>
                  <button className="btn btn--soft btn--sm" onClick={() => setQrSurvey(survey)}>
                    QR Code
                  </button>
                  <button className="btn btn--danger-soft btn--sm" onClick={() => handleDelete(survey.id)}>
                    Elimina
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {qrSurvey && (
        <QrModal
          title={qrSurvey.title}
          url={`${window.location.origin}/s/${qrSurvey.id}`}
          onClose={() => setQrSurvey(null)}
        />
      )}
    </div>
  )
}
