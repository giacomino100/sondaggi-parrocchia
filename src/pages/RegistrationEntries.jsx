import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { deleteEntry, watchEntries, watchRegistration } from '../lib/registrations'
import QrModal from '../components/QrModal'

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function csvCell(value) {
  const s = String(value ?? '')
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv(title, entries) {
  const header = [
    'Nome bambino', 'Cognome bambino', 'Data di nascita',
    'Nome genitore', 'Cognome genitore', 'Cellulare', 'Email', 'Indirizzo',
    'Consenso foto/video', 'Data iscrizione',
  ]
  const rows = entries.map((e) => [
    e.nomeBambino, e.cognomeBambino, formatDate(e.dataNascita),
    e.nomeGenitore, e.cognomeGenitore, e.cellulare, e.email, e.indirizzo,
    e.consensoFoto ? 'Sì' : 'No',
    e.submittedAt?.toDate ? e.submittedAt.toDate().toLocaleDateString('it-IT') : '',
  ])
  // Separatore ";" e BOM così Excel in italiano apre il file correttamente
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = `${title.replace(/[^\w-]+/g, '-').toLowerCase()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function DeleteModal({ registrationId, entry, onClose }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setDeleting(true)
    setError('')
    try {
      await deleteEntry(registrationId, entry.id)
      onClose()
    } catch {
      setError("Impossibile eliminare l'iscrizione. Riprova.")
      setDeleting(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog dialog--small" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog__title">Eliminare questa iscrizione?</h2>
        <p className="dialog__testo">
          Stai per eliminare l'iscrizione di <strong>{entry.nomeBambino} {entry.cognomeBambino}</strong>.
        </p>
        <p className="warning">
          ⚠️ Questa azione è <strong>definitiva</strong> e non potrà essere annullata.
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

export default function RegistrationEntries() {
  const { registrationId } = useParams()
  const [registration, setRegistration] = useState(undefined)
  const [entries, setEntries] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [copiato, setCopiato] = useState(false)

  useEffect(() => watchRegistration(registrationId, setRegistration), [registrationId])
  useEffect(() => watchEntries(registrationId, setEntries), [registrationId])

  const url = `${window.location.origin}/i/${registrationId}`
  const conFoto = entries.filter((e) => e.consensoFoto).length

  async function copiaLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch { /* clipboard non disponibile */ }
  }

  if (registration === undefined) return <p className="status">Caricamento…</p>
  if (registration === null) return <p className="status">Iscrizione non trovata.</p>

  return (
    <>
      <div className="wrap wrap--risultati">
        <div className="topbar">
          <h1 className="topbar__title">Iscritti</h1>
          <div className="topbar__actions">
            <Link className="btn btn--soft btn--sm" to="/iscrizioni">← Iscrizioni</Link>
          </div>
        </div>

        <div className="card">
          <div className="card__bar"></div>
          <header className="hero">
            <span className="eyebrow">Iscrizione</span>
            <h1 className="hero__title">{registration.title}</h1>
            {registration.description && <p className="hero__desc">{registration.description}</p>}
            <span className="chip">
              <span className="chip__dot" style={registration.status !== 'open' ? { background: 'var(--rosso)' } : {}}></span>
              {registration.status === 'open' ? 'Iscrizioni aperte' : 'Iscrizioni chiuse'}
            </span>
          </header>

          <div className="body">
            <div className="stats">
              <div className="stat">
                <span className="stat__num">{entries.length}</span>
                <span className="stat__label">Iscritti</span>
              </div>
              <div className="stat">
                <span className="stat__num">{conFoto}</span>
                <span className="stat__label">Consenso foto sì</span>
              </div>
              <div className="stat">
                <span className="stat__num">{entries.length - conFoto}</span>
                <span className="stat__label">Consenso foto no</span>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn btn--soft btn--sm" type="button" onClick={() => setShowQr(true)}>QR Code</button>
              <button className="btn btn--ghost btn--sm" type="button" onClick={copiaLink}>
                {copiato ? 'Link copiato ✓' : 'Copia link'}
              </button>
              <button
                className="btn btn--ghost btn--sm"
                type="button"
                onClick={() => exportCsv(registration.title, entries)}
                disabled={entries.length === 0}
              >
                ↓ Esporta Excel (CSV)
              </button>
            </div>

            <h2 className="section-title" style={{ fontSize: '1.05rem' }}>Elenco iscritti</h2>

            {entries.length === 0 ? (
              <p className="muted">Ancora nessun iscritto.</p>
            ) : (
              <ul className="iscr-elenco">
                {entries.map((e) => (
                  <li key={e.id} className="iscr-riga">
                    <div className="iscr-riga__head">
                      <div>
                        <span className="iscr-nome">{e.nomeBambino} {e.cognomeBambino}</span>
                        <span className="iscr-nascita">nato/a il {formatDate(e.dataNascita)}</span>
                      </div>
                      <span className={`badge badge--${e.consensoFoto ? 'open' : 'closed'}`}>
                        {e.consensoFoto ? '📷 Foto sì' : '🚫 Foto no'}
                      </span>
                      <button
                        className="icon-btn icon-btn--danger"
                        type="button"
                        aria-label="Elimina iscrizione"
                        onClick={() => setDeleteTarget(e)}
                      >🗑</button>
                    </div>
                    <dl className="iscr-dati">
                      <dt>Genitore</dt><dd>{e.nomeGenitore} {e.cognomeGenitore}</dd>
                      <dt>Cellulare</dt><dd><a href={`tel:${e.cellulare}`}>{e.cellulare}</a></dd>
                      <dt>Email</dt><dd><a href={`mailto:${e.email}`}>{e.email}</a></dd>
                      <dt>Indirizzo</dt><dd>{e.indirizzo}</dd>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="foot">Parrocchia di San Gioacchino · Partinico</p>
      </div>

      {showQr && <QrModal title={registration.title} url={url} onClose={() => setShowQr(false)} />}
      {deleteTarget && (
        <DeleteModal registrationId={registrationId} entry={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  )
}
