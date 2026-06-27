import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { submitResponse, watchSurvey } from '../lib/surveys'

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

  if (survey === undefined) return <p className="status">Caricamento...</p>
  if (survey === null) return <p className="status">Sondaggio non trovato.</p>
  if (survey.status !== 'open') {
    return (
      <div className="page page-narrow">
        <h1>{survey.title}</h1>
        <p className="muted">Questo sondaggio non è più aperto alle risposte.</p>
      </div>
    )
  }
  if (hasVoted) {
    return (
      <div className="page page-narrow">
        <h1>{survey.title}</h1>
        <p>Grazie, la tua risposta è stata registrata.</p>
      </div>
    )
  }

  return (
    <div className="page page-narrow">
      <h1>{survey.title}</h1>
      {survey.description && <p className="muted">{survey.description}</p>}

      <form className="card" onSubmit={handleSubmit}>
        {survey.questions.map((question) => (
          <fieldset key={question.id} className="question-card">
            <legend>{question.text}</legend>

            {question.type === 'text' && (
              <input
                value={answers[question.id] ?? ''}
                onChange={(e) => setAnswer(question.id, e.target.value)}
              />
            )}

            {question.type === 'single' &&
              question.options.map((option) => (
                <label key={option} className="option-choice">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option}
                    onChange={() => setAnswer(question.id, option)}
                  />
                  {option}
                </label>
              ))}

            {question.type === 'multiple' &&
              question.options.map((option) => (
                <label key={option} className="option-choice">
                  <input
                    type="checkbox"
                    checked={(answers[question.id] ?? []).includes(option)}
                    onChange={() => toggleMultiple(question.id, option)}
                  />
                  {option}
                </label>
              ))}
          </fieldset>
        ))}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Invio...' : 'Invia risposta'}
        </button>
      </form>
    </div>
  )
}
