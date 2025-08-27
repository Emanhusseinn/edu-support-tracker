import React from 'react';
import Modal from './Modal';
import '../styles/modal.scss'
export default function ConfirmModal({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  working = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="confirm-text">{message}</p>
      <div className="confirm-actions">
        <button className="ghost" onClick={onClose} disabled={working}>
          {cancelLabel}
        </button>
        <button
          className={danger ? 'danger' : ''}
          onClick={onConfirm}
          disabled={working}
        >
          {working ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
