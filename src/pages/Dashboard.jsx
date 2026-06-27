import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { deleteSurvey, setSurveyStatus, watchSurveys } from '../lib/surveys'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [surveys, setSurveys] = useState([])

  useEffect(() => watchSurveys(setSurveys), [])

  async function handleDelete(surveyId) {
    if (confirm('Eliminare definitivamente questo sondaggio e tutte le risposte?')) {
      await deleteSurvey(surveyId)
    }
  }

  function shareLink(surveyId) {
    return `${window.location.origin}/s/${surveyId}`
  }

  async function copyLink(surveyId) {
    await navigator.clipboard.writeText(shareLink(surveyId))
    alert('Link copiato.')
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Sondaggi</h1>
          <p className="muted">Connesso come {user.email}</p>
        </div>
        <div className="header-actions">
          <Link className="button" to="/sondaggi/nuovo">
            + Nuovo sondaggio
          </Link>
          <button className="button-secondary" onClick={logout}>
            Esci
          </button>
        </div>
      </header>

      {surveys.length === 0 && <p className="muted">Nessun sondaggio creato finora.</p>}

      <ul className="survey-list">
        {surveys.map((survey) => (
          <li key={survey.id} className="card">
            <div className="survey-list-main">
              <h2>{survey.title}</h2>
              <span className={`badge badge-${survey.status}`}>
                {survey.status === 'open' ? 'Aperto' : 'Chiuso'}
              </span>
            </div>
            {survey.description && <p className="muted">{survey.description}</p>}
            <div className="card-actions">
              <Link to={`/sondaggi/${survey.id}/risultati`}>Risultati</Link>
              <Link to={`/sondaggi/${survey.id}/modifica`}>Modifica</Link>
              <button onClick={() => copyLink(survey.id)}>Copia link</button>
              <button
                onClick={() =>
                  setSurveyStatus(survey.id, survey.status === 'open' ? 'closed' : 'open')
                }
              >
                {survey.status === 'open' ? 'Chiudi' : 'Riapri'}
              </button>
              <button className="danger" onClick={() => handleDelete(survey.id)}>
                Elimina
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
