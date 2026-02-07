import React from 'react';
import { ToastMessage } from '../lib/errors';

interface ErrorToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getToastStyles = (type: string) => {
    const base = {
      background: 'var(--bg, #f7f4ee)',
      fontFamily: '"Courier Prime", monospace',
      border: '2px solid',
    };
    
    switch (type) {
      case 'error':
        return { ...base, borderColor: '#c62828', color: '#c62828' };
      case 'success':
        return { ...base, borderColor: '#2e7d32', color: '#2e7d32' };
      case 'warning':
        return { ...base, borderColor: '#ed6c02', color: '#ed6c02' };
      default:
        return { ...base, borderColor: 'var(--ink)', color: 'var(--ink)' };
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className="toast-item"
            style={styles}
          >
            <div className="toast-content">
              {toast.message}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="toast-dismiss"
              style={{ color: styles.color }}
            >
              [×]
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ErrorToast;

