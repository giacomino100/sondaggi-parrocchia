import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createRsvpSurvey, makeQuestionId } from '../lib/surveys'

const TEMPLATES = [
  {
    id: 'presenze',
    label: 'Modulo presenze',
    desc: 'Raccoglie nome, cognome, telefono e numero di partecipanti. Ideale per eventi e cene.',
    icon: '👥',
    fields: [
      { label: 'Nome', type: 'text', note: 'Obbligatorio' },
      { label: 'Cognome', type: 'text', note: 'Obbligatorio' },
      { label: 'Telefono', type: 'tel', note: 'Obbligatorio' },
      { label: 'Partecipanti', type: 'number', note: 'Obbligatorio, min 1' },
      { label: 'Di cui bambini', type: 'number', note: 'Facoltativo' },
      { label: 'Note', type: 'textarea', note: 'Facoltativo' },
    ],
  },
  {
    id: 'sondaggio',
    label: 'Sondaggio generico',
    desc: 'Crea domande a scelta singola, scelta multipla o risposta libera.',
    icon: '📋',
    fields: [
      { label: 'Domanda 1', type: 'single', note: 'Scelta singola — A / B / C …' },
      { label: 'Domanda 2', type: 'multiple', note: 'Scelta multipla' },
      { label: 'Domanda 3', type: 'text', note: 'Risposta libera' },
    ],
  },
]

function FieldPreview({ fields }) {
  return (
    <ul className="tpl-fields">
      {fields.map((f) => (
        <li key={f.label} className="tpl-field">
          <span className="tpl-field__label">{f.label}</span>
          <span className={`tpl-field__type tpl-field__type--${f.type}`}>{f.note}</span>
        </li>
      ))}
    </ul>
  )
}

function RsvpForm({ onCancel }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('Anniversario Don Pietro')
  const [description, setDescription] = useState(
    'Conferma la tua presenza alla Santa Messa e alla cena.',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return }
    setSaving(true)
    try {
      const ref = await createRsvpSurvey({ title: title.trim(), description: description.trim(), uid: user.uid })
      navigate(`/sondaggi/${ref.id}/risultati`)
    } catch {
      setError('Creazione non riuscita. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="tpl-form" onSubmit={handleCreate}>
      <div className="field">
        <label htmlFor="rsvp-title">Titolo <span className="req">*</span></label>
        <input
          id="rsvp-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Es. Anniversario Don Pietro"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="rsvp-desc">Descrizione <span className="opt">(facoltativo)</span></label>
        <textarea
          id="rsvp-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dettagli sull'evento…"
        />
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Creazione…' : 'Crea modulo'}
        </button>
        <button type="button" className="btn btn--link" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </form>
  )
}

function GenericForm({ onCancel }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  function handleContinue(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return }
    navigate('/sondaggi/crea', {
      state: {
        title: title.trim(),
        description: description.trim(),
        questions: [
          { id: makeQuestionId(), text: '', type: 'single', options: ['', ''] },
        ],
      },
    })
  }

  return (
    <form className="tpl-form" onSubmit={handleContinue}>
      <div className="field">
        <label htmlFor="gen-title">Titolo <span className="req">*</span></label>
        <input
          id="gen-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Es. Sondaggio gradimento messa"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="gen-desc">Descrizione <span className="opt">(facoltativo)</span></label>
        <textarea
          id="gen-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione del sondaggio…"
        />
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="btn btn--primary">
          Continua →
        </button>
        <button type="button" className="btn btn--link" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </form>
  )
}

export default function TemplateSelector() {
  const [selected, setSelected] = useState(null)

  function select(id) {
    setSelected((prev) => (prev === id ? null : id))
  }

  return (
    <div className="wrap wrap--wide">
      <div className="topbar">
        <h1 className="topbar__title">Nuovo sondaggio</h1>
        <div className="topbar__actions">
          <Link className="btn btn--ghost btn--sm" to="/dashboard">Annulla</Link>
        </div>
      </div>

      <p className="muted" style={{ marginBottom: 20 }}>
        Scegli un tipo di sondaggio per cominciare.
      </p>

      <div className="tpl-grid">
        {TEMPLATES.map((tpl) => {
          const isSelected = selected === tpl.id
          return (
            <button
              key={tpl.id}
              type="button"
              className={`tpl-card ${isSelected ? 'tpl-card--selected' : ''}`}
              onClick={() => select(tpl.id)}
            >
              <div className="tpl-card__icon">{tpl.icon}</div>
              <div className="tpl-card__body">
                <span className="tpl-card__name">{tpl.label}</span>
                <span className="tpl-card__desc">{tpl.desc}</span>
              </div>
              <FieldPreview fields={tpl.fields} />
              <span className="tpl-card__cta">
                {isSelected ? 'Selezionato ✓' : 'Usa template →'}
              </span>
            </button>
          )
        })}
      </div>

      {selected === 'presenze' && (
        <div className="tpl-expand">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Configura il modulo presenze</h2>
          <RsvpForm onCancel={() => setSelected(null)} />
        </div>
      )}

      {selected === 'sondaggio' && (
        <div className="tpl-expand">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Configura il sondaggio</h2>
          <GenericForm onCancel={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
