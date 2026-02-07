import { useState, useCallback, useEffect } from 'react';
import { ErrorType, ToastMessage, generateToastId, getErrorMessage, ErrorOptions } from '../lib/errors';

export const useError = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ErrorType, message: string, persistent: boolean = false) => {
    const toast: ToastMessage = {
      id: generateToastId(),
      type,
      message,
      persistent,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss non-persistent toasts
    if (!persistent) {
      const timeout = type === 'error' ? 5000 : type === 'success' ? 3000 : 4000;
      setTimeout(() => {
        removeToast(toast.id);
      }, timeout);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showError = useCallback((errorCode: string, options?: ErrorOptions) => {
    const message = getErrorMessage(errorCode, options);
    addToast('error', message, options?.persistent);
  }, [addToast]);

  const showSuccess = useCallback((message: string) => {
    addToast('success', message, false);
  }, [addToast]);

  const showWarning = useCallback((message: string, persistent: boolean = false) => {
    addToast('warning', message, persistent);
  }, [addToast]);

  const showInfo = useCallback((message: string) => {
    addToast('info', message, false);
  }, [addToast]);

  return {
    toasts,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  };
};






