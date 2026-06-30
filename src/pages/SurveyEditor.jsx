import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
  const location = useLocation()

  // Titolo/descrizione/domande pre-compilati da TemplateSelector via router state
  const tpl = location.state ?? {}

  const [title, setTitle] = useState(tpl.title ?? '')
  const [description, setDescription] = useState(tpl.description ?? '')
  const [questions, setQuestions] = useState(
    tpl.questions?.length ? tpl.questions : [emptyQuestion()],
  )
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

  if (loading) return <p className="status">Caricamento…</p>

  return (
    <div className="wrap wrap--wide">
      <div className="topbar">
        <h1 className="topbar__title">{isEditing ? 'Modifica sondaggio' : 'Nuovo sondaggio'}</h1>
        <div className="topbar__actions">
          <Link className="btn btn--ghost btn--sm" to={isEditing ? '/dashboard' : '/sondaggi/nuovo'}>
            Annulla
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card__bar"></div>
        <form className="body" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Titolo <span className="req">*</span></label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="description">Descrizione <span className="opt">(facoltativo)</span></label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <h2 className="section-title">Domande</h2>

          {questions.map((question, qIndex) => (
            <div key={question.id} className="q-editor">
              <div className="q-editor__head">
                <div className="field">
                  <label htmlFor={`q-${question.id}`}>Domanda {qIndex + 1}</label>
                  <input
                    id={`q-${question.id}`}
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                    required
                  />
                </div>
                <div className="field" style={{ flex: '0 0 160px' }}>
                  <label htmlFor={`t-${question.id}`}>Tipo</label>
                  <select
                    id={`t-${question.id}`}
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
                </div>
              </div>

              {question.type !== 'text' && (
                <div className="options">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-row">
                      <input
                        className="input"
                        value={option}
                        placeholder={`Opzione ${oIndex + 1}`}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        required
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Rimuovi opzione"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => addOption(qIndex)}
                  >
                    + Opzione
                  </button>
                </div>
              )}

              {questions.length > 1 && (
                <div className="actions actions--end">
                  <button
                    type="button"
                    className="btn btn--danger-soft btn--sm"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    Rimuovi domanda
                  </button>
                </div>
              )}
            </div>
          ))}

          <button type="button" className="btn btn--ghost" onClick={addQuestion}>
            + Aggiungi domanda
          </button>

          {error && <p className="alert">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva sondaggio'}
          </button>
        </form>
      </div>
    </div>
  )
}
