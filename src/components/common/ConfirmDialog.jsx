import React, { useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Smartphone,
  Unlock,
  CheckCircle2,
  X,
  HelpCircle,
  LogOut,
  Info,
} from 'lucide-react';

/**
 * Modern Custom Confirm Dialog Component
 * Menggantikan dialog native bawaan browser (window.confirm & window.alert)
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  icon = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Konfigurasi icon dan palet warna modern sesuai varian
  const config = {
    danger: {
      bgIcon: 'bg-rose-100 text-rose-600 border border-rose-200/80',
      defaultIcon: Trash2,
      btnConfirm:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-2 focus:ring-rose-500 active:scale-[0.98]',
    },
    warning: {
      bgIcon: 'bg-amber-100 text-amber-700 border border-amber-200/80',
      defaultIcon: Archive,
      btnConfirm:
        'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-2 focus:ring-amber-500 active:scale-[0.98]',
    },
    info: {
      bgIcon: 'bg-blue-100 text-blue-700 border border-blue-200/80',
      defaultIcon: Smartphone,
      btnConfirm:
        'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs focus:ring-2 focus:ring-zinc-900 active:scale-[0.98]',
    },
    success: {
      bgIcon: 'bg-emerald-100 text-emerald-700 border border-emerald-200/80',
      defaultIcon: ArchiveRestore,
      btnConfirm:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-2 focus:ring-emerald-500 active:scale-[0.98]',
    },
  }[variant] || {
    bgIcon: 'bg-zinc-100 text-zinc-700 border border-zinc-200/80',
    defaultIcon: HelpCircle,
    btnConfirm: 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs active:scale-[0.98]',
  };

  const IconComponent = icon || config.defaultIcon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/90 animate-in zoom-in-95 duration-200 select-none">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs shrink-0 ${config.bgIcon}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight leading-snug">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">ExamGuard Proctoring System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-2.5 text-xs text-zinc-600 leading-relaxed border-t border-b border-zinc-100 my-2">
          {message}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4">
          {cancelText && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${config.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
