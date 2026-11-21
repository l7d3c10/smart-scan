import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, opts = {}) => addToast({ type: 'success', message, ...opts }), [addToast]);
  const error = useCallback((message, opts = {}) => addToast({ type: 'error', message, ...opts }), [addToast]);
  const warning = useCallback((message, opts = {}) => addToast({ type: 'warning', message, ...opts }), [addToast]);
  const info = useCallback((message, opts = {}) => addToast({ type: 'info', message, ...opts }), [addToast]);

  return { toasts, addToast, removeToast, success, error, warning, info };
}
