import React, { useEffect, useId, useRef } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  mobileFullscreen?: boolean;
  panelClassName?: string;
  bodyClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  mobileFullscreen = false,
  panelClassName = '',
  bodyClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-surface-900/20 backdrop-blur-sm transition-all duration-200 ${
        mobileFullscreen ? 'items-end justify-center p-0 sm:items-center sm:p-4' : 'items-center justify-center p-4'
      }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`w-full transform bg-white shadow-modal transition-all duration-200 animate-scale-in ${
          mobileFullscreen
            ? `max-h-[100dvh] min-h-[100dvh] rounded-none sm:min-h-0 sm:max-h-[90vh] sm:rounded-xl ${sizeClasses[size]}`
            : `rounded-xl ${sizeClasses[size]}`
        } ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 sm:px-6">
            {title && (
              <h3 id={titleId} className="text-base font-semibold text-surface-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
                aria-label="Tutup modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className={`px-5 py-4 sm:px-6 ${mobileFullscreen ? 'max-h-[calc(100dvh-73px)] overflow-y-auto sm:max-h-[calc(90vh-73px)]' : ''} ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const typeConfig = {
  danger: {
    icon: XCircleIcon,
    iconBg: 'bg-danger-50 ring-1 ring-danger-100',
    iconColor: 'text-danger-600',
    button: 'btn-danger',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconBg: 'bg-warning-50 ring-1 ring-warning-100',
    iconColor: 'text-warning-600',
    button: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-warning-600 text-white text-sm font-medium rounded-lg transition-all duration-150 hover:bg-warning-700 focus-visible:ring-2 focus-visible:ring-warning-500 focus-visible:ring-offset-2 disabled:opacity-50 shadow-xs',
  },
  info: {
    icon: InformationCircleIcon,
    iconBg: 'bg-info-50 ring-1 ring-info-100',
    iconColor: 'text-info-600',
    button: 'btn-primary',
  },
  success: {
    icon: CheckCircleIcon,
    iconBg: 'bg-success-50 ring-1 ring-success-100',
    iconColor: 'text-success-600',
    button: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-success-600 text-white text-sm font-medium rounded-lg transition-all duration-150 hover:bg-success-700 focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2 disabled:opacity-50 shadow-xs',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'info',
  isLoading = false,
}) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <div className="flex gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}>
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <p className="text-sm leading-relaxed text-surface-600">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={config.button}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
