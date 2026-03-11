import React, { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  isWorking?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = '[ CONFIRM ]',
  cancelLabel = '[ CANCEL ]',
  tone = 'default',
  isWorking = false,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isWorking) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWorking, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className={`confirm-dialog-sheet confirm-dialog-${tone}`}>
        <p className="confirm-dialog-kicker">Workbook Action</p>
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h2>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="brand-edit-btn" onClick={onCancel} disabled={isWorking}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`brand-submit-btn confirm-dialog-confirm confirm-dialog-confirm-${tone}`}
            onClick={onConfirm}
            disabled={isWorking}
          >
            {isWorking ? '[ WORKING... ]' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
