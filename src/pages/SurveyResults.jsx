import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSurvey, watchResponses } from '../lib/surveys'
import RsvpResults from '../components/RsvpResults'

function tallySingleOrMultiple(question, responses) {
  const counts = Object.fromEntries(question.options.map((o) => [o, 0]))
  let total = 0
  for (const response of responses) {
    const answer = response.answers?.[question.id]
    if (answer == null) continue
    const values = Array.isArray(answer) ? answer : [answer]
    for (const value of values) {
      if (value in counts) {
        counts[value] += 1
        total += 1
      }
    }
  }
  return { counts, total }
}

function QuestionResult({ question, responses }) {
  if (question.type === 'text') {
    const answers = responses
      .map((r) => r.answers?.[question.id])
      .filter((a) => typeof a === 'string' && a.trim())
    return (
      <div className="result-block">
        <h3 className="result-q-title">{question.text}</h3>
        {answers.length === 0 ? (
          <p className="muted">Nessuna risposta.</p>
        ) : (
          <ul className="text-answers">
            {answers.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const { counts, total } = tallySingleOrMultiple(question, responses)
  return (
    <div className="result-block">
      <h3 className="result-q-title">{question.text}</h3>
      <div className="result-bars">
        {Object.entries(counts).map(([option, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={option} className="result-bar-row">
              <div className="result-bar-label">
                <span>{option}</span>
                <span className="result-bar-count">
                  {count} · {pct}%
                </span>
              </div>
              <div className="result-bar-track">
                <div className="result-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SurveyResults() {
  const { surveyId } = useParams()
  const [survey, setSurvey] = useState(null)
  const [responses, setResponses] = useState([])

  useEffect(() => {
    getSurvey(surveyId).then(setSurvey)
    return watchResponses(surveyId, setResponses)
  }, [surveyId])

  if (!survey) return <p className="status">Caricamento…</p>

  if (survey.surveyType === 'rsvp') {
    return <RsvpResults survey={survey} surveyId={surveyId} responses={responses} />
  }

  const numChoice = (survey.questions ?? []).filter((q) => q.type !== 'text').length
  const numText = survey.questions.length - numChoice

  return (
    <div className="wrap wrap--risultati">
      <div className="topbar">
        <h1 className="topbar__title">Risultati</h1>
        <div className="topbar__actions">
          <Link className="btn btn--soft btn--sm" to="/dashboard">
            ← Sondaggi
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card__bar"></div>
        <header className="hero">
          <span className="eyebrow">Risultati</span>
          <h1 className="hero__title">{survey.title}</h1>
          {survey.description && <p className="hero__desc">{survey.description}</p>}
          <span className="chip">
            <span className="chip__dot"></span>
            {survey.status === 'open' ? 'Sondaggio aperto' : 'Sondaggio chiuso'}
          </span>
        </header>

        <div className="body">
          <div className="stats">
            <div className="stat">
              <span className="stat__num">{responses.length}</span>
              <span className="stat__label">Risposte</span>
            </div>
            <div className="stat">
              <span className="stat__num">{survey.questions.length}</span>
              <span className="stat__label">Domande</span>
            </div>
            <div className="stat">
              <span className="stat__num">{numChoice}</span>
              <span className="stat__label">A scelta</span>
            </div>
            <div className="stat">
              <span className="stat__num">{numText}</span>
              <span className="stat__label">Libere</span>
            </div>
          </div>

          {responses.length === 0 ? (
            <p className="muted">Ancora nessuna risposta.</p>
          ) : (
            survey.questions.map((question) => (
              <QuestionResult key={question.id} question={question} responses={responses} />
            ))
          )}
        </div>
      </div>

      <p className="foot">Parrocchia · Sondaggi</p>
    </div>
  )
}
