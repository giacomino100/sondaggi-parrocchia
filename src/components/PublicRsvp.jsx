import { useState } from 'react'
import { submitRsvpResponse } from '../lib/surveys'

function votedKey(surveyId) {
  return `sondaggio-votato-${surveyId}`
}

export default function PublicRsvp({ survey, surveyId }) {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [totale, setTotale] = useState('')
  const [bambini, setBambini] = useState('0')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(() => Boolean(localStorage.getItem(votedKey(surveyId))))

  const totaleNum = parseInt(totale, 10)
  const bambiniNum = parseInt(bambini || '0', 10)
  const bambinoError = totale && bambini && bambiniNum > totaleNum

  const valid =
    nome.trim() &&
    cognome.trim() &&
    telefono.trim() &&
    totale &&
    totaleNum >= 1 &&
    bambiniNum >= 0 &&
    !bambinoError

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid || submitting) return
    setError('')
    setSubmitting(true)
    try {
      await submitRsvpResponse(surveyId, {
        nome: nome.trim(),
        cognome: cognome.trim(),
        telefono: telefono.trim(),
        totale: totaleNum,
        bambini: bambiniNum,
        note: note.trim(),
      })
      localStorage.setItem(votedKey(surveyId), '1')
      setSent(true)
    } catch {
      setError('Invio non riuscito. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  function clear() {
    setNome(''); setCognome(''); setTelefono('')
    setTotale(''); setBambini('0'); setNote('')
    setError('')
  }

  return (
    <div className="wrap">
      <div className="card">
        <div className="card__bar"></div>

        <header className="hero">
          <span className="eyebrow">Modulo presenze</span>
          <h1 className="hero__title">{survey.title}</h1>
          {survey.description && <p className="hero__desc">{survey.description}</p>}
        </header>

        {sent ? (
          <div className="body" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="done">✓</div>
            <h2 style={{ fontSize: '1.4rem' }}>Grazie, {nome || 'a te'}!</h2>
            <p className="muted" style={{ margin: 0 }}>
              La tua presenza è stata registrata.
            </p>
            <button
              className="btn btn--link"
              type="button"
              onClick={() => { clear(); setSent(false); localStorage.removeItem(votedKey(surveyId)) }}
              style={{ marginTop: 6 }}
            >
              Invia un'altra risposta
            </button>
          </div>
        ) : (
          <form className="body" onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="nome">Nome <span className="req">*</span></label>
                <input
                  id="nome"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Es. Mario"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cognome">Cognome <span className="req">*</span></label>
                <input
                  id="cognome"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Es. Rossi"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="telefono">Numero di telefono <span className="req">*</span></label>
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Es. 333 1234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="totale">Partecipanti <span className="req">*</span></label>
                <input
                  id="totale"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="4"
                  value={totale}
                  onChange={(e) => setTotale(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="bambini">Di cui bambini</label>
                <input
                  id="bambini"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  value={bambini}
                  onChange={(e) => setBambini(e.target.value)}
                />
              </div>
            </div>

            {bambinoError && (
              <p className="hint hint--error">
                I bambini non possono superare il totale dei partecipanti.
              </p>
            )}

            <div className="field">
              <label htmlFor="note">Note <span className="opt">(facoltativo)</span></label>
              <textarea
                id="note"
                rows={2}
                placeholder="Allergie, intolleranze…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && <p className="alert">{error}</p>}

            <div className="actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!valid || submitting}
              >
                {submitting ? 'Invio in corso…' : 'Conferma la presenza'}
              </button>
              <button type="button" className="btn btn--link" onClick={clear}>
                Svuota
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="foot">Parrocchia · Sondaggi</p>
    </div>
  )
}
