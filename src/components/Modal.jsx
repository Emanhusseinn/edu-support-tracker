import React, { useEffect } from 'react';

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e)=>e.stopPropagation()}>
        {title && <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-close" onClick={onClose} aria-label="Close">×</button>
        </div>}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
