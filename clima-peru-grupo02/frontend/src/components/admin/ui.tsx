/**
 * Componentes UI reutilizables del panel de administración.
 * Badge, Modal, Tabla paginada, Toast, Spinner, EmptyState, ConfirmDialog.
 */
import React, { ReactNode, useEffect, useRef } from 'react';
import { X, AlertTriangle, Loader2, SearchX } from 'lucide-react';

// ─── Badge de estado ──────────────────────────────────────────────────────────
interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';
  children: ReactNode;
  className?: string;
}
export const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const styles = {
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    danger:  'bg-red-500/15 text-red-300 border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    info:    'bg-sky-500/15 text-sky-300 border-sky-500/30',
    neutral: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    purple:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md', className = '',
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={`animate-spin text-sky-400 ${sizes[size]} ${className}`} />;
};

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps { title: string; description?: string; icon?: ReactNode }
export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
      {icon ?? <SearchX className="w-6 h-6 text-slate-500" />}
    </div>
    <h3 className="text-slate-300 font-medium mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}
export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, children, maxWidth = 'max-w-lg',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`w-full ${maxWidth} bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  isLoading?: boolean;
}
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirmar', danger = false, isLoading = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60 flex items-center gap-2 ${
            danger ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500'
          }`}
        >
          {isLoading && <Spinner size="sm" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}
export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200',
    error:   'bg-red-900/90 border-red-500/50 text-red-200',
    warning: 'bg-amber-900/90 border-amber-500/50 text-amber-200',
    info:    'bg-sky-900/90 border-sky-500/50 text-sky-200',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium backdrop-blur animate-in slide-in-from-bottom-2 ${styles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

// ─── Paginación ───────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}
export const Pagination: React.FC<PaginationProps> = ({
  page, totalPages, total, pageSize, onPageChange,
}) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
      <p className="text-xs text-slate-500">
        Mostrando <span className="text-slate-300 font-medium">{start}–{end}</span> de{' '}
        <span className="text-slate-300 font-medium">{total}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  subtitle?: string;
}
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm font-medium text-slate-300">{title}</div>
    {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
  </div>
);
