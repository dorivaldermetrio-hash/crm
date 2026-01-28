'use client';

import { useState } from 'react';
import { X, User, Mail, Plus } from 'lucide-react';

interface CriarContatoEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CriarContatoEmailModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarContatoEmailModalProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const resetForm = () => {
    setNome('');
    setEmail('');
    setErro(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCriar = async () => {
    // Validações básicas
    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      setErro('Email é obrigatório');
      return;
    }

    // Valida formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErro('Email inválido');
      return;
    }

    setCriando(true);
    setErro(null);

    try {
      const response = await fetch('/api/contatos-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        setErro(data.error || 'Erro ao criar contato email');
      }
    } catch (error) {
      console.error('❌ Erro ao criar contato email:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCriando(false);
    }
  };

  if (!isOpen) return null;

  const primeiraLetra = nome
    ? nome.charAt(0).toUpperCase()
    : email
    ? email.charAt(0).toUpperCase()
    : '?';

  // Cores do avatar baseadas na primeira letra
  const cores = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-red-500 to-red-600',
  ];
  const corAvatar = cores[primeiraLetra.charCodeAt(0) % cores.length];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fade-in_200ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-[slide-in-from-bottom-4_300ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-4">
            <div className={`${corAvatar} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl`}>
              {primeiraLetra}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Adicionar Contato Email
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Preencha os dados do novo contato
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/80 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200 hover:scale-110"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Erro */}
          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{erro}</p>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <User className="w-4 h-4 text-blue-500" />
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro(null);
              }}
              placeholder="Digite o nome do contato..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <Mail className="w-4 h-4 text-blue-500" />
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErro(null);
              }}
              placeholder="exemplo@email.com"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
            disabled={criando}
          >
            Cancelar
          </button>
          <button
            onClick={handleCriar}
            disabled={criando || !nome.trim() || !email.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
          >
            {criando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Criar Contato
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

