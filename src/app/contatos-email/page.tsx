'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import CriarContatoEmailModal from '@/components/CriarContatoEmailModal';
import EditarContatoEmailModal from '@/components/EditarContatoEmailModal';
import ConfirmarExclusaoContatoEmailModal from '@/components/ConfirmarExclusaoContatoEmailModal';
import { Plus, Mail, Pencil, Trash2 } from 'lucide-react';

interface ContatoEmail {
  id: string;
  nome: string;
  email: string;
  createdAt: string | null;
}

export default function ContatosEmailPage() {
  const { isOpen, isMobile } = useSidebar();
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [contatosEmail, setContatosEmail] = useState<ContatoEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contatoEmailEditando, setContatoEmailEditando] = useState<ContatoEmail | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [contatoEmailExcluindo, setContatoEmailExcluindo] = useState<ContatoEmail | null>(null);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    fetchContatosEmail();
  }, []);

  const fetchContatosEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/contatos-email');
      const data = await response.json();

      if (data.success) {
        setContatosEmail(data.contatosEmail || []);
      } else {
        setError(data.error || 'Erro ao carregar contatos email');
      }
    } catch (err) {
      console.error('Erro ao buscar contatos email:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!contatoEmailExcluindo) return;

    setExcluindo(true);
    try {
      const response = await fetch(`/api/contatos-email/${contatoEmailExcluindo.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setModalExcluirAberto(false);
        setContatoEmailExcluindo(null);
        fetchContatosEmail();
      } else {
        setError(data.error || 'Erro ao excluir contato email');
      }
    } catch (err) {
      console.error('Erro ao excluir contato email:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setExcluindo(false);
    }
  };

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
                  Contatos de Email
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 truncate">
                  {loading
                    ? 'Carregando...'
                    : contatosEmail.length === 0
                    ? 'Nenhum contato email encontrado'
                    : `${contatosEmail.length} ${contatosEmail.length === 1 ? 'contato encontrado' : 'contatos encontrados'}`}
                </p>
              </div>
              <button
                onClick={() => setModalCriarAberto(true)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start flex-shrink-0"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Adicionar Contato Email</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando contatos email...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchContatosEmail}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && contatosEmail.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-700 min-w-0">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📧</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhum contato email ainda
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
                Adicione seu primeiro contato email para começar.
              </p>
            </div>
          )}

          {/* Lista de Contatos Email */}
          {!loading && !error && contatosEmail.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-w-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {contatosEmail.map((contato) => {
                  const primeiraLetra = contato.nome
                    ? contato.nome.charAt(0).toUpperCase()
                    : contato.email.charAt(0).toUpperCase();

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
                      key={contato.id}
                      className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors min-w-0"
                    >
                      {/* Avatar */}
                      <div
                        className={`${corAvatar} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0`}
                      >
                        {primeiraLetra}
                      </div>

                      {/* Nome e Email */}
                      <div className="flex-1 flex items-center justify-between gap-2 sm:gap-3 md:gap-4 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {contato.nome}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            {contato.email}
                          </p>
                        </div>
                        {/* Botões de ação - sempre visíveis no mobile, hover no desktop */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContatoEmailEditando(contato);
                              setModalEditarAberto(true);
                            }}
                            className="p-1.5 sm:p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            aria-label="Editar contato"
                          >
                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContatoEmailExcluindo(contato);
                              setModalExcluirAberto(true);
                            }}
                            className="p-1.5 sm:p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label="Excluir contato"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Criar Contato Email */}
      <CriarContatoEmailModal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onSuccess={() => {
          fetchContatosEmail();
        }}
      />

      {/* Modal Editar Contato Email */}
      <EditarContatoEmailModal
        contatoEmail={contatoEmailEditando}
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setContatoEmailEditando(null);
        }}
        onSuccess={() => {
          fetchContatosEmail();
        }}
      />

      {/* Modal Confirmar Exclusão */}
      <ConfirmarExclusaoContatoEmailModal
        isOpen={modalExcluirAberto}
        onClose={() => {
          setModalExcluirAberto(false);
          setContatoEmailExcluindo(null);
        }}
        onConfirm={handleExcluir}
        nomeContato={contatoEmailExcluindo?.nome || ''}
        emailContato={contatoEmailExcluindo?.email || ''}
        excluindo={excluindo}
      />
    </div>
  );
}

