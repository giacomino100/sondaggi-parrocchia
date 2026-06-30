import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { submitResponse, watchSurvey } from '../lib/surveys'
import PublicRsvp from '../components/PublicRsvp'

function votedKey(surveyId) {
  return `sondaggio-votato-${surveyId}`
}

export default function PublicSurvey() {
  const { surveyId } = useParams()
  const [survey, setSurvey] = useState(undefined)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasVoted, setHasVoted] = useState(() => Boolean(localStorage.getItem(votedKey(surveyId))))

  useEffect(() => watchSurvey(surveyId, setSurvey), [surveyId])

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleMultiple(questionId, option) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      return { ...prev, [questionId]: next }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const missing = survey.questions.some((q) => {
      const a = answers[q.id]
      if (q.type === 'multiple') return !a || a.length === 0
      return !a || !String(a).trim()
    })
    if (missing) {
      setError('Rispondi a tutte le domande prima di inviare.')
      return
    }

    setSubmitting(true)
    try {
      await submitResponse(surveyId, answers)
      localStorage.setItem(votedKey(surveyId), '1')
      setHasVoted(true)
    } catch {
      setError('Invio non riuscito. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  if (survey === undefined) return <p className="status">Caricamento…</p>

  if (survey?.surveyType === 'rsvp') {
    return <PublicRsvp survey={survey} surveyId={surveyId} />
  }

  if (survey === null) {
    return (
      <div className="wrap">
        <div className="card">
          <div className="card__bar"></div>
          <header className="hero">
            <span className="eyebrow">Sondaggio</span>
            <h1 className="hero__title">Sondaggio non trovato</h1>
            <p className="hero__desc">Il link potrebbe non essere più valido.</p>
          </header>
        </div>
        <p className="foot">Parrocchia · Sondaggi</p>
      </div>
    )
  }

  const closed = survey.status !== 'open'

  return (
    <div className="wrap">
      <div className="card">
        <div className="card__bar"></div>

        <header className="hero">
          <span className="eyebrow">Sondaggio</span>
          <h1 className="hero__title">{survey.title}</h1>
          {survey.description && <p className="hero__desc">{survey.description}</p>}
        </header>

        {hasVoted ? (
          <div className="body" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="done">✓</div>
            <h2 style={{ fontSize: '1.4rem' }}>Grazie!</h2>
            <p className="muted" style={{ margin: 0 }}>
              La tua risposta è stata registrata.
            </p>
          </div>
        ) : closed ? (
          <div className="body">
            <p className="muted" style={{ margin: 0 }}>
              Questo sondaggio non è più aperto alle risposte.
            </p>
          </div>
        ) : (
          <form className="body" onSubmit={handleSubmit}>
            {survey.questions.map((question) => (
              <fieldset key={question.id} className="q-block">
                <legend className="q-title">{question.text}</legend>

                {question.type === 'text' && (
                  <textarea
                    rows={2}
                    placeholder="Scrivi la tua risposta…"
                    value={answers[question.id] ?? ''}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                  />
                )}

                {question.type === 'single' && (
                  <div className="choices">
                    {question.options.map((option) => {
                      const selected = answers[question.id] === option
                      return (
                        <label
                          key={option}
                          className={`choice${selected ? ' choice--selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            checked={selected}
                            onChange={() => setAnswer(question.id, option)}
                          />
                          {option}
                        </label>
                      )
                    })}
                  </div>
                )}

                {question.type === 'multiple' && (
                  <div className="choices">
                    {question.options.map((option) => {
                      const selected = (answers[question.id] ?? []).includes(option)
                      return (
                        <label
                          key={option}
                          className={`choice${selected ? ' choice--selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMultiple(question.id, option)}
                          />
                          {option}
                        </label>
                      )
                    })}
                  </div>
                )}
              </fieldset>
            ))}

            {error && <p className="alert">{error}</p>}

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Invio in corso…' : 'Invia risposta'}
            </button>
          </form>
        )}
      </div>

      <p className="foot">Parrocchia · Sondaggi</p>
    </div>
  )
}
