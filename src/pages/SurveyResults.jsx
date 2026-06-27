import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSurvey, watchResponses } from '../lib/surveys'

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
      <div className="card">
        <h3>{question.text}</h3>
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
    <div className="card">
      <h3>{question.text}</h3>
      {Object.entries(counts).map(([option, count]) => {
        const pct = total ? Math.round((count / total) * 100) : 0
        return (
          <div key={option} className="result-bar-row">
            <div className="result-bar-label">
              <span>{option}</span>
              <span>
                {count} ({pct}%)
              </span>
            </div>
            <div className="result-bar-track">
              <div className="result-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
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

  if (!survey) return <p className="status">Caricamento...</p>

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{survey.title}</h1>
          <p className="muted">{responses.length} risposte ricevute</p>
        </div>
        <Link className="button-secondary" to="/dashboard">
          Torna ai sondaggi
        </Link>
      </header>

      {survey.questions.map((question) => (
        <QuestionResult key={question.id} question={question} responses={responses} />
      ))}
    </div>
  )
}
