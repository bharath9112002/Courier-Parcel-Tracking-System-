import { useEffect, useRef } from 'react'
import Icon from './Icon'

export default function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Delete',
  busy = false,
  error,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="modal" onClick={() => !busy && onCancel()}>
      <div
        className="modal__box"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="modal__icon"><Icon name="x" size={24} /></span>
        <h2 id="confirm-title">{title}</h2>
        <div className="modal__body">{children}</div>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <div className="modal__actions">
          <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
