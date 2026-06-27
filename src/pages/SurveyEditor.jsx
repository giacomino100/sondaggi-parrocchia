import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createSurvey, getSurvey, makeQuestionId, updateSurvey } from '../lib/surveys'

const QUESTION_TYPES = [
  { value: 'single', label: 'Scelta singola' },
  { value: 'multiple', label: 'Scelta multipla' },
  { value: 'text', label: 'Risposta libera' },
]

function emptyQuestion() {
  return { id: makeQuestionId(), text: '', type: 'single', options: ['', ''] }
}

export default function SurveyEditor() {
  const { surveyId } = useParams()
  const isEditing = Boolean(surveyId)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) return
    getSurvey(surveyId).then((survey) => {
      if (!survey) {
        navigate('/dashboard')
        return
      }
      setTitle(survey.title)
      setDescription(survey.description ?? '')
      setQuestions(survey.questions?.length ? survey.questions : [emptyQuestion()])
      setLoading(false)
    })
  }, [surveyId, isEditing, navigate])

  function updateQuestion(index, patch) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(qIndex, oIndex, value) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q,
      ),
    )
  }

  function addOption(qIndex) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ''] } : q)),
    )
  }

  function removeOption(qIndex, oIndex) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q,
      ),
    )
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion()])
  }

  function removeQuestion(index) {
    setQuestions((qs) => qs.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanQuestions = questions.map((q) => ({
      ...q,
      text: q.text.trim(),
      options: q.type === 'text' ? [] : q.options.map((o) => o.trim()).filter(Boolean),
    }))

    if (!title.trim()) {
      setError('Il titolo è obbligatorio.')
      return
    }
    if (cleanQuestions.some((q) => !q.text)) {
      setError('Ogni domanda deve avere un testo.')
      return
    }
    if (cleanQuestions.some((q) => q.type !== 'text' && q.options.length < 2)) {
      setError('Le domande a scelta devono avere almeno due opzioni.')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await updateSurvey(surveyId, {
          title: title.trim(),
          description: description.trim(),
          questions: cleanQuestions,
        })
      } else {
        await createSurvey({
          title: title.trim(),
          description: description.trim(),
          questions: cleanQuestions,
          uid: user.uid,
        })
      }
      navigate('/dashboard')
    } catch {
      setError('Salvataggio non riuscito. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="status">Caricamento...</p>

  return (
    <div className="page">
      <header className="page-header">
        <h1>{isEditing ? 'Modifica sondaggio' : 'Nuovo sondaggio'}</h1>
        <Link className="button-secondary" to="/dashboard">
          Annulla
        </Link>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label>
          Titolo
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Descrizione (opzionale)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <h2>Domande</h2>
        {questions.map((question, qIndex) => (
          <fieldset key={question.id} className="question-card">
            <div className="card-actions">
              <label className="grow">
                Domanda {qIndex + 1}
                <input
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                  required
                />
              </label>
              <label>
                Tipo
                <select
                  value={question.type}
                  onChange={(e) =>
                    updateQuestion(qIndex, {
                      type: e.target.value,
                      options: question.options.length ? question.options : ['', ''],
                    })
                  }
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {questions.length > 1 && (
                <button type="button" className="danger" onClick={() => removeQuestion(qIndex)}>
                  Rimuovi domanda
                </button>
              )}
            </div>

            {question.type !== 'text' && (
              <div className="options-list">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-row">
                    <input
                      value={option}
                      placeholder={`Opzione ${oIndex + 1}`}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      required
                    />
                    {question.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(qIndex, oIndex)}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addOption(qIndex)}>
                  + Opzione
                </button>
              </div>
            )}
          </fieldset>
        ))}

        <button type="button" onClick={addQuestion}>
          + Aggiungi domanda
        </button>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Salvataggio...' : 'Salva sondaggio'}
        </button>
      </form>
    </div>
  )
}
