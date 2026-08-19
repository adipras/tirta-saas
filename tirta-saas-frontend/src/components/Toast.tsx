import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ToastContext } from './toast-context';
import type { Toast, ToastType } from '../types/toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration: number = 5000) => {
      const id = Math.random().toString(36).slice(2, 11);
      const newToast: Toast = { id, type, message, duration };
      let shouldScheduleRemoval = true;

      setToasts((prev) => {
        const hasActiveDuplicate = prev.some(
          (toast) => toast.type === type && toast.message === message
        );

        if (hasActiveDuplicate) {
          shouldScheduleRemoval = false;
          return prev;
        }

        return [...prev, newToast];
      });

      if (shouldScheduleRemoval && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration);
  }, [addToast]);

  const contextValue = useMemo(
    () => ({ addToast, removeToast, success, error, warning, info }),
    [addToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div
      className="fixed top-3 right-3 left-3 z-50 space-y-2 sm:left-auto sm:right-4 sm:top-4 sm:w-80"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const typeConfig = {
  success: {
    icon: CheckCircleIcon,
    bg: 'bg-success-50 border-success-200',
    text: 'text-success-800',
    iconColor: 'text-success-500',
  },
  error: {
    icon: XCircleIcon,
    bg: 'bg-danger-50 border-danger-200',
    text: 'text-danger-800',
    iconColor: 'text-danger-500',
  },
  warning: {
    icon: ExclamationCircleIcon,
    bg: 'bg-warning-50 border-warning-200',
    text: 'text-warning-800',
    iconColor: 'text-warning-500',
  },
  info: {
    icon: InformationCircleIcon,
    bg: 'bg-info-50 border-info-200',
    text: 'text-info-800',
    iconColor: 'text-info-500',
  },
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300);

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  return (
    <div
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      aria-atomic="true"
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-dropdown transition-all duration-300 ${config.bg} ${
        isExiting ? 'opacity-0 translate-y-1 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <Icon className={`h-4.5 w-4.5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
      <p className={`flex-1 text-[13px] font-medium leading-snug ${config.text}`}>{toast.message}</p>
      <button
        type="button"
        onClick={handleClose}
        className={`flex-shrink-0 rounded-lg p-1 transition-colors ${config.text} opacity-60 hover:opacity-100 hover:bg-white/50`}
        aria-label="Tutup notifikasi"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
