'use client';

import { X } from 'lucide-react';

interface ConfirmarExclusaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nomeProduto: string;
  excluindo?: boolean;
}

export default function ConfirmarExclusaoModal({
  isOpen,
  onClose,
  onConfirm,
  nomeProduto,
  excluindo = false,
}: ConfirmarExclusaoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Confirmar Exclusão
          </h2>
          <button
            onClick={onClose}
            disabled={excluindo}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Você tem certeza que deseja remover esse produto ou serviço?
          </p>
          {nomeProduto && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Produto:
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {nomeProduto}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={excluindo}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={excluindo}
            className="px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}

