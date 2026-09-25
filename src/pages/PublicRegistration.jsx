import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { submitEntry, watchRegistration } from '../lib/registrations'

const EMPTY = {
  nomeGenitore: '',
  cognomeGenitore: '',
  cellulare: '',
  email: '',
  nomeBambino: '',
  cognomeBambino: '',
  dataNascita: '',
  indirizzo: '',
}

function sentKey(registrationId) {
  return `iscrizione-inviata-${registrationId}`
}

function Shell({ eyebrow = 'Iscrizione', title, description, children }) {
  return (
    <div className="wrap">
      <div className="card">
        <div className="card__bar"></div>
        <header className="hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="hero__title">{title}</h1>
          {description && <p className="hero__desc">{description}</p>}
        </header>
        {children}
      </div>
      <p className="foot">Parrocchia · Iscrizioni</p>
    </div>
  )
}

export default function PublicRegistration() {
  const { registrationId } = useParams()
  const [registration, setRegistration] = useState(undefined)
  const [form, setForm] = useState(EMPTY)
  const [consensoFoto, setConsensoFoto] = useState(null)
  const [consensoPrivacy, setConsensoPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(() => Boolean(localStorage.getItem(sentKey(registrationId))))

  useEffect(() => watchRegistration(registrationId, setRegistration), [registrationId])

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const today = new Date().toISOString().slice(0, 10)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  const valid =
    Object.values(form).every((v) => v.trim()) &&
    emailValid &&
    consensoFoto !== null &&
    consensoPrivacy

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid || submitting) {
      setError('Compila tutti i campi obbligatori.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const data = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      await submitEntry(registrationId, { ...data, consensoFoto, consensoPrivacy })
      localStorage.setItem(sentKey(registrationId), '1')
      setSent(true)
    } catch {
      setError('Invio non riuscito. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setForm(EMPTY)
    setConsensoFoto(null)
    setConsensoPrivacy(false)
    setError('')
    setSent(false)
    localStorage.removeItem(sentKey(registrationId))
  }

  if (registration === undefined) return <p className="status">Caricamento…</p>

  if (registration === null) {
    return (
      <Shell
        title="Iscrizione non trovata"
        description="Il link potrebbe non essere più valido."
      />
    )
  }

  if (sent) {
    return (
      <Shell title={registration.title}>
        <div className="body" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="done">✓</div>
          <h2 style={{ fontSize: '1.4rem' }}>Iscrizione inviata!</h2>
          <p className="muted" style={{ margin: 0 }}>
            Grazie, abbiamo ricevuto l'iscrizione{form.nomeBambino ? ` di ${form.nomeBambino}` : ''}.
          </p>
          <button className="btn btn--link" type="button" onClick={reset} style={{ marginTop: 6 }}>
            Iscrivi un altro figlio/a
          </button>
        </div>
      </Shell>
    )
  }

  if (registration.status !== 'open') {
    return (
      <Shell title={registration.title} description={registration.description}>
        <div className="body">
          <p className="muted" style={{ margin: 0 }}>Le iscrizioni sono chiuse.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={registration.title} description={registration.description}>
      <form className="body" onSubmit={handleSubmit} noValidate>
        <h2 className="form-section">Dati del genitore</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="nomeGenitore">Nome <span className="req">*</span></label>
            <input id="nomeGenitore" type="text" autoComplete="given-name" value={form.nomeGenitore} onChange={set('nomeGenitore')} required />
          </div>
          <div className="field">
            <label htmlFor="cognomeGenitore">Cognome <span className="req">*</span></label>
            <input id="cognomeGenitore" type="text" autoComplete="family-name" value={form.cognomeGenitore} onChange={set('cognomeGenitore')} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cellulare">Cellulare <span className="req">*</span></label>
          <input id="cellulare" type="tel" inputMode="tel" autoComplete="tel" placeholder="Es. 333 1234567" value={form.cellulare} onChange={set('cellulare')} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email <span className="req">*</span></label>
          <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="nome@esempio.it" value={form.email} onChange={set('email')} required />
          {form.email.trim() && !emailValid && <p className="hint hint--error">Indirizzo email non valido.</p>}
        </div>
        <div className="field">
          <label htmlFor="indirizzo">Indirizzo di residenza <span className="req">*</span></label>
          <input id="indirizzo" type="text" autoComplete="street-address" placeholder="Via, numero civico, comune" value={form.indirizzo} onChange={set('indirizzo')} required />
        </div>

        <h2 className="form-section">Dati del bambino/a</h2>
        <div className="row">
          <div className="field">
            <label htmlFor="nomeBambino">Nome <span className="req">*</span></label>
            <input id="nomeBambino" type="text" autoComplete="off" value={form.nomeBambino} onChange={set('nomeBambino')} required />
          </div>
          <div className="field">
            <label htmlFor="cognomeBambino">Cognome <span className="req">*</span></label>
            <input id="cognomeBambino" type="text" autoComplete="off" value={form.cognomeBambino} onChange={set('cognomeBambino')} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="dataNascita">Data di nascita <span className="req">*</span></label>
          <input id="dataNascita" type="date" max={today} value={form.dataNascita} onChange={set('dataNascita')} required />
        </div>

        <h2 className="form-section">Consenso foto e video</h2>
        <p className="hint" style={{ marginTop: -8 }}>
          Durante le attività potremmo scattare foto e girare video. Autorizzi la pubblicazione
          di immagini in cui compare tuo figlio/a sui canali social e sul sito della parrocchia?
        </p>
        <div className="choices">
          <label className={`choice${consensoFoto === true ? ' choice--selected' : ''}`}>
            <input type="radio" name="consensoFoto" checked={consensoFoto === true} onChange={() => setConsensoFoto(true)} />
            Sì, acconsento alla pubblicazione
          </label>
          <label className={`choice${consensoFoto === false ? ' choice--selected' : ''}`}>
            <input type="radio" name="consensoFoto" checked={consensoFoto === false} onChange={() => setConsensoFoto(false)} />
            No, non acconsento
          </label>
        </div>

        <label className={`choice${consensoPrivacy ? ' choice--selected' : ''}`}>
          <input type="checkbox" checked={consensoPrivacy} onChange={(e) => setConsensoPrivacy(e.target.checked)} />
          <span>
            Acconsento al trattamento dei dati personali per la gestione dell'iscrizione e delle
            attività parrocchiali. <span className="req">*</span>
          </span>
        </label>

        {error && <p className="alert">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={!valid || submitting}>
          {submitting ? 'Invio in corso…' : 'Invia iscrizione'}
        </button>
      </form>
    </Shell>
  )
}
