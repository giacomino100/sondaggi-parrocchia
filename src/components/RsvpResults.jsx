import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteResponse, updateResponse } from '../lib/surveys'

function Initials({ nome, cognome }) {
  return (
    <div className="rsvp-iniz">
      {(nome?.[0] ?? '').toUpperCase()}{(cognome?.[0] ?? '').toUpperCase()}
    </div>
  )
}

function EditModal({ surveyId, riga, onClose }) {
  const [nome, setNome] = useState(riga.nome)
  const [cognome, setCognome] = useState(riga.cognome)
  const [telefono, setTelefono] = useState(riga.telefono ?? '')
  const [totale, setTotale] = useState(String(riga.totale))
  const [bambini, setBambini] = useState(String(riga.bambini ?? 0))
  const [note, setNote] = useState(riga.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totaleNum = parseInt(totale, 10)
  const bambiniNum = parseInt(bambini || '0', 10)
  const bambinoError = totale && bambini && bambiniNum > totaleNum
  const valid = nome.trim() && cognome.trim() && telefono.trim() && totale && totaleNum >= 1 && !bambinoError

  async function save() {
    if (!valid || saving) return
    setSaving(true)
    setError('')
    try {
      await updateResponse(surveyId, riga.id, {
        nome: nome.trim(),
        cognome: cognome.trim(),
        telefono: telefono.trim(),
        totale: totaleNum,
        bambini: bambiniNum,
        note: note.trim(),
      })
      onClose()
    } catch {
      setError('Impossibile salvare le modifiche. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog__title">Modifica risposta</h2>

        <div className="row" style={{ marginBottom: 0 }}>
          <div className="field">
            <label htmlFor="mod-nome">Nome <span className="req">*</span></label>
            <input id="mod-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="mod-cognome">Cognome <span className="req">*</span></label>
            <input id="mod-cognome" type="text" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="mod-tel">Telefono <span className="req">*</span></label>
          <input id="mod-tel" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
        </div>

        <div className="row" style={{ marginBottom: 0 }}>
          <div className="field">
            <label htmlFor="mod-totale">Partecipanti <span className="req">*</span></label>
            <input id="mod-totale" type="number" min="1" value={totale} onChange={(e) => setTotale(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="mod-bambini">Di cui bambini</label>
            <input id="mod-bambini" type="number" min="0" value={bambini} onChange={(e) => setBambini(e.target.value)} />
          </div>
        </div>

        {bambinoError && <p className="hint hint--error">I bambini non possono superare il totale.</p>}

        <div className="field">
          <label htmlFor="mod-note">Note <span className="opt">(facoltativo)</span></label>
          <textarea id="mod-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && <p className="alert">{error}</p>}

        <p className="warning">
          ⚠️ Una volta salvata, la versione precedente andrà persa e <strong>non potrà essere ripristinata</strong>.
        </p>

        <div className="dialog__azioni">
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={saving}>Annulla</button>
          <button className="btn btn--primary" type="button" onClick={save} disabled={!valid || saving}>
            {saving ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ surveyId, riga, onClose }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setDeleting(true)
    setError('')
    try {
      await deleteResponse(surveyId, riga.id)
      onClose()
    } catch {
      setError('Impossibile eliminare la risposta. Riprova.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog dialog--small" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog__title">Eliminare questa risposta?</h2>
        <p className="dialog__testo">
          Stai per eliminare la risposta di <strong>{riga.nome} {riga.cognome}</strong>{' '}
          ({riga.totale} {riga.totale === 1 ? 'persona' : 'persone'}).
        </p>
        <p className="warning">
          ⚠️ Questa azione è <strong>definitiva</strong>: una volta eliminata, la risposta non potrà essere ripristinata.
        </p>
        {error && <p className="alert">{error}</p>}
        <div className="dialog__azioni">
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={deleting}>Annulla</button>
          <button className="btn btn--danger" type="button" onClick={confirm} disabled={deleting}>
            {deleting ? 'Eliminazione…' : 'Elimina definitivamente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RsvpResults({ survey, surveyId, responses }) {
  const [editRiga, setEditRiga] = useState(null)
  const [deleteRiga, setDeleteRiga] = useState(null)
  const [copiato, setCopiato] = useState(false)

  const totalePersone = responses.reduce((s, r) => s + (r.totale || 0), 0)
  const totaleBambini = responses.reduce((s, r) => s + (r.bambini || 0), 0)
  const totaleAdulti = totalePersone - totaleBambini

  async function copiaLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${surveyId}`)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch { /* clipboard non disponibile */ }
  }

  return (
    <>
      <div className="wrap wrap--risultati">
        <div className="topbar">
          <h1 className="topbar__title">Presenze</h1>
          <div className="topbar__actions">
            <Link className="btn btn--soft btn--sm" to="/dashboard">← Sondaggi</Link>
          </div>
        </div>

        <div className="card">
          <div className="card__bar"></div>
          <header className="hero">
            <span className="eyebrow">Modulo presenze</span>
            <h1 className="hero__title">{survey.title}</h1>
            {survey.description && <p className="hero__desc">{survey.description}</p>}
            <span className="chip">
              <span className="chip__dot" style={survey.status !== 'open' ? { background: 'var(--rosso)' } : {}}></span>
              {survey.status === 'open' ? 'Modulo aperto' : 'Modulo chiuso'}
            </span>
          </header>

          <div className="body">
            <div className="stats">
              <div className="stat">
                <span className="stat__num">{totalePersone}</span>
                <span className="stat__label">Persone</span>
              </div>
              <div className="stat">
                <span className="stat__num">{totaleAdulti}</span>
                <span className="stat__label">Adulti</span>
              </div>
              <div className="stat">
                <span className="stat__num">{totaleBambini}</span>
                <span className="stat__label">Bambini</span>
              </div>
              <div className="stat">
                <span className="stat__num">{responses.length}</span>
                <span className="stat__label">Risposte</span>
              </div>
            </div>

            <div className="rsvp-list-header">
              <h2 className="section-title" style={{ fontSize: '1.05rem' }}>Chi ha confermato</h2>
              <span className="rsvp-legenda">adulti <span className="rsvp-bambini-label">+bambini</span></span>
            </div>

            {responses.length === 0 ? (
              <p className="muted">Ancora nessuna risposta.</p>
            ) : (
              <div className="rsvp-scroll">
                <ul className="rsvp-elenco">
                  {responses.map((r) => {
                    const adulti = (r.totale || 0) - (r.bambini || 0)
                    return (
                      <li key={r.id} className="rsvp-riga">
                        <Initials nome={r.nome} cognome={r.cognome} />
                        <div className="rsvp-info">
                          <span className="rsvp-nome">{r.nome} {r.cognome}</span>
                          {r.telefono && (
                            <a className="rsvp-tel" href={`tel:${r.telefono}`}>{r.telefono}</a>
                          )}
                          {r.note && <span className="rsvp-nota">{r.note}</span>}
                        </div>
                        <div className="rsvp-conta">
                          <span className="rsvp-num rsvp-num--adulti">{adulti}</span>
                          {r.bambini > 0 && (
                            <span className="rsvp-num rsvp-num--bambini">+{r.bambini}</span>
                          )}
                        </div>
                        <div className="rsvp-azioni">
                          <button
                            className="icon-btn"
                            type="button"
                            aria-label="Modifica risposta"
                            onClick={() => setEditRiga(r)}
                          >✎</button>
                          <button
                            className="icon-btn icon-btn--danger"
                            type="button"
                            aria-label="Elimina risposta"
                            onClick={() => setDeleteRiga(r)}
                          >🗑</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className="actions" style={{ marginTop: 8 }}>
              <Link className="btn btn--primary btn--sm" to={`/s/${surveyId}`}>
                Aggiungi presenza
              </Link>
              <button className="btn btn--link" type="button" onClick={copiaLink}>
                {copiato ? 'Link copiato ✓' : 'Copia invito'}
              </button>
            </div>
          </div>
        </div>

        <p className="foot">Parrocchia · Sondaggi</p>
      </div>

      {editRiga && (
        <EditModal surveyId={surveyId} riga={editRiga} onClose={() => setEditRiga(null)} />
      )}
      {deleteRiga && (
        <DeleteModal surveyId={surveyId} riga={deleteRiga} onClose={() => setDeleteRiga(null)} />
      )}
    </>
  )
}
