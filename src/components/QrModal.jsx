import { QRCodeCanvas } from 'qrcode.react'

export default function QrModal({ title, url, onClose }) {
  function download() {
    const canvas = document.getElementById('qr-canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog dialog--small" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog__title">QR Code</h2>
        <p className="dialog__testo">{title}</p>

        <div className="qr-wrap">
          <QRCodeCanvas
            id="qr-canvas"
            value={url}
            size={220}
            includeMargin
            level="M"
            fgColor="#1d1c2b"
            bgColor="#ffffff"
          />
        </div>

        <p className="qr-url">{url}</p>

        <div className="dialog__azioni">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Chiudi</button>
          <button className="btn btn--primary" type="button" onClick={download}>
            ↓ Scarica PNG
          </button>
        </div>
      </div>
    </div>
  )
}
